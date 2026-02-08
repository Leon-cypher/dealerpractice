import json

with open('questions.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

ts_content = """export interface Question {
  id: number;
  category: string;
  difficulty: string;
  question: string;
  options: { [key: string]: string };
  answer: string;
  explanation: string;
}

export const QUIZ_DATA: Question[] = """

formatted_data = []
for q in data:
    # 強制將所有內容轉換為字串，除了 ID
    formatted_data.append({
        'id': int(q['編號']),
        'category': str(q['類別']),
        'difficulty': str(q['難度']),
        'question': str(q['題目']),
        'options': {
            'A': str(q['選項A']),
            'B': str(q['選項B']),
            'C': str(q['選項C']),
            'D': str(q['選項D'])
        },
        'answer': str(q['正確答案']),
        'explanation': str(q['解析'])
    })

ts_content += json.dumps(formatted_data, ensure_ascii=False, indent=2) + ";"

with open('src/utils/quizData.ts', 'w', encoding='utf-8') as f:
    f.write(ts_content)

print("Success: Fixed and regenerated src/utils/quizData.ts")