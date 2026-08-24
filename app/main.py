import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    admin_router,
    ai_router,
    auth_router,
    content_router,
    grievances_router,
    health_router,
)

log = logging.getLogger(__name__)

app = FastAPI(
    title="Sahayak CPGRAMS API",
    description="Centralized Public Grievance Redress And Monitoring System.",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3001")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        frontend_url,
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(grievances_router)
app.include_router(content_router)
app.include_router(ai_router)
app.include_router(admin_router)
