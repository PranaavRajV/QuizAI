export interface SocialUser {
  id: string;
  username: string;
  email: string;
  avatar_initials: string;
  avg_score: number;
  total_quizzes: number;
  last_active: string;
  is_online: boolean;
}

export interface Friendship {
  id: number;
  from_user: string;
  to_user: string;
  from_user_detail: SocialUser;
  to_user_detail: SocialUser;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  updated_at: string;
}

export interface Challenge {
  id: number;
  challenger: string;
  challenged: string;
  challenger_detail: SocialUser;
  challenged_detail: SocialUser;
  quiz: string;
  quiz_detail: {
    id: string;
    topic: string;
    difficulty: string;
    num_questions: number;
  };
  challenger_attempt: string | null;
  challenged_attempt: string | null;
  challenger_attempt_detail: any | null;
  challenged_attempt_detail: any | null;
  status: 'pending' | 'active' | 'completed' | 'expired';
  created_at: string;
  expires_at: string;
  winner_name: string | null;
}

export interface ShareResult {
  id: number;
  user: string;
  username: string;
  attempt: string;
  share_token: string;
  is_public: boolean;
  created_at: string;
  quiz_name: string;
  score: number;
  correct_count: number;
}
