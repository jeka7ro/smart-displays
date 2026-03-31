import uuid
import jwt
import os
from datetime import datetime, timezone, timedelta

SECRET_KEY = os.environ.get("SECRET_KEY", "change-me-in-production")
exp = datetime.now(timezone.utc) + timedelta(days=7)
# Use a random UUID just to pass the JWT validation, 
# wait, if the user does not exist in the DB, it will throw 401 "User not found".
# So we need a real user ID.
# Let's query the local DB for the user id from local .env
