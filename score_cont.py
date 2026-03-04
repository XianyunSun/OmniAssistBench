import pandas as pd

# ================================================
# basic settings (no need to change)
score_aspects = ["score", "question_understanding", "semantic_alignment", "polarity_consistency", "keypoint_coverage", "silence_protocol", "redundancy", "conversational_tone", ]
class_names_3 = { # evaluate on 16 sub-task levels
    "identity identification":"identity identification", # II
    "addressee identification":"addressee identification", # AI
    "complex emotion understanding":"complex emotion understanding", # CEU
    "dynamic counting":"dynamic counting", # DC
    "event retrieval":"event retrieval", # ER
    "appearance order":"appearance order", # AO
    "linguistic reference":"linguistic reference", # LR
    "action reference":"action reference", # AR
    "OCR-based prompt following":"OCR-based prompt following", # OPF
    "gesture-based prompt following":"gesture-based prompt following", # GPF
    "context-aware response":"context-aware response", # CR
    "single event-triggered response":"single event-triggered response", # SER
    "multi events-triggered response":"multi events-triggered response", # MER
    "step tracking":"step tracking", # ST
    "checklist tracking":"checklist tracking", # CT
    "multitask tracking":"multitask tracking", # MT
    "real case":"real case", # RC
    }

class_names_2 = { # evaluate on 7 major-task levels
    "identity identification":"social perception", 
    "addressee identification":"social perception", 
    "complex emotion understanding":"social perception",
    "dynamic counting":"temporal perception", 
    "event retrieval":"temporal perception", 
    "appearance order":"temporal perception", 
    "linguistic reference":"referential perception", 
    "action reference":"referential perception", 
    "OCR-based prompt following":"none-audio prompt following", 
    "gesture-based prompt following":"none-audio prompt following", 
    "context-aware response":"context-aware response", 
    "single event-triggered response":"proactivate response", 
    "multi events-triggered response":"proactivate response", 
    "step tracking":"process tracking", 
    "checklist tracking":"process tracking", 
    "multitask tracking":"process tracking", 
    "real case":"real case", 
    }

class_names_1 = { # evaluate on basic / advanced task categories
    "identity identification":"objective understanding", 
    "addressee identification":"objective understanding", 
    "complex emotion understanding":"objective understanding",
    "dynamic counting":"objective understanding", 
    "event retrieval":"objective understanding", 
    "appearance order":"objective understanding", 
    "linguistic reference":"objective understanding", 
    "action reference":"objective understanding", 
    "OCR-based prompt following":"objective understanding", 
    "gesture-based prompt following":"objective understanding", 
    "context-aware response":"interactive", 
    "single event-triggered response":"interactive", 
    "multi events-triggered response":"interactive", 
    "step tracking":"interactive", 
    "checklist tracking":"interactive", 
    "multitask tracking":"interactive", 
    "real case":"real case",
    }

class_names_list = {"first":class_names_1, "second":class_names_2, "third":class_names_3}

# ================================================
# evaluation settings
level = "third" # set evaluation level, choose from: ["first", "second", "third"]
class_names = class_names_list[level]
realcase_level = "all" 
# realcase_level="all": calculate the average score of all 3 real world tasks; 
# realcase_level="seperate":seperately calculate the average score on each real world task

# path settings
LABEL_CSV = r"./labels.csv" # path to the csv label file
RESULT_CSV = r"./Qwen3_result_evalcsv_v2_gpt-5.csv" # path to the scoring result file

# ================================================
if __name__=="__main__":
    label_df = pd.read_csv(LABEL_CSV)
    result_df = pd.read_csv(RESULT_CSV, encoding="utf-8")

    video_class_list = {} # format: {class:{video_seg:[]}, {video:[]},{scores:[]}, {key points number:[]}}
    total_video_count = 0
    for i in range(len(result_df["video_name"])):
        video_seg = result_df["video_name"][i]
        
        if video_seg=="meeting-seg6" or video_seg=="handcraft-seg4":
        # these 2 samples are open-ended questions with no ground truth answer, 
        # so they are not included in the average score calculation
            continue    

        video_class = str(label_df.loc[label_df["video_name"]==video_seg, "class"].values[0]).strip()
        video_class = class_names[video_class]
        if video_class=="real case" and realcase_level=="seperate":
            video_class = video_seg.split("-seg")[0]

        if not video_class in video_class_list.keys():
            video_class_list[video_class] = {}
            
        # log the scores
        for aspect in score_aspects:
            if not aspect in video_class_list[video_class].keys(): 
                video_class_list[video_class][aspect] = []
            video_class_list[video_class][aspect].append(result_df[aspect][i])
            
        total_video_count += 1

    print("total videos:", total_video_count)

    summary_dict = {}
    for k in video_class_list.keys(): summary_dict[k]={}

    valid_video_count = 0  # only include samples with score>0
    total_score = 0
    for video_cls in video_class_list:
        for aspect in score_aspects:
            score_filtered = [s for s in video_class_list[video_cls][aspect] if s>-1]
            summary_dict[video_cls][aspect+"_cont"] = len(score_filtered)
            summary_dict[video_cls][aspect+"_ave"] = sum(score_filtered)/len(score_filtered) if len(score_filtered) else -1
            
            if aspect=="score": 
                valid_video_count += len(score_filtered)
                total_score += sum(score_filtered)

    print("total valid videos:", valid_video_count)
    print("total average score:", total_score/valid_video_count)

    # print the average scores
    for s in summary_dict.keys():
        print(s,":", summary_dict[s]["score_ave"])



    

    


