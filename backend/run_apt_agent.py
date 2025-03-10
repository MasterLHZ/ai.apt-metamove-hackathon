import asyncio
import time
from datetime import datetime
import logging
import json
from aptos_task import PredictionPoolManager
from dotenv import load_dotenv
import os

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger()

node_url = os.getenv("NODE_URL")
admin_private_key = os.getenv("ADMIN_PRIVATE_KEY")
contract_address = os.getenv("CONTRACT_ADDRESS")
pool_manager = PredictionPoolManager(node_url, admin_private_key, contract_address)


async def main():
    await gambling_agent_new_pool()


async def gambling_agent_new_pool():
    bet_duration = 3600 * 23
    lock_duration = 900
    
    pool_data = {
        "asset_type": "APT/USD",
        "end_price": 16.95,
        "title": "Will Aptos exceed $17 in the next 24 hours?",
        "optionA": "APT price will be greater than or equal to $17 at settlement",
        "optionB": "APT price will be less than $17 at settlement",
        "end_time": "2025-03-9 15:00:00 UTC",
        "reason": "The recent news of Bitwise applying for an Aptos ETF with the SEC has increased optimism for APT prices. Aptos may continue to attract traders' attention. Meanwhile, market data shows that while Bitcoin and other major coins have experienced adjustments in the last 24 hours, blockchain interoperability and emerging Layer-1 solutions are gaining market interest. If Aptos breaks through the psychological barrier of $17 in the next 24 hours, it will be an important signal for investors. The opening price of $16.95 is a neutral level, as there is potential for upward movement."
    }
    end_time_str = pool_data["end_time"]
    end_time = datetime.strptime(end_time_str, "%Y-%m-%d %H:%M:%S %Z")
    end_timestamp = int(end_time.timestamp())

    print(f"End time: {end_time_str}, Timestamp: {end_timestamp}")
    start_time = end_timestamp - bet_duration - lock_duration

    new_pool_data = {
        "asset_type": pool_data["asset_type"],
        "start_time": start_time,
        "bet_duration": bet_duration,
        "lock_duration": lock_duration,
        "end_price": pool_data["end_price"],
        "title": pool_data["title"],
        "optionA": pool_data["optionA"],
        "optionB": pool_data["optionB"],
        "reason": pool_data["reason"]
    }

    result = await pool_manager.create_prediction_pool(new_pool_data)
    if result["success"]:
        logger.info(f"gambling_agent_new_pool success, ID: {result['tx_hash']}")
    else:
        logger.info(f"gambling_agent_new_pool failed: {result['error']}")
    


if __name__ == "__main__":
    asyncio.run(main())
