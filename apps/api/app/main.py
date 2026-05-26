from fastapi import FastAPI
from app.api import health, schema
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# API routers
app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(schema.router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {"message": "Welcome to the TRACE-X Platform API"}
