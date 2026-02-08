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
    formatted_data.append({
        'id': q['編號'],
        'category': q['類別'],
        'difficulty': q['難度'],
        'question': q['題目'],
        'options': {
            'A': q['選項A'],
            'B': q['選項B'],
            'C': q['選項C'],
            'D': q['選項D']
        },
        'answer': q['正確答案'],
        'explanation': q['解析']
    })

ts_content += json.dumps(formatted_data, ensure_ascii=False, indent=2) + ";"

with open('src/utils/quizData.ts', 'w', encoding='utf-8') as f:
    f.write(ts_content)

print("Success: Generated src/utils/quizData.ts")
