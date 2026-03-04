import ast
import re
from typing import List, Union
import pdb

def reformat_or(text):
    """
    Analyzes the input string and applies Case 1 or Case 2 formatting logic.
    """
    # Clean up input (remove surrounding quotes if the user literally pasted them)
    text = text.strip()
    #pdb.set_trace()
    if text.startswith('"') and text.endswith('"'):
        # formatting cleanup in case string was copy-pasted with extra quotes
        text = text[1:-1].replace('\\n', '\n')

    # Detect Case 1: Look for "Number. [" or "Number. key point" at the start
    # Regex explains: Start of string, one or more digits, a literal dot.
    if re.match(r'^\d+\.', text):
        return _process_numbered_list(text)
    
    # Detect Case 2: Starts with a bracket "[" (implying a list without numbers)
    elif text.startswith('['):
        return _process_pure_list(text)
    
    # Fallback if neither pattern matches
    else:
        return text

def _process_numbered_list(text):
    """
    Case 1 Logic:
    - Identify numbered lines.
    - If content is a list ["a", "b"], join with " <OR> " (no newlines).
    - Else keep as is.
    """
    lines = text.split('\n')
    formatted_lines = []

    for line in lines:
        line = line.strip()
        if not line: 
            continue

        # Regex to capture "1." and "the rest of the content"
        match = re.match(r'^(\d+\.)\s*(.*)', line)
        
        if match:
            number_prefix = match.group(1)
            content = match.group(2)
            
            try:
                # Attempt to parse content as a list (e.g. '["a", "b"]')
                parsed_content = ast.literal_eval(content)
                
                if isinstance(parsed_content, list):
                    # Join with <OR> without newlines
                    joined_text = " <OR> ".join(str(item) for item in parsed_content)
                    formatted_lines.append(f"{number_prefix} {joined_text}")
                else:
                    # Content wasn't a list, keep original
                    formatted_lines.append(line)
            except (ValueError, SyntaxError):
                # Content wasn't parseable (e.g. plain text "key point 2"), keep original
                formatted_lines.append(line)
        else:
            formatted_lines.append(line)

    return "\n".join(formatted_lines)

def _process_pure_list(text):
    """
    Case 2 Logic:
    - Parse the whole string as a list.
    - Join elements with "\n<OR>\n" (newlines around tag).
    """
    #pdb.set_trace()
    try:
        # Parse the string into a python list
        # We treat literal newlines inside the string logic here
        parsed_list = ast.literal_eval(text)
        
        if isinstance(parsed_list, list):
            # Join with <OR> surrounded by newlines
            return "\n<OR>\n".join(str(item) for item in parsed_list)
        else:
            return text
    except (ValueError, SyntaxError):
        return "Error: Could not parse string list."
# --- Examples / quick tests ---
if __name__=="__main__":
    examples = [
        '1.["description 1 of key point1", "description 2 of key point 1", "description 3"] \n2. key point 2',
        '["answer sentence 1 \\n second row", "answer sentence 2 "]',
        str('["answer sentence 1 \\n second row", "answer sentence 2 "]'),
    ]

    for i, ex in enumerate(examples, start=1):
        print(f"Example {i} input:")
        print(repr(ex))
        print("Output:")
        print(reformat_or(ex))
        print("-" * 40)

    # Additional quick tests showing mixed text with numbering and whitespace
    mixed = "1. [\"A \\n B\",\"C\"]\n2. another line"
    print("Mixed input:", mixed)
    print("Mixed output:")
    print(reformat_or(mixed))