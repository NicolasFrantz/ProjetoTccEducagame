
import React, { useState, useEffect } from 'react';
import { User, UserRole, ViewState, Quiz, QuizResult, SUBJECTS, Question } from './types';
import { generateQuizQuestions } from './services/geminiService';
import { Button } from './components/Button';

// --- Firebase SDK ---
// Fix: Use namespaced imports to bypass potential type definition issues in the environment
import * as firebaseApp from 'firebase/app';
import * as firebaseAuth from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore';

const initializeApp = firebaseApp.initializeApp;
const getAuth = firebaseAuth.getAuth;
const signInWithEmailAndPassword = firebaseAuth.signInWithEmailAndPassword;
const createUserWithEmailAndPassword = firebaseAuth.createUserWithEmailAndPassword;
const signOut = firebaseAuth.signOut;
const onAuthStateChanged = firebaseAuth.onAuthStateChanged;

import { 
  Users, // Fix: Added missing Users icon import
  Trophy, 
  Plus, 
  Play, 
  LogOut, 
  Sparkles, 
  LayoutDashboard, 
  Gamepad2, 
  BookOpen, 
  School as SchoolIcon, 
  Baby, 
  ArrowRight, 
  Star, 
  Lock, 
  UserCircle, 
  Trash, 
  CheckCircle, 
  PenTool, 
  PlusCircle, 
  Heart, 
  Home, 
  ClipboardList, 
  UserPlus, 
  ArrowLeft, 
  Grid3X3, 
  Search, 
  Link as LinkIcon, 
  BarChart as BarChartIcon, 
  Puzzle, 
  Brain, 
  Calculator, 
  RotateCcw, 
  X, 
  Circle, 
  Zap, 
  Layers, 
  Timer, 
  Menu,
  Filter,
  Library,
  Pencil
} from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, YAxis } from 'recharts';

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyDG1AbKMX5xhdh3CTxOGilX21YoFev-ojI",
  authDomain: "educagame-1ef93.firebaseapp.com",
  projectId: "educagame-1ef93",
  storageBucket: "educagame-1ef93.firebasestorage.app",
  messagingSenderId: "161877422862",
  appId: "1:161877422862:web:3989327364361cd5ac9d5f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Audio Utility ---
const playSound = (type: 'success' | 'error' | 'click' | 'step' | 'win') => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    if (type === 'success') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
      gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now); osc.stop(now + 0.4);
    } else if (type === 'error') {
      osc.type = 'square'; osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.2);
      gain.gain.setValueAtTime(0.05, now); gain.gain.linearRampToValueAtTime(0.001, now + 0.3);
      osc.start(now); osc.stop(now + 0.3);
    } else if (type === 'win') {
      osc.type = 'triangle'; osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.1); osc.frequency.setValueAtTime(783.99, now + 0.2);
      gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc.start(now); osc.stop(now + 0.6);
    } else {
      osc.type = 'sine'; osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now); osc.stop(now + 0.1);
    }
  } catch (e) {}
};

// --- Shared Components ---

const Confetti = () => {
  const [particles] = useState(() => Array.from({ length: 40 }).map((_, i) => ({
    id: i, left: Math.random() * 100, delay: Math.random() * 2,
    color: ['text-yellow-400', 'text-primary', 'text-accent', 'text-green-400', 'text-blue-400'][Math.floor(Math.random() * 5)],
    size: Math.random() * 20 + 10
  })));
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map(p => (
        <div key={p.id} className={`absolute -top-10 animate-fall ${p.color}`}
          style={{ left: `${p.left}%`, animationDelay: `${p.delay}s`, width: p.size, height: p.size }}>
          <Star className="fill-current w-full h-full" />
        </div>
      ))}
    </div>
  );
};

const UserAvatar = ({ name, colorClass = "bg-primary" }: { name: string, colorClass?: string }) => (
    <div className={`w-10 h-10 rounded-full ${colorClass} text-white flex items-center justify-center font-black text-sm shadow-sm`}>
        {name ? name.substring(0, 2).toUpperCase() : '?'}
    </div>
);

const Sidebar = ({ currentUser, setView, currentView, onLogout, className = "", onClose }: any) => {
  const isParent = currentUser.role === UserRole.PARENT;
  const isStaff = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.TEACHER;
  const menuItems = isParent 
    ? [
        { label: 'Início', icon: Home, view: 'DASHBOARD_STAFF' },
        { label: 'Meus Filhos', icon: Baby, view: 'MANAGE_USERS' },
        { label: 'Relatórios', icon: BarChartIcon, view: 'REPORTS' },
        { label: 'Atividades', icon: Library, view: 'MANAGE_QUIZZES' },
      ]
    : isStaff
    ? [
        { label: 'Início', icon: LayoutDashboard, view: 'DASHBOARD_STAFF' },
        { label: 'Alunos', icon: Users, view: 'MANAGE_USERS' },
        { label: 'Turmas', icon: Grid3X3, view: 'MANAGE_CLASSES' },
        { label: 'Criar Quiz', icon: PenTool, view: 'CREATE_QUIZ' },
        { label: 'Relatórios', icon: BarChartIcon, view: 'REPORTS' },
      ]
    : [
        { label: 'Meu Painel', icon: Gamepad2, view: 'DASHBOARD_STUDENT' },
        { label: 'Jogos', icon: Puzzle, view: 'GAMES_HUB' },
        { label: 'Ranking', icon: Trophy, view: 'LEADERBOARD' },
      ];

  return (
    <div className={`w-72 bg-white border-r-4 border-slate-100 h-screen flex flex-col rounded-r-3xl shadow-xl ${className}`}>
      <div className="p-8 flex flex-col items-center border-b border-dashed border-slate-200">
        <div className={`${isParent ? 'bg-orange-500' : 'bg-primary'} text-white p-3 rounded-2xl rotate-3 shadow-lg mb-3`}>
          <SchoolIcon className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-display font-black text-slate-700 tracking-tight text-center leading-tight">
          Educa<br/><span className={isParent ? "text-orange-500" : "text-primary"}>Game</span>
        </h1>
      </div>
      <nav className="flex-1 p-6 space-y-3">
        {menuItems.map((item: any) => (
          <button key={item.label} onClick={() => { setView(item.view); playSound('click'); onClose?.(); }}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold ${
              currentView === item.view ? "bg-primary text-white shadow-lg" : "text-slate-500 hover:bg-slate-50"
            }`}>
            <item.icon className="w-6 h-6" /> {item.label}
          </button>
        ))}
      </nav>
      <div className="p-6 mt-auto">
        <Button variant="danger" size="md" className="w-full" onClick={onLogout}><LogOut className="w-4 h-4" /> Sair</Button>
      </div>
    </div>
  );
};

// --- View Components ---

const LoginView = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [tab, setTab] = useState<'student' | 'staff'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      let loginEmail = email;
      let loginPass = password;
      if (tab === 'student') {
        loginEmail = `${email.toLowerCase().replace(/\s/g, '.')}@student.com`;
        loginPass = 'student123';
      }
      const cred = await signInWithEmailAndPassword(auth, loginEmail, loginPass);
      const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
      if (userDoc.exists()) {
        onLogin(userDoc.data() as User);
        playSound('success');
      } else { setError('Perfil não encontrado.'); }
    } catch (e: any) {
      setError('Acesso negado. Verifique os dados ou contate o professor.');
      playSound('error');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] flex items-center justify-center p-4">
      <div className="bg-white rounded-[3rem] shadow-2xl max-w-md w-full p-10">
        <div className="text-center mb-8">
          <div className="bg-primary text-white w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 rotate-3 shadow-lg">
            <Gamepad2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-display font-black text-slate-800">EducaGame</h2>
        </div>
        <div className="flex bg-slate-100 p-2 rounded-2xl mb-8">
           <button onClick={() => setTab('student')} className={`flex-1 py-3 rounded-xl font-black text-sm ${tab === 'student' ? 'bg-white shadow-sm text-primary' : 'text-slate-400'}`}>Aluno</button>
           <button onClick={() => setTab('staff')} className={`flex-1 py-3 rounded-xl font-black text-sm ${tab === 'staff' ? 'bg-white shadow-sm text-primary' : 'text-slate-400'}`}>Adulto</button>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}
          <input className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 font-bold" 
            placeholder={tab === 'student' ? "Seu Nome Completo" : "Seu Email"} value={email} onChange={e => setEmail(e.target.value)} required />
          {tab === 'staff' && <input className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 font-bold" 
            type="password" placeholder="Sua Senha" value={password} onChange={e => setPassword(e.target.value)} required />}
          <Button isLoading={loading} className="w-full py-4 text-xl">Entrar</Button>
        </form>
      </div>
    </div>
  );
};

const QuizPlayer = ({ quiz, student, onComplete, onExit }: any) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const q = quiz.questions[currentIdx];

  const handleAnswer = (idx: number) => {
    if (showFeedback) return;
    const correct = idx === q.correctAnswerIndex;
    if (correct) { setScore(s => s + 10); playSound('success'); } else { playSound('error'); }
    setShowFeedback(true);
  };

  const next = () => {
    setShowFeedback(false);
    if (currentIdx < quiz.questions.length - 1) { setCurrentIdx(i => i + 1); }
    else { setIsFinished(true); onComplete(score); }
  };

  if (isFinished) return (
    <div className="text-center py-20 animate-fade-in relative">
      <Confetti /><Trophy className="w-32 h-32 text-yellow-400 mx-auto mb-6" />
      <h2 className="text-5xl font-black mb-4">Incrível!</h2>
      <p className="text-2xl text-slate-500 mb-8 font-bold">Você ganhou {score} pontos!</p>
      <Button size="lg" onClick={onExit}>Voltar</Button>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto py-10">
      <div className="bg-white rounded-[2.5rem] p-12 shadow-xl border-b-8 border-slate-100">
        <p className="text-slate-400 font-black uppercase text-sm mb-4">Questão {currentIdx + 1} de {quiz.questions.length}</p>
        <h3 className="text-3xl font-display font-black text-slate-800 mb-10">{q.text}</h3>
        <div className="grid gap-4">
          {q.options.map((opt: string, i: number) => (
            <button key={i} onClick={() => handleAnswer(i)}
              className={`p-6 rounded-2xl text-left font-black text-xl border-4 transition-all ${
                showFeedback ? (i === q.correctAnswerIndex ? 'bg-green-500 text-white border-green-600' : 'bg-slate-50 border-slate-100 opacity-50') : 'bg-white border-slate-100 hover:border-primary'
              }`}>
              {opt}
            </button>
          ))}
        </div>
        {showFeedback && <Button onClick={next} className="mt-8 w-full py-4 text-xl">Próxima</Button>}
      </div>
    </div>
  );
};

// --- Educational Management Views ---

const ManageUsersView = ({ currentUser }: any) => {
  const [users, setUsers] = useState<User[]>([]);
  const load = async () => {
    const q = query(collection(db, 'users'), where('role', '==', UserRole.STUDENT));
    const snap = await getDocs(q);
    setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as User)));
  };
  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    const name = prompt("Nome do Aluno:");
    const grade = parseInt(prompt("Série (1-5):") || "1");
    const group = prompt("Turma (Ex: A):");
    if (!name || !group) return;
    try {
      const email = `${name.toLowerCase().replace(/\s/g, '.')}@student.com`;
      const cred = await createUserWithEmailAndPassword(auth, email, 'student123');
      const newUser: User = { id: cred.user.uid, name, email, role: UserRole.STUDENT, grade, classGroup: group, points: 0, level: 1 };
      await setDoc(doc(db, 'users', cred.user.uid), newUser);
      load();
    } catch (e) { alert("Erro ao criar aluno."); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><h2 className="text-3xl font-black">Alunos</h2><Button onClick={handleAdd}><UserPlus /> Matricular Aluno</Button></div>
      <div className="bg-white rounded-[2rem] p-6 shadow-sm">
        {users.map(u => (
          <div key={u.id} className="flex items-center justify-between p-4 border-b last:border-0">
            <div className="flex items-center gap-3"><UserAvatar name={u.name} /><div><p className="font-bold">{u.name}</p><p className="text-xs text-slate-400">{u.grade}º Ano - {u.classGroup}</p></div></div>
            <div className="flex items-center gap-4"><span className="font-black text-primary">{u.points} XP</span><button onClick={async () => { await deleteDoc(doc(db, 'users', u.id)); load(); }} className="text-red-400"><Trash className="w-5 h-5" /></button></div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CreateQuizView = ({ currentUser, onSuccess }: any) => {
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [grade, setGrade] = useState(3);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      const questions = await generateQuizQuestions(subject, 'Médio', topic, grade, 3);
      const quizId = `qz_${Date.now()}`;
      const quiz: Quiz = { id: quizId, title: topic, subject, description: '', difficulty: 'Médio', questions, createdBy: currentUser.id, createdAt: Date.now(), targetGrade: grade };
      await setDoc(doc(db, 'quizzes', quizId), quiz);
      onSuccess();
    } catch (e) { alert("Erro com a IA."); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-10 rounded-[3rem] shadow-xl border-b-8 border-slate-100">
      <h3 className="text-2xl font-black mb-6 flex items-center gap-2"><Sparkles className="text-primary" /> Novo Quiz com IA</h3>
      <div className="space-y-4">
        <input className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 font-bold" 
          placeholder="Tema (Ex: Sistema Solar)" value={topic} onChange={e => setTopic(e.target.value)} />
        <select className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 font-bold" 
          value={subject} onChange={e => setSubject(e.target.value)}>{SUBJECTS.map(s => <option key={s}>{s}</option>)}</select>
        <select className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 font-bold" 
          value={grade} onChange={e => setGrade(parseInt(e.target.value))}>{[1,2,3,4,5].map(g => <option key={g} value={g}>{g}º Ano</option>)}</select>
        <Button className="w-full py-4 text-xl" isLoading={loading} onClick={handleCreate}>Gerar Atividade</Button>
      </div>
    </div>
  );
};

// --- App Root ---

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('LOGIN');
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
        if (userDoc.exists()) {
          const profile = userDoc.data() as User;
          setUser(profile);
          setView(profile.role === UserRole.STUDENT ? 'DASHBOARD_STUDENT' : 'DASHBOARD_STAFF');
        } else { await signOut(auth); setView('LOGIN'); }
      } else { setView('LOGIN'); }
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => { await signOut(auth); setUser(null); setView('LOGIN'); setActiveQuiz(null); };

  const handleQuizComplete = async (score: number) => {
    if (user && activeQuiz) {
      const resId = `res_${Date.now()}`;
      await setDoc(doc(db, 'quizResults', resId), { studentId: user.id, quizId: activeQuiz.id, score, date: Date.now() });
      const newPoints = (user.points || 0) + score;
      const newLevel = Math.floor(newPoints / 100) + 1;
      await updateDoc(doc(db, 'users', user.id), { points: newPoints, level: newLevel });
      setUser({ ...user, points: newPoints, level: newLevel });
    }
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  if (!user) return <LoginView onLogin={setUser} />;
  if (activeQuiz) return <QuizPlayer quiz={activeQuiz} student={user} onComplete={handleQuizComplete} onExit={() => setActiveQuiz(null)} />;

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar currentUser={user} currentView={view} setView={setView} onLogout={handleLogout} />
      <main className="flex-1 p-10 overflow-y-auto">
        {view === 'DASHBOARD_STAFF' && (
          <div className="space-y-8">
            <h2 className="text-4xl font-black text-slate-800">Olá, {user.name}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <Button onClick={() => setView('MANAGE_USERS')} variant="primary" className="h-32 flex-col"><Users /> Alunos</Button>
               <Button onClick={() => setView('CREATE_QUIZ')} variant="secondary" className="h-32 flex-col"><PenTool /> Novo Quiz</Button>
               <Button onClick={() => setView('REPORTS')} variant="success" className="h-32 flex-col"><BarChartIcon /> Relatórios</Button>
               <Button onClick={() => setView('LEADERBOARD')} variant="accent" className="h-32 flex-col"><Trophy /> Ranking</Button>
            </div>
          </div>
        )}
        {view === 'DASHBOARD_STUDENT' && (
          <div className="space-y-8">
             <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border flex items-center justify-between">
                <div><h2 className="text-3xl font-black">Oi, {user.name}!</h2><p className="text-slate-500 font-bold">Nível {user.level} • {user.points} XP</p></div>
                <Trophy className="w-16 h-16 text-yellow-400 shadow-yellow-100" />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <Button onClick={() => setView('GAMES_HUB')} size="lg" className="h-40 text-2xl flex-col bg-pink-500"><Gamepad2 className="w-10 h-10" /> Jogar</Button>
                <Button onClick={() => setView('LEADERBOARD')} size="lg" className="h-40 text-2xl flex-col bg-indigo-500"><Trophy className="w-10 h-10" /> Ranking</Button>
             </div>
             <h3 className="text-xl font-black">Suas Missões</h3>
             <StudentQuizzes grade={user.grade} onPlay={setActiveQuiz} />
          </div>
        )}
        {view === 'MANAGE_USERS' && <ManageUsersView currentUser={user} />}
        {view === 'CREATE_QUIZ' && <CreateQuizView currentUser={user} onSuccess={() => setView('DASHBOARD_STAFF')} />}
        {view === 'REPORTS' && <ReportsView />}
        {view === 'LEADERBOARD' && <LeaderboardView />}
        {view === 'GAMES_HUB' && <div className="text-center py-20 text-slate-300 font-black text-4xl">Em breve mais jogos! 🚧</div>}
      </main>
    </div>
  );
};

const StudentQuizzes = ({ grade, onPlay }: any) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  useEffect(() => {
    const load = async () => {
      const q = query(collection(db, 'quizzes'), where('targetGrade', '==', grade));
      const snap = await getDocs(q);
      setQuizzes(snap.docs.map(d => d.data() as Quiz));
    };
    load();
  }, [grade]);
  return (
    <div className="grid gap-4">
      {quizzes.map(q => (
        <div key={q.id} className="bg-white p-6 rounded-3xl border flex justify-between items-center group hover:border-primary transition-all shadow-sm">
          <div><p className="font-black text-xl">{q.title}</p><p className="text-xs text-slate-400 uppercase font-bold">{q.subject}</p></div>
          <Button onClick={() => onPlay(q)}>Começar <Play className="w-4 h-4 fill-current" /></Button>
        </div>
      ))}
    </div>
  );
};

const LeaderboardView = () => {
  const [students, setStudents] = useState<User[]>([]);
  useEffect(() => {
    const load = async () => {
      const q = query(collection(db, 'users'), where('role', '==', UserRole.STUDENT), orderBy('points', 'desc'), limit(10));
      const snap = await getDocs(q);
      setStudents(snap.docs.map(d => d.data() as User));
    };
    load();
  }, []);
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h2 className="text-3xl font-black text-center mb-8">🏆 Melhores Alunos</h2>
      {students.map((s, i) => (
        <div key={s.id} className="bg-white p-4 rounded-2xl shadow-sm flex items-center gap-4">
          <span className="w-8 font-black text-2xl text-slate-300">#{i+1}</span>
          <UserAvatar name={s.name} />
          <p className="flex-1 font-bold">{s.name}</p>
          <span className="font-black text-primary">{s.points} XP</span>
        </div>
      ))}
    </div>
  );
};

const ReportsView = () => {
  const [results, setResults] = useState<any[]>([]);
  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(collection(db, 'quizResults'));
      setResults(snap.docs.map(d => d.data()));
    };
    load();
  }, []);
  return (
    <div className="bg-white rounded-3xl p-8">
      <h2 className="text-2xl font-black mb-6">Histórico de Atividades</h2>
      <table className="w-full text-left">
        <thead><tr className="text-slate-400 font-black uppercase text-xs"><th>Data</th><th>Aluno</th><th>Pontos</th></tr></thead>
        <tbody>
          {results.map((r, i) => (
            <tr key={i} className="border-t">
              <td className="py-4">{new Date(r.date).toLocaleDateString()}</td>
              <td className="py-4 font-bold">{r.studentId.substring(0,8)}...</td>
              <td className="py-4 font-black text-success">{r.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default App;
