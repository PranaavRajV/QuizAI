export interface User {
  id: number;
  username: string;
  email: string;
  bio?: string;
  email_notifications?: boolean;
  push_notifications?: boolean;
  dark_mode?: boolean;
  avatar_url?: string | null;
  notifications_unread?: number;
  pending_friend_requests_count?: number;
  pending_challenges_count?: number;
}


export interface Choice {
  id: number;
  choice_text: string;
}

export interface Question {
  id: number;
  question_text: string;
  explanation: string;
  order: number;
  choices: Choice[];
}

export interface Quiz {
  id: number;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  num_questions: number;
  created_by_name: string;
  created_at: string;
  share_token: string;
  questions?: Question[];
}

export interface UserAnswer {
  id: number;
  question: number;
  selected_choice: number | null;
  is_correct: boolean;
}

export interface QuizAttempt {
  id: number;
  user: number;
  quiz: number;
  quiz_topic: string;
  score: number;
  total_questions: number;
  correct_count: number;
  started_at: string;
  completed_at: string | null;
  is_completed: boolean;
  answers?: UserAnswer[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface CreateQuizPayload {
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  num_questions: number;
}

export interface LoginPayload {
  email: string;
  password?: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password?: string;
  password_confirm?: string;
  bio?: string;
}
