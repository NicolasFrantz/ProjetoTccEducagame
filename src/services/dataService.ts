import { User, UserRole, Quiz, QuizResult, SchoolClass, School } from '../types';

// Escolas Iniciais
const INITIAL_SCHOOLS: School[] = [
  { id: 's1', name: 'Escola Modelo' }
];

// Apenas o Admin existe inicialmente
const INITIAL_USERS: User[] = [
  { 
    id: '1', 
    name: 'Diretor Admin', 
    email: 'admin@escola.com', 
    password: '1234',
    role: UserRole.ADMIN, 
    schoolId: 's1'
  },
   { 
    id: '2', 
    name: 'Responsável', 
    email: 'admin@pai.com', 
    password: '1234',
    role: UserRole.PARENT, 
  }
];

// Classes Iniciais vinculadas à escola s1
const INITIAL_CLASSES: SchoolClass[] = [
  { id: 'c1', grade: 1, name: 'A', schoolId: 's1' },
  { id: 'c2', grade: 1, name: 'B', schoolId: 's1' },
  { id: 'c3', grade: 2, name: 'A', schoolId: 's1' },
  { id: 'c4', grade: 2, name: 'B', schoolId: 's1' },
  { id: 'c5', grade: 3, name: 'A', schoolId: 's1' },
  { id: 'c6', grade: 3, name: 'B', schoolId: 's1' },
  { id: 'c7', grade: 4, name: 'A', schoolId: 's1' },
  { id: 'c8', grade: 4, name: 'B', schoolId: 's1' },
  { id: 'c9', grade: 5, name: 'A', schoolId: 's1' },
  { id: 'c10', grade: 5, name: 'B', schoolId: 's1' },
];

// Um quiz inicial de exemplo criado pelo Admin
const INITIAL_QUIZZES: Quiz[] = [
  {
    id: 'q1',
    title: 'Quiz de Boas-vindas',
    subject: 'Conhecimentos Gerais',
    description: 'Atividade demonstrativa para Séries Iniciais.',
    difficulty: 'Fácil',
    targetGrade: 1,
    createdBy: '1',
    createdAt: Date.now(),
    questions: [
      { 
        id: 'q1_1', 
        text: 'Qual é a primeira letra do alfabeto?', 
        options: ['B', 'A', 'Z', 'C'], 
        correctAnswerIndex: 1,
        explanation: 'A letra A é a primeira do nosso alfabeto e uma vogal.'
      },
      { 
        id: 'q1_2', 
        text: 'Quanto é 1 + 1?', 
        options: ['11', '3', '2', '0'], 
        correctAnswerIndex: 2,
        explanation: 'Uma unidade mais uma unidade resultam em duas unidades.'
      },
    ]
  }
];

// Helper to load/save
const get = <T>(key: string, initial: T): T => {
  const stored = localStorage.getItem(key);
  if (!stored) return initial;
  try {
    return JSON.parse(stored);
  } catch {
    return initial;
  }
};

const set = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const dataService = {
  getSchools: () => get<School[]>('schools', INITIAL_SCHOOLS),
  saveSchool: (school: School) => {
    const schools = get<School[]>('schools', INITIAL_SCHOOLS);
    const idx = schools.findIndex(s => s.id === school.id);
    if (idx >= 0) schools[idx] = school;
    else schools.push(school);
    set('schools', schools);
  },
  deleteSchool: (id: string) => {
    const schools = get<School[]>('schools', INITIAL_SCHOOLS);
    set('schools', schools.filter(s => s.id !== id));
  },

  getUsers: () => get<User[]>('users', INITIAL_USERS),
  saveUser: (user: User) => {
    const users = get<User[]>('users', INITIAL_USERS);
    // Check if update or create
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) users[idx] = user;
    else users.push(user);
    set('users', users);
  },
  
  deleteUser: (id: string) => {
    const users = get<User[]>('users', INITIAL_USERS);
    set('users', users.filter(u => u.id !== id));
  },

  // Nova função específica para remover alunos, resultados e vínculos
  deleteStudent: (studentId: string) => {
    // 1. Remove Resultados do Aluno (Limpeza de histórico)
    const results = get<QuizResult[]>('results', []);
    const newResults = results.filter(r => r.studentId !== studentId);
    set('results', newResults);

    // 2. Remove o Aluno
    // Como o array 'parentIds' fica dentro do objeto do aluno, deletar o aluno
    // automaticamente desfaz o vínculo com os pais.
    const users = get<User[]>('users', INITIAL_USERS);
    const newUsers = users.filter(u => u.id !== studentId);
    set('users', newUsers);
  },
  
  getQuizzes: () => get<Quiz[]>('quizzes', INITIAL_QUIZZES),
  saveQuiz: (quiz: Quiz) => {
    const quizzes = get<Quiz[]>('quizzes', INITIAL_QUIZZES);
    quizzes.push(quiz);
    set('quizzes', quizzes);
  },

  getResults: () => get<QuizResult[]>('results', []),
  saveResult: (result: QuizResult) => {
    const results = get<QuizResult[]>('results', []);
    results.push(result);
    set('results', results);

    // Update student points logic
    const users = get<User[]>('users', INITIAL_USERS);
    const studentIndex = users.findIndex(u => u.id === result.studentId);
    if (studentIndex >= 0) {
      const student = users[studentIndex];
      const newPoints = (student.points || 0) + result.score;
      // Simple leveling logic: every 100 points = 1 level
      const newLevel = Math.floor(newPoints / 100) + 1;
      
      users[studentIndex] = {
        ...student,
        points: newPoints,
        level: newLevel
      };
      set('users', users);
    }
  },

  getClasses: () => get<SchoolClass[]>('classes', INITIAL_CLASSES),
  saveClass: (schoolClass: SchoolClass) => {
    const classes = get<SchoolClass[]>('classes', INITIAL_CLASSES);
    classes.push(schoolClass);
    set('classes', classes);
  },
  deleteClass: (id: string) => {
    const classes = get<SchoolClass[]>('classes', INITIAL_CLASSES);
    set('classes', classes.filter(c => c.id !== id));
  }
};