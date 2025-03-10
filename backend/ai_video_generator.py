import os
import json
import time
from typing import List, Dict, Tuple,Optional
from pathlib import Path

from moviepy.editor import *
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import requests
from tqdm import tqdm
from openai import OpenAI
from dashscope.audio.tts_v2 import SpeechSynthesizer
import dashscope
import random
import uuid
import cv2
from moviepy.editor import (
    ImageClip,
    AudioFileClip,
    concatenate_videoclips,
    CompositeVideoClip
)
import os

from typing_extensions import Annotated, AsyncGenerator, Literal

import httpx
import ormsgpack
from pydantic import AfterValidator, BaseModel, conint

import base64
from LLM import openrouter_client

class VideoGenerator:
    def __init__(self, subject:str, script_prompt:str, image_prompt:str, video_length="1", scene_length="5-8", narration_lan="english", each_narration_words="30-50", voice_id="alloy", captions=False, video_scale="16:9", output_dir="output"):
        self.script_prompt = script_prompt
        self.image_prompt = image_prompt
        self.video_length = video_length
        self.scene_length = scene_length
        self.narration_lan = narration_lan
        self.each_narration_words = each_narration_words
        self.output_dir = output_dir
        self.voice_id = voice_id
        self.captions = captions
        self.video_scale = video_scale
        self.subject = subject
        os.makedirs(output_dir, exist_ok=True)

    def image_to_base64(self, image_path):
        """
        Convert the image to Base64 encoding and send it to Flux API
        Parameters:
            image_path (str):  The path of the image file
        return:
            Response: Flux API response
        """
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"image_path not exists: {image_path}")

        with open(image_path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
            return encoded_string

    def generate_script(self) -> List[Dict]:

        retry = 0
        max_retry = 3
        while retry < max_retry:
            try:
                print("generate_script...")

                prompt = f"""
                
                Create a short video script for the following content. The video length is approximately {self.video_length} minutes.
                
                    1. Extract a topic description based on the provided content, with the field being subject. The topic content includes core content, location, scene, and characters, Subject is used as a text generated graph prompt word for the Flux model, in English
                    2. Divide the script into {self.scene_length} scenes, each scene containing:
                        2.1.  scene： Detailed scene description, depiction of details, text prompts for Flux model, in English (English picture description, do not mention any text in the picture)
                        2.2.  narration： The voiceover text corresponding to the scene should be written in {self.narration_lan} (around {self.each_narration_words})
                        2.3.  Please use popular short video copy to attract attention for the first scenario script, which should be about 10 words short and attractive
                                    
                    The content is as follows:<content>"{self.script_prompt}"</content>
                                    
                    Return in JSON format, as follows:
                {{
                    "subject: "subject",
                    [ 
                    "script": [
                        {{"scene": "Scenario Description 1", "narration": "narration1"}},
                        {{"scene": "Scenario Description 2", "narration": "narration2"}}
                    ]
                ]}}
                """
                print(prompt)
                response = openrouter_client.chat.completions.create(
                    model="x-ai/grok-2-1212",
                    messages=[
                        {"role": "system", "content": "You are a professional short video scriptwriter, familiar with the script production rules of TikTok's popular short videos, and skilled in creating concise and interesting short video content."},
                        {"role": "user", "content": prompt}
                    ],
                    response_format={"type": "json_object"}
                )

                script_data = json.loads(response.choices[0].message.content)
                print(script_data)
                self.subject = script_data["subject"]
                if "script" in script_data:
                    script = script_data["script"]
                elif "scenes" in script_data:
                    script = script_data["scenes"]
                else:
                    script = script_data

                # save script_data
                with open(os.path.join(self.output_dir, f"script_{uuid.uuid4()}.json"), "w", encoding="utf-8") as f:
                    json.dump(script, f, ensure_ascii=False, indent=2)
                    print('script_data saved')

                return script_data

            except Exception as e:
                retry = retry + 1
                print(f"generate_script error: {str(e)},  retry {retry}/{max_retry}...")
        raise


    def generate_voice(self, text: str, output_path: str) -> str:

        KEY = f'Bearer {os.getenv("FISH_KEY")}'
        retry = 0
        max_retry = 3
        while retry < max_retry:
            try:
                request = ServeTTSRequest(
                    text=text,
                    reference_id="5196af35f6ff4a0dbf541793fc9f2157"
                )
                request_dict = request.model_dump()

                packed_data = ormsgpack.packb(request_dict)

                with httpx.Client() as client:
                    with open(output_path, "wb") as f:
                        with client.stream(
                                "POST",
                                "https://api.fish.audio/v1/tts",
                                content=packed_data,
                                headers={
                                    "authorization": KEY,
                                    "content-type": "application/msgpack",
                                },
                                timeout=None,
                        ) as response:
                            for chunk in response.iter_bytes():
                                f.write(chunk)
                            print(f"generate_voice success: {output_path}")
                            return output_path

            except Exception as e:
                retry = retry + 1
                print(f"generate_voice error: {str(e)},  retry {retry}/{max_retry}...")
        raise

    def add_subtitle_with_pillow(self, frame, text, fontsize=60, color=(0, 255, 255)):  
        from PIL import Image, ImageDraw, ImageFont
        import numpy as np

        pil_img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        draw = ImageDraw.Draw(pil_img)

        w, h = pil_img.size

        # Split the text into lines
        chars_per_line = 80
        text_lines = []
        for i in range(0, len(text), chars_per_line):
            text_lines.append(text[i:i+chars_per_line])

        try:
            possible_fonts = [
                "/System/Library/Fonts/PingFang.ttc",  # macOS
                "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc",  # Linux
                "/usr/share/fonts/dejavu-sans-fonts/DejaVuSans-Bold.ttf" # AWS
            ]

            font = None
            for font_path in possible_fonts:
                try:
                    font = ImageFont.truetype(font_path, fontsize)
                    break
                except:
                    continue

            if font is None:
                font = ImageFont.load_default()
                print("warning：font not found，use system default font")
        except Exception as e:
            print(f"font loading error: {e}")
            font = ImageFont.load_default()
            print("warning：font loading error，use system default font")

        # Set row height and bottom margin
        line_height = int(fontsize * 1.5)
        bottom_margin = 80  # You can adjust this value as needed

        # Add some extra padding to the background color block
        padding_x = 20
        padding_y = 10

        bg_height = len(text_lines) * line_height + 2 * padding_y
        bg_y = h - bg_height - bottom_margin + padding_y

        max_text_width = 0
        for line in text_lines:
            try:
                bbox = draw.textbbox((0, 0), line, font=font)
                text_width = bbox[2] - bbox[0]
            except AttributeError:
                text_width, text_height = draw.textsize(line, font=font)
            max_text_width = max(max_text_width, text_width)

        # Draw a semi transparent black background color block
        bg_width = max_text_width + 2 * padding_x
        bg_x = (w - bg_width) // 2

        # Create a semi transparent black background (with a transparency of approximately 70%)
        overlay = Image.new('RGBA', pil_img.size, (0, 0, 0, 0))
        overlay_draw = ImageDraw.Draw(overlay)

        # Draw a background rectangle
        overlay_draw.rectangle(
            [(bg_x, bg_y), (bg_x + bg_width, bg_y + bg_height)],
            fill=(0, 0, 0, 180)  # Black background, transparency set to 180 (0 is completely transparent, 255 is opaque)
        )

        pil_img = Image.alpha_composite(pil_img.convert('RGBA'), overlay)

        for i, line in enumerate(text_lines):
            try:
                bbox = draw.textbbox((0, 0), line, font=font)
                text_width = bbox[2] - bbox[0]
            except AttributeError:
                text_width, text_height = draw.textsize(line, font=font)

            text_x = (w - text_width) // 2
            text_y = bg_y + i * line_height + padding_y

            draw = ImageDraw.Draw(pil_img)
            draw.text((text_x, text_y), line, font=font, fill=color)

        return cv2.cvtColor(np.array(pil_img.convert('RGB')), cv2.COLOR_RGB2BGR)


    def generate_image(self, scene_description: str, index: int) -> str:

        retry = 0
        max_retry = 3
        while retry < max_retry:
            try:
                print(f"Generating image for scene {index+1}: {scene_description[:30]}...")

                os.makedirs(self.output_dir, exist_ok=True)
                image_path = os.path.join(self.output_dir, f"scene_{uuid.uuid4()}_{index+1}.png")

                prompt = f"{self.subject}, {self.image_prompt}, {scene_description}"

                # request Flux API
                flux_api_url = "https://api.bfl.ml/v1/flux-pro-1.1-ultra"
                headers = {
                    'Content-Type': 'application/json',
                    'X-Key': os.getenv("FLUX_API_KEY")
                }
                # width = 1280
                # height = 736
                print(f'self.video_scale {self.video_scale}')
                if self.video_scale == "9:16":
                    # flux-pro-1.1-ultra only support 9:21
                    # width = 736
                    # height = 1280
                    self.video_scale = "9:21"

                payload = {
                    "prompt": prompt,
                    # "image_prompt": self.image_to_base64(os.path.join(os.getcwd(), "base.png")),
                    # "width": width,
                    # "height": height,
                    "aspect_ratio":self.video_scale,
                    "prompt_upsampling": False,
                    "seed": random.randint(1, 10000),
                    "safety_tolerance": 2,
                    "output_format": "jpeg",
                    # "webhook_url": "",
                    # "webhook_secret": ""
                }

                print('----sync call, please wait a moment----')
                response = requests.post(flux_api_url, headers=headers, json=payload)

                if response.status_code == 200:
                    task_data = response.json()
                    task_id = task_data["id"]
                    polling_url = f"https://api.bfl.ml/v1/get_result?id={task_id}"

                    # polling
                    max_attempts = 30
                    for attempt in range(max_attempts):
                        print(f"Polling to generate results, try {attempt+1}/{max_attempts}...")
                        poll_response = requests.get(polling_url)

                        if poll_response.status_code == 200:
                            result_data = poll_response.json()
                            if result_data.get("status") == "Ready":
                                image_url = result_data["result"]["sample"]
                                img_response = requests.get(image_url)
                                if img_response.status_code == 200:
                                    with open(image_path, 'wb') as f:
                                        f.write(img_response.content)
                                    print(f"image saved at: {image_path}")
                                    return image_path
                                else:
                                    print(f"download image failed: {img_response.status_code}")
                                    break

                        time.sleep(5)

                    print(f"generate_image failed, taskId: {task_id}")
                else:
                    print(f"Request API failed，code: {response.status_code}，Response: {response.text}")
                    raise

            except Exception as e:
                retry = retry + 1
                print(f"generate_image error: {str(e)},  retry {retry}/{max_retry}...")
        raise


    def create_subtitle_frame(self, text: str, frame_size=(1080, 1920)) -> np.ndarray:
        img = Image.new('RGBA', frame_size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        try:
            font = ImageFont.truetype("simhei.ttf", 40)
        except IOError:
            font = ImageFont.load_default()

        text_width, text_height = draw.textsize(text, font=font)
        position = ((frame_size[0] - text_width) // 2, frame_size[1] - text_height - 100)

        text_bg = ((frame_size[0] - text_width) // 2 - 10, position[1] - 10,
                   (frame_size[0] + text_width) // 2 + 10, position[1] + text_height + 10)
        draw.rectangle(text_bg, fill=(0, 0, 0, 160))

        draw.text(position, text, font=font, fill=(255, 255, 255, 255))

        return np.array(img)

    def add_silence_after_audio(self, audio_clip, silence_duration=0.5):
        from moviepy.audio.AudioClip import AudioClip
        import numpy as np

        silence = AudioClip(
            make_frame=lambda t: np.zeros(2),  #Stereo mute (2 channels)
            duration=silence_duration
        )

        return concatenate_audioclips([audio_clip, silence])


    def create_video(self, script_data) -> str:
        start_time = time.time()

        script = script_data['script']

        video_clips = []

        # Generate voiceovers, images, and subtitles for each scene and synchronize them
        for i, scene in enumerate(tqdm(script)):
            if not isinstance(scene, dict) or "narration" not in scene or "scene" not in scene:
                continue
            scene_narration = scene["narration"]
            scene_description = scene["scene"]

            # Generate dubbing
            audio_path = os.path.join(self.output_dir, f"audio_{uuid.uuid4()}_{i+1}.mp3")
            self.generate_voice(scene_narration, audio_path)
            # audio_clip = AudioFileClip(audio_path)
            # audio_duration = audio_clip.duration

            # Add a mute interval to the audio
            audio_clip = AudioFileClip(audio_path)

            audio_clip_with_silence = self.add_silence_after_audio(audio_clip, silence_duration=0.5)

            audio_duration = audio_clip_with_silence.duration

            # Generate image
            image_path = self.generate_image(scene_description, i)
            image_clip = ImageClip(image_path).set_duration(audio_duration)


            def make_subtitle_function(current_text=scene_narration):
                def subtitle_function(gf, t):
                    return self.add_subtitle_with_pillow(gf(t), current_text)
                return subtitle_function

            if self.captions:
                current_scene_subtitle_function = make_subtitle_function()
                subtitled_clip = image_clip.fl(current_scene_subtitle_function)
                subtitled_clip = subtitled_clip.set_audio(audio_clip_with_silence)
                video_clips.append(subtitled_clip)
            else:
                image_clip = image_clip.set_audio(audio_clip_with_silence)
                video_clips.append(image_clip)

        final_video = concatenate_videoclips(video_clips)

        output_path = os.path.join(self.output_dir, f"{self.script_prompt.replace(' ', '_')[:5]}_{uuid.uuid4()}.mp4")
        final_video.write_videofile(output_path, fps=24, codec="libx264", audio_codec="aac", ffmpeg_params=[])

        end_time = time.time()
        print(f"create video finish! cost: {end_time - start_time:.2f} seconds")
        print(f"video output_path: {output_path}")

        return output_path


    def improved_add_silence(self, audio_clip, silence_duration=0.5):
        from moviepy.editor import CompositeAudioClip, AudioClip
        import numpy as np

        silence = AudioClip(
            lambda t: np.zeros((audio_clip.nchannels,)),
            duration=silence_duration
        )

        combined = CompositeAudioClip([
            audio_clip,
            silence.set_start(audio_clip.duration)
        ])

        return combined

class ServeReferenceAudio(BaseModel):
    audio: bytes
    text: str

class ServeTTSRequest(BaseModel):
    text: str
    chunk_length: Annotated[int, conint(ge=100, le=300, strict=True)] = 200
    # Audio format
    format: Literal["wav", "pcm", "mp3"] = "mp3"
    mp3_bitrate: Literal[64, 128, 192] = 128
    # References audios for in-context learning
    references: List[ServeReferenceAudio] = []
    # Reference id
    # For example, if you want use https://fish.audio/m/7f92f8afb8ec43bf81429cc1c9199cb1/
    # Just pass 7f92f8afb8ec43bf81429cc1c9199cb1
    reference_id: Optional[str] = None
    # Normalize text for en & zh, this increase stability for numbers
    normalize: bool = True
    # Balance mode will reduce latency to 300ms, but may decrease stability
    latency: Literal["normal", "balanced"] = "normal"
