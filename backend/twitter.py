import json
import os
import time
import tweepy
from threading import Timer
import redis
from LLM import openrouter_client
from redis_client import redis_client
import threading
import schedule
import requests
from urllib.parse import urlencode
import logging
import base64
import hashlib
import secrets
import urllib.parse

from dotenv import load_dotenv
load_dotenv()


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger()


# Redirect URI for OAuth 2.0 flow
REDIRECT_URI = os.getenv('REDIRECT_URI', 'http://127.0.0.1:8090/callback')
CLIENT_ID = os.getenv("X_CLIENT_ID")
CLIENT_SECRET = os.getenv("X_CLIENT_SECRET")

os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

AUTHORIZATION_BASE_URL = "https://twitter.com/i/oauth2/authorize"
TOKEN_URL = "https://api.twitter.com/2/oauth2/token"
TWEET_URL = "https://api.twitter.com/2/tweets"


def get_authorization_url():

    code_verifier = secrets.token_urlsafe(64)
    code_challenge = base64.urlsafe_b64encode(
        hashlib.sha256(code_verifier.encode()).digest()
    ).decode().rstrip('=')

    state = secrets.token_urlsafe(32)

    params = {
        "response_type": "code",
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "scope": "tweet.read users.read tweet.write offline.access media.write",
        "state": "random_string",
        "code_challenge": "challenge",
        "code_challenge_method": "plain"
    }
    return f"{AUTHORIZATION_BASE_URL}?{urlencode(params)}"


def get_tokens_from_code(authorization_code, CLIENT_ID, CLIENT_SECRET):
    data = {
        "grant_type": "authorization_code",
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "code": authorization_code,
        "code_verifier": "challenge"
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    response = requests.post(TOKEN_URL, data=data, headers=headers, auth=(CLIENT_ID, CLIENT_SECRET))

    if response.status_code == 200:
        logger.info(response.json())
        return response.json()
    else:
        logger.info(f"get Access Token failed: {response.status_code}, {response.text}")
        return None


def refresh_access_token():
    try:
        logger.info('refresh_access_token start')
        # Get tokens from Redis
        tokens = get_tokens_from_redis()
        if not tokens or 'refresh_token' not in tokens:
            logger.info(f"No valid refresh token found")
            return False

        refresh_token = tokens["refresh_token"]
        data = {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "client_id": CLIENT_ID
        }
        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        response = requests.post(TOKEN_URL, data=data, headers=headers, auth=(CLIENT_ID, CLIENT_SECRET))

        if response.status_code == 200:
            new_token = response.json()

            # Update tokens with new access token (and possibly refresh token)
            tokens["access_token"] = new_token["access_token"]
            if "refresh_token" in new_token:
                tokens["refresh_token"] = new_token["refresh_token"]

            # Store updated tokens in Redis
            store_tokens_in_redis(tokens)

            logger.info(f"Access Token refreshed")
        else:
            logger.info(f"user Access Token refresh failed: {response.status_code}, {response.text}")
    except Exception as e:
        logger.info(f'refresh_access_token failed : {e}')


def store_tokens_in_redis( tokens):
    """Store access and refresh tokens in Redis"""
    try:
        # Store tokens as JSON in Redis with user_id as the key
        redis_key = f"AIAPT:twitter_tokens"
        redis_client.set(redis_key, json.dumps(tokens))
        logger.info(f"Tokens stored in Redis successfully")
        return True
    except Exception as e:
        logger.info(f"Error storing tokens in Redis: {e}")
        return False


def get_tokens_from_redis():
    """Retrieve tokens from Redis for a specific user"""
    try:
        redis_key = f"AIAPT:twitter_tokens"
        tokens_json = redis_client.get(redis_key)

        if tokens_json:
            return json.loads(tokens_json)
        else:
            logger.info(f"No tokens found in Redis")
            return None
    except Exception as e:
        logger.info(f"Error retrieving tokens from Redis: {e}")
        return None


def post_tweet(tweet_text, media_file=None, retry=0):
    """Post a tweet using Tweepy client with optional media (image or video)

    Parameters:
    tweet_text (str): The text content of the tweet
    media_file (str, optional): Path to media file (image or video) to upload

    Returns:
    str: Tweet ID if successful, None otherwise
    """
    logger.info("start post_tweet")
    # Get tokens from Redis
    tokens = get_tokens_from_redis()
    if not tokens or 'access_token' not in tokens:
        logger.info("No valid access token found")
        return None

    try:
        access_token = tokens["access_token"]

        payload = {}

        if media_file is not None:
            try:
                logger.info(f'upload_video {media_file}')
                media_id = upload_video(access_token, media_file)
                logger.info(media_id)
                if media_id is not None:
                    payload['media'] = {}
                    payload['media']['media_ids'] = [media_id]
            except Exception as e:
                logger.info(f'media_file {e}')


        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        logger.info(f'post twitter {tweet_text}')
        payload["text"] = tweet_text
        logger.info(payload)
        response = requests.post(TWEET_URL, headers=headers, json=payload, timeout=120)
        logger.info(response.text)

    except Exception as e:
        logger.info(f"Error posting tweet: {e}")
        if retry > 3:
            logger.info(f"posting tweet retry > 3")
            return None
        # If the error is due to an expired token, try to refresh and retry once
        if "token" in str(e).lower() and "expired" in str(e).lower():
            try:
                logger.info("Attempting to refresh token and retry...")
                if refresh_access_token():
                    retry += 1
                    return post_tweet(tweet_text, media_file, retry)  # Recursive call with fresh token
                else:
                    logger.info("Token refresh failed")
            except Exception as retry_error:
                logger.info(f"Retry failed: {retry_error}")

        return None


def check_redis_connection():
    """Test the Redis connection"""
    try:
        redis_client.ping()
        logger.info("Connected to Redis successfully!")
        return True
    except redis.ConnectionError as e:
        logger.info(f"Redis connection failed: {e}")
        return False


def start_twitter_grant():
    logger.info(os.getenv("X_CLIENT_ID"))
    logger.info( CLIENT_ID)
    logger.info( CLIENT_SECRET)


    # Check if we already have tokens for this agent
    existing_tokens = get_tokens_from_redis()
    if existing_tokens:
        logger.info(f"Tokens already exist Do you want to reauthorize? (y/n)")
        choice = input().lower()
        if choice != 'y':
            logger.info(f"Skipping ...")
            return

    # step 1: get Authorization URL
    logger.info("init trade_agents X access_token")

    logger.info(get_authorization_url())
    # st3p 2: get Authorization Code
    authorization_code = input("input Authorization Code: ").strip()
    tokens = get_tokens_from_code(authorization_code, CLIENT_ID, CLIENT_SECRET)

    if tokens:
        token_data = {
            "access_token": tokens["access_token"],
            "refresh_token": tokens.get("refresh_token", ''),
            "created_at": time.time()
        }
        store_tokens_in_redis(token_data)
        logger.info(f" grant success {token_data}")


def input_authorization_code(authorization_code):
    tokens = get_tokens_from_code(authorization_code, CLIENT_ID, CLIENT_SECRET)
    if tokens:
        token_data = {
            "access_token": tokens["access_token"],
            "refresh_token": tokens.get("refresh_token", ''),
            "created_at": time.time()
        }
        store_tokens_in_redis(token_data)
        logger.info(f" grant success {token_data}")
        return True
    return False



def upload_video(access_token, video_path):
    import requests
    import os
    import time
    import json

    if not os.path.exists(video_path):
        logger.info(f"Error: Video file does not exist at {video_path}")
        return None

    file_size = os.path.getsize(video_path)
    base_url = 'https://api.x.com/2/media/upload'
    headers = {
        'Authorization': f'Bearer {access_token}'
    }

    # 1. INIT
    init_params = {
        "command": "INIT",
        "total_bytes": str(file_size),
        "media_type": "video/mp4",
        "media_category": "tweet_video"
    }

    logger.info(f"Initializing upload for file: {video_path} ({file_size} bytes)")
    init_response = requests.post(base_url, headers=headers, params=init_params, timeout=60)

    if init_response.status_code != 202 and init_response.status_code != 200:
        logger.info(f"INIT failed with status code {init_response.status_code}: {init_response.text}")
        return None

    try:
        media_id = init_response.json()['data']['id']
        logger.info(f"INIT successful. Media ID: {media_id}")
    except KeyError:
        logger.info(f"Unexpected INIT response format: {init_response.text}")
        return None

    # 2. APPEND
    chunk_size = 4 * 1024 * 1024  # 4MB
    segment_index = 0

    with open(video_path, 'rb') as video_file:
        while True:
            chunk = video_file.read(chunk_size)
            if not chunk:
                break

            append_params = {
                "command": "APPEND",
                "media_id": media_id,
                "segment_index": segment_index
            }

            files = {
                'media': chunk
            }

            logger.info(f"Uploading segment {segment_index}")
            append_response = requests.post(base_url, headers=headers, params=append_params, files=files, timeout=120)

            if append_response.status_code != 204 and append_response.status_code != 200:
                logger.info(f"APPEND failed for segment {segment_index}: {append_response.text}")
                return None

            segment_index += 1
            logger.info(f"Uploaded segment {segment_index} successfully")

    # 3. FINALIZE
    finalize_params = {
        "command": "FINALIZE",
        "media_id": media_id
    }

    logger.info("Finalizing upload...")
    finalize_response = requests.post(base_url, headers=headers, params=finalize_params, timeout=60)

    if finalize_response.status_code != 201 and finalize_response.status_code != 200:
        logger.info(f"FINALIZE failed with status code {finalize_response.status_code}: {finalize_response.text}")
        return None

    logger.info(f"FINALIZE response: {finalize_response.text}")

    # 4. polling status
    try:
        finalize_json = finalize_response.json()
        processing_info = finalize_json.get('data', {}).get('processing_info')

        if processing_info:
            state = processing_info.get('state')
            logger.info(f"Initial processing state: {state}")

            if state == "pending" or state == "in_progress":
                check_after_secs = processing_info.get('check_after_secs', 10)

                while True:
                    logger.info(f"Waiting {check_after_secs} seconds before checking status...")
                    time.sleep(check_after_secs)

                    status_params = {
                        "command": "STATUS",
                        "media_id": media_id
                    }

                    status_response = requests.get(base_url, headers=headers, params=status_params, timeout=30)

                    if status_response.status_code != 200:
                        logger.info(f"STATUS check failed: {status_response.text}")
                        break

                    status_json = status_response.json()
                    processing_info = status_json.get('data', {}).get('processing_info')

                    if processing_info:
                        state = processing_info.get('state')
                        logger.info(f"Current processing state: {state}")

                        if state == "succeeded":
                            logger.info("Video processing completed successfully!")
                            break
                        elif state == "failed":
                            error = processing_info.get('error', {})
                            error_message = error.get('message', 'Unknown error')
                            logger.info(f"Video processing failed: {error_message}")
                            return None

                        check_after_secs = processing_info.get('check_after_secs', 5)
                    else:
                        logger.info("No processing info in STATUS response")
                        break
    except json.JSONDecodeError:
        logger.info(f"Failed to parse JSON from FINALIZE response: {finalize_response.text}")
    except Exception as e:
        logger.info(f"Error checking processing status: {str(e)}")

    logger.info(f"Video upload complete. Media ID: {media_id}")
    return media_id


async def main():
    a = apt_agent()
    await a.run()

if __name__ == "__main__":
    from apt_agent import apt_agent
    from ai_video_works import start_workers
    # start_workers()
    import asyncio
    # asyncio.run(main())

    # start_twitter_grant()
    # a09TdUgycVZ6T1VJVXU5aHBmNU5kZDJfcGJ5bTgxZ2JMc0Vfc2x5dDF3X1VoOjE3NDEyNjA0MDEzNzU6MToxOmF0OjE
    post_tweet("this is a new video", "output/😂_You_fa44d233-055a-4f7c-87f4-cd574e5cc4a1.mp4")
