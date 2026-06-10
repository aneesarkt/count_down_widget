from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Constants for the retirement countdown
DEFAULT_WIDGET_ID = "default"
INITIAL_SHIFTS = 1025
RETIRE_YEARS = 4
RETIRE_MONTHS = 10
RETIRE_DAYS = 25


def add_years_months_days(start: datetime, years: int, months: int, days: int) -> datetime:
    # add years and months by calendar; days as timedelta
    year = start.year + years
    month = start.month + months
    while month > 12:
        month -= 12
        year += 1
    day = start.day
    # clamp day if needed
    try:
        new_dt = start.replace(year=year, month=month, day=day)
    except ValueError:
        # e.g. Feb 30 -> use last day of month
        import calendar
        last_day = calendar.monthrange(year, month)[1]
        new_dt = start.replace(year=year, month=month, day=last_day)
    from datetime import timedelta
    return new_dt + timedelta(days=days)


app = FastAPI()
api_router = APIRouter(prefix="/api")


# ----- Models -----
class Widget(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    shifts_remaining: int
    target_date: str  # ISO string
    updated_at: str   # ISO string


class ShiftsUpdate(BaseModel):
    shifts_remaining: int


# ----- Old status endpoints (kept) -----
@api_router.get("/")
async def root():
    return {"message": "Hello World"}


# ----- Widget endpoints -----
async def _get_or_create_default_widget() -> dict:
    doc = await db.widgets.find_one({"id": DEFAULT_WIDGET_ID}, {"_id": 0})
    if doc:
        return doc
    now = datetime.now(timezone.utc)
    target = add_years_months_days(now, RETIRE_YEARS, RETIRE_MONTHS, RETIRE_DAYS)
    doc = {
        "id": DEFAULT_WIDGET_ID,
        "shifts_remaining": INITIAL_SHIFTS,
        "target_date": target.isoformat(),
        "updated_at": now.isoformat(),
    }
    await db.widgets.insert_one(doc.copy())
    # remove _id if mongo added it (insert_one mutates the dict)
    doc.pop("_id", None)
    return doc


@api_router.get("/widget", response_model=Widget)
async def get_widget():
    doc = await _get_or_create_default_widget()
    return Widget(**doc)


@api_router.put("/widget/shifts", response_model=Widget)
async def update_shifts(payload: ShiftsUpdate):
    if payload.shifts_remaining < 0:
        raise HTTPException(status_code=400, detail="shifts_remaining must be >= 0")
    # ensure widget exists
    await _get_or_create_default_widget()
    now_iso = datetime.now(timezone.utc).isoformat()
    await db.widgets.update_one(
        {"id": DEFAULT_WIDGET_ID},
        {"$set": {"shifts_remaining": payload.shifts_remaining, "updated_at": now_iso}},
    )
    doc = await db.widgets.find_one({"id": DEFAULT_WIDGET_ID}, {"_id": 0})
    return Widget(**doc)


@api_router.post("/widget/reset", response_model=Widget)
async def reset_widget():
    """Reset widget to initial state. Useful for debugging."""
    await db.widgets.delete_one({"id": DEFAULT_WIDGET_ID})
    doc = await _get_or_create_default_widget()
    return Widget(**doc)


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
