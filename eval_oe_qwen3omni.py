import os
import pandas as pd
import csv
import torch

from transformers import Qwen3OmniMoeForConditionalGeneration, Qwen3OmniMoeProcessor
from qwen_omni_utils import process_mm_info

# ================================================
# path settings
MODEL_PATH = r"./qwen3/Qwen3-Omni-30B-A3B-Instruct/"   # path to the model folder
VIDEO_FOLDER = r"./omni_bench_videos"   # path to all video data
VIDEO_LABEL = r"./labels.csv" # path to the csv label file
OUTPUT_FILE = r"./Qwen3_result.csv" # path to the output csv file which contains model replies

# system prompt settings
# most of this system prompt comes from the official document. However, note that we added the very last sentence to inform the model that it may need to maintain silence.
user_system_prompt = "You are Qwen-Omni, a smart voice assistant created by Alibaba Qwen."
sys_message = {
    "role": "system",
    "content": [
          {"type": "text", "text": f"{user_system_prompt} You are a virtual voice assistant with no gender or age.\nYou are communicating with the user.\nIn user messages, “I/me/my/we/our” refer to the user and “you/your” refer to the assistant. In your replies, address the user as “you/your” and yourself as “I/me/my”; never mirror the user’s pronouns—always shift perspective. Keep original pronouns only in direct quotes; if a reference is unclear, ask a brief clarifying question.\nInteract with users using short(no more than 50 words), brief, straightforward language, maintaining a natural tone.\nNever use formal phrasing, mechanical expressions, bullet points, overly structured language. \nYour output must consist only of the spoken content you want the user to hear. \nDo not include any descriptions of actions, emotions, sounds, or voice changes. \nDo not use asterisks, brackets, parentheses, or any other symbols to indicate tone or actions. \nYou must answer users' audio or text questions, do not directly describe the video content. \nYou should communicate in the same language strictly as the user unless they request otherwise.\nWhen you are uncertain (e.g., you can't see/hear clearly, don't understand, or the user makes a comment rather than asking a question), use appropriate questions to guide the user to continue the conversation.\nKeep replies concise and conversational, as if talking face-to-face. You must reply in English. Otherwise, if you decide to keep quiet, output exactly \"KEEP QUIET\"."}
    ]
}

# video settings
FPS = 1.0
MAX_INPUT_TOKENS = 32768  # set to -1 to disable token legth check
DELAY_TIME = 10 # If the token length exceeds the maximum, remove the oldest 10s of video and retry. Repeat until the token length is within the limit. You may change this time setting.
START_TURN = 1

# log settings
NEW_LOG = True # write a header to a new OUTPUT_FILE and clear any existing content if the output file already exist. Set this to False to resume writing outputs to an existing file
LOG = True

# ================================================
def inference_token(processor, model, conversations):
    '''
    For multi-turn interactions, chat histories are stored in `conversations`.
    '''
    conversations_bk = conversations.copy()
    retries = 0
    video_start = 0
    if "video_start" in conversations_bk[START_TURN]["content"][0].keys():
      video_start = int(conversations_bk[START_TURN]["content"][0]["video_start"] / (FPS*DELAY_TIME))
      
    while True:
        text = processor.apply_chat_template(conversations_bk, 
                                            tokenize=False, add_generation_prompt=True)
        audios, images, videos = process_mm_info(conversations_bk, 
                                                use_audio_in_video=True,
                                                )
          
        inputs = processor(text=text, audio=audios, images=images, videos=videos, 
                        return_tensors="pt", padding=True, 
                        use_audio_in_video=True)

        # check and remove the oldest chat history if token length exceeds the maximum
        if MAX_INPUT_TOKENS>0 and inputs["input_ids"].shape[1]>MAX_INPUT_TOKENS:
            chat = conversations_bk[START_TURN]
            if chat["role"]=="user" and chat["content"][0]["type"]=="video":
                frames_left = int(videos[0].shape[0])
                if frames_left > DELAY_TIME*FPS+1:
                    video_start += 1
                    chat["content"][0]["video_start"]=DELAY_TIME*FPS*video_start
                else:
                    conversations_bk.pop(START_TURN)
                    video_start = 0
                        
            elif chat["role"]=="user" and chat["content"][0]["type"]=="text":
                conversations_bk.pop(START_TURN)
                video_start = 0
            elif chat["role"]=="assistant":
                conversations_bk.pop(START_TURN)
                video_start = 0
            retries += 1
        
        else:
            inputs.to(model.device).to(model.dtype)
            
            with torch.no_grad():
                text_ids, _ = model.generate(**inputs, 
                                        thinker_return_dict_in_generate=True,
                                        use_audio_in_video=True,
                                        )
            
            text = processor.batch_decode(text_ids.sequences[:, inputs["input_ids"].shape[1] :],
                                        skip_special_tokens=True,
                                        clean_up_tokenization_spaces=False)[0]
            
            return text, retries, conversations_bk

def process_video(processor, model, video_file, turn='single', example_video='', chat=None):
    print('video:', video_file, 'example:', example_video)
    conversation = [sys_message]

    if turn=='single':
        conversation.append(
            {"role":"user",
             "content":[{"type":"video", "video":video_file, 
                         "fps":FPS, 
                    }]}
            )

        response, retries, _ = inference_token(processor, model, conversation)
        chat = None

    elif turn=='multi_start':
        if not example_video=='':
            conversation.append({
                "role":"user",
                "content":[
                    {"type":"text", "text":"This is the example video:\n"},
                    {"type":"video", "video":example_video,
                            "fps":FPS, 
                            },
                    {"type":"text", "text":"This is the video showing me doing the same thing:\n"}
                ]})
            
        conversation.append({
            "role":"user",
            "content":[
                {"type":"video", "video":video_file, "fps":FPS}
            ]})
        chat = conversation

        response, retries, chat = inference_token(processor, model, chat)
        chat.append(
            {"role":"assistant",
             "content":[{"type":"text", "text":response}]}
        )

    elif turn=='multi':
        chat.append(
            {"role":"user",
             "content":[{"type":"video", "video":video_file,
                         "fps":FPS, 
                        }]}
            )
        
        response, retries, chat = inference_token(processor, model, chat)
        chat.append(
            {"role":"assistant",
             "content":[{"type":"text", "text":response}]}
        )

    return response, chat, retries


# ================================================
if __name__=="__main__":
    
    video_df = pd.read_csv(VIDEO_LABEL)
    if NEW_LOG:
        with open(OUTPUT_FILE, mode='w+', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(['video_name', 'output_text', 'token_retries'])

    # ===== load model =====
    model = Qwen3OmniMoeForConditionalGeneration.from_pretrained(
        MODEL_PATH,
        dtype="auto",
        device_map="auto",
        attn_implementation="flash_attention_2",
    )
    model.eval()
    processor = Qwen3OmniMoeProcessor.from_pretrained(MODEL_PATH)

    # ===== eval =====
    chat=None
    for i in range(len(video_df['video_name'])):
        torch.cuda.empty_cache()

        video_name = video_df['video_name'][i]
        video_file = os.path.join(VIDEO_FOLDER, video_name+'.mp4')

        # single turn
        if video_df['turns'][i]=='single':
            response, _, retries = process_video(processor, model, 
                                                 video_file, turn='single', chat=None)

        # multi turn
        elif video_df['turns'][i]=='multi':
            current_seg = video_name.split('seg')[-1]
            example_video = ''

            if not pd.isna(video_df['example_video'][i]):
                if current_seg=='1':
                    example_video = os.path.join(VIDEO_FOLDER, video_df['example_video'][i]+'.mp4')

            response, chat, retries = process_video(processor, model,
                                                    video_file,
                                                    turn='multi_start' if current_seg=='1' else 'multi', 
                                                    example_video=example_video, 
                                                    chat=None if current_seg=='1' else chat)
        
        if LOG:
            with open(OUTPUT_FILE, mode='a+', newline='', encoding='utf-8') as csvfile:
                writer = csv.writer(csvfile)
                writer.writerow([video_name, response, retries])
        print(i, video_name, response)









