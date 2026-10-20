from typing import Optional

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..models import Organization, ProductSubscription, User
from ..security import current_user, hash_password

router = APIRouter(prefix='/billing', tags=['Billing & Stripe'])

PLANS = {
    'cultural-starter': {'product': 'cultural', 'name': 'Lumiar Cultural Starter', 'amount': 4900},
    'cultural-pro': {'product': 'cultural', 'name': 'Lumiar Cultural Profissional', 'amount': 14900},
    'guia-early-access': {'product': 'guia', 'name': 'Lumiar Guia Acesso Antecipado', 'amount': 2900},
}


class CheckoutRequest(BaseModel):
    plan: str
    email: EmailStr
    organization_name: str = Field(..., min_length=3, max_length=180)
    success_url: Optional[str] = None
    cancel_url: Optional[str] = None


class PortalRequest(BaseModel):
    return_url: Optional[str] = None


def ensure_stripe():
    if not settings.stripe_enabled:
        raise HTTPException(503, 'Pagamentos ainda não configurados. Defina STRIPE_SECRET_KEY.')
    stripe.api_key = settings.stripe_secret_key


@router.get('/plans')
def plans():
    return [
        {'id': key, 'product': value['product'], 'name': value['name'], 'amount': value['amount'], 'currency': settings.stripe_currency}
        for key, value in PLANS.items()
    ]


@router.post('/checkout')
def create_checkout_session(data: CheckoutRequest, db: Session = Depends(get_db)):
    ensure_stripe()
    plan = PLANS.get(data.plan)
    if not plan:
        raise HTTPException(400, 'Plano inválido')

    organization = db.query(Organization).filter(Organization.contact_email == data.email.lower()).first()
    session = stripe.checkout.Session.create(
        mode='subscription',
        customer_email=data.email,
        line_items=[{
            'quantity': 1,
            'price_data': {
                'currency': settings.stripe_currency,
                'unit_amount': plan['amount'],
                'recurring': {'interval': 'month'},
                'product_data': {'name': plan['name']},
            },
        }],
        metadata={
            'plan': data.plan,
            'product_key': plan['product'],
            'organization_name': data.organization_name,
            'organization_id': str(organization.id) if organization else '',
        },
        subscription_data={'metadata': {'plan': data.plan, 'product_key': plan['product']}},
        success_url=data.success_url or settings.stripe_success_url,
        cancel_url=data.cancel_url or settings.stripe_cancel_url,
        allow_promotion_codes=True,
    )
    return {'checkout_url': session.url, 'session_id': session.id}


@router.post('/portal')
def create_customer_portal(data: PortalRequest, user: User = Depends(current_user), db: Session = Depends(get_db)):
    ensure_stripe()
    subscription = db.query(ProductSubscription).filter_by(organization_id=user.organization_id).first()
    customer_id = (subscription.settings or {}).get('stripe_customer_id') if subscription else None
    if not customer_id:
        raise HTTPException(404, 'Cliente Stripe ainda não associado a esta organização')
    portal = stripe.billing_portal.Session.create(
        customer=customer_id,
        return_url=data.return_url or settings.stripe_success_url,
    )
    return {'portal_url': portal.url}


@router.post('/webhook')
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    ensure_stripe()
    payload = await request.body()
    signature = request.headers.get('stripe-signature')
    try:
        event = stripe.Webhook.construct_event(payload, signature, settings.stripe_webhook_secret)
    except (ValueError, stripe.error.SignatureVerificationError) as exc:
        raise HTTPException(400, f'Webhook Stripe inválido: {exc}')

    event_type = event['type']
    obj = event['data']['object']
    if event_type == 'checkout.session.completed':
        metadata = obj.get('metadata', {})
        organization_id = metadata.get('organization_id')
        organization = db.get(Organization, int(organization_id)) if organization_id else None
        if not organization:
            organization = Organization(
                name=metadata.get('organization_name', 'Nova organização'),
                slug=''.join(c.lower() if c.isalnum() else '-' for c in metadata.get('organization_name', 'nova-organizacao')).strip('-')[:110],
                plan=metadata.get('plan', 'cultural-starter'),
                contact_email=obj.get('customer_details', {}).get('email'),
            )
            db.add(organization)
            db.flush()
        subscription = db.query(ProductSubscription).filter_by(
            organization_id=organization.id,
            product_key=metadata.get('product_key', 'cultural'),
        ).first()
        if not subscription:
            subscription = ProductSubscription(organization_id=organization.id, product_key=metadata.get('product_key', 'cultural'))
            db.add(subscription)
        subscription.status = 'active'
        subscription.settings = {
            **(subscription.settings or {}),
            'stripe_customer_id': obj.get('customer'),
            'stripe_subscription_id': obj.get('subscription'),
            'checkout_session_id': obj.get('id'),
        }
    elif event_type in ('customer.subscription.deleted', 'customer.subscription.updated'):
        customer_id = obj.get('customer')
        subscriptions = db.query(ProductSubscription).filter(ProductSubscription.settings['stripe_customer_id'].as_string() == customer_id).all()
        for subscription in subscriptions:
            subscription.status = 'cancelled' if event_type.endswith('deleted') else obj.get('status', subscription.status)

    db.commit()
    return {'received': True}