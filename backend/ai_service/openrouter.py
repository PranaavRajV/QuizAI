import json
import time
import requests
import os
import logging
from django.conf import settings
from .exceptions import (
    AIServiceException, RateLimitError, InvalidResponseError, AllModelsFailedError
)

logger = logging.getLogger(__name__)

class OpenRouterService:
    def __init__(self):
        self.api_key = os.getenv('OPENROUTER_API_KEY')
        if not self.api_key:
            logger.error("OPENROUTER_API_KEY is not set in environment variables.")
        self.url = "https://openrouter.ai/api/v1/chat/completions"
        self.xai_key = os.getenv('XAI_API_KEY')
        self.xai_url = "https://api.x.ai/v1/chat/completions"

    MODEL_CHAIN = [
        "google/gemini-2.0-flash-exp:free",
        "google/gemini-2.0-flash-lite-preview-02-05:free",
        "deepseek/deepseek-r1-distill-llama-70b:free",
        "deepseek/deepseek-chat:free",
        "meta-llama/llama-3.3-70b-instruct:free",
        "google/gemini-flash-1.5-exp:free",
        "qwen/qwen-2.5-72b-instruct:free",
        "mistralai/mistral-7b-instruct:free",
        "microsoft/phi-3-medium-128k-instruct:free",
        "openrouter/free", 
    ]

    def validate_ai_response(self, questions):
        if not isinstance(questions, list):
            raise InvalidResponseError("AI response is not a list of questions.")
        
        for idx, q in enumerate(questions):
            required_keys = ['question_text', 'choices', 'correct_index', 'explanation']
            # Basic validation but flexible on types
            for key in required_keys:
                if key not in q:
                    # Try to fix typed answers missing choices
                    if q.get('type') == 'typed' and key in ['choices', 'correct_index']:
                        continue
                    raise InvalidResponseError(f"Question {idx} is missing key: {key}")

    def call_openrouter(self, model, prompt, num_questions, topic):
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "AI Quiz App",
            "Content-Type": "application/json"
        }

        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": prompt},
                {"role": "user", "content": f"Generate {num_questions} questions about {topic}."}
            ],
            "temperature": 0.7
        }

        try:
            response = requests.post(
                self.url,
                headers=headers,
                data=json.dumps(payload),
                timeout=30,
            )
            
            if response.status_code == 429:
                raise RateLimitError(f"Rate limited on {model}")
            
            if response.status_code in [502, 503, 504]:
                raise AIServiceException(f"Model {model} unavailable (HTTP {response.status_code})")

            if response.status_code != 200:
                raise AIServiceException(f"OpenRouter API error ({response.status_code}): {response.text}")

            data = response.json()
            content = data['choices'][0]['message']['content'].strip()
            
            import re
            json_match = re.search(r'\[\s*\{.*\}\s*\]', content, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
            else:
                json_str = content
                if json_str.startswith("```json"):
                    json_str = json_str.replace("```json", "", 1).replace("```", "", 1).strip()
                elif json_str.startswith("```"):
                    json_str = json_str.replace("```", "", 1).replace("```", "", 1).strip()

            try:
                questions = json.loads(json_str)
            except json.JSONDecodeError:
                deep_match = re.search(r'\[.*\]', content, re.DOTALL)
                if deep_match:
                    questions = json.loads(deep_match.group(0))
                else:
                    raise InvalidResponseError("AI returned invalid JSON format")
            
            if isinstance(questions, dict) and "questions" in questions:
                questions = questions["questions"]

            self.validate_ai_response(questions)
            return questions

        except requests.exceptions.Timeout:
            raise RateLimitError("Timeout")
        except Exception:
            raise

    def call_grok(self, prompt, num_questions, topic):
        if not self.xai_key:
            raise AIServiceException("XAI_API_KEY not set")
            
        headers = {
            "Authorization": f"Bearer {self.xai_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "grok-2-latest",
            "messages": [
                {"role": "system", "content": prompt},
                {"role": "user", "content": f"Generate {num_questions} questions about {topic}."}
            ],
            "temperature": 0.7
        }
        
        try:
            response = requests.post(self.xai_url, headers=headers, json=payload, timeout=30)
            if response.status_code != 200:
                raise AIServiceException(f"xAI API Error ({response.status_code})")
                
            data = response.json()
            content = data['choices'][0]['message']['content'].strip()
            
            import re
            match = re.search(r'\[.*\]', content, re.DOTALL)
            if match:
                questions = json.loads(match.group(0))
                self.validate_ai_response(questions)
                return questions
            
            questions = json.loads(content)
            self.validate_ai_response(questions)
            return questions
        except Exception:
            raise

    def _build_system_prompt(self, topic, difficulty, num_questions, settings=None):
        difficulty_guidance = {
            'easy': 'factual recall and basic concepts',
            'medium': 'application of concepts to scenarios',
            'hard': 'analysis, synthesis, and complex problem solving',
        }
        guidance = difficulty_guidance.get(difficulty, difficulty_guidance['medium'])

        question_types = None
        if settings:
            question_types = settings.get('question_types')

        type_instructions = ""
        if question_types:
            if set(question_types) == {'mcq'}:
                type_instructions = "All questions must be multiple-choice (MCQ) with four options."
            elif set(question_types) == {'typed'}:
                type_instructions = (
                    "All questions must be typed-answer questions. Do NOT include choices. "
                    "Return objects with fields: question_text, correct_answer, explanation, type='typed'."
                )
            else:
                type_instructions = (
                    "Generate a mix of MCQ and typed-answer questions."
                )

        base_requirements = """
REQUIREMENTS:
1. Return ONLY a valid JSON array of objects. NO markdown, NO commentary.
2. Each MCQ must have 4 choices and a correct_index (0-3).
"""

        system_prompt = f"""You are a professional educational assessment expert.
Generate a quiz with {num_questions} questions about "{topic}".
Difficulty Level: {difficulty.upper()} ({guidance}).
{type_instructions}
{base_requirements}
"""
        return system_prompt

    def generate_questions(self, topic, difficulty, num_questions, user_id=None, settings=None):
        effective_num = num_questions
        try:
            for attempt_phase in [1, 2, 3]:
                if attempt_phase == 3:
                    effective_num = max(5, num_questions // 2)

                system_prompt = self._build_system_prompt(
                    topic=topic,
                    difficulty=difficulty,
                    num_questions=effective_num,
                    settings=settings,
                )

                for model in self.MODEL_CHAIN:
                    try:
                        questions = self.call_openrouter(model, system_prompt, effective_num, topic)
                        if questions:
                            return questions
                    except Exception:
                        continue
                
                # Fallback to Grok
                if attempt_phase == 1:
                    try:
                        return self.call_grok(system_prompt, effective_num, topic)
                    except Exception:
                        pass
            
            raise AIServiceException("All models failed")

        except Exception as e:
            logger.critical(f"Infinite Robustness: AI failed {str(e)}. Using Failsafe for {topic}")
            return self._get_failsafe_questions(topic, effective_num)

    def _get_failsafe_questions(self, topic, count):
        questions = []
        for i in range(count):
            questions.append({
                "question_text": f"Fundamental concept of {topic} (Essential Study {i+1})",
                "choices": [
                    f"Core application of {topic}",
                    f"Theoretical basis of {topic}",
                    f"Historical context of {topic}",
                    "All of the above"
                ],
                "correct_index": 0,
                "explanation": f"Mastering {topic} requires a deep understanding of its core principles and real-world applications.",
                "type": "mcq"
            })
        return questions

    def evaluate_typed_answer(self, correct_answer, user_answer):
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "AI Quiz App - Typed Evaluation",
            "Content-Type": "application/json",
        }
        
        prompt = (
            f"Correct: '{correct_answer}'. User: '{user_answer}'. "
            "Is the user conceptually correct? Return JSON: { \"is_correct\": bool, \"feedback\": \"str\" }"
        )

        for model in self.MODEL_CHAIN[:3]: 
            try:
                payload = {
                    "model": model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.0,
                }
                response = requests.post(self.url, headers=headers, data=json.dumps(payload), timeout=15)
                if response.status_code == 200:
                    data = response.json()
                    content = data['choices'][0]['message']['content'].strip()
                    import re
                    match = re.search(r'\{.*\}', content, re.DOTALL)
                    if match:
                        result = json.loads(match.group(0))
                        return {
                            "is_correct": bool(result.get("is_correct")),
                            "feedback": result.get("feedback") or "Evaluated accurately."
                        }
            except Exception:
                continue

        return self._local_fallback_eval(correct_answer, user_answer)

    def _local_fallback_eval(self, correct, user):
        c = correct.lower().strip()
        u = user.lower().strip()
        if u == c or u in c or c in u:
            return {"is_correct": True, "feedback": "Match detected (Failsafe)."}
        return {"is_correct": False, "feedback": "Answer did not match required terms."}
