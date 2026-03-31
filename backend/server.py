"""
Smart Displays — FastAPI Backend
Multi-tenant digital signage platform
"""
import asyncio, os, uuid, logging, shutil, traceback
from contextlib import asynccontextmanager
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional
import httpx

import bcrypt
from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from jose import JWTError, jwt
from PIL import Image
from pydantic import BaseModel, EmailStr, Field, ConfigDict
import boto3

import db as DB

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

# ── ENV ───────────────────────────────────────────────────────────────────────
SECRET_KEY  = os.environ.get("SECRET_KEY", "change-me-in-production")
ALGORITHM   = "HS256"
TOKEN_EXPIRE_DAYS = 7

CORS_ORIGINS = [o.strip() for o in os.environ.get("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001").split(",")]
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")

R2_ACCOUNT_ID    = os.environ.get("R2_ACCOUNT_ID", "")
R2_ACCESS_KEY_ID = os.environ.get("R2_ACCESS_KEY_ID", "")
R2_SECRET_KEY    = os.environ.get("R2_SECRET_ACCESS_KEY", "")
R2_BUCKET        = os.environ.get("R2_BUCKET_NAME", "smart-displays-media")
R2_PUBLIC_URL    = os.environ.get("R2_PUBLIC_URL", "")
R2_ENDPOINT      = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com" if R2_ACCOUNT_ID else None

s3 = None
if R2_ACCESS_KEY_ID and R2_SECRET_KEY and R2_ENDPOINT:
    s3 = boto3.client("s3", endpoint_url=R2_ENDPOINT,
                      aws_access_key_id=R2_ACCESS_KEY_ID,
                      aws_secret_access_key=R2_SECRET_KEY,
                      region_name="auto")
    logger.info("✅ R2 Storage ready")

UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# ── LIFESPAN ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up...")
    await asyncio.wait_for(DB.init_db(), timeout=120)
    logger.info("DB ready ✓")
    yield
    await DB.close_db()

# ── APP ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="Smart Displays API", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS,
                   allow_origin_regex=r"https://.*\.netlify\.app",
                   allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

api = APIRouter(prefix="/api")
security = HTTPBearer()

# ── STORAGE ───────────────────────────────────────────────────────────────────
async def upload_file(data: bytes, path: str, content_type: str) -> str:
    if s3:
        try:
            s3.put_object(Bucket=R2_BUCKET, Key=path, Body=data, ContentType=content_type)
            return f"{R2_PUBLIC_URL}/{path}"
        except Exception as e:
            logger.warning(f"R2 upload failed, fallback: {e}")
    local = UPLOAD_DIR / path
    local.parent.mkdir(parents=True, exist_ok=True)
    local.write_bytes(data)
    return f"/uploads/{path}"


# ── AUTH HELPERS ──────────────────────────────────────────────────────────────
def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(),
                          hashed.encode() if isinstance(hashed, str) else hashed)

def create_token(user_id: str, org_id: str) -> str:
    exp = datetime.now(timezone.utc) + timedelta(days=TOKEN_EXPIRE_DAYS)
    return jwt.encode({"sub": user_id, "org": org_id, "exp": exp}, SECRET_KEY, ALGORITHM)

async def current_user(creds: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(creds.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        org_id:  str = payload.get("org")
        if not user_id or not org_id:
            raise HTTPException(401, "Invalid token")
    except JWTError:
        raise HTTPException(401, "Invalid token")
    user = await DB.user_get_by_id(user_id)
    if not user or user.get("status") != "active":
        raise HTTPException(401, "User not found or suspended")
    user["org_id"] = org_id  # always from token (security)
    return user


# ── MODELS ────────────────────────────────────────────────────────────────────
class RegisterIn(BaseModel):
    org_name: str
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str
    phone: Optional[str] = None

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class LocationIn(BaseModel):
    name: str
    address: Optional[str] = None
    city: Optional[str] = None
    status: Optional[str] = "active"
    timezone: Optional[str] = "Europe/Bucharest"

class BrandIn(BaseModel):
    name: str
    logo_url: Optional[str] = None

class ScreenIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    location_id: Optional[str] = None
    name: str
    slug: str
    resolution: Optional[str] = "1920x1080"
    orientation: Optional[str] = "0"
    sync_group: Optional[str] = None
    sync_group_name: Optional[str] = None
    cascade_offset: Optional[int] = 0
    sync_type: Optional[str] = "simple"
    sync_fit_mode: Optional[str] = "cover"
    parallax_enabled: Optional[bool] = False
    steam_enabled: Optional[bool] = False
    valentine_hearts_enabled: Optional[bool] = False
    valentine_hearts_intensity: Optional[str] = "low"
    snow_enabled: Optional[bool] = False
    snow_intensity: Optional[str] = "low"
    sakura_enabled: Optional[bool] = False
    sakura_intensity: Optional[str] = "low"
    logo_enabled: Optional[bool] = False
    logo_brand_id: Optional[str] = None
    logo_position: Optional[str] = "top-right"
    logo_size: Optional[str] = "md"
    custom_text_enabled: Optional[bool] = False
    custom_text_content: Optional[str] = None
    custom_text_position: Optional[str] = "bottom-center"
    custom_text_size: Optional[str] = "md"
    custom_text_color: Optional[str] = "#FFFFFF"
    custom_text_has_background: Optional[bool] = False

class ContentIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    title: str
    type: str
    source_type: Optional[str] = "url"
    file_url: Optional[str] = None
    duration: Optional[int] = 10
    category: Optional[str] = "other"
    tags: Optional[List[str]] = []
    autoplay: Optional[bool] = True
    loop: Optional[bool] = True
    folder_id: Optional[str] = None

class FolderIn(BaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = "#6366f1"
    icon: Optional[str] = "folder"

class PlaylistIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str
    description: Optional[str] = None
    items: Optional[List[Dict[str, Any]]] = []
    autoplay: Optional[bool] = True
    loop: Optional[bool] = True
    status: Optional[str] = "active"
    color: Optional[str] = "#4F46E5"
    is_scheduled: Optional[bool] = False
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None

class ZoneAssignIn(BaseModel):
    zone_id: Optional[str] = "main"
    content_type: Optional[str] = "single_content"
    content_id: Optional[str] = None
    playlist_id: Optional[str] = None

class ScreenZoneIn(BaseModel):
    screen_id: str
    zone_id: str
    content_type: str
    content_id: Optional[str] = None
    playlist_id: Optional[str] = None

class TitleUpdate(BaseModel):
    title: str

class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6)


# ══════════════════════════════════════════════════════════════════════════════
# AUTH ROUTES
# ══════════════════════════════════════════════════════════════════════════════

@api.post("/auth/register")
async def register(body: RegisterIn):
    """Self-service registration — creates an organization + owner user."""
    existing = await DB.user_get_by_email(body.email)
    if existing:
        raise HTTPException(400, "Email already in use")

    now = datetime.now(timezone.utc)
    org_id  = str(uuid.uuid4())
    user_id = str(uuid.uuid4())

    await DB.org_insert({
        "id": org_id, "name": body.org_name, "owner_id": user_id,
        "plan": "trial", "created_at": now
    })
    await DB.user_insert({
        "id": user_id, "org_id": org_id, "email": body.email,
        "full_name": body.full_name, "phone": body.phone,
        "hashed_password": hash_password(body.password),
        "role": "admin", "is_owner": True, "status": "active", "created_at": now
    })
    # Create a default location so the CMS isn't empty
    await DB.location_insert({
        "id": str(uuid.uuid4()), "org_id": org_id,
        "name": body.org_name, "city": "", "address": "",
        "created_at": now
    })

    token = create_token(user_id, org_id)
    return {"access_token": token, "token_type": "bearer",
            "user": {"id": user_id, "email": body.email, "full_name": body.full_name,
                     "org_id": org_id, "org_name": body.org_name, "role": "admin", 
                     "is_owner": True, "is_onboarded": False}}


@api.post("/auth/login")
async def login(body: LoginIn):
    user = await DB.user_get_by_email(body.email)
    if not user or not verify_password(body.password, user["hashed_password"]):
        raise HTTPException(401, "Invalid email or password")
    if user.get("status") != "active":
        raise HTTPException(403, "Account suspended")
    await DB.user_update_last_login(body.email)
    org = await DB.org_get(user["org_id"])
    token = create_token(user["id"], user["org_id"])
    return {"access_token": token, "token_type": "bearer",
            "user": {**{k: user[k] for k in ["id","email","full_name","role","is_owner","org_id","is_onboarded"]},
                     "org_name": org["name"] if org else ""}}


@api.get("/auth/me")
async def me(u=Depends(current_user)):
    org = await DB.org_get(u["org_id"])
    return {**{k: u[k] for k in ["id","email","full_name","role","is_owner","org_id","is_onboarded"]},
            "org_name": org["name"] if org else "",
            "org_plan": org.get("plan") if org else "trial",
            "org_plan_expires_at": org.get("plan_expires_at") if org else None}

@api.post("/auth/onboarding")
async def finish_onboarding(u=Depends(current_user)):
    await DB.pool.execute("UPDATE users SET is_onboarded = TRUE WHERE id = $1", u["id"])
    return {"ok": True}


@api.post("/auth/change-password")
async def change_password(body: PasswordChange, u=Depends(current_user)):
    if not verify_password(body.current_password, u["hashed_password"]):
        raise HTTPException(400, "Current password is incorrect")
    await DB.user_update_password(u["id"], hash_password(body.new_password))
    return {"ok": True}


class GoogleAuthIn(BaseModel):
    credential: str  # Google ID token from the frontend

@api.post("/auth/google")
async def google_auth(body: GoogleAuthIn):
    """Sign in / sign up with Google. Verifies the Google ID token and creates or logs in the user."""
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(501, "Google OAuth not configured on this server")

    # Verify token with Google
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://oauth2.googleapis.com/tokeninfo",
            params={"id_token": body.credential},
            timeout=10,
        )
    if resp.status_code != 200:
        raise HTTPException(401, "Invalid Google token")

    info = resp.json()
    if info.get("aud") != GOOGLE_CLIENT_ID:
        raise HTTPException(401, "Token audience mismatch")

    email     = info.get("email", "").lower().strip()
    full_name = info.get("name") or email.split("@")[0]
    if not email:
        raise HTTPException(400, "No email in Google token")

    now = datetime.now(timezone.utc)
    user = await DB.user_get_by_email(email)

    if user:
        # Existing user → login
        if user.get("status") != "active":
            raise HTTPException(403, "Account suspended")
        await DB.user_update_last_login(email)
        org = await DB.org_get(user["org_id"])
        token = create_token(user["id"], user["org_id"])
        return {"access_token": token, "token_type": "bearer",
                "user": {**{k: user[k] for k in ["id","email","full_name","role","is_owner","org_id","is_onboarded"]},
                         "org_name": org["name"] if org else ""}}
    else:
        # New user → auto-register with Google account
        org_id  = str(uuid.uuid4())
        user_id = str(uuid.uuid4())
        org_name = full_name  # user can rename later

        await DB.org_insert({"id": org_id, "name": org_name, "owner_id": user_id, "plan": "trial", "created_at": now})
        await DB.user_insert({
            "id": user_id, "org_id": org_id, "email": email,
            "full_name": full_name, "hashed_password": "",  # no password for Google users
            "role": "admin", "is_owner": True, "status": "active", "created_at": now
        })
        await DB.location_insert({"id": str(uuid.uuid4()), "org_id": org_id, "name": org_name, "city": "", "address": "", "created_at": now})

        token = create_token(user_id, org_id)
        return {"access_token": token, "token_type": "bearer",
                "user": {"id": user_id, "email": email, "full_name": full_name,
                         "org_id": org_id, "org_name": org_name, "role": "admin", 
                         "is_owner": True, "is_onboarded": False}}


# ══════════════════════════════════════════════════════════════════════════════
# LOCATIONS
# ══════════════════════════════════════════════════════════════════════════════

@api.get("/locations")
async def list_locations(u=Depends(current_user)):
    return await DB.locations_list(u["org_id"])

@api.post("/locations", status_code=201)
async def create_location(body: LocationIn, u=Depends(current_user)):
    row = {"id": str(uuid.uuid4()), "org_id": u["org_id"],
           **body.model_dump(), "created_at": datetime.now(timezone.utc)}
    await DB.location_insert(row)
    return row

@api.put("/locations/{loc_id}")
async def update_location(loc_id: str, body: LocationIn, u=Depends(current_user)):
    loc = await DB.location_get(loc_id, u["org_id"])
    if not loc:
        raise HTTPException(404, "Location not found")
    await DB.location_update(loc_id, u["org_id"], body.model_dump())
    return {"ok": True}

@api.delete("/locations/{loc_id}")
async def delete_location(loc_id: str, u=Depends(current_user)):
    ok = await DB.location_delete(loc_id, u["org_id"])
    if not ok:
        raise HTTPException(404, "Location not found")
    return {"ok": True}


# ══════════════════════════════════════════════════════════════════════════════
# BRANDS
# ══════════════════════════════════════════════════════════════════════════════

@api.get("/brands")
async def list_brands(u=Depends(current_user)):
    return await DB.brands_list(u["org_id"])

@api.post("/brands", status_code=201)
async def create_brand(body: BrandIn, u=Depends(current_user)):
    row = {"id": str(uuid.uuid4()), "org_id": u["org_id"],
           **body.model_dump(), "created_at": datetime.now(timezone.utc)}
    await DB.brand_insert(row)
    return row

@api.put("/brands/{brand_id}")
async def update_brand(brand_id: str, body: BrandIn, u=Depends(current_user)):
    b = await DB.brand_get(brand_id, u["org_id"])
    if not b:
        raise HTTPException(404, "Brand not found")
    await DB.brand_update(brand_id, u["org_id"], body.model_dump())
    return {"ok": True}

@api.delete("/brands/{brand_id}")
async def delete_brand(brand_id: str, u=Depends(current_user)):
    ok = await DB.brand_delete(brand_id, u["org_id"])
    if not ok:
        raise HTTPException(404)
    return {"ok": True}


# ══════════════════════════════════════════════════════════════════════════════
# SCREENS
# ══════════════════════════════════════════════════════════════════════════════

@api.get("/screens/thumbnails")
async def get_screen_thumbnails(u=Depends(current_user)):
    # Returns a dict of { "slug": "base64_or_url" }. Empty for now.
    return {}

HARDCODED_TEMPLATES = [
    {
        "id": "fullscreen",
        "name": "Ecran Complet (1Z)",
        "zones": [
            {"id": "zone-1", "name": "Zonă Principală", "x": 0, "y": 0, "width": 100, "height": 100}
        ]
    },
    {
        "id": "split_v",
        "name": "Split Vertical (2Z)",
        "zones": [
            {"id": "zone-1", "name": "Stânga (50%)", "x": 0, "y": 0, "width": 50, "height": 100},
            {"id": "zone-2", "name": "Dreapta (50%)", "x": 50, "y": 0, "width": 50, "height": 100}
        ]
    },
    {
        "id": "l_shape",
        "name": "L-Shape (3Z)",
        "zones": [
            {"id": "zone-1", "name": "Principal", "x": 0, "y": 0, "width": 75, "height": 80},
            {"id": "zone-2", "name": "Lateral", "x": 75, "y": 0, "width": 25, "height": 100},
            {"id": "zone-3", "name": "Subsol", "x": 0, "y": 80, "width": 75, "height": 20}
        ]
    }
]

@api.get("/screen-templates")
async def list_screen_templates(u=Depends(current_user)):
    return HARDCODED_TEMPLATES


@api.get("/screens")
async def list_screens(u=Depends(current_user)):
    return await DB.screens_list(u["org_id"])

@api.post("/screens", status_code=201)
async def create_screen(body: ScreenIn, u=Depends(current_user)):
    # Block >1 screens for trial/free/none
    org_data = await DB.org_get(u["org_id"])
    plan = org_data.get("plan", "trial") if org_data else "trial"
    if plan in ["trial", "free", "none"]:
        screens = await DB.screens_list(u["org_id"])
        if len(screens) >= 1:
            raise HTTPException(status_code=403, detail="Abonamentul free permite un singur ecran. Treceți la un cont superior pentru ecrane nelimitate.")

    if await DB.screen_exists_by_slug(body.slug):
        raise HTTPException(400, "Slug already taken, choose another")
    row = {"id": str(uuid.uuid4()), "org_id": u["org_id"],
           **body.model_dump(), "created_at": datetime.now(timezone.utc)}
    await DB.screen_insert(row)
    return await DB.screen_get(row["id"], u["org_id"])

@api.get("/screens/{screen_id}")
async def get_screen(screen_id: str, u=Depends(current_user)):
    s = await DB.screen_get(screen_id, u["org_id"])
    if not s:
        raise HTTPException(404)
    return s

@api.get("/screen-zones/{screen_id}")
async def get_screen_zones(screen_id: str, u=Depends(current_user)):
    return await DB.screen_zones_list(screen_id)

@api.post("/screen-zones")
async def save_screen_zone(body: ScreenZoneIn, u=Depends(current_user)):
    s = await DB.screen_get(body.screen_id, u["org_id"])
    if not s:
        raise HTTPException(404, "Screen not found")
    await DB.screen_zone_upsert(
        u["org_id"], body.screen_id, body.zone_id,
        body.content_id, body.playlist_id, body.content_type
    )
    return {"ok": True}

@api.put("/screens/{screen_id}")
async def update_screen(screen_id: str, body: ScreenIn, u=Depends(current_user)):
    s = await DB.screen_get(screen_id, u["org_id"])
    if not s:
        raise HTTPException(404)
    # Slug uniqueness check (allow same slug if same screen)
    if body.slug != s["slug"] and await DB.screen_exists_by_slug(body.slug):
        raise HTTPException(400, "Slug already taken")
    await DB.screen_update(screen_id, u["org_id"], body.model_dump())
    return await DB.screen_get(screen_id, u["org_id"])

@api.delete("/screens/{screen_id}")
async def delete_screen(screen_id: str, u=Depends(current_user)):
    ok = await DB.screen_delete(screen_id, u["org_id"])
    if not ok:
        raise HTTPException(404)
    return {"ok": True}

@api.post("/screens/{screen_id}/assign")
async def assign_content(screen_id: str, body: ZoneAssignIn, u=Depends(current_user)):
    """Assign content or playlist to a screen zone."""
    s = await DB.screen_get(screen_id, u["org_id"])
    if not s:
        raise HTTPException(404)
    await DB.screen_zone_upsert(
        u["org_id"], screen_id,
        body.zone_id or "main",
        body.content_id, body.playlist_id,
        body.content_type or "single_content"
    )
    return {"ok": True}

@api.get("/screens/{screen_id}/zone")
async def get_zone(screen_id: str, u=Depends(current_user)):
    s = await DB.screen_get(screen_id, u["org_id"])
    if not s:
        raise HTTPException(404)
    return await DB.screen_zone_get(screen_id)


# ── TV DISPLAY (Public — no auth) ─────────────────────────────────────────────
@api.get("/display/{slug}")
async def tv_display(slug: str):
    """Called by the TV browser to get screen config."""
    screen = await DB.screen_get_by_slug(slug)
    if not screen:
        raise HTTPException(404, "Screen not found")

    # Heartbeat
    await DB.screen_heartbeat(screen["id"])

    # Get template
    template_id = screen.get("template_id") or "fullscreen"
    template = next((t for t in HARDCODED_TEMPLATES if t["id"] == template_id), HARDCODED_TEMPLATES[0])

    # Get assigned content / playlists for ALL zones
    db_zones = await DB.screen_zones_list(screen["id"])
    zones_config = []
    for z in db_zones:
        content = None
        playlist = None
        c_id = z.get("content_id")
        p_id = z.get("playlist_id")
        if c_id:
            c = await DB._one("SELECT * FROM content WHERE id=$1", c_id)
            content = DB._row(c) if c else None
        if p_id:
            p = await DB._one("SELECT * FROM playlists WHERE id=$1", p_id)
            playlist = DB._row(p) if p else None
        
        zones_config.append({
            "zone_id": z["zone_id"],
            "content_type": z["content_type"],
            "content": content,
            "playlist": playlist
        })

    # Fetch logo if needed
    if screen.get("logo_enabled") and screen.get("logo_brand_id"):
        brand = await DB.brand_get(screen["logo_brand_id"], screen["org_id"])
        if brand and brand.get("logo_url"):
            screen["logo_url"] = brand["logo_url"]

    # Fetch organization to check subscription limits
    org_data = await DB.org_get(screen["org_id"])
    subscription_status = org_data.get("subscription_status", "none") if org_data else "none"

    # Also extract 'main' zone to support fallback
    main_zone = next((z for z in zones_config if z["zone_id"] == "main"), None)

    return {
        "screen": screen,
        "template": template,
        "zones_config": zones_config,
        "zone": main_zone,  # Fallback for older frontend code
        "content": main_zone["content"] if main_zone else None,
        "playlist": main_zone["playlist"] if main_zone else None,
        "subscription_status": subscription_status,
    }

@api.post("/display/{slug}/heartbeat")
async def tv_heartbeat(slug: str):
    screen = await DB.screen_get_by_slug(slug)
    if screen:
        await DB.screen_heartbeat(screen["id"])
    return {"ok": True}


# ══════════════════════════════════════════════════════════════════════════════
# CONTENT
# ══════════════════════════════════════════════════════════════════════════════

@api.get("/content/folders")
async def list_content_folders(u=Depends(current_user)):
    return await DB.folder_list(u["org_id"])

@api.post("/content/folders", status_code=201)
async def create_folder(body: FolderIn, u=Depends(current_user)):
    row = {
        "id": str(uuid.uuid4()), "org_id": u["org_id"],
        **body.model_dump(), "created_at": datetime.now(timezone.utc)
    }
    await DB.folder_insert(row)
    return row

@api.patch("/content/folders/{folder_id}")
async def update_folder(folder_id: str, body: FolderIn, u=Depends(current_user)):
    await DB.folder_update(folder_id, u["org_id"], body.model_dump())
    return {"ok": True}

@api.delete("/content/folders/{folder_id}")
async def delete_folder(folder_id: str, u=Depends(current_user)):
    ok = await DB.folder_delete(folder_id, u["org_id"])
    if not ok:
        raise HTTPException(404)
    return {"ok": True}

@api.get("/content")
async def list_content(u=Depends(current_user)):
    return await DB.content_list(u["org_id"])

@api.post("/content", status_code=201)
async def create_content(body: ContentIn, u=Depends(current_user)):
    row = {"id": str(uuid.uuid4()), "org_id": u["org_id"],
           **body.model_dump(), "created_at": datetime.now(timezone.utc)}
    await DB.content_insert(row)
    return row

@api.post("/content/upload", status_code=201)
async def upload_content(
    file: UploadFile = File(...),
    title: str = Form(...),
    duration: int = Form(10),
    category: str = Form("other"),
    u=Depends(current_user)
):
    MAX_SIZE = 500 * 1024 * 1024  # 500 MB
    data = await file.read()
    if len(data) > MAX_SIZE:
        raise HTTPException(413, "File too large (max 500 MB)")

    content_type = file.content_type or "application/octet-stream"
    ext = Path(file.filename or "file").suffix or ".bin"
    media_type = "video" if content_type.startswith("video") else "image"
    path = f"org-{u['org_id']}/{media_type}/{uuid.uuid4()}{ext}"

    # Thumbnail for images
    thumb_url = None
    if media_type == "image" and len(data) < 20 * 1024 * 1024:
        try:
            from io import BytesIO
            img = Image.open(BytesIO(data))
            img.thumbnail((400, 400))
            buf = BytesIO()
            img.save(buf, format="JPEG", quality=75)
            thumb_path = f"org-{u['org_id']}/thumbs/{uuid.uuid4()}.jpg"
            thumb_url = await upload_file(buf.getvalue(), thumb_path, "image/jpeg")
        except Exception as e:
            logger.warning(f"Thumbnail generation failed: {e}")

    file_url = await upload_file(data, path, content_type)
    content_id = str(uuid.uuid4())
    row = {
        "id": content_id, "org_id": u["org_id"], "title": title,
        "type": media_type, "source_type": "file",
        "file_url": file_url, "file_size": len(data),
        "duration": duration, "category": category,
        "tags": [], "thumbnail_url": thumb_url,
        "autoplay": True, "loop": True, "folder_id": None,
        "created_at": datetime.now(timezone.utc)
    }
    await DB.content_insert(row)
    return row

@api.patch("/content/{content_id}/title")
async def rename_content(content_id: str, body: TitleUpdate, u=Depends(current_user)):
    await DB.content_update_title(content_id, u["org_id"], body.title)
    return {"ok": True}

@api.delete("/content/{content_id}")
async def delete_content(content_id: str, u=Depends(current_user)):
    ok = await DB.content_delete(content_id, u["org_id"])
    if not ok:
        raise HTTPException(404)
    return {"ok": True}

@api.get("/content-folders")
async def list_content_folders(u=Depends(current_user)):
    # Temporary stub to prevent 405 Method Not Allowed in frontend
    return []


# ══════════════════════════════════════════════════════════════════════════════
# PLAYLISTS
# ══════════════════════════════════════════════════════════════════════════════

@api.get("/playlists")
async def list_playlists(u=Depends(current_user)):
    return await DB.playlists_list(u["org_id"])

@api.post("/playlists", status_code=201)
async def create_playlist(body: PlaylistIn, u=Depends(current_user)):
    row = {"id": str(uuid.uuid4()), "org_id": u["org_id"],
           **body.model_dump(), "created_at": datetime.now(timezone.utc)}
    await DB.playlist_insert(row)
    return await DB.playlist_get(row["id"], u["org_id"])

@api.get("/playlists/{pl_id}")
async def get_playlist(pl_id: str, u=Depends(current_user)):
    p = await DB.playlist_get(pl_id, u["org_id"])
    if not p:
        raise HTTPException(404)
    return p

@api.put("/playlists/{pl_id}")
async def update_playlist(pl_id: str, body: PlaylistIn, u=Depends(current_user)):
    p = await DB.playlist_get(pl_id, u["org_id"])
    if not p:
        raise HTTPException(404)
    await DB.playlist_update(pl_id, u["org_id"], body.model_dump())
    return await DB.playlist_get(pl_id, u["org_id"])

@api.delete("/playlists/{pl_id}")
async def delete_playlist(pl_id: str, u=Depends(current_user)):
    ok = await DB.playlist_delete(pl_id, u["org_id"])
    if not ok:
        raise HTTPException(404)
    return {"ok": True}


# ══════════════════════════════════════════════════════════════════════════════
# BILLING (basic webhook stub + manual activation)
# ══════════════════════════════════════════════════════════════════════════════

class BillingActivateIn(BaseModel):
    plan: str         # day, week, month
    ref: Optional[str] = None

@api.post("/billing/checkout")
async def create_checkout(body: BillingActivateIn, u=Depends(current_user)):
    """Creates a Viva Wallet checkout session url"""
    # Funcționalitate de bază (Mock). Deocamdată returnăm url-ul direct către plata viva folosind linkurile tale.
    # Când ai token-ul API, un request aici ar cere un OrderCode.
    keys = {"day": "PLACEHOLDER_1ZI", "week": "PLACEHOLDER_1SAP", "month": "PLACEHOLDER_1LUNA"}
    ref = keys.get(body.plan)
    if not ref:
        raise HTTPException(400, "Invalid plan")
    return {"url": f"https://www.vivapayments.com/web/checkout?ref={ref}&merchantTrns={u['org_id']}_{body.plan}"}

@api.post("/webhooks/viva")
async def viva_webhook(request: Request):
    """Webhook apelat de Viva Wallet la o plată confirmată."""
    body = await request.json()
    event_type = body.get("EventData", {}).get("StatusId")
    if event_type == "F": # Finished
        pass
    return {"status": "ok"}

@api.post("/billing/activate")
async def activate_plan(body: BillingActivateIn, u=Depends(current_user)):
    """Manually activate a plan (called after payment confirmation)."""
    PLAN_DAYS = {"day": 1, "week": 7, "month": 30}
    PLAN_EUR  = {"day": 1.21, "week": 6.05, "month": 18.15}
    if body.plan not in PLAN_DAYS:
        raise HTTPException(400, "Invalid plan")
    now = datetime.now(timezone.utc)
    expires = now + timedelta(days=PLAN_DAYS[body.plan])
    await DB.org_update_plan(u["org_id"], body.plan, expires)
    await DB.billing_insert({
        "id": str(uuid.uuid4()), "org_id": u["org_id"],
        "plan": body.plan, "amount_eur": PLAN_EUR[body.plan],
        "paid_at": now, "expires_at": expires,
        "provider": "viva", "ref": body.ref, "created_at": now
    })
    return {"ok": True, "plan": body.plan, "expires_at": expires.isoformat()}

@api.get("/billing")
async def get_billing(u=Depends(current_user)):
    org = await DB.org_get(u["org_id"])
    history = await DB.billing_list(u["org_id"])
    return {"org": org, "history": history}

@api.get("/billing/summary")
async def get_billing_summary(u=Depends(current_user)):
    # Temporary stub to prevent 404s in frontend Billing page
    return {
        "locations": [],
        "config": {"price_per_screen": 15.0, "currency": "EUR", "notes": ""},
        "total_screens": 0,
        "total_monthly": 0
    }

@api.put("/billing/config")
async def update_billing_config(request: Request, u=Depends(current_user)):
    # Temporary stub
    return {"ok": True}

@api.get("/dashboard/stats")
async def get_dashboard_stats(u=Depends(current_user)):
    screens = await DB.screens_list(u["org_id"])
    org_data = await DB.org_get(u["org_id"])
    plan = org_data.get("plan", "trial") if org_data else "trial"
    
    return {
        "locations": 0,
        "screens_total": len(screens),
        "screens_online": sum(1 for s in screens if s.get("status") in ["online", "active"]),
        "products_active": 0,
        "content_files": 0,
        "plan": plan,
        "recent_activity": []
    }

@api.get("/happy-hours")
async def list_happy_hours(u=Depends(current_user)):
    return []


# ══════════════════════════════════════════════════════════════════════════════
# HEALTH
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/")
async def health():
    return {"status": "ok", "service": "Smart Displays API", "version": "1.0.0"}

@app.get("/api/version")
async def version():
    return {"version": "1.0.0"}

# Mount router
app.include_router(api)
