import sys
import os
from schedule_task import start_all_schedules
from flask import Flask, request, jsonify, render_template, make_response, send_from_directory
import redis
import json
import threading
import uuid
import time
import logging
import os
from ai_video_works import start_workers
from twitter import start_twitter_grant,input_authorization_code,get_authorization_url
from dotenv import load_dotenv
from pathlib import Path
from apt_agent import agent_awareness,apt_agent

env_path = Path('.').absolute() / '.env'
print(f"loading .env : {env_path}")

load_dotenv(dotenv_path=env_path, verbose=True)

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.route('/api/run', methods=['GET'])
async def run():
    print('run')
    await apt_agent().run()
    return jsonify({
        "message": "success"
    })


@app.route('/api/authorization_code', methods=['GET'])
def input_authorization_code():
    r = input_authorization_code(request.args.get("authorization_code"))
    return jsonify({
        "result": r,
        "message": "success"
    })


@app.route('/api/get_authorization_url', methods=['GET'])
def authorization_url():
    return jsonify({
        "url": get_authorization_url(),
        "message": "success"
    })


if __name__ == '__main__':
    start_all_schedules()
    start_workers()

    start_twitter_grant_thread = threading.Thread(target=start_twitter_grant, daemon=True)
    start_twitter_grant_thread.start()

    try:
        app.run(debug=False, host='0.0.0.0', port=5001)
    finally:
        pass