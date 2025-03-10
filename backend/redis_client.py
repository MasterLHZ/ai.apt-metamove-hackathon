import json
import os
import redis
from dotenv import load_dotenv
load_dotenv()

redis_client = redis.Redis(host=os.getenv("REDIS_HOST", 'localhost'), port=os.getenv("REDIS_PORT", 6379), db=0, decode_responses=True)
