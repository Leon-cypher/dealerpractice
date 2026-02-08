import pandas as pd
import json

try:
    df = pd.read_excel('題庫大全.xlsx')
    # Convert to list of dictionaries
    data = df.to_dict(orient='records')
    with open('questions.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("Success: Converted to questions.json")
except Exception as e:
    print(f"Error: {e}")
