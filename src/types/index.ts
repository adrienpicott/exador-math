export type UserRole = 'student' | 'coach'
export type DifficultyLevel = 'facile' | 'moyen' | 'difficile' | 'expert' | 'piege'
export type QuestionType = 'multiple_choice' | 'free_text'
export type QuizStatus = 'in_progress' | 'completed' | 'abandoned'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  class_id?: string
  level: number
  xp: number
  total_xp: number
  current_streak: number
  best_streak: number
  last_activity?: string
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Chapter {
  id: string
  title: string
  description?: string
  continent: string
  school_level: string
  order_index: number
  prerequisites: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Question {
  id: string
  chapter_id: string
  question_text: string
  question_type: QuestionType
  difficulty: DifficultyLevel
  points_base: number
  explanation?: string
  hints: string[]
  time_limit?: number
  tags: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}
