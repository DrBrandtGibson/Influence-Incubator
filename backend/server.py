from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# Configure logging EARLY
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("iif")

app = FastAPI(title="Influence Incubator Formula API", version="0.1.0")

api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"app": "Influence Incubator Formula API", "status": "ok"}


@api_router.get("/health")
async def health():
    return {"status": "healthy"}


# Mount routers
from routers.auth import router as auth_router  # noqa: E402
from routers.profile import router as profile_router  # noqa: E402
from routers.plans import router as plans_router  # noqa: E402
from routers.ai import router as ai_router  # noqa: E402
from routers.uploads import router as uploads_router  # noqa: E402
from routers.exports import router as exports_router  # noqa: E402
from routers.billing import router as billing_router, webhook_router as stripe_webhook_router  # noqa: E402
from routers.clickfunnels import router as clickfunnels_webhook_router  # noqa: E402

api_router.include_router(auth_router)
api_router.include_router(profile_router)
api_router.include_router(plans_router)
api_router.include_router(ai_router)
api_router.include_router(uploads_router)
api_router.include_router(exports_router)
api_router.include_router(billing_router)
api_router.include_router(stripe_webhook_router)
api_router.include_router(clickfunnels_webhook_router)

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

logger.info("Influence Incubator API ready.")
