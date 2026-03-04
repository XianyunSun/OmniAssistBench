import os
from google import genai
import time
import pandas as pd
import csv

# ================================================
# Gemini API settings
MODEL = "gemini-3-pro-preview"
API_KEY = "API_KEY"
client = genai.Client(api_key=API_KEY,
                    http_options={'api_version': 'v1alpha'})

# eval running settings
VIDEO_FOLDER = r"./omni_bench_data/"  # path to all video data
VIDEO_CSV = r"./labels.csv" # path to the csv label file
OUTPUT_FILE = r"./gemini3_result.csv"   # path to the output csv file which contains model replies

NEW_LOG = True # write a header to a new OUTPUT_FILE and clear any existing content if the output file already exist. Set this to False to resume writing outputs to an existing file
LOG = True
MAX_RETRY = 3   # automatic retries are implemented to handle potential server errors

# ================================================ 
def process_video(video_file, user_prompt, turn='single', example_video='', chat=None):
    print('video:', video_file, 'example:', example_video)

    # upload video and wait untile the file is ready to process
    video = client.files.upload(file=video_file)
    file_metadata = client.files.get(name=video.name)
    start = float(time.time())
    while file_metadata.state.name != 'ACTIVE':
            time.sleep(1)
            file_metadata = client.files.get(name=video.name)
    print('uploaded with %.4f' % (float(time.time())-start))

    if not example_video=="":
        example_video_upload = client.files.upload(file=example_video)
        example_file_metadata = client.files.get(name=example_video_upload.name)
        start = float(time.time())
        while example_file_metadata.state.name != 'ACTIVE':
            time.sleep(1)
            example_file_metadata = client.files.get(name=example_video_upload.name)
        print('example video uploaded with %.4f' % (float(time.time())-start))        

    # get model replies
    retry_cnt = 0
    while True:
        try:
            if turn=='single':
                response = client.models.generate_content(
                    model=MODEL,
                    contents=[video, user_prompt])
                client.files.delete(name=video.name)
                
            elif turn=='multi_start':
                chat = client.chats.create(model=MODEL)
                if not example_video=='':                    
                    response = chat.send_message(['This is the example video:\n', example_video, 
                                                'This is the video showing me doing something:', video, 
                                                user_prompt])
                else:
                    response = chat.send_message([video, user_prompt])
                
            elif turn=='multi':
                response = chat.send_message([video, user_prompt])
            
            return response.text, chat
        
        except Exception as e:
            print("retrying...", str(e))
            retry_cnt += 1
            if retry_cnt>MAX_RETRY: raise
            else: time.sleep(15)

# ================================================
if __name__=="__main__":
    
    # system prompt
    user_prompt_oe = 'You are a helpful video assistant. For the above input video(s), if you decide to output, organize your output as if you are directly talking to the user. Otherwise, if you decide to keep quiet, output excatly "[KEEP QUIET]".'
    
    video_df = pd.read_csv(VIDEO_CSV)

    if NEW_LOG:
        with open(OUTPUT_FILE, mode='w+', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(['video_name', 'output_text'])

    # ===== evaluation =====
    chat = None   # chat history for multi-turn interaction
    for i in range(len(video_df['video_name'])):
        video_name = video_df['video_name'][i]
        video_file = os.path.join(VIDEO_FOLDER, video_name+'.mp4')
        print('starting with the %d th video: %s' %(i, video_name))

        # single turn
        if video_df['turns'][i]=='single':
            response, _ = process_video(video_file, user_prompt_oe, turn='single', chat=None)

        # multi turn
        elif video_df['turns'][i]=='multi':
            current_seg = video_name.split('seg')[-1]
            example_video = ''
                
            if not pd.isna(video_df['example_video'][i]):
                if current_seg=='1':
                    example_video = os.path.join(VIDEO_FOLDER, video_df['example_video'][i]+'.mp4')

            response, chat = process_video(video_file, user_prompt_oe,
                                        turn='multi_start' if current_seg=='1' else 'multi', 
                                        example_video=example_video, 
                                        chat=None if current_seg=='1' else chat)
        
        # write log
        if LOG:
            with open(OUTPUT_FILE, mode='a+', newline='', encoding='utf-8') as csvfile:
                writer = csv.writer(csvfile)
                writer.writerow([video_name, response])
        print(i, video_name, response)
        print('waiting......')
        time.sleep(60)  # we observed that Gemini models sometimes suffer from performance drop when sending requests continuously, so we wait for 1 min after each request. You may adjust this waiting time.









