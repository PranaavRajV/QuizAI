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
  is_correct?: boolean; // Only present in results view
}

export interface Question {
  id: number;
  question_text: string;
  explanation: string;
  order: number;
  type: 'mcq' | 'typed';
  correct_answer?: string; // Only for results
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
  public_attempt_count?: number;
  public_avg_score?: number;
}

export interface UserAnswer {
  id: number;
  question: number;
  selected_choice: number | null;
  is_correct: boolean;
  typed_answer?: string;
  feedback?: string;
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
  evaluation_status: 'pending' | 'processing' | 'completed';
  answers?: UserAnswer[];
  quiz_details?: Question[]; // Added for results review
}

export interface RoomParticipant {
  id: number;
  user: number;
  username: string;
  avatar_url?: string | null;
  is_ready: boolean;
  score: number;
  rank?: number;
}

export interface Room {
  id: number;
  room_code: string;
  host: number;
  host_name: string;
  quiz: number;
  quiz_topic: string;
  status: 'waiting' | 'active' | 'completed';
  max_participants: number;
  participants: RoomParticipant[];
  created_at: string;
  started_at?: string;
  completed_at?: string;
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

export interface QuizConfig {
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  num_questions: number;
  max_participants?: number;
  time_per_question?: number;
  points_per_question?: number;
  question_types?: ('mcq' | 'typed')[];
}

export interface CreateQuizPayload {
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  num_questions: number;
  quiz_config?: QuizConfig;
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
