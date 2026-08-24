from app.routers.health import router as health_router
from app.routers.auth import router as auth_router
from app.routers.grievances import router as grievances_router
from app.routers.content import router as content_router
from app.routers.ai import router as ai_router
from app.routers.admin import router as admin_router

__all__ = [
    "health_router",
    "auth_router",
    "grievances_router",
    "content_router",
    "ai_router",
    "admin_router",
]
