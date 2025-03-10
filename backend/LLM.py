from openai import OpenAI
import os
from dotenv import load_dotenv
load_dotenv()


openrouter_api_key = os.getenv('OPENROUTER_API_KEY')
openrouter_base_url = os.getenv('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1')
openrouter_client = OpenAI(api_key=openrouter_api_key, base_url=openrouter_base_url)
