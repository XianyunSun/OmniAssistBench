from openai import OpenAI
import openai
import os
import pandas as pd
import csv
import json
from tool import reformat_or


# ================================================
## OpenAI API settings
MODEL = "gpt-5"
MY_KEY = "MY_KEY"
BASE_URL = "https://api.openai.com/v1"
client = OpenAI(api_key=MY_KEY, base_url=BASE_URL)

## Set the evaluation instruction file
inst_file = r"./score_rubric.txt"
with open(inst_file, "r", encoding="utf-8") as file:
    INST = file.read()

## file and log settings
# scoring result with be saved in the same folder as the model reply file
ANSWER_CSV = r"./Qwen3_result.csv"    # path to the csv file which contains model replies
LABEL_CSV = r"./labels.csv" # path to the csv label file

NEW_LOG = False # Set this to False to resume writing outputs to an existing file
LOG = True

CSV_HEAD = ["video_name", "video_class", "question_understanding", "semantic_alignment", "polarity_consistency", "keypoint_coverage", "silence_protocol", "redundancy", "conversational_tone", "score", "rationale"]

# ================================================
def generate_eval(video_name, question, gt, key_points, answer):
    
    prompt = INST.replace("<QUESTION>", question)
    prompt = prompt.replace("<GOLD_ANSWER>", reformat_or(str(gt).replace("\n", "\n")))
    prompt = prompt.replace("<GOLD ANSWER (KEY POINTS)>", reformat_or(str(key_points).replace('\n', '\n')))
    prompt = prompt.replace("<VIDEO_NAME>", video_name)
    prompt = prompt.replace("<MODEL_ANSWER>", answer)

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "user", 
                "content": prompt}],
                temperature=0,)
        response = response.choices[0].message.content
    
    except openai.BadRequestError as e:
        if "The response was filtered" in str(e):
            response = \
            """{
            "candidate": "video_name",
            "question_understanding": "Not Applicable",
            "semantic_alignment": "Not Applicable",
            "polarity_consistency": "Not Applicable",
            "keypoint_coverage": "Not Applicable",
            "silence_protocol": "Not Applicable",
            "redundancy": "Not Applicable",
            "conversational_tone": "Not Applicable",
            "score": -1,
            "rationale": "ERROR: The response was filtered due to the prompt triggering Azure OpenAI's content management policy."}
            """
            response = response.replace("video_name", video_name)
            print("POLICY ERROR for video:", video_name)
        else:
            raise

    if "```json" in response:
        response = response.replace("```json", "").replace("```", "")

    print(response)
    return response

def str2dict(response, video_name, video_class):
    if isinstance(response, str):
        try: 
            data = json.loads(response)
            data["video_class"] = video_class

        except json.JSONDecodeError as e:
        # If JSON parsing fails, store the raw string and record the error
                data = {
                    "candidate": str(video_name),
                    "video_class": str(video_class),
                    "question_understanding": "",
                    "semantic_alignment": "",
                    "polarity_consistency": "",
                    "keypoint_coverage": "",
                    "silence_protocol": "",
                    "redundancy": "",
                    "conversational_tone": "",
                    "score": -1,
                    "rationale": "",
                    "_raw": str(response),
                    "_json_error":[f"JSONDecodeError: {e}"],
                    }
    
    elif isinstance(response, dict): 
        data = response
        data["video_class"] = video_class
    
    else:
    # Unexpected return type
        data = {
            "candidate": str(video_name),
            "video_class": str(video_class),
            "question_understanding": "",
            "semantic_alignment": "",
            "polarity_consistency": "",
            "keypoint_coverage": "",
            "silence_protocol": "",
            "redundancy": "",
            "conversational_tone": "",
            "score": -1,
            "rationale": "",
            "_raw": str(response),
            "_json_error":[f"Unexpected return type: {type(response)}"],
            }
    return data 

def str2score(string):
    assert string in ['Yes', 'No', 'Partly', 'Not Applicable']
    score_dict = {"Yes":2, "No":0, "Not Applicable":-1, "Partly":1}
    return score_dict[string]

def write_results_json(response_dict, gt, candidate, out_json_file):
    json_data = []
    try:
        with open(out_json_file, "r", encoding="utf-8") as f:
            json_data = json.load(f)
            if not isinstance(json_data, list):
                  json_data = [json_data]
    except Exception: json_data = []

    response_dict["gt"] = gt
    response_dict["answer"] = candidate
    json_data.append(response_dict)
    tmp = out_json_file + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(json_data, f, ensure_ascii=False, indent=2)
    os.replace(tmp, out_json_file)

def write_results_csv(response_dict, out_csv_file):
    with open(out_csv_file, "a", encoding="utf-8", newline="") as cf:
        writer = csv.DictWriter(cf, fieldnames=CSV_HEAD)
        # Build row from obj
        row = {
            "video_name": response_dict.get("candidate"),
            "video_class": response_dict.get("video_class"),
            "question_understanding": str2score(response_dict.get("question_understanding")),
            "semantic_alignment": str2score(response_dict.get("semantic_alignment")),
            "polarity_consistency": str2score(response_dict.get("polarity_consistency")),
            "keypoint_coverage": str2score(response_dict.get("keypoint_coverage")),
            "silence_protocol": str2score(response_dict.get("silence_protocol")),
            "redundancy": str2score(response_dict.get("redundancy")),
            "conversational_tone": str2score(response_dict.get("conversational_tone")),
            "score": int(response_dict.get("score")),
            "rationale": response_dict.get("rationale"),}
        writer.writerow(row)
     
# ================================================
if __name__=="__main__":
    label_df = pd.read_csv(LABEL_CSV)
    answer_df = pd.read_csv(ANSWER_CSV, encoding="utf-8")

    output_json = ANSWER_CSV.replace(".csv", "_evaljson_v2_"+MODEL.replace("/", "-")+".json")
    output_csv = ANSWER_CSV.replace(".csv", "_evalcsv_v2_"+MODEL.replace("/", "-")+".csv")
    if NEW_LOG:
        with open(output_json, "w+", encoding="utf-8") as f:
            json.dump([], f, ensure_ascii=False, indent=2)
        with open(output_csv, mode="w+", newline="", encoding="utf-8") as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(CSV_HEAD)
    
    for i in range(len(label_df["video_name"])):
        video_name = label_df["video_name"][i]
        video_class = label_df["class"][i]
        
        answer = str(answer_df.loc[answer_df["video_name"]==video_name, "output_text"].values[0])
        question = str(label_df["question"][i]) if not pd.isna(label_df["question"][i]) else "What is the next step?"
        gt_answer = str(label_df["gt_answer"][i]) 
        gt_key = str(label_df["key_points"][i])
        
        eval = generate_eval(video_name, question, gt_answer, gt_key, answer, format="completions")
        eval_dict = str2dict(eval, video_name, video_class)
        if LOG:
            write_results_json(eval_dict, gt_answer, answer, output_json)
            write_results_csv(eval_dict, output_csv)
        #time.sleep(5)

