export enum UserRole {
  ADMIN = 'ADMIN',  
  TEACHER = 'TEACHER',
  PARENT = 'PARENT',  
  STUDENT = 'STUDENT'  
}

export interface School {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string; // Security field for Staff
  // Student specific fields
  points?: number; 
  level?: number;  
  grade?: number; // 1 to 9 (Ensino Fundamental)
  classGroup?: string; // A, B, C... ou "Família Souza"
  schoolId?: string; // ID da escola onde estuda
  badges?: string[];
  parentIds?: string[]; // IDs dos pais vinculados a este aluno
}

export interface SchoolClass {
  id: string;
  name: string; // Ex: "A", "B", "Matutino", "101"
  grade: number; // 1 a 5
  schoolId: string; // ID da escola
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswerIndex: number;
  explanation?: string;
}

export interface Quiz {
  id: string;
  title: string;
  subject: string;
  description: string;
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
  targetGrade?: number; // Designed for which grade
  questions: Question[];
  createdBy: string; // Teacher or Parent ID
  createdAt: number;
}

export interface QuizResult {
  studentId: string;
  quizId: string;
  score: number;
  maxScore: number;
  date: number;
}

export type ViewState = 
  | 'LOGIN'
  | 'DASHBOARD_STAFF' // Combined Admin/Teacher/Parent
  | 'DASHBOARD_STUDENT'
  | 'MANAGE_SCHOOLS' 
  | 'MANAGE_USERS'
  | 'ENROLL_STUDENT'
  | 'MANAGE_CLASSES' 
  | 'CREATE_QUIZ'
  | 'PLAY_QUIZ'
  | 'LEADERBOARD'
  | 'REPORTS'
  | 'GAMES_HUB';

// Define the subjects available for generation
export const SUBJECTS = [
  'Matemática',
  'Português',
  'História',
  'Geografia',
  'Ciências',
  'Inglês',
  'Artes',
  'Conhecimentos Gerais'
];