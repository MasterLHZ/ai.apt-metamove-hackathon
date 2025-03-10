import schedule
import time
import threading
from twitter import post_tweet,refresh_access_token
from apt_agent import agent_awareness,apt_agent

stop_event = threading.Event()


def schedule_all_tasks():
    """Schedule all different types of tasks"""
    schedule.clear()
    a = agent_awareness()
    schedule.every(300).seconds.do(a.refresh_crypto_prices)
    schedule.every(300).seconds.do(a.refresh_market_news)
    print('Agent_awareness scheduler set to run every 120 seconds')

    # refresh access token every 3600 seconds (every hour)
    schedule.every(1800).seconds.do(refresh_access_token)
    print('Token refresh scheduler set to run every 1800 seconds')

    # schedule a tweet every day at 5:00 AM, 6:00 AM, and 7:00 AM
    agent = apt_agent()
    schedule.every().day.at("09:00").do(agent.run_wrapper)
    schedule.every().day.at("16:00").do(agent.run_wrapper)
    print("Tweet schedule set for 5:00 AM, 6:00 AM, and 7:00 AM daily")


def run_all_schedulers(stop_event):
    print('Scheduler thread started - managing all scheduled tasks')
    while not stop_event.is_set():
        schedule.run_pending()
        time.sleep(1)


def start_all_schedules():
    schedule_all_tasks()

    scheduler_thread = threading.Thread(target=run_all_schedulers, args=(stop_event,))
    scheduler_thread.daemon = True
    scheduler_thread.start()
    print('All schedulers started in a single thread')
    return scheduler_thread