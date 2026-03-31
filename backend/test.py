import asyncio
import os
import sys

# add backend path so db module works
sys.path.append("/Users/eugeniucazmal/Downloads/dev_office/get-app-dev/smart_displays/backend")
import db as DB

async def test():
    await DB.init_db()
    try:
        # Get users just to see if it works
        U = await DB._all("SELECT * FROM users LIMIT 1;")
        if not U:
            print("No users found.", flush=True)
            return
        
        user_id = U[0]["id"]
        org_id = U[0]["org_id"]
        print(f"Testing org: {org_id}", flush=True)
        
        # Test screens_list
        res = await DB.screens_list(org_id)
        print(f"Screens list OK, length: {len(res)}", flush=True)
        
        locations = await DB.locations_list(org_id)
        print(f"Locations list OK, length: {len(locations)}", flush=True)
        
        content = await DB.content_list(org_id)
        print(f"content list OK, length: {len(content)}", flush=True)
        
    except Exception as e:
        print(f"DB ERROR: {e}", flush=True)
    finally:
        await DB.close_db()

asyncio.run(test())
