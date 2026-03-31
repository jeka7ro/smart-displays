"""
Smart Displays — Database Layer (asyncpg / PostgreSQL)
Multi-tenant: every resource is scoped by org_id.
"""
from __future__ import annotations

import os
import json
from pathlib import Path
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import asyncpg
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

DATABASE_URL = os.environ.get("DATABASE_URL") or os.environ.get("SUPABASE_DB_URL")
if not DATABASE_URL:
    raise RuntimeError("Set DATABASE_URL in .env")

pool: Optional[asyncpg.Pool] = None


# ─────────────────────────────────────── CONNECT ──────────────────────────────

async def init_db() -> None:
    global pool
    url = DATABASE_URL.strip()
    if url.startswith("postgres://"):
        url = "postgresql://" + url[11:]
    if ("supabase.co" in url or "pooler.supabase.com" in url) and "sslmode=" not in url:
        sep = "&" if "?" in url else "?"
        url = f"{url}{sep}sslmode=require"

    from urllib.parse import unquote, urlparse
    parsed = urlparse(url)
    username = unquote(parsed.username or "")
    password = unquote(parsed.password or "")
    hostname = parsed.hostname or "localhost"
    port     = parsed.port or 5432
    database = parsed.path.lstrip("/") or "postgres"
    ssl_mode = "require" if "sslmode=require" in url else None

    import logging, asyncio
    logger = logging.getLogger("uvicorn.error")
    logger.info(f"Connecting to {hostname}:{port}/{database}")

    for attempt in range(3):
        try:
            pool = await asyncpg.create_pool(
                user=username, password=password,
                host=hostname, port=port, database=database,
                ssl=ssl_mode,
                min_size=1, max_size=5,
                command_timeout=20, timeout=15,
                statement_cache_size=0,
            )
            logger.info("DB connected ✓")
            break
        except Exception as e:
            logger.error(f"DB attempt {attempt+1} failed: {e}")
            if attempt < 2:
                await asyncio.sleep(2)
            else:
                raise

    await _create_tables()


async def close_db() -> None:
    global pool
    if pool:
        await pool.close()
        pool = None


# ─────────────────────────────────────── TABLES ───────────────────────────────

async def _create_tables() -> None:
    assert pool

    await pool.execute("""
        CREATE TABLE IF NOT EXISTS organizations (
            id           TEXT PRIMARY KEY,
            name         TEXT NOT NULL,
            owner_id     TEXT NOT NULL,
            plan         TEXT DEFAULT 'trial',
            plan_expires_at TIMESTAMPTZ,
            created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    """)

    await pool.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id              TEXT PRIMARY KEY,
            org_id          TEXT REFERENCES organizations(id) ON DELETE CASCADE,
            email           TEXT UNIQUE NOT NULL,
            full_name       TEXT DEFAULT 'Unknown',
            hashed_password TEXT NOT NULL,
            role            TEXT DEFAULT 'admin',
            is_owner        BOOLEAN DEFAULT FALSE,
            is_onboarded    BOOLEAN DEFAULT FALSE,
            status          TEXT DEFAULT 'active',
            avatar_url      TEXT,
            phone           TEXT,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            last_login      TIMESTAMPTZ
        );
    """)

    # Migrare automată pentru users.is_onboarded
    await pool.execute("""
        ALTER TABLE users ADD COLUMN IF NOT EXISTS is_onboarded BOOLEAN DEFAULT FALSE;
    """)

    await pool.execute("""
        CREATE TABLE IF NOT EXISTS password_resets (
            email      TEXT PRIMARY KEY,
            token      TEXT NOT NULL,
            expires_at TIMESTAMPTZ NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    """)

    await pool.execute("""
        CREATE TABLE IF NOT EXISTS locations (
            id         TEXT PRIMARY KEY,
            org_id     TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            name       TEXT NOT NULL,
            address    TEXT,
            city       TEXT,
            status     TEXT DEFAULT 'active',
            timezone   TEXT DEFAULT 'Europe/Bucharest',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    """)

    await pool.execute("""
        CREATE TABLE IF NOT EXISTS brands (
            id         TEXT PRIMARY KEY,
            org_id     TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            name       TEXT NOT NULL,
            logo_url   TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    """)

    await pool.execute("""
        CREATE TABLE IF NOT EXISTS screens (
            id               TEXT PRIMARY KEY,
            org_id           TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            location_id      TEXT REFERENCES locations(id),
            name             TEXT NOT NULL,
            slug             TEXT NOT NULL UNIQUE,
            resolution       TEXT DEFAULT '1920x1080',
            orientation      TEXT DEFAULT '0',
            status           TEXT DEFAULT 'offline',
            last_active      TIMESTAMPTZ,
            sync_group       TEXT,
            sync_group_name  TEXT,
            cascade_offset   INT DEFAULT 0,
            sync_type        TEXT DEFAULT 'simple',
            sync_fit_mode    TEXT DEFAULT 'cover',
            -- Effects
            parallax_enabled         BOOLEAN DEFAULT FALSE,
            steam_enabled            BOOLEAN DEFAULT FALSE,
            valentine_hearts_enabled BOOLEAN DEFAULT FALSE,
            valentine_hearts_intensity TEXT DEFAULT 'low',
            snow_enabled             BOOLEAN DEFAULT FALSE,
            snow_intensity           TEXT DEFAULT 'low',
            sakura_enabled           BOOLEAN DEFAULT FALSE,
            sakura_intensity         TEXT DEFAULT 'low',
            -- Logo overlay
            logo_enabled    BOOLEAN DEFAULT FALSE,
            logo_brand_id   TEXT REFERENCES brands(id),
            logo_position   TEXT DEFAULT 'top-right',
            logo_size       TEXT DEFAULT 'md',
            -- Custom text
            custom_text_enabled        BOOLEAN DEFAULT FALSE,
            custom_text_content        TEXT,
            custom_text_position       TEXT DEFAULT 'bottom-center',
            custom_text_size           TEXT DEFAULT 'md',
            custom_text_color          TEXT DEFAULT '#FFFFFF',
            custom_text_has_background BOOLEAN DEFAULT FALSE,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    """)

    await pool.execute("""
        CREATE TABLE IF NOT EXISTS content (
            id          TEXT PRIMARY KEY,
            org_id      TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            title       TEXT NOT NULL,
            type        TEXT NOT NULL,
            source_type TEXT DEFAULT 'file',
            file_url    TEXT NOT NULL,
            file_size   BIGINT DEFAULT 0,
            duration    INT DEFAULT 10,
            category    TEXT DEFAULT 'other',
            tags        JSONB DEFAULT '[]',
            thumbnail_url TEXT,
            autoplay    BOOLEAN DEFAULT TRUE,
            loop        BOOLEAN DEFAULT TRUE,
            folder_id   TEXT,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    """)

    await pool.execute("""
        CREATE TABLE IF NOT EXISTS content_folders (
            id          TEXT PRIMARY KEY,
            org_id      TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            name        TEXT NOT NULL,
            color       TEXT DEFAULT '#6366f1',
            icon        TEXT DEFAULT 'folder',
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    """)

    await pool.execute("""
        CREATE TABLE IF NOT EXISTS playlists (
            id           TEXT PRIMARY KEY,
            org_id       TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            name         TEXT NOT NULL,
            description  TEXT,
            items        JSONB DEFAULT '[]',
            autoplay     BOOLEAN DEFAULT TRUE,
            loop         BOOLEAN DEFAULT TRUE,
            status       TEXT DEFAULT 'active',
            color        TEXT DEFAULT '#4F46E5',
            is_scheduled BOOLEAN DEFAULT FALSE,
            start_at     TIMESTAMPTZ,
            end_at       TIMESTAMPTZ,
            created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    """)

    await pool.execute("""
        CREATE TABLE IF NOT EXISTS screen_zones (
            id           TEXT PRIMARY KEY,
            org_id       TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            screen_id    TEXT NOT NULL REFERENCES screens(id) ON DELETE CASCADE,
            zone_id      TEXT NOT NULL DEFAULT 'main',
            content_type TEXT DEFAULT 'single_content',
            content_id   TEXT REFERENCES content(id),
            playlist_id  TEXT REFERENCES playlists(id),
            UNIQUE(screen_id, zone_id)
        );
    """)

    await pool.execute("""
        CREATE TABLE IF NOT EXISTS billing (
            id          TEXT PRIMARY KEY,
            org_id      TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            plan        TEXT NOT NULL,
            amount_eur  NUMERIC(10,2),
            paid_at     TIMESTAMPTZ,
            expires_at  TIMESTAMPTZ,
            provider    TEXT DEFAULT 'viva',
            ref         TEXT,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    """)

    # Add missing columns gracefully (for existing DBs)
    for stmt in [
        "ALTER TABLE screens ADD COLUMN IF NOT EXISTS sync_created_by TEXT",
        "ALTER TABLE screens ADD COLUMN IF NOT EXISTS sync_created_at TIMESTAMPTZ",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT",
    ]:
        try:
            await pool.execute(stmt)
        except Exception:
            pass


# ─────────────────────────────────────── HELPERS ──────────────────────────────

def _row(r) -> Optional[Dict[str, Any]]:
    if r is None:
        return None
    d = dict(r)
    for k, v in list(d.items()):
        if hasattr(v, "isoformat"):
            d[k] = v.isoformat()
        list_fields = ["tags", "items", "screen_ids"]
        if k in list_fields:
            if v is None:
                d[k] = []
            elif isinstance(v, str):
                try:
                    d[k] = json.loads(v)
                except Exception:
                    d[k] = []
    return d


def _rows(rows) -> List[Dict[str, Any]]:
    return [d for r in rows if (d := _row(r))]


async def _one(q: str, *a) -> Optional[Dict[str, Any]]:
    assert pool
    return _row(await pool.fetchrow(q, *a))


async def _all(q: str, *a) -> List[Dict[str, Any]]:
    assert pool
    return _rows(await pool.fetch(q, *a))


async def _exec(q: str, *a) -> str:
    assert pool
    return await pool.execute(q, *a)


# ─────────────────────────────────────── ORGANIZATIONS ────────────────────────

async def org_get(org_id: str) -> Optional[Dict]:
    return await _one("SELECT * FROM organizations WHERE id = $1", org_id)

async def org_insert(row: Dict) -> None:
    await _exec(
        "INSERT INTO organizations (id, name, owner_id, plan, created_at) VALUES ($1,$2,$3,$4,$5)",
        row["id"], row["name"], row["owner_id"], row.get("plan", "trial"), row["created_at"]
    )

async def org_update_plan(org_id: str, plan: str, expires_at) -> None:
    await _exec(
        "UPDATE organizations SET plan=$1, plan_expires_at=$2 WHERE id=$3",
        plan, expires_at, org_id
    )


# ─────────────────────────────────────── USERS ────────────────────────────────

async def user_get_by_email(email: str) -> Optional[Dict]:
    return await _one("SELECT * FROM users WHERE email=$1", email)

async def user_get_by_id(user_id: str) -> Optional[Dict]:
    return await _one("SELECT * FROM users WHERE id=$1", user_id)

async def user_insert(row: Dict) -> None:
    await _exec(
        """INSERT INTO users (id, org_id, email, full_name, hashed_password, role,
           is_owner, status, phone, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)""",
        row["id"], row["org_id"], row["email"], row.get("full_name", ""),
        row["hashed_password"], row.get("role", "admin"),
        row.get("is_owner", False), row.get("status", "active"), row.get("phone"), row["created_at"]
    )

async def user_update_last_login(email: str) -> None:
    await _exec("UPDATE users SET last_login=NOW() WHERE email=$1", email)

async def user_update_password(user_id: str, hashed: str) -> None:
    await _exec("UPDATE users SET hashed_password=$1 WHERE id=$2", hashed, user_id)

async def users_list(org_id: str) -> List[Dict]:
    return await _all(
        "SELECT id,email,full_name,role,is_owner,status,avatar_url,phone,created_at,last_login "
        "FROM users WHERE org_id=$1 ORDER BY created_at DESC", org_id
    )


# ─────────────────────────────────────── LOCATIONS ────────────────────────────

async def location_get(loc_id: str, org_id: str) -> Optional[Dict]:
    return await _one("SELECT * FROM locations WHERE id=$1 AND org_id=$2", loc_id, org_id)

async def locations_list(org_id: str) -> List[Dict]:
    return await _all("SELECT * FROM locations WHERE org_id=$1 ORDER BY name", org_id)

async def location_insert(row: Dict) -> None:
    await _exec(
        "INSERT INTO locations (id,org_id,name,address,city,status,timezone,created_at) "
        "VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
        row["id"], row["org_id"], row["name"], row.get("address"), row.get("city"),
        row.get("status","active"), row.get("timezone","Europe/Bucharest"), row["created_at"]
    )

async def location_update(loc_id: str, org_id: str, data: Dict) -> None:
    await _exec(
        "UPDATE locations SET name=$1,address=$2,city=$3,status=$4 WHERE id=$5 AND org_id=$6",
        data["name"], data.get("address"), data.get("city"), data.get("status","active"),
        loc_id, org_id
    )

async def location_delete(loc_id: str, org_id: str) -> bool:
    r = await _exec("DELETE FROM locations WHERE id=$1 AND org_id=$2", loc_id, org_id)
    return "DELETE 1" in r


# ─────────────────────────────────────── BRANDS ───────────────────────────────

async def brand_get(brand_id: str, org_id: str) -> Optional[Dict]:
    return await _one("SELECT * FROM brands WHERE id=$1 AND org_id=$2", brand_id, org_id)

async def brands_list(org_id: str) -> List[Dict]:
    return await _all("SELECT * FROM brands WHERE org_id=$1 ORDER BY name", org_id)

async def brand_insert(row: Dict) -> None:
    await _exec(
        "INSERT INTO brands (id,org_id,name,logo_url,created_at) VALUES ($1,$2,$3,$4,$5)",
        row["id"], row["org_id"], row["name"], row.get("logo_url"), row["created_at"]
    )

async def brand_update(brand_id: str, org_id: str, data: Dict) -> None:
    await _exec(
        "UPDATE brands SET name=$1,logo_url=$2 WHERE id=$3 AND org_id=$4",
        data["name"], data.get("logo_url"), brand_id, org_id
    )

async def brand_delete(brand_id: str, org_id: str) -> bool:
    r = await _exec("DELETE FROM brands WHERE id=$1 AND org_id=$2", brand_id, org_id)
    return "DELETE 1" in r


# ─────────────────────────────────────── SCREENS ──────────────────────────────

async def screen_get(screen_id: str, org_id: str) -> Optional[Dict]:
    return await _one("SELECT * FROM screens WHERE id=$1 AND org_id=$2", screen_id, org_id)

async def screen_get_by_slug(slug: str) -> Optional[Dict]:
    """Public — no org check (TV display needs this)"""
    return await _one("SELECT * FROM screens WHERE slug=$1", slug)

async def screens_list(org_id: str) -> List[Dict]:
    return await _all("""
        SELECT s.*,
            CASE WHEN s.last_active >= NOW() - INTERVAL '20 minutes' THEN 'online' ELSE 'offline' END AS status,
            l.name AS location_name, l.city
        FROM screens s
        LEFT JOIN locations l ON s.location_id = l.id
        WHERE s.org_id = $1
        ORDER BY l.name, s.name
    """, org_id)

async def screen_exists_by_slug(slug: str) -> bool:
    r = await _one("SELECT 1 FROM screens WHERE slug=$1", slug)
    return r is not None

async def screen_insert(row: Dict) -> None:
    await _exec(
        """INSERT INTO screens (id,org_id,location_id,name,slug,resolution,orientation,
           sync_group,sync_group_name,cascade_offset,sync_type,sync_fit_mode,
           parallax_enabled,steam_enabled,valentine_hearts_enabled,valentine_hearts_intensity,
           snow_enabled,snow_intensity,sakura_enabled,sakura_intensity,
           logo_enabled,logo_brand_id,logo_position,logo_size,
           custom_text_enabled,custom_text_content,custom_text_position,custom_text_size,
           custom_text_color,custom_text_has_background,created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
                   $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31)""",
        row["id"], row["org_id"], row.get("location_id"), row["name"], row["slug"],
        row.get("resolution","1920x1080"), row.get("orientation","0"),
        row.get("sync_group"), row.get("sync_group_name"), row.get("cascade_offset",0),
        row.get("sync_type","simple"), row.get("sync_fit_mode","cover"),
        row.get("parallax_enabled",False), row.get("steam_enabled",False),
        row.get("valentine_hearts_enabled",False), row.get("valentine_hearts_intensity","low"),
        row.get("snow_enabled",False), row.get("snow_intensity","low"),
        row.get("sakura_enabled",False), row.get("sakura_intensity","low"),
        row.get("logo_enabled",False), row.get("logo_brand_id"),
        row.get("logo_position","top-right"), row.get("logo_size","md"),
        row.get("custom_text_enabled",False), row.get("custom_text_content"),
        row.get("custom_text_position","bottom-center"), row.get("custom_text_size","md"),
        row.get("custom_text_color","#FFFFFF"), row.get("custom_text_has_background",False),
        row["created_at"]
    )

async def screen_update(screen_id: str, org_id: str, data: Dict) -> None:
    await _exec(
        """UPDATE screens SET location_id=$1,name=$2,resolution=$3,orientation=$4,
           sync_group=$5,sync_group_name=$6,cascade_offset=$7,sync_type=$8,sync_fit_mode=$9,
           parallax_enabled=$10,steam_enabled=$11,valentine_hearts_enabled=$12,
           valentine_hearts_intensity=$13,snow_enabled=$14,snow_intensity=$15,
           sakura_enabled=$16,sakura_intensity=$17,logo_enabled=$18,logo_brand_id=$19,
           logo_position=$20,logo_size=$21,custom_text_enabled=$22,custom_text_content=$23,
           custom_text_position=$24,custom_text_size=$25,custom_text_color=$26,
           custom_text_has_background=$27
           WHERE id=$28 AND org_id=$29""",
        data.get("location_id"), data["name"],
        data.get("resolution","1920x1080"), data.get("orientation","0"),
        data.get("sync_group"), data.get("sync_group_name"), data.get("cascade_offset",0),
        data.get("sync_type","simple"), data.get("sync_fit_mode","cover"),
        data.get("parallax_enabled",False), data.get("steam_enabled",False),
        data.get("valentine_hearts_enabled",False), data.get("valentine_hearts_intensity","low"),
        data.get("snow_enabled",False), data.get("snow_intensity","low"),
        data.get("sakura_enabled",False), data.get("sakura_intensity","low"),
        data.get("logo_enabled",False), data.get("logo_brand_id"),
        data.get("logo_position","top-right"), data.get("logo_size","md"),
        data.get("custom_text_enabled",False), data.get("custom_text_content"),
        data.get("custom_text_position","bottom-center"), data.get("custom_text_size","md"),
        data.get("custom_text_color","#FFFFFF"), data.get("custom_text_has_background",False),
        screen_id, org_id
    )

async def screen_heartbeat(screen_id: str) -> None:
    await _exec("UPDATE screens SET last_active=NOW() WHERE id=$1", screen_id)

async def screen_delete(screen_id: str, org_id: str) -> bool:
    r = await _exec("DELETE FROM screens WHERE id=$1 AND org_id=$2", screen_id, org_id)
    return "DELETE 1" in r

async def screens_by_sync_group(sync_group: str, org_id: str) -> List[Dict]:
    return await _all(
        "SELECT * FROM screens WHERE sync_group=$1 AND org_id=$2 ORDER BY cascade_offset",
        sync_group, org_id
    )


# ─────────────────────────────────────── SCREEN ZONES ─────────────────────────

async def screen_zone_get(screen_id: str, zone_id: str = "main") -> Optional[Dict]:
    return await _one(
        "SELECT * FROM screen_zones WHERE screen_id=$1 AND zone_id=$2", screen_id, zone_id
    )

async def screen_zone_upsert(org_id: str, screen_id: str, zone_id: str,
                              content_id: Optional[str], playlist_id: Optional[str],
                              content_type: str = "single_content") -> None:
    import uuid
    await _exec(
        """INSERT INTO screen_zones (id,org_id,screen_id,zone_id,content_type,content_id,playlist_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           ON CONFLICT (screen_id,zone_id) DO UPDATE SET
             content_type=EXCLUDED.content_type,
             content_id=EXCLUDED.content_id,
             playlist_id=EXCLUDED.playlist_id""",
        str(uuid.uuid4()), org_id, screen_id, zone_id, content_type, content_id, playlist_id
    )


# ─────────────────────────────────────── CONTENT ──────────────────────────────

async def content_get(content_id: str, org_id: str) -> Optional[Dict]:
    return await _one("SELECT * FROM content WHERE id=$1 AND org_id=$2", content_id, org_id)

async def content_list(org_id: str) -> List[Dict]:
    return await _all(
        "SELECT * FROM content WHERE org_id=$1 ORDER BY created_at DESC LIMIT 1000", org_id
    )

async def content_insert(row: Dict) -> None:
    await _exec(
        """INSERT INTO content (id,org_id,title,type,source_type,file_url,file_size,
           duration,category,tags,thumbnail_url,autoplay,loop,folder_id,created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)""",
        row["id"], row["org_id"], row["title"], row["type"],
        row.get("source_type","file"), row["file_url"], row.get("file_size",0),
        row.get("duration",10), row.get("category","other"),
        json.dumps(row.get("tags") or []), row.get("thumbnail_url"),
        row.get("autoplay",True), row.get("loop",True),
        row.get("folder_id"), row["created_at"]
    )

async def content_update_title(content_id: str, org_id: str, title: str) -> None:
    await _exec("UPDATE content SET title=$1 WHERE id=$2 AND org_id=$3", title, content_id, org_id)

async def content_delete(content_id: str, org_id: str) -> bool:
    # Clear from screen zones first
    await _exec("UPDATE screen_zones SET content_id=NULL WHERE content_id=$1", content_id)
    r = await _exec("DELETE FROM content WHERE id=$1 AND org_id=$2", content_id, org_id)
    return "DELETE 1" in r

async def content_count(org_id: str) -> int:
    r = await _one("SELECT count(*)::int AS c FROM content WHERE org_id=$1", org_id)
    return r["c"] if r else 0


# ─────────────────────────────────────── PLAYLISTS ────────────────────────────

async def playlist_get(playlist_id: str, org_id: str) -> Optional[Dict]:
    return await _one("SELECT * FROM playlists WHERE id=$1 AND org_id=$2", playlist_id, org_id)

async def playlists_list(org_id: str) -> List[Dict]:
    return await _all(
        "SELECT * FROM playlists WHERE org_id=$1 ORDER BY created_at DESC LIMIT 500", org_id
    )

async def playlist_insert(row: Dict) -> None:
    await _exec(
        """INSERT INTO playlists (id,org_id,name,description,items,autoplay,loop,
           status,color,is_scheduled,start_at,end_at,created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)""",
        row["id"], row["org_id"], row["name"], row.get("description"),
        json.dumps(row.get("items") or []),
        row.get("autoplay",True), row.get("loop",True),
        row.get("status","active"), row.get("color","#4F46E5"),
        row.get("is_scheduled",False), row.get("start_at"), row.get("end_at"),
        row["created_at"]
    )

async def playlist_update(playlist_id: str, org_id: str, data: Dict) -> None:
    await _exec(
        """UPDATE playlists SET name=$1,description=$2,items=$3,autoplay=$4,loop=$5,
           status=$6,color=$7,is_scheduled=$8,start_at=$9,end_at=$10
           WHERE id=$11 AND org_id=$12""",
        data["name"], data.get("description"), json.dumps(data.get("items") or []),
        data.get("autoplay",True), data.get("loop",True),
        data.get("status","active"), data.get("color","#4F46E5"),
        data.get("is_scheduled",False), data.get("start_at"), data.get("end_at"),
        playlist_id, org_id
    )

async def playlist_delete(playlist_id: str, org_id: str) -> bool:
    # Clear from screen zones
    await _exec("UPDATE screen_zones SET playlist_id=NULL WHERE playlist_id=$1", playlist_id)
    r = await _exec("DELETE FROM playlists WHERE id=$1 AND org_id=$2", playlist_id, org_id)
    return "DELETE 1" in r


# ─────────────────────────────────────── BILLING ──────────────────────────────

async def billing_insert(row: Dict) -> None:
    await _exec(
        """INSERT INTO billing (id,org_id,plan,amount_eur,paid_at,expires_at,provider,ref,created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)""",
        row["id"], row["org_id"], row["plan"], row.get("amount_eur"),
        row.get("paid_at"), row.get("expires_at"),
        row.get("provider","viva"), row.get("ref"), row["created_at"]
    )

async def billing_list(org_id: str) -> List[Dict]:
    return await _all(
        "SELECT * FROM billing WHERE org_id=$1 ORDER BY created_at DESC", org_id
    )
