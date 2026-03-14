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
    MODEL_CHAIN = [
        "google/gemini-flash-1.5-exp:free",
        "google/gemini-2.0-flash-exp:free",
        "meta-llama/llama-3.1-8b-instruct:free",
        "meta-llama/llama-3.3-70b-instruct:free",
        "mistralai/mistral-7b-instruct:free",
        "qwen/qwen-2.5-72b-instruct:free",
        "openrouter/free", # Ultimate fallback
    ]

    def __init__(self):
        self.api_key = os.getenv('OPENROUTER_API_KEY')
        self.url = "https://openrouter.ai/api/v1/chat/completions"

    def validate_ai_response(self, questions):
        if not isinstance(questions, list):
            raise InvalidResponseError("AI response is not a list of questions.")
        
        for idx, q in enumerate(questions):
            required_keys = ['question_text', 'choices', 'correct_index', 'explanation']
            for key in required_keys:
                if key not in q:
                    raise InvalidResponseError(f"Question {idx} is missing key: {key}")
            
            if not q['question_text'].strip():
                raise InvalidResponseError(f"Question {idx} has empty question_text")
            
            if not isinstance(q['choices'], list) or len(q['choices']) != 4:
                raise InvalidResponseError(f"Question {idx} must have exactly 4 choices")
            
            for c_idx, choice in enumerate(q['choices']):
                if not isinstance(choice, str) or not choice.strip():
                    raise InvalidResponseError(f"Question {idx}, Choice {c_idx} is empty or not a string")
            
            if not isinstance(q['correct_index'], int) or not (0 <= q['correct_index'] <= 3):
                raise InvalidResponseError(f"Question {idx} has invalid correct_index: {q['correct_index']}")
            
            if not q['explanation'].strip():
                raise InvalidResponseError(f"Question {idx} has empty explanation")

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
                timeout=30  # Increased to 30s to handle slow free models
            )
            
            if response.status_code == 429:
                raise RateLimitError(f"Rate limited on {model}")
            
            if response.status_code in [502, 503]:
                raise AIServiceException(f"Model {model} unavailable (HTTP {response.status_code})")

            if response.status_code != 200:
                raise AIServiceException(f"OpenRouter API error ({response.status_code}): {response.text}")

            data = response.json()
            content = data['choices'][0]['message']['content'].strip()
            
            if content.startswith("```"):
                content = content.split("\n", 1)[1] if "\n" in content else content
                content = content.rsplit("```", 1)[0]
            
            questions = json.loads(content)
            
            if isinstance(questions, dict) and "questions" in questions:
                questions = questions["questions"]

            self.validate_ai_response(questions)
            return questions

        except (requests.exceptions.RequestException, json.JSONDecodeError, KeyError) as e:
            raise AIServiceException(str(e))

    def generate_questions(self, topic, difficulty, num_questions, user_id=None):
        difficulty_guidance = {
            'easy': 'factual recall and basic concepts',
            'medium': 'application of concepts to scenarios',
            'hard': 'analysis, synthesis, and complex problem solving'
        }
        
        guidance = difficulty_guidance.get(difficulty, difficulty_guidance['medium'])
        system_prompt = f"""You are a professional educational assessment expert.
        Generate a quiz with {num_questions} questions about "{topic}".
        Difficulty Level: {difficulty.upper()} ({guidance}).
        
        REQUIREMENTS:
        1. Each question must have exactly one clearly correct answer and 3 highly plausible distractors.
        2. Questions and choices must be educationally accurate and clearly worded.
        3. Include a comprehensive "explanation" (2-3 sentences) that not only identifies the correct answer but also explains WHY it is correct and why other options might be misleading. This should feel like an expert tutor explaining the concept.
        4. Return ONLY a valid JSON array of objects. NO markdown, NO commentary.
        
        JSON SCHEMA:
        [
          {{
            "question_text": "string",
            "choices": ["string1", "string2", "string3", "string4"],
            "correct_index": 0,
            "explanation": "string"
          }}
        ]"""

        last_error = None
        for attempt_num, model in enumerate(self.MODEL_CHAIN, 1):
            try:
                logger.info(f"Attempting model: {model} (Attempt {attempt_num}/{len(self.MODEL_CHAIN)})")
                questions = self.call_openrouter(model, system_prompt, num_questions, topic)
                
                if attempt_num > 1:
                    logger.info(f"Success with model: {model} after {attempt_num} attempts")
                else:
                    logger.info(f"Success with primary model: {model}")
                    
                return questions

            except RateLimitError as e:
                logger.warning(f"Model {model} rate limited, trying next...")
                last_error = "rate_limit"
                continue
            except InvalidResponseError as e:
                logger.warning(f"Invalid response from {model}, trying next...")
                last_error = "invalid_response"
                continue
            except Exception as e:
                logger.warning(f"Model {model} failed: {str(e)}, trying next...")
                last_error = str(e)
                continue

        logger.error(f"All models failed for quiz generation. User: {user_id}")
        raise AllModelsFailedError(f"All {len(self.MODEL_CHAIN)} models failed. Last error: {last_error}")
