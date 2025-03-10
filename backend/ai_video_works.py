import json
import threading
import uuid
import time
import logging
from ai_video_generator import VideoGenerator
import os
from redis_client import redis_client

QUEUE_NAME = 'AIAPT:AIVideo:video_generation_tasks'
TASKS_HASH = 'AIAPT:AIVideo:video_tasks'
USER_TASKS_PREFIX = 'AIAPT:AIVideo:user_tasks:'

MAX_WORKERS = 1
worker_semaphore = threading.Semaphore(MAX_WORKERS)
stop_workers = False
worker_threads = []

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_generate_video_task(subject:str, script_prompt:str, image_prompt:str, video_length="1", scene_length="5-8", narration_lan="English", each_narration_words="30-50", voice_id="alloy", captions=False, video_scale="16:9",):

    # 1. generator script
    generator = VideoGenerator(
        subject=subject,
        script_prompt=script_prompt,
        image_prompt=image_prompt,
        video_length=video_length,
        scene_length=scene_length,
        narration_lan=narration_lan,
        each_narration_words=each_narration_words,
        voice_id=voice_id,
        captions=captions,
        video_scale=video_scale
    )
    task_id = str(uuid.uuid4())

    script_data = generator.generate_script()
    data = { 'task_id': task_id,
            'script_prompt': script_prompt,
            'image_prompt': image_prompt,
            'video_length': video_length,
            'scene_length': scene_length,
            'narration_lan': narration_lan,
            'each_narration_words': each_narration_words,
            'voice_id': voice_id,
            'captions': captions,
            'video_scale': video_scale,
            'script_data': script_data}

    # 2. push queue
    redis_client.rpush(QUEUE_NAME, json.dumps(data))
    task_info = {
        'status': 'queued',
        'updated_at': time.time(),
        'parameters': json.dumps(data)
    }
    redis_client.hset(TASKS_HASH, task_id, json.dumps(task_info))

    return task_id


def get_task_info(task_id):
    return redis_client.hget(TASKS_HASH, task_id)


def update_task_status(task_id, status, result=None):
    task_info_json = redis_client.hget(TASKS_HASH, task_id)
    if not task_info_json:
        logger.error(f"Unable to update task {task_id}, task does not exist")
        return False

    task_info = json.loads(task_info_json)
    task_info['status'] = status
    task_info['updated_at'] = time.time()

    if result is not None:
        if isinstance(result, (dict, list)):
            task_info['result'] = json.dumps(result)
        else:
            task_info['result'] = result

    redis_client.hset(TASKS_HASH, task_id, json.dumps(task_info))
    return True


def worker_process():
    logger.info("worker_process start")

    while not stop_workers:
        try:
            worker_semaphore.acquire()

            try:
                task_data = redis_client.blpop(QUEUE_NAME, timeout=1)

                if not task_data:
                    worker_semaphore.release()
                    continue

                print(task_data)

                _, task_json = task_data
                print(task_json)
                task = json.loads(task_json)
                task_id = task.get('task_id')
                update_task_status(task_id, "processing")

                try:
                    generator = VideoGenerator(
                        subject=task.get('script_data').get('subject'),
                        script_prompt=task.get('script_prompt'),
                        image_prompt=task.get('image_prompt'),
                        video_length=task.get('video_length', '1'),
                        scene_length=task.get('scene_length', '10-12'),
                        narration_lan=task.get('narration_lan', 'english'),
                        each_narration_words=task.get('each_narration_words', '30-50'),
                        voice_id=task.get('voice_id', 'alloy'),
                        captions=task.get('captions', False),
                        video_scale=task.get('video_scale', '16:9')
                    )

                    output_path = generator.create_video(task.get('script_data'))

                    update_task_status(task_id, "completed", {"output_path": output_path})
                    logger.info(f"Task {task_id} has been successfully completed")

                except Exception as e:
                    logger.error(f"work process failed taskId: {task_id} error: {str(e)}")
                    update_task_status(task_id, "failed", {"error": str(e)})

            except Exception as e:
                logger.error(f"work process error: {str(e)}")

            finally:
                worker_semaphore.release()

        except Exception as e:
            logger.error(f"work process error: {str(e)}")
            time.sleep(1)

    logger.info("work process stop")


def start_workers(num_workers=1):
    global worker_threads, stop_workers, MAX_WORKERS
    stop_workers = False

    saved_max_workers = redis_client.get('max_workers')
    if saved_max_workers:
        try:
            MAX_WORKERS = int(saved_max_workers)
            global worker_semaphore
            worker_semaphore = threading.Semaphore(MAX_WORKERS)
        except (ValueError, TypeError):
            logger.warning("Unable to parse saved maxw_workers settings, using default values")

    for _ in range(num_workers):
        thread = threading.Thread(target=worker_process)
        thread.daemon = True
        thread.start()
        worker_threads.append(thread)

    logger.info(f"Start {num_workers} worker threads")


def stop_all_workers():
    global stop_workers
    stop_workers = True

    # Waiting for all threads stop
    for thread in worker_threads:
        if thread.is_alive():
            thread.join(timeout=2)

    logger.info("All work threads have stopped")