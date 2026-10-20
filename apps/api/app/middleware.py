"""
Middleware para tratamento de erros, logging e rate limiting
"""
import logging
import time
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import structlog
from redis import Redis
from .config import settings

# Configurar structlog
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Redis para rate limiting
REDIS_AVAILABLE = False
if settings.redis_enabled:
    try:
        redis_client = Redis.from_url(settings.redis_url, decode_responses=True, socket_connect_timeout=1, socket_timeout=1)
        redis_client.ping()
        REDIS_AVAILABLE = True
    except Exception:
        REDIS_AVAILABLE = False
        logger.warning("Redis not available, rate limiting disabled")

class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware para logging de requisições"""
    
    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = request.headers.get("x-request-id", str(time.time()))
        
        start_time = time.time()
        
        # Log da requisição
        logger.info(
            "request_started",
            method=request.method,
            path=request.url.path,
            request_id=request_id,
            client=request.client.host if request.client else None,
        )
        
        try:
            response = await call_next(request)
        except Exception as exc:
            process_time = time.time() - start_time
            logger.error(
                "request_error",
                method=request.method,
                path=request.url.path,
                request_id=request_id,
                duration_ms=process_time * 1000,
                error=str(exc),
            )
            raise
        
        process_time = time.time() - start_time
        
        # Log da resposta
        logger.info(
            "request_completed",
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration_ms=process_time * 1000,
            request_id=request_id,
        )
        
        # Adicionar headers de rastreamento
        response.headers["x-request-id"] = request_id
        response.headers["x-process-time"] = str(process_time)
        
        return response

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware para rate limiting"""
    
    async def dispatch(self, request: Request, call_next) -> Response:
        if not settings.rate_limit_enabled or not REDIS_AVAILABLE:
            return await call_next(request)
        
        # Obter identificador único (IP ou usuário)
        client_id = request.client.host if request.client else "unknown"
        
        # Algumas rotas públicas não sofrem rate limiting
        public_routes = ["/api/v1/auth/login", "/api/v1/auth/register", "/api/v1/public"]
        if any(request.url.path.startswith(route) for route in public_routes):
            return await call_next(request)
        
        try:
            # Verificar rate limit no Redis
            key = f"rate_limit:{client_id}"
            current = redis_client.incr(key)
            
            if current == 1:
                redis_client.expire(key, settings.rate_limit_period)
            
            if current > settings.rate_limit_requests:
                logger.warning(
                    "rate_limit_exceeded",
                    client_id=client_id,
                    count=current
                )
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Muitas requisições. Tente novamente mais tarde."}
                )
            
            response = await call_next(request)
            response.headers["x-ratelimit-limit"] = str(settings.rate_limit_requests)
            response.headers["x-ratelimit-remaining"] = str(settings.rate_limit_requests - current)
            return response
        except Exception as e:
            logger.error("rate_limit_error", error=str(e))
            return await call_next(request)

class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """Middleware para tratamento global de erros"""
    
    async def dispatch(self, request: Request, call_next) -> Response:
        try:
            return await call_next(request)
        except Exception as exc:
            logger.error(
                "unhandled_error",
                path=request.url.path,
                method=request.method,
                error=str(exc),
                exc_info=True
            )
            
            # Resposta genérica para não expor detalhes internos
            return JSONResponse(
                status_code=500,
                content={"detail": "Erro interno do servidor. Tente novamente mais tarde."}
            )
