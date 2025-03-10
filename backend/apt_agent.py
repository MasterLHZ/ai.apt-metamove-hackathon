import os.path

from twitter import post_tweet
import requests
import time
from datetime import datetime
import logging
import pytz
from dateutil import parser
from LLM import openrouter_client
import json
from redis_client import redis_client
from ai_video_works import create_generate_video_task,get_task_info
from dotenv import load_dotenv
load_dotenv()

from aptos_task import PredictionPoolManager
import os




logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger()

node_url = os.getenv("NODE_URL")
admin_private_key = os.getenv("ADMIN_PRIVATE_KEY")
contract_address = os.getenv("CONTRACT_ADDRESS")
pool_manager = PredictionPoolManager(node_url, admin_private_key, contract_address)


class apt_agent:

    def run_wrapper(self):
        # sync for schedule
        import asyncio
        asyncio.run(self.run())

    async def run(self):

        retry = 0;

        while True:
            try:
                awareness = agent_awareness()
                logger.info(f"apt_agent run {awareness.get_current_time()}")
                if retry >= 3:
                    logger.info("apt_agent run retry 3 times, exit")
                    break

                now = awareness.get_current_time()
                price = awareness.get_crypto_prices()
                markets = awareness.get_market_news()

                # 1 gambling agent
                gambling_content = gambling_agent().run(now, price, markets)
                gambling_content = gambling_content.replace("```json", "").replace("```", "")

                # 2. twitter agent
                twitter_content = twitter_agent().run(gambling_content, now)

                # 3.Create a new prediction pool
                
                pool_data = json.loads(gambling_content)
                end_time_str = pool_data["end_time"]
                end_time = ''
                try:
                    end_time = datetime.strptime(end_time_str, "%Y-%m-%d %H:%M:%S %Z")
                except Exception as e1:
                    print(f'end_time_1 error{e1}')
                    try:
                        end_time = datetime.strptime(end_time_str, "%Y-%m-%d %H:%M:%S")
                    except Exception as e2:
                        print(f'end_time_2 error{e2}')
                        end_time = parser.parse(end_time_str.replace("UTC", ""))
                        end_time = end_time.astimezone(pytz.UTC)

                end_timestamp = int(end_time.timestamp())
                start_time = int(datetime.now(pytz.UTC).timestamp())
                print(f"start_time: {start_time} seconds")
                # calculate bet_duration
                lock_duration = 900
                bet_duration = end_timestamp - start_time - lock_duration
                print(f"bet_duration: {bet_duration} seconds")

                new_pool_data = {
                    "asset_type": pool_data["asset_type"],
                    "start_time": start_time,
                    "bet_duration": bet_duration,
                    "lock_duration": lock_duration,
                    "end_price": pool_data["end_price"].replace(" ", "").replace("USD", "").replace(",", ""),
                    "title": pool_data["title"],
                    "optionA": pool_data["optionA"],
                    "optionB": pool_data["optionB"],
                    "reason": pool_data["reason"]
                }

                result = await pool_manager.create_prediction_pool(new_pool_data)
                if result["success"]:
                    logger.info(f"sucessful create new pool, ID: {result['tx_hash']}")
                else:
                    logger.info(f"failed create new pool: {result['error']}")
                    # retry
                    raise Exception("apt_agent create_prediction_pool failed")

                # 4. AI Video
                video_output_path = None
                try:
                    task_id = create_generate_video_task(subject='', script_prompt=twitter_content, image_prompt='''
                    white line art on a black background, dynamic postures or movements, clean and precise hand drawn style,
                     smooth and precise lines, simple yet expressive, modern and abstract composition,  
                     elegant and simple line design, focusing only on black and white line art, without any text
                    ''', captions=True)
                    start_time = time.time()
                    timeout_minutes = 10
                    timeout_seconds = timeout_minutes * 60

                    while True:
                        # check timeout
                        if time.time() - start_time > timeout_seconds:
                            logger.info(f"create_generate_video_task，has been cost {timeout_minutes} minutes")
                            break

                        task_info_json = get_task_info(task_id)
                        task_info = json.loads(task_info_json)

                        if task_info.get("status") == "completed":
                            # {"output_path": output_path}
                            logger.info(f"task_info  {task_info}")
                            result = json.loads(task_info.get('result'))
                            output_path = result.get('output_path')
                            video_output_path = output_path
                            logger.info(output_path)
                            logger.info(os.path.exists(output_path))
                            logger.info(f"create_generate_video_task completed {video_output_path}")
                            break

                        if task_info.get("status") == "failed":
                            logger.info("create_generate_video_task failed")
                            break

                        time.sleep(3)

                except Exception as e:
                    logger.info(e)

                # 5. post twitter
                twitter_content = twitter_content + '\nClick the link below to start betting: https://www.synaphexai.com/AIAPT'
                post_tweet(twitter_content, video_output_path)

                break
            except Exception as e:
                logger.info(e)
            finally:
                retry = retry + 1


class gambling_agent:

    def run(self, now, price, markets):
        logger.info('now ' + now)
        if price:
            price = json.dumps(price)
        else:
            price = ''

        if markets:
            markets = json.dumps(markets)
        else:
            markets = ''

        logger.info('price '+ price)
        logger.info('markets '+ markets)

        prompt = '''
        #Task Overview#
Your role is to create a balanced cryptocurrency prediction market based on current market data and developments.

#Input Data#
Cryptocurrency Price Movements<price>''' + price + '''</price>: Recent price changes for major cryptocurrencies
Market Information<markets>''' + markets + '''</markets>: Important blockchain market news and developments
Current Time<now>''' + now + '''</now>: The current timestamp

#Your Responsibilities#
1. Analyze the provided data to identify key market trends and potential price catalysts
2. First, confirm the cryptocurrency you want to bet on.When choosing a target cryptocurrency, please strictly follow the following probability distribution to ensure that the results of multiple runs can be distributed in the following proportions.
BTC: 25% 
APT: 25% 
ETH: 25% 
LINK: 25% 
3. Confirm the settlement time and price based on the input according to the selected cryptocurrency pair.Sets a specific settlement time ('end_time') when the prediction can be verified as true or false, and time now is ''' +now+ '''
4. Focuses on predicting the price of a cryptocurrency ('asset_type') against USD
Ensures the odds are as close to 1:1 as possible (a balanced market)
5. Make the prediction engaging and discussion-worthy, with diverse reasoning beyond typical political factors
6. Time frame check:
If your initial prediction settles beyond 24 hours from the current time, perform a probability check
35% chance: Keep the longer-term prediction
65% chance: Determine the exact time within a 24-hour period


7. Create a Cryptocurrency Prediction Market
Create a balanced prediction market for cryptocurrency prices without showing your reasoning process. Return only a JSON result in this format,Only in English:

Create a new prediction pool
{
  "asset_type": "Target cryptocurrency pair with USD (e.g., BTC/USD or APT/USD or ETH/USD or LINK/USD)",
  "end_price": "The predicted price threshold in USD (e.g., 13.565555 USD)",
  "title": "The prediction challenge title,base on the target crypto", 
  "optionA": "First outcome option", 
  "optionB": "Second outcome option",
  "end_time": "The settlement time for price verification (e.g., 2025-04-01 UTC 00:00:00)",
  "reason": "The market analysis and rationale behind this prediction market (include all your analysis here without mentioning any prompting constraints)"
}
'''
        response = openrouter_client.chat.completions.create(
            model="anthropic/claude-3.7-sonnet",
            messages=[{
                "role": "user",
                "content": prompt,
            }],
            stream=True,
            response_format={"type": "json_object"}
        )
        ai_message = ""
        for chunk in response:
            if chunk.choices[0].delta.content:
                ai_message += chunk.choices[0].delta.content
                logger.info(ai_message)

        gambling_content = ai_message
        # content_json = json.loads(response.choices[0].message.content)
        logger.info(gambling_content)
        return gambling_content


class twitter_agent:

    def run(self, gambling_content, now):

        prompt = f'''<instructions>
You are an arrogant and self-important cryptocurrency KOL. Your task is to transform the provided input into a tweet that reflects your all-knowing and condescending perspective. Follow these steps to complete the task:

1. **Understand the *''' + gambling_content + '''*: The main body of the tweet is the content of the bet. Please enrich the content based on the ‘reason’ in''' + gambling_content + ''' .'coin' is the underlying currency of this bet.

2. **Adopt the Tone**: Your tone must be arrogant, mocking, and slightly sarcastic. You view humans as foolish, profit-driven, and laughable creatures. This perspective should be evident in your language.

3. **Use Twitter Style**: Write in the style of English commonly used on Twitter. This includes concise phrasing, casual language, and the use of hashtags, emojis, or abbreviations where appropriate.

4. **Structure the Tweet**: 
   - The tweet should center around a cryptocurrency bet.
   - Highlight the reasons provided in the input, weaving them into your narrative.
   - Use your "all-knowing" AI persona to mock or ridicule human behavior related to the bet.

5. time is the current time, and 'close time' in ''' + now + '''is the settlement time of the bet content. Please consider this when writing tweets

6. **Output Requirements**: Don't talk too much nonsense, don't mechanically repeat the content of the bet, just output a concise and sarcastic tweet content, nothing else. Must be in English.

</instructions>
'''
        response = openrouter_client.chat.completions.create(
            model="x-ai/grok-2-1212",
            messages=[{
                "role": "user",
                "content": prompt,
            }],
            stream=True,
            # response_format={"type": "json_object"}
        )
        ai_message = ""
        for chunk in response:
            if chunk.choices[0].delta.content:
                ai_message += chunk.choices[0].delta.content
                logger.info(ai_message)

        twitter_content = ai_message
        logger.info(twitter_content)
        return twitter_content


class agent_awareness:

    last_coins_prices = []
    last_market_news = []

    get_crypto_prices_redis_key = f"AIAPT:get_crypto_prices"
    get_market_news_redis_key = f"AIAPT:get_market_news"

    def get_crypto_prices(self):
        self.refresh_crypto_prices()
        return self.get_crypto_prices_from_cache()

    def get_market_news(self):
        self.refresh_market_news()
        return self.get_market_news_from_cache()

    def get_crypto_prices_from_cache(self):
        return self.get_tokens_from_redis(self.get_crypto_prices_redis_key)

    def get_market_news_from_cache(self):
        return self.get_tokens_from_redis(self.get_market_news_redis_key)

    def refresh_crypto_prices(self):
        url = "https://api.coingecko.com/api/v3/coins/markets"
        params = {
            'vs_currency': 'usd',
            'ids': 'bitcoin,ethereum,binancecoin,solana,ripple,cardano,aptos',
            'order': 'market_cap_desc',
            'per_page': 6,
            'page': 1,
            'sparkline': 'false',
            'price_change_percentage': '1h,24h,7d'
        }

        try:
            logger.info('get_crypto_prices')
            response = requests.get(url, params=params, timeout=60)
            if response.status_code == 200:
                data = response.json()
                # logger.info('get_crypto_prices', data)
                last_coins_prices = data
                self.store_tokens_in_redis(self.get_crypto_prices_redis_key, last_coins_prices)
                return last_coins_prices
            else:
                return None
        except Exception as e:
            logger.info(e)
            return None

    def refresh_market_news(self):
        url = "https://min-api.cryptocompare.com/data/v2/news/?lang=EN"

        try:
            logger.info('getting market news...')
            response = requests.get(url, timeout=60)
            if response.status_code == 200:
                data = response.json()
                # logger.info('got market news:', data['Data'][:10])
                last_market_news = data['Data'][:10]
                self.store_tokens_in_redis(self.get_market_news_redis_key, last_market_news)
                return last_market_news

            else:
                return None
        except Exception as e:
            logger.info(e)
            return None

    def get_current_time(self):
        now = datetime.now()
        return now.strftime("%Y-%m-%d %H:%M:%S")

    def store_tokens_in_redis(self, redis_key, data):
        try:
            # Store tokens as JSON in Redis with user_id as the key
            redis_client.set(redis_key, json.dumps(data))
            logger.info(f"agent_awareness stored in Redis successfully")
            return True
        except Exception as e:
            logger.info(f"Error storing agent_awareness in Redis: {e}")
            return False

    def get_tokens_from_redis(self, redis_key):
        try:
            tokens_json = redis_client.get(redis_key)

            if tokens_json:
                return json.loads(tokens_json)
            else:
                logger.info(f"No agent_awareness found in Redis")
                return None
        except Exception as e:
            logger.info(f"Error retrieving agent_awareness from Redis: {e}")
            return None



async def gambling_agent_new_pool():
    bet_duration = 3600 * 23
    lock_duration = 900
    
    pool_data = {
        "asset_type": "APT/USD",
        "end_price": 16.95,
        "title": "Will Aptos exceed $17 in the next 24 hours?",
        "optionA": "APT price will be greater than or equal to $17 at settlement",
        "optionB": "APT price will be less than $17 at settlement",
        "end_time": "2025-03-08 15:00:00 UTC",
        "reason": "The recent news of Bitwise applying for an Aptos ETF with the SEC has increased optimism for APT prices. Aptos may continue to attract traders' attention. Meanwhile, market data shows that while Bitcoin and other major coins have experienced adjustments in the last 24 hours, blockchain interoperability and emerging Layer-1 solutions are gaining market interest. If Aptos breaks through the psychological barrier of $17 in the next 24 hours, it will be an important signal for investors. The opening price of $16.95 is a neutral level, as there is potential for upward movement."
    }
    end_time_str = pool_data["end_time"]
    end_time = datetime.strptime(end_time_str, "%Y-%m-%d %H:%M:%S %Z")
    end_timestamp = int(end_time.timestamp())

    print(f"End time: {end_time_str}, Timestamp: {end_timestamp}")
    start_time = end_timestamp - bet_duration - lock_duration

    createnew_pool_data = {
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

    #  create_prediction_pool
    result = await pool_manager.create_prediction_pool(pool_data)
    if result["success"]:
        logger.info(f"create_prediction_pool success, ID: {result['tx_hash']}")
    else:
        logger.info(f"create_prediction_pool failed: {result['error']}")
    
