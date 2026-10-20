"""Reset de dados organizacionais, preservando os superadministradores.

Uso intencionalmente interativo:
    python reset_production_data.py
"""

from sqlalchemy import text

from app.database import SessionLocal


CONFIRMATION = 'RESETAR DADOS ORGANIZACIONAIS'


def reset_data() -> None:
    confirmation = input(f"Digite '{CONFIRMATION}' para continuar: ")
    if confirmation != CONFIRMATION:
        raise SystemExit('Operacao cancelada.')

    db = SessionLocal()
    try:
        db.execute(text("DELETE FROM item_documents WHERE organization_id IN (SELECT id FROM organizations)"))
        db.execute(text("DELETE FROM cultural_items WHERE organization_id IN (SELECT id FROM organizations)"))
        db.execute(text("DELETE FROM cultural_spaces WHERE organization_id IN (SELECT id FROM organizations)"))
        db.execute(text("DELETE FROM product_subscriptions WHERE organization_id IN (SELECT id FROM organizations)"))
        db.execute(text("DELETE FROM audit_logs WHERE organization_id IN (SELECT id FROM organizations)"))
        db.execute(text("DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM users WHERE role <> 'superadmin')"))
        db.execute(text("DELETE FROM users WHERE role <> 'superadmin'"))
        db.execute(text("DELETE FROM organizations"))
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

    print('Dados organizacionais removidos. Superadministradores preservados.')


if __name__ == '__main__':
    reset_data()