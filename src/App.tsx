import React, { useState, useEffect } from 'react';
import { User, UserRole, ViewState, Quiz, QuizResult, SUBJECTS, Question } from './types';
import { dataService } from './services/dataService';
import { generateQuizQuestions } from './services/geminiService';
import { Button } from './components/Button';
import { 
  Users, 
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
  FileText, 
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

// --- Helper Utilities ---
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const getQuizTheme = (grade: number) => ({ isChild: true, container: "bg-[#FFFBEB] border-yellow-300", text: "font-display text-3xl", optionBtn: "py-6 px-6 rounded-3xl text-xl border-b-8 active:border-b-0 active:translate-y-2", successColor: "bg-green-400 text-white", errorColor: "bg-red-400 text-white", neutralColor: "bg-white border-slate-200 text-slate-700 hover:bg-blue-50", layout: "grid-cols-1 gap-6", illustration: true });

// --- Procedural Sound Utility ---
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
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1); // A5
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'error') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.2);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'win') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.1);
      osc.frequency.setValueAtTime(783.99, now + 0.2);
      osc.frequency.setValueAtTime(1046.50, now + 0.3);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.6);
    } else if (type === 'step') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400 + (Math.random() * 200), now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    }
  } catch (e) {
    console.warn("Audio context error", e);
  }
};

// --- Components ---

const Confetti = () => {
  const [particles, setParticles] = useState<Array<{id: number, left: number, delay: number, color: string, size: number}>>([]);

  useEffect(() => {
    const colors = ['text-yellow-400', 'text-primary', 'text-accent', 'text-green-400', 'text-blue-400'];
    const newParticles = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 20 + 10
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className={`absolute -top-10 animate-fall ${p.color}`}
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            width: p.size,
            height: p.size
          }}
        >
          <Star className="fill-current w-full h-full" />
        </div>
      ))}
    </div>
  );
};

const Sidebar = ({ currentUser, setView, currentView, onLogout, className = "", onClose }: { currentUser: User, setView: (v: ViewState) => void, currentView: ViewState, onLogout: () => void, className?: string, onClose?: () => void }) => {
  const isParent = currentUser.role === UserRole.PARENT;
  const isStaff = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.TEACHER || isParent;

  let menuItems = [];
  if (isParent) {
     menuItems = [
        { show: true, label: 'Nossa Casa', icon: Home, view: 'DASHBOARD_STAFF' },
        { show: true, label: 'Meus Filhos', icon: Baby, view: 'MANAGE_USERS' },
        { show: true, label: 'Relatórios', icon: BarChartIcon, view: 'REPORTS' },
        { show: true, label: 'Criar Tarefa', icon: Sparkles, view: 'CREATE_QUIZ' },
        { show: true, label: 'Atividades', icon: Library, view: 'MANAGE_QUIZZES' }, 
        { show: false, label: '', icon: Trophy, view: 'LEADERBOARD' }, 
     ];
  } else if (isStaff) {
     menuItems = [
        { show: true, label: 'Sala dos Professores', icon: LayoutDashboard, view: 'DASHBOARD_STAFF' },
        { show: true, label: 'Diário de Classe', icon: ClipboardList, view: 'MANAGE_USERS' },
        { show: true, label: 'Matricular Aluno', icon: UserPlus, view: 'ENROLL_STUDENT' },
        { show: true, label: 'Turmas', icon: Grid3X3, view: 'MANAGE_CLASSES' },
        { show: true, label: 'Relatórios', icon: BarChartIcon, view: 'REPORTS' },
        { show: true, label: 'Atividades', icon: Library, view: 'MANAGE_QUIZZES' },
        { show: true, label: 'Planejamento', icon: PenTool, view: 'CREATE_QUIZ' },
        { show: true, label: 'Ranking', icon: Trophy, view: 'LEADERBOARD' },
     ];
  } else {
     menuItems = [
        { show: true, label: 'Meu Painel', icon: Gamepad2, view: 'DASHBOARD_STUDENT' },
        { show: true, label: 'Minigames', icon: Puzzle, view: 'GAMES_HUB' },
        { show: false, label: '', icon: Users, view: 'MANAGE_USERS' },
        { show: false, label: '', icon: PenTool, view: 'CREATE_QUIZ' },
        { show: true, label: 'Minhas Conquistas', icon: Trophy, view: 'LEADERBOARD' },
     ];
  }

  const getRoleLabel = (role: UserRole) => {
    switch(role) {
        case UserRole.ADMIN: return 'Direção';
        case UserRole.TEACHER: return 'Professor(a)';
        case UserRole.PARENT: return 'Responsável';
        default: return `${currentUser.grade}º Ano`;
    }
  }

  const activeColor = isParent ? "bg-orange-500 text-white shadow-orange-200" : "bg-primary text-white shadow-primary/30";
  const hoverColor = isParent ? "hover:bg-orange-50 hover:text-orange-600" : "hover:bg-slate-50 hover:text-primary";
  const iconBg = isParent ? 'bg-orange-500' : 'bg-primary';

  return (
    <div className={`w-[85vw] md:w-72 bg-white border-r-4 ${isParent ? 'border-orange-100' : 'border-slate-100'} h-screen flex flex-col rounded-r-3xl shadow-xl ${className}`}>
      <div className="p-8 flex flex-col items-center border-b border-dashed border-slate-200 relative">
        {onClose && (
            <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 md:hidden bg-slate-50 rounded-full">
                <X className="w-6 h-6" />
            </button>
        )}
        <div className={`${iconBg} text-white p-3 rounded-2xl rotate-3 shadow-lg mb-3 transition-colors`}>
          {isParent ? <Heart className="w-10 h-10 fill-current" /> : <SchoolIcon className="w-10 h-10" />}
        </div>
        <h1 className="text-2xl font-display font-black text-slate-700 tracking-tight text-center leading-tight">
          Educa<br/><span className={isParent ? "text-orange-500" : "text-primary"}>Game</span>
        </h1>
        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-2">Séries Iniciais</p>
      </div>

      <nav className="flex-1 p-6 space-y-3 overflow-y-auto">
        {menuItems.filter(item => item.show).map((item) => (
          <button
            key={item.label}
            onClick={() => { setView(item.view as ViewState); playSound('click'); onClose?.(); }}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-200 font-bold text-base md:text-lg ${
              currentView === item.view 
                ? `${activeColor} shadow-lg scale-105` 
                : `text-slate-500 ${hoverColor}`
            }`}
          >
            <item.icon className={`w-6 h-6 ${currentView === item.view ? 'animate-bounce' : ''}`} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-6 mt-auto">
        <div className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-500 flex-shrink-0">
             {currentUser.name.substring(0,2).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-display font-bold text-slate-800 truncate">{currentUser.name}</p>
            <p className="text-xs font-bold text-slate-400 truncate uppercase">
              {getRoleLabel(currentUser.role)}
            </p>
          </div>
        </div>
        <Button variant="danger" size="md" className="w-full text-sm" onClick={onLogout}>
          <LogOut className="w-4 h-4" /> Sair
        </Button>
      </div>
    </div>
  );
};

const DashboardQuickAction = ({ icon: Icon, label, colorClass, onClick }: { icon: any, label: string, colorClass: string, onClick: () => void }) => (
    <button 
        onClick={onClick}
        className={`bg-white p-4 rounded-2xl border shadow-sm flex flex-col items-center justify-center gap-3 hover:-translate-y-1 transition-all active:scale-95 min-h-[110px] group`}
    >
        <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10 group-hover:bg-opacity-20 transition-colors`}>
            <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
        </div>
        <span className="font-bold text-xs md:text-sm text-slate-600 text-center leading-tight">{label}</span>
    </button>
);

const UserAvatar = ({ name, colorClass = "bg-primary" }: { name: string, colorClass?: string }) => (
    <div className={`w-10 h-10 rounded-full ${colorClass} text-white flex items-center justify-center font-black text-sm shadow-sm`}>
        {name ? name.substring(0, 2).toUpperCase() : '?'}
    </div>
);

// --- Math Memory Game Component ---
// ... (Memory Game Code remains the same)
interface MemoryCard {
  id: string;
  value: string; 
  matchId: number; 
  isFlipped: boolean;
  isMatched: boolean;
  type: 'equation' | 'result';
}

const MathMemoryGame = ({ onExit, grade = 1 }: { onExit: () => void, grade: number }) => {
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<MemoryCard[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [gameWon, setGameWon] = useState(false);

  useEffect(() => {
    startNewGame();
  }, []);

  const generateEquations = (level: number) => {
    const pairs: { eq: string, res: string, id: number }[] = [];
    const usedEqs = new Set<string>();
    const usedResults = new Set<string>();

    while (pairs.length < 6) {
        let a, b, result, eqStr;
        if (level === 1) {
            if (Math.random() > 0.5) { a = getRandomInt(1, 10); b = getRandomInt(1, 5); result = a + b; eqStr = `${a} + ${b}`; }
            else { a = getRandomInt(5, 10); b = getRandomInt(1, 4); result = a - b; eqStr = `${a} - ${b}`; }
        } else if (level === 2) {
            if (Math.random() > 0.5) { a = getRandomInt(10, 40); b = getRandomInt(5, 20); result = a + b; eqStr = `${a} + ${b}`; }
            else { a = getRandomInt(20, 50); b = getRandomInt(5, 15); result = a - b; eqStr = `${a} - ${b}`; }
        } else if (level === 3) { a = getRandomInt(2, 6); b = getRandomInt(2, 9); result = a * b; eqStr = `${a} x ${b}`; }
        else if (level === 4) {
            if (Math.random() > 0.5) { a = getRandomInt(6, 9); b = getRandomInt(4, 9); result = a * b; eqStr = `${a} x ${b}`; }
            else { b = getRandomInt(2, 6); result = getRandomInt(3, 9); a = b * result; eqStr = `${a} ÷ ${b}`; }
        } else {
            const op = Math.random();
            if (op < 0.33) { a = getRandomInt(50, 100); b = getRandomInt(20, 50); if (Math.random() > 0.5) { result = a + b; eqStr = `${a} + ${b}`; } else { result = a - b; eqStr = `${a} - ${b}`; } }
            else if (op < 0.66) { a = getRandomInt(7, 12); b = getRandomInt(6, 12); result = a * b; eqStr = `${a} x ${b}`; }
            else { b = getRandomInt(4, 10); result = getRandomInt(5, 15); a = b * result; eqStr = `${a} ÷ ${b}`; }
        }

        const resStr = String(result);
        if (!usedEqs.has(eqStr) && !usedResults.has(resStr)) {
            usedEqs.add(eqStr);
            usedResults.add(resStr);
            pairs.push({ eq: eqStr, res: resStr, id: pairs.length });
        }
    }
    return pairs;
  };

  const startNewGame = () => {
    const equations = generateEquations(grade);
    const deck: MemoryCard[] = [];
    const ts = Date.now();
    equations.forEach((item, index) => {
      deck.push({ id: `eq-${ts}-${index}`, value: item.eq, matchId: item.id, isFlipped: false, isMatched: false, type: 'equation' });
      deck.push({ id: `res-${ts}-${index}`, value: item.res, matchId: item.id, isFlipped: false, isMatched: false, type: 'result' });
    });
    setCards(deck.sort(() => Math.random() - 0.5));
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setGameWon(false);
    playSound('click');
  };

  const handleCardClick = (card: MemoryCard) => {
    if (flippedCards.length === 2 || card.isFlipped || card.isMatched || gameWon) return;
    playSound('step');
    const newFlipped = [...flippedCards, card];
    const updatedCards = cards.map(c => c.id === card.id ? { ...c, isFlipped: true } : c);
    setCards(updatedCards);
    setFlippedCards(newFlipped);
    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      checkForMatch(newFlipped, updatedCards);
    }
  };

  const checkForMatch = (currentFlipped: MemoryCard[], currentCards: MemoryCard[]) => {
    const [card1, card2] = currentFlipped;
    const isMatch = card1.matchId === card2.matchId;
    if (isMatch) {
      setTimeout(() => {
        playSound('success');
        const matchedCards = currentCards.map(c => c.id === card1.id || c.id === card2.id ? { ...c, isMatched: true, isFlipped: true } : c);
        setCards(matchedCards);
        setFlippedCards([]);
        setMatches(m => {
          const nm = m + 1;
          if (nm === 6) { setGameWon(true); playSound('win'); }
          return nm;
        });
      }, 500);
    } else {
      setTimeout(() => {
        playSound('error');
        const resetCards = currentCards.map(c => c.id === card1.id || c.id === card2.id ? { ...c, isFlipped: false } : c);
        setCards(resetCards);
        setFlippedCards([]);
      }, 1000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
         <div className="flex items-center gap-4">
             <Button variant="outline" size="sm" onClick={onExit}><ArrowLeft className="w-4 h-4" /> Voltar</Button>
             <h2 className="text-lg md:text-xl font-display font-black text-slate-800 flex items-center gap-2">
                 <Calculator className="w-6 h-6 text-primary" /> <span className="hidden md:inline">Memória da Matemática</span><span className="md:hidden">Memória</span> ({grade}º)
             </h2>
         </div>
         <div className="flex gap-4 font-bold text-slate-500 text-sm md:text-base">
             <span>Jogadas: {moves}</span>
             <Button variant="secondary" size="sm" onClick={startNewGame}><RotateCcw className="w-4 h-4" /> <span className="hidden sm:inline">Reiniciar</span></Button>
         </div>
      </div>
      {gameWon && <Confetti />}
      <div className="bg-indigo-50 p-4 md:p-8 rounded-[2rem] border-4 border-indigo-200 relative">
        {gameWon && (
            <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm rounded-[1.8rem] flex flex-col items-center justify-center animate-in fade-in zoom-in">
                <Trophy className="w-24 h-24 text-yellow-400 mb-4 drop-shadow-lg" />
                <h3 className="text-4xl font-display font-black text-slate-800 mb-2">Incrível!</h3>
                <p className="text-slate-500 font-bold text-lg mb-6">Você completou em {moves} jogadas.</p>
                <Button variant="primary" size="lg" onClick={startNewGame}>Jogar Novamente</Button>
            </div>
        )}
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2 md:gap-4">
            {cards.map(card => (
                <div key={card.id} onClick={() => handleCardClick(card)}
                    className={`aspect-square cursor-pointer rounded-2xl flex items-center justify-center text-lg sm:text-2xl font-black transition-all duration-500 transform perspective-1000 ${
                        card.isFlipped || card.isMatched ? (card.type === 'result' ? 'bg-white text-primary border-4 border-primary rotate-y-180' : 'bg-white text-secondaryDark border-4 border-secondary rotate-y-180') : 'bg-gradient-to-br from-primary to-primaryDark text-white shadow-lg hover:scale-105 border-4 border-white/20'
                    } ${card.isMatched ? 'opacity-50 scale-95 ring-4 ring-green-400 border-transparent' : ''}`}
                >
                    <div className="backface-hidden">{(card.isFlipped || card.isMatched) ? card.value : <Brain className="w-6 h-6 md:w-8 md:h-8 opacity-50" />}</div>
                </div>
            ))}
        </div>
      </div>
       <p className="text-center text-slate-400 font-bold text-xs md:text-sm">Encontre os pares: A conta (Ex: 2+2) e o resultado (Ex: 4)!</p>
    </div>
  );
};

// ... (Other Mini-games remain unchanged: SequenceGame, SpeedMathGame, TicTacToeGame)
const SequenceGame = ({ onExit, grade = 1 }: { onExit: () => void, grade: number }) => {
    const [sequence, setSequence] = useState<number[]>([]);
    const [userStep, setUserStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [highlighted, setHighlighted] = useState<number | null>(null);
    const [message, setMessage] = useState("Clique em Iniciar!");
    const [gameOver, setGameOver] = useState(false);
    const speed = Math.max(250, 900 - (grade * 120)); 
    const colors = [
        { id: 0, color: 'bg-red-400', active: 'bg-red-200 ring-8 ring-red-400', icon: Zap },
        { id: 1, color: 'bg-green-400', active: 'bg-green-200 ring-8 ring-green-400', icon: Layers },
        { id: 2, color: 'bg-blue-400', active: 'bg-blue-200 ring-8 ring-blue-400', icon: Star },
        { id: 3, color: 'bg-yellow-400', active: 'bg-yellow-200 ring-8 ring-yellow-400', icon: Circle }
    ];
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
    const playSequence = async (seq: number[]) => {
        setIsPlaying(true); setMessage("Observe..."); await sleep(500);
        for (let i = 0; i < seq.length; i++) {
            setHighlighted(seq[i]); playSound('step'); await sleep(speed); setHighlighted(null); await sleep(150);
        }
        setIsPlaying(false); setMessage("Sua vez!");
    };
    const startGame = () => {
        setSequence([Math.floor(Math.random() * 4)]); setUserStep(0); setGameOver(false); playSound('click');
    };
    useEffect(() => { 
        if (sequence.length > 0 && !gameOver) { 
            playSequence(sequence); 
        } 
    }, [sequence, gameOver]);

    const handleColorClick = (id: number) => {
        if (isPlaying || gameOver || sequence.length === 0) return;
        setHighlighted(id); setTimeout(() => setHighlighted(null), 200);
        if (id === sequence[userStep]) {
            playSound('step');
            if (userStep === sequence.length - 1) {
                setMessage("Muito bem! Próximo nível..."); playSound('success'); setUserStep(0);
                setTimeout(() => { setSequence([...sequence, Math.floor(Math.random() * 4)]); }, 1000);
            } else { setUserStep(s => s + 1); }
        } else { setGameOver(true); playSound('error'); setMessage("Ops! Errou a sequência."); }
    };
    return (
        <div className="max-w-lg mx-auto flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-8">
                 <Button variant="outline" size="sm" onClick={onExit}><ArrowLeft className="w-4 h-4" /> Sair</Button>
                 <h2 className="text-xl md:text-2xl font-display font-black text-slate-800">Mestre da Sequência</h2>
            </div>
            <div className="bg-white p-8 rounded-[3rem] shadow-xl border-b-8 border-slate-100 flex flex-col items-center relative overflow-hidden w-full">
                <div className="mb-6 font-bold text-lg md:text-xl text-center text-slate-600 bg-slate-100 px-6 py-2 rounded-full min-w-[200px]">{gameOver ? `Game Over! Nível: ${sequence.length}` : message}</div>
                <p className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-widest">Nível: {grade}º Ano ({speed}ms)</p>
                <div className="grid grid-cols-2 gap-4">
                    {colors.map(c => (
                        <button key={c.id} onClick={() => handleColorClick(c.id)}
                            className={`w-28 h-28 md:w-32 md:h-32 rounded-3xl transition-all duration-200 flex items-center justify-center ${highlighted === c.id ? c.active : c.color} shadow-lg active:scale-95`}
                        >
                            <c.icon className={`w-10 h-10 md:w-12 md:h-12 text-white/50 ${highlighted === c.id ? 'scale-125 text-white' : ''}`} />
                        </button>
                    ))}
                </div>
                {(gameOver || sequence.length === 0) && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-[3rem]">
                        <Button onClick={startGame} size="lg" variant="primary" className="shadow-xl">
                            {gameOver ? <RotateCcw className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                            {gameOver ? 'Tentar de Novo' : 'Começar Jogo'}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

const SpeedMathGame = ({ onExit, grade = 1 }: { onExit: () => void, grade: number }) => {
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [problem, setProblem] = useState<{q: string, a: number, opts: number[]}>({q: '', a: 0, opts: []});
    const [gameActive, setGameActive] = useState(false);
    const [feedback, setFeedback] = useState<'CORRECT' | 'WRONG' | null>(null);

    const generateProblem = () => {
        let type = 'ADD';
        if (grade === 1) type = Math.random() > 0.7 ? 'SUB' : 'ADD';
        else if (grade === 2) type = Math.random() > 0.5 ? 'SUB' : 'ADD';
        else if (grade === 3) type = Math.random() > 0.5 ? 'MUL' : (Math.random() > 0.5 ? 'ADD' : 'SUB');
        else if (grade === 4) type = Math.random() > 0.4 ? 'MUL' : (Math.random() > 0.4 ? 'DIV' : 'SUB');
        else type = 'MIXED';

        let a, b, q, ans;
        if (type === 'MIXED') {
            const r = Math.random();
            if(r < 0.2) type = 'ADD'; else if(r < 0.4) type = 'SUB'; else if(r < 0.7) type = 'MUL'; else type = 'DIV'; 
        }

        if (type === 'ADD') {
            const max = grade === 1 ? 15 : (grade === 2 ? 40 : (grade * 30)); 
            a = Math.floor(Math.random() * max) + 1; b = Math.floor(Math.random() * max) + 1; q = `${a} + ${b}`; ans = a + b;
        } else if (type === 'SUB') {
            const max = grade === 1 ? 15 : (grade === 2 ? 40 : (grade * 30));
            a = Math.floor(Math.random() * max) + 10; b = Math.floor(Math.random() * (a - 1)) + 1; q = `${a} - ${b}`; ans = a - b;
        } else if (type === 'MUL') {
            const maxVal = grade === 3 ? 5 : (grade === 4 ? 9 : 12);
            a = Math.floor(Math.random() * (maxVal - 1)) + 2; b = Math.floor(Math.random() * 9) + 2; q = `${a} x ${b}`; ans = a * b;
        } else {
            const divAns = grade === 4 ? getRandomInt(2, 9) : getRandomInt(3, 12);
            const divisor = grade === 4 ? getRandomInt(2, 5) : getRandomInt(2, 9);
            const dividend = divAns * divisor; q = `${dividend} ÷ ${divisor}`; ans = divAns;
        }

        const opts = new Set([ans as number]);
        while(opts.size < 3) {
            const offset = Math.floor(Math.random() * 5) + 1; const sign = Math.random() > 0.5 ? 1 : -1;
            const fake = (ans as number) + (offset * sign); if(fake > 0) opts.add(fake); 
        }
        setProblem({ q, a: ans as number, opts: Array.from(opts).sort(() => Math.random() - 0.5) });
    };

    useEffect(() => {
        let timer: any;
        if (gameActive && timeLeft > 0) { timer = setInterval(() => setTimeLeft(t => t - 1), 1000); }
        else if (timeLeft === 0) { setGameActive(false); if (score > 0) playSound('win'); }
        return () => clearInterval(timer);
    }, [gameActive, timeLeft, score]);

    const startGame = () => { setScore(0); setTimeLeft(30); setGameActive(true); playSound('click'); generateProblem(); };
    const handleAnswer = (val: number) => {
        if (!gameActive) return;
        if (val === problem.a) { setScore(s => s + 10); setFeedback('CORRECT'); playSound('success'); setTimeout(() => { setFeedback(null); generateProblem(); }, 300); }
        else { setFeedback('WRONG'); playSound('error'); setTimeout(() => { setFeedback(null); generateProblem(); }, 300); }
    };

    return (
        <div className="max-w-lg mx-auto flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-8">
                 <Button variant="outline" size="sm" onClick={onExit}><ArrowLeft className="w-4 h-4" /> Sair</Button>
                 <h2 className="text-xl md:text-2xl font-display font-black text-slate-800">Desafio da Tabuada</h2>
            </div>
            <div className={`bg-white p-8 rounded-[3rem] shadow-xl border-b-8 border-slate-100 w-full flex flex-col items-center relative overflow-hidden transition-colors duration-300 ${feedback === 'CORRECT' ? 'bg-green-50' : feedback === 'WRONG' ? 'bg-red-50' : ''}`}>
                {!gameActive ? (
                    <div className="text-center py-10">
                        <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
                        <h3 className="text-3xl font-black text-slate-800 mb-2">{timeLeft === 0 ? 'Fim de Jogo!' : 'Preparado?'}</h3>
                        <p className="text-slate-500 font-bold mb-6">{timeLeft === 0 ? `Pontuação Final: ${score}` : `Resolva contas de nível ${grade}º Ano!`}</p>
                        <Button onClick={startGame} size="lg" variant="secondary" className="shadow-lg">{timeLeft === 0 ? 'Jogar Novamente' : 'Começar!'}</Button>
                    </div>
                ) : (
                    <>
                        <div className="w-full flex justify-between mb-8">
                            <div className="bg-slate-100 px-4 py-2 rounded-xl font-black text-slate-500 flex items-center gap-2"><Timer className="w-5 h-5" /> {timeLeft}s</div>
                            <div className="bg-indigo-100 px-4 py-2 rounded-xl font-black text-indigo-600">{score} pts</div>
                        </div>
                        <div className="mb-10 text-center"><span className="text-6xl font-display font-black text-slate-800">{problem.q}</span></div>
                        <div className="grid grid-cols-3 gap-4 w-full">
                            {problem.opts.map((opt, i) => (
                                <button key={i} onClick={() => handleAnswer(opt)}
                                    className="h-20 rounded-2xl bg-white border-b-4 border-slate-200 font-black text-xl md:text-2xl text-slate-700 hover:-translate-y-1 hover:border-b-8 active:translate-y-1 active:border-b-0 transition-all shadow-md hover:shadow-lg hover:text-primary"
                                >{opt}</button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const ticTacToeAISmarts = (board: (string | null)[], symbol: string, grade: number) => {
  const opponentSymbol = symbol === 'X' ? 'O' : 'X';
  const checkWinner = (squares: (string | null)[]) => {
    const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    for (const [a, b, c] of lines) { if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) return squares[a]; }
    if (squares.every(s => s !== null)) return 'draw';
    return null;
  };
  const minimax = (tempBoard: (string | null)[], depth: number, isMaximizing: boolean): number => {
    const result = checkWinner(tempBoard);
    if (result === symbol) return 10 - depth; if (result === opponentSymbol) return depth - 10; if (result === 'draw') return 0;
    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) { if (!tempBoard[i]) { tempBoard[i] = symbol; const score = minimax(tempBoard, depth + 1, false); tempBoard[i] = null; bestScore = Math.max(score, bestScore); } }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 9; i++) { if (!tempBoard[i]) { tempBoard[i] = opponentSymbol; const score = minimax(tempBoard, depth + 1, true); tempBoard[i] = null; bestScore = Math.min(score, bestScore); } }
      return bestScore;
    }
  };
  const availableMoves = board.map((s, i) => s === null ? i : null).filter(v => v !== null) as number[];
  const randomnessFactor = Math.max(0, 1 - (grade * 0.2)); 
  if (Math.random() < randomnessFactor && availableMoves.length > 0) { return availableMoves[Math.floor(Math.random() * availableMoves.length)]; }
  for (const move of availableMoves) { const b = [...board]; b[move] = symbol; if (checkWinner(b) === symbol) return move; }
  for (const move of availableMoves) { const b = [...board]; b[move] = opponentSymbol; if (checkWinner(b) === opponentSymbol) return move; }
  let bestScore = -Infinity; let move = availableMoves[0];
  for (const i of availableMoves) { const tempBoard = [...board]; tempBoard[i] = symbol; const score = minimax(tempBoard, 0, false); if (score > bestScore) { bestScore = score; move = i; } }
  return move;
};

const TicTacToeGame = ({ onExit, grade = 1 }: { onExit: () => void, grade: number }) => {
    const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
    const [xIsNext, setXIsNext] = useState(true); 
    const [winner, setWinner] = useState<string | null>(null);
    const [isDraw, setIsDraw] = useState(false);
    const [isAITurn, setIsAITurn] = useState(false);
    const calculateWinner = (squares: (string | null)[]) => {
        const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
        for (let i = 0; i < lines.length; i++) { const [a, b, c] = lines[i]; if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) return squares[a]; }
        return null;
    };
    const handleBoardUpdate = (newBoard: (string | null)[], player: 'X' | 'O') => {
      setBoard(newBoard);
      const w = calculateWinner(newBoard);
      if (w) { setWinner(w); if (w === 'X') playSound('win'); else playSound('error'); }
      else if (newBoard.every(square => square !== null)) { setIsDraw(true); playSound('click'); }
      else { setXIsNext(prev => !prev); }
    };
    const handleClick = (i: number) => { if (winner || board[i] || isDraw || isAITurn) return; playSound('step'); const newBoard = [...board]; newBoard[i] = 'X'; handleBoardUpdate(newBoard, 'X'); };
    useEffect(() => {
      if (!xIsNext && !winner && !isDraw) {
        setIsAITurn(true);
        const timer = setTimeout(() => {
          const aiMove = ticTacToeAISmarts(board, 'O', grade);
          const newBoard = [...board]; newBoard[aiMove] = 'O'; playSound('step'); handleBoardUpdate(newBoard, 'O'); setIsAITurn(false);
        }, 600); 
        return () => clearTimeout(timer);
      }
    }, [xIsNext, winner, isDraw, board, grade]);
    const resetGame = () => { setBoard(Array(9).fill(null)); setXIsNext(true); setWinner(null); setIsDraw(false); setIsAITurn(false); playSound('click'); };
    const status = winner ? `Vencedor: ${winner === 'X' ? 'Você' : 'EducaIA'}!` : isDraw ? 'Empate! Deu velha!' : isAITurn ? 'EducaIA pensando...' : 'Sua vez (X)';
    return (
        <div className="max-w-lg mx-auto flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-8">
                 <Button variant="outline" size="sm" onClick={onExit}><ArrowLeft className="w-4 h-4" /> Sair</Button>
                 <h2 className="text-2xl font-display font-black text-slate-800">Jogo da Velha vs IA</h2>
            </div>
            {(winner || isDraw) && <Confetti />}
            <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border-b-8 border-slate-100 w-full aspect-square flex flex-col items-center justify-center relative">
                 {(winner || isDraw) && (
                    <div className="absolute inset-0 z-10 bg-white/90 rounded-[2rem] flex flex-col items-center justify-center animate-in fade-in">
                        {winner === 'X' ? (<Trophy className="w-20 h-20 text-yellow-400 mb-2" />) : winner === 'O' ? (<div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-2"><Zap className="w-10 h-10 text-red-500" /></div>) : (<div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-2"><span className="text-4xl">🤝</span></div>)}
                        <h3 className="text-3xl font-black text-slate-800 mb-4">{winner === 'X' ? 'Você Ganhou!' : winner === 'O' ? 'A IA Ganhou!' : 'Empate!'}</h3>
                        <Button onClick={resetGame} variant="primary">Jogar de Novo</Button>
                    </div>
                 )}
                 <div className={`mb-4 font-bold px-4 py-2 rounded-full ${isDraw ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-100 text-slate-500'}`}>{status}</div>
                 <div className="grid grid-cols-3 gap-3 w-full h-full p-2">
                    {board.map((square, i) => (
                        <button key={i} disabled={isAITurn || !!winner || !!isDraw} onClick={() => handleClick(i)}
                            className={`rounded-2xl font-black text-5xl flex items-center justify-center transition-all ${square === 'X' ? 'bg-blue-100 text-blue-500' : square === 'O' ? 'bg-pink-100 text-pink-500' : 'bg-slate-50 hover:bg-slate-100 text-transparent'} ${isAITurn ? 'cursor-wait' : ''}`}
                        >{square === 'X' && <X className="w-12 h-12" />}{square === 'O' && <Circle className="w-10 h-10" />}{!square && '.'}</button>
                    ))}
                 </div>
            </div>
            <p className="mt-6 text-center text-slate-400 font-bold text-sm max-w-xs">Sua IA está no nível {grade}º Ano. Quanto maior o seu ano, mais difícil ela joga!</p>
        </div>
    );
};

const GamesHubView = ({ onSelectGame }: { onSelectGame: (game: string) => void }) => {
    const games = [
        { id: 'math-memory', title: 'Memória Matemática', desc: 'Some e subtraia para achar os pares!', icon: Calculator, color: 'bg-indigo-500' },
        { id: 'tic-tac-toe', title: 'Jogo da Velha', desc: 'Desafie a IA inteligente!', icon: Grid3X3, color: 'bg-pink-500' },
        { id: 'sequence-master', title: 'Mestre da Sequência', desc: 'Repita as cores na ordem certa!', icon: Zap, color: 'bg-yellow-500' },
        { id: 'speed-math', title: 'Desafio da Tabuada', desc: 'Resolva contas contra o relógio!', icon: Timer, color: 'bg-green-500' }
    ];
    return (
        <div className="space-y-8">
            <div className="text-center space-y-2"><h2 className="text-3xl md:text-4xl font-display font-black text-slate-800">Minigames Racha Cuca</h2><p className="text-slate-500 font-bold text-base md:text-lg">Divirta-se enquanto treina seu cérebro!</p></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {games.map(game => (
                    <div key={game.id} onClick={() => { onSelectGame(game.id); playSound('click'); }} className="bg-white rounded-[2.5rem] p-2 border-b-8 border-slate-100 cursor-pointer hover:-translate-y-2 transition-all duration-300 group shadow-sm hover:shadow-xl">
                        <div className={`h-32 md:h-40 rounded-[2rem] ${game.color} flex items-center justify-center relative overflow-hidden`}>
                            <game.icon className="w-16 h-16 md:w-20 md:h-20 text-white opacity-80 group-hover:scale-110 transition-transform duration-500" />
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                            <div className="absolute bottom-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-white text-xs font-black">JOGAR</div>
                        </div>
                        <div className="p-6 text-center"><h3 className="text-2xl font-display font-black text-slate-800 mb-2">{game.title}</h3><p className="text-slate-400 font-bold text-sm">{game.desc}</p></div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const LoginView = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [tab, setTab] = useState<'student' | 'staff'>('student');
  const [staffRoleType, setStaffRoleType] = useState<'TEACHER' | 'PARENT'>('TEACHER');
  const [error, setError] = useState('');
  const [studentName, setStudentName] = useState('');
  const [grade, setGrade] = useState(1);
  const [classGroup, setClassGroup] = useState(''); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const availableClasses = dataService.getClasses();
  const handleStudentLogin = () => {
    const users = dataService.getUsers();
    const found = users.find(u => u.role === UserRole.STUDENT && u.name.toLowerCase().trim() === studentName.toLowerCase().trim() && u.grade === grade && u.classGroup === classGroup);
    if (found) { playSound('success'); onLogin(found); } else { playSound('error'); setError('Aluno não encontrado! Verifique se selecionou a turma correta.'); }
  };
  const handleStaffLogin = () => {
    const users = dataService.getUsers();
    const found = users.find(u => (u.role === UserRole.ADMIN || u.role === UserRole.TEACHER || u.role === UserRole.PARENT) && (u.email === email || u.name === email) && u.password === password);
    if (found) { playSound('success'); onLogin(found); } else { playSound('error'); setError('Credenciais inválidas. Verifique email e senha.'); }
  };
  const handleStaffRegister = () => {
    if (!regName || !regEmail || !regPassword) { setError('Preencha todos os campos.'); return; }
    const users = dataService.getUsers(); if (users.find(u => u.email === regEmail)) { setError('Este email já está cadastrado.'); return; }
    const newUser: User = { id: `staff-${Date.now()}`, name: regName, email: regEmail, password: regPassword, role: staffRoleType === 'PARENT' ? UserRole.PARENT : UserRole.TEACHER };
    dataService.saveUser(newUser); playSound('success'); onLogin(newUser);
  };
  const filteredClasses = availableClasses.filter(c => c.grade === grade);
  return (
    <div className="min-h-screen bg-[#F0F9FF] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-300 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-pink-300 rounded-full blur-3xl opacity-50"></div>
      <div className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl max-w-lg w-full border-b-8 border-slate-100 relative z-10 overflow-hidden">
        <div className="bg-slate-50 p-2 flex gap-2 m-4 mb-0 rounded-2xl border border-slate-100">
          <button onClick={() => { setTab('student'); setError(''); setIsRegistering(false); playSound('click'); }} className={`flex-1 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${tab === 'student' ? 'bg-white shadow-md text-primary' : 'text-slate-400 hover:bg-white/50'}`}><Baby className="w-5 h-5" /> Sou Aluno</button>
          <button onClick={() => { setTab('staff'); setError(''); playSound('click'); }} className={`flex-1 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${tab === 'staff' ? 'bg-white shadow-md text-secondaryDark' : 'text-slate-400 hover:bg-white/50'}`}><SchoolIcon className="w-5 h-5" /> Sou Adulto</button>
        </div>
        <div className="p-6 md:p-10 pt-6">
          <div className="text-center mb-6">
            <div className={`w-20 h-20 mx-auto rounded-[1.5rem] flex items-center justify-center mb-4 shadow-lg rotate-3 ${tab === 'student' ? 'bg-primary' : 'bg-secondary'}`}>{tab === 'student' ? <Gamepad2 className="w-10 h-10 text-white" /> : <Lock className="w-10 h-10 text-white" />}</div>
            <h1 className="text-3xl font-display font-black text-slate-800">{tab === 'student' ? 'Hora de Aprender!' : (isRegistering ? 'Criar Conta' : 'Acesso Restrito')}</h1>
            <p className="text-slate-500 font-bold mt-2">{tab === 'student' ? 'Plataforma para o Ensino Fundamental.' : (isRegistering ? 'Preencha os dados abaixo.' : 'Área para Pais e Professores.')}</p>
          </div>
          {error && <div className="bg-red-50 text-red-500 p-4 rounded-2xl font-bold text-center mb-6 text-sm border border-red-100 animate-bounce">{error}</div>}
          {tab === 'student' ? (
            <div className="space-y-4">
              <div><label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-2">Seu Nome Completo</label><div className="relative"><UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="Nome cadastrado na escola" className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-primary focus:bg-white transition-all outline-none font-bold text-slate-700" /></div></div>
              <div className="flex gap-4">
                <div className="flex-1"><label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-2">Série</label><select value={grade} onChange={e => { setGrade(parseInt(e.target.value)); setClassGroup(''); }} className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-primary outline-none font-bold text-slate-700">{[1,2,3,4,5].map(g => <option key={g} value={g}>{g}º Ano</option>)}</select></div>
                <div className="flex-1"><label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-2">Turma</label><select value={classGroup} onChange={e => setClassGroup(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-primary outline-none font-bold text-slate-700"><option value="">Selecione</option>{filteredClasses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
              </div>
              <Button onClick={handleStudentLogin} variant="primary" className="w-full py-4 text-lg mt-4 shadow-xl shadow-primary/20">Entrar na Aventura <ArrowRight className="w-5 h-5" /></Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex p-1 bg-slate-100 rounded-xl mb-4"><button onClick={() => { setStaffRoleType('TEACHER'); playSound('click'); }} className={`flex-1 py-2 text-xs font-black uppercase rounded-lg transition-all ${staffRoleType === 'TEACHER' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>Sou Professor</button><button onClick={() => { setStaffRoleType('PARENT'); playSound('click'); }} className={`flex-1 py-2 text-xs font-black uppercase rounded-lg transition-all ${staffRoleType === 'PARENT' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>Sou Pai/Mãe</button></div>
              {isRegistering ? (
                 <>
                  <div><label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-2">Seu Nome</label><input value={regName} onChange={e => setRegName(e.target.value)} placeholder="Como quer ser chamado?" className="w-full px-4 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-secondary focus:bg-white transition-all outline-none font-bold text-slate-700" /></div>
                  <div><label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-2">Email</label><input value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="Seu melhor email" className="w-full px-4 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-secondary focus:bg-white transition-all outline-none font-bold text-slate-700" /></div>
                  <div><label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-2">Senha</label><input type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="Crie uma senha segura" className="w-full px-4 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-secondary focus:bg-white transition-all outline-none font-bold text-slate-700" /></div>
                  <Button onClick={handleStaffRegister} variant="secondary" className="w-full py-4 text-lg mt-4 shadow-xl shadow-secondary/20"><UserPlus className="w-5 h-5" /> Confirmar Cadastro</Button>
                  <button onClick={() => { setIsRegistering(false); setError(''); playSound('click'); }} className="w-full text-center text-slate-400 font-bold text-xs mt-4 hover:text-secondaryDark transition-colors flex items-center justify-center gap-1"><ArrowLeft className="w-3 h-3" /> Voltar para Login</button>
                 </>
              ) : (
                 <>
                  <div><label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-2">Email</label><div className="relative"><UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email cadastrado" className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-secondary focus:bg-white transition-all outline-none font-bold text-slate-700" /></div></div>
                  <div><label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-2">Senha</label><div className="relative"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-secondary focus:bg-white transition-all outline-none font-bold text-slate-700" /></div></div>
                  <Button onClick={handleStaffLogin} variant="secondary" className="w-full py-4 text-lg mt-4 shadow-xl shadow-secondary/20">{staffRoleType === 'PARENT' ? 'Acessar Área Família' : 'Acessar Área Professor'}</Button>
                  <div className="mt-6 pt-6 border-t border-slate-100 text-center"><p className="text-slate-400 text-xs font-bold mb-3">Ainda não tem uma conta?</p><button onClick={() => { setIsRegistering(true); setError(''); playSound('click'); }} className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 font-bold hover:border-secondary hover:text-secondaryDark transition-all">Criar Cadastro {staffRoleType === 'PARENT' ? 'Familiar' : 'Docente'}</button></div>
                 </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const QuizPlayer = ({ quiz, student, onComplete, onExit }: { quiz: Quiz, student: User, onComplete: (score: number) => void, onExit: () => void }) => {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [finished, setFinished] = useState(false);
  const theme = getQuizTheme(student.grade || 1);
  const currentQ = quiz.questions[currentQuestionIdx];
  const handleAnswer = (optionIdx: number) => {
    if (showFeedback) return;
    setSelectedOption(optionIdx); const correct = optionIdx === currentQ.correctAnswerIndex;
    setIsCorrect(correct); setShowFeedback(true);
    if (correct) { playSound('success'); setScore(s => s + 10); } else { playSound('error'); }
  };
  const nextQuestion = () => {
    setShowFeedback(false); setSelectedOption(null); playSound('click');
    if (currentQuestionIdx < quiz.questions.length - 1) { setCurrentQuestionIdx(p => p + 1); }
    else { setFinished(true); playSound('win'); onComplete(score); }
  };
  if (finished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in relative px-4">
        <Confetti /><div className="relative mb-8"><div className="absolute inset-0 bg-yellow-300 blur-2xl rounded-full opacity-50 animate-pulse"></div><Trophy className="w-32 h-32 text-yellow-400 drop-shadow-xl relative z-10" /></div>
        <h2 className="text-4xl md:text-5xl font-display font-black text-slate-800 mb-4">Parabéns!</h2><p className="text-xl md:text-2xl text-slate-500 font-bold mb-8">Você detonou no quiz!</p>
        <div className="bg-white p-8 rounded-3xl shadow-xl border-b-8 border-slate-100 mb-10 w-72 transform hover:scale-105 transition-transform relative z-10"><p className="text-sm text-slate-400 uppercase font-black tracking-wider mb-2">Sua Pontuação</p><p className="text-6xl font-display font-black text-primary">{score}</p><div className="flex justify-center gap-1 mt-4"><Star className="fill-yellow-400 text-yellow-400 w-6 h-6" /><Star className="fill-yellow-400 text-yellow-400 w-6 h-6" /><Star className="fill-yellow-400 text-yellow-400 w-6 h-6" /></div></div>
        <Button onClick={onExit} size="lg" variant="primary" className="w-64 shadow-xl shadow-primary/20 relative z-10">Voltar ao Painel</Button>
      </div>
    );
  }
  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-8 flex justify-between items-center">
        <button onClick={() => { onExit(); playSound('click'); }} className="text-slate-400 hover:text-slate-600 font-bold flex items-center gap-1"><LogOut className="w-5 h-5" /> <span className="hidden md:inline">Sair</span></button>
        <div className="flex items-center gap-4"><div className="h-4 w-20 md:w-32 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-success transition-all duration-500" style={{ width: `${((currentQuestionIdx) / quiz.questions.length) * 100}%`}}></div></div><span className="bg-secondary text-white px-4 py-1 rounded-full text-sm font-black shadow-sm shadow-secondary/50">{score} pts</span></div>
      </div>
      <div className={`p-6 md:p-12 rounded-[2.5rem] shadow-lg border-4 transition-all duration-500 relative overflow-hidden ${theme.container}`}>
          <span className="inline-block px-4 py-1 rounded-lg bg-slate-100 text-slate-500 font-bold text-xs md:text-sm mb-6">Questão {currentQuestionIdx + 1}</span><h3 className={`${theme.text} text-slate-800 mb-10 leading-tight text-2xl md:text-3xl`}>{currentQ.text}</h3><div className={`grid ${theme.layout}`}>
          {currentQ.options.map((opt, idx) => {
              let stateClass = theme.neutralColor; if (showFeedback) { if (idx === currentQ.correctAnswerIndex) stateClass = theme.successColor; else if (idx === selectedOption) stateClass = theme.errorColor; else stateClass = "opacity-50 border-slate-100 bg-slate-50"; }
            return (<button key={idx} onClick={() => handleAnswer(idx)} disabled={showFeedback} className={`text-left font-bold transition-all transform ${theme.optionBtn} ${stateClass} ${!showFeedback ? 'hover:scale-[1.02]' : ''}`}><div className="flex items-center gap-4"><div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 flex-shrink-0 ${showFeedback && idx === currentQ.correctAnswerIndex ? 'border-white bg-white/20' : 'border-current opacity-50'}`}>{String.fromCharCode(65 + idx)}</div><span>{opt}</span></div></button>);
          })}
        </div></div>
      <div className="h-24 flex items-center justify-center mt-4">
        {showFeedback && (<div className={`w-full max-w-2xl p-4 md:p-6 rounded-2xl border-2 flex flex-col md:flex-row gap-4 md:gap-6 items-center animate-in slide-in-from-bottom-5 fade-in ${isCorrect ? 'bg-green-50 border-green-200 text-green-900' : 'bg-red-50 border-red-200 text-red-900'}`}><div className={`p-3 rounded-full flex-shrink-0 ${isCorrect ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'}`}>{isCorrect ? <CheckCircle className="w-8 h-8" /> : <Trophy className="w-8 h-8 rotate-180" />}</div><div className="flex-1 text-left w-full"><h4 className="font-black text-lg mb-1 text-center md:text-left">{isCorrect ? 'Resposta Certa!' : 'Ops, não foi dessa vez!'}</h4>{currentQ.explanation && <p className="text-sm font-medium opacity-90 leading-relaxed text-center md:text-left">{currentQ.explanation}</p>}</div><Button onClick={nextQuestion} size="lg" variant={isCorrect ? 'success' : 'primary'} className="w-full md:w-auto px-8 py-3 text-base shadow-lg flex-shrink-0">{currentQuestionIdx === quiz.questions.length - 1 ? 'Concluir' : 'Próxima'} <ArrowRight className="w-4 h-4" /></Button></div>)}
      </div>
    </div>
  );
};

const CreateQuizView = ({ currentUser, quizToEdit, onSuccess }: { currentUser: User, quizToEdit: Quiz | null, onSuccess: () => void }) => {
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [targetGrade, setTargetGrade] = useState(3);
  const [difficulty, setDifficulty] = useState('Fácil');
  const [description, setDescription] = useState('');
  
  // State for AI Question Count
  const [aiQuestionCount, setAiQuestionCount] = useState(3);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [creationMode, setCreationMode] = useState<'AI' | 'MANUAL'>('MANUAL');
  const [loadingAI, setLoadingAI] = useState(false);

  const [manualText, setManualText] = useState('');
  const [manualOptions, setManualOptions] = useState(['', '', '', '']);
  const [manualCorrectIdx, setManualCorrectIdx] = useState(0);
  const [manualExplanation, setManualExplanation] = useState('');

  // FILL FORM IF EDITING
  useEffect(() => {
    if (quizToEdit) {
        const titleParts = quizToEdit.title.split(': ');
        const extractedTopic = titleParts.length > 1 ? titleParts[1] : quizToEdit.title;
        setTopic(extractedTopic);
        setSubject(quizToEdit.subject);
        setTargetGrade(quizToEdit.targetGrade || 3);
        setDifficulty(quizToEdit.difficulty);
        setDescription(quizToEdit.description);
        setQuestions(quizToEdit.questions);
    }
  }, [quizToEdit]);

  const handleGenerateAI = async () => {
    if (!topic) return alert('Por favor digite um tópico para a IA.');
    setLoadingAI(true);
    try {
      const newQuestions = await generateQuizQuestions(
        subject, 
        difficulty, 
        topic, 
        targetGrade, 
        aiQuestionCount // Pass user selection
      ); 
      setQuestions(prev => [...prev, ...newQuestions]);
    } catch (e) {
      alert('Erro ao gerar com IA.');
    } finally {
      setLoadingAI(false);
    }
  };

  const handleAddManual = () => {
    if (!manualText || manualOptions.some(o => !o)) return alert('Preencha o enunciado e todas as opções.');
    
    const newQuestion: Question = {
      id: `manual-${Date.now()}`,
      text: manualText,
      options: [...manualOptions],
      correctAnswerIndex: manualCorrectIdx,
      explanation: manualExplanation || undefined
    };

    setQuestions(prev => [...prev, newQuestion]);
    setManualText('');
    setManualOptions(['', '', '', '']);
    setManualCorrectIdx(0);
    setManualExplanation('');
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handleSaveQuiz = () => {
    if (questions.length === 0) return alert("Adicione pelo menos uma pergunta!");
    if (!topic) return alert("Dê um título/tópico ao quiz.");

    const newQuiz: Quiz = {
      id: quizToEdit ? quizToEdit.id : `quiz-${Date.now()}`, // Keep existing ID if editing
      title: `${subject}: ${topic}`,
      description: description || `Quiz para ${targetGrade}º ano`,
      subject,
      difficulty: difficulty as any,
      targetGrade,
      questions,
      createdBy: currentUser.id,
      createdAt: quizToEdit ? quizToEdit.createdAt : Date.now()
    };

    dataService.saveQuiz(newQuiz);
    onSuccess();
  };

  const isParent = currentUser.role === UserRole.PARENT;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Panel: Config & Creation */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h3 className="text-xl font-display font-black text-slate-800 mb-6 flex items-center gap-2">
            <PenTool className={`w-6 h-6 ${isParent ? 'text-orange-500' : 'text-primary'}`} /> 
            {quizToEdit ? 'Editar Atividade' : (isParent ? 'Criar Tarefa de Casa' : 'Criar Nova Atividade')}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
               <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-2">Matéria</label>
                <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full p-3 rounded-xl bg-slate-50 border-2 border-slate-100 font-bold text-slate-700">
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
               </div>
               <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-2">Série Alvo</label>
                <div className="flex gap-1 overflow-x-auto pb-2">
                    {[1,2,3,4,5].map(g => (
                        <button
                            key={g}
                            onClick={() => setTargetGrade(g)}
                            className={`w-10 h-10 rounded-lg font-black text-sm flex-shrink-0 transition-all ${targetGrade === g ? (isParent ? 'bg-orange-500 text-white' : 'bg-primary text-white') : 'bg-slate-100 text-slate-400'}`}
                        >
                            {g}º
                        </button>
                    ))}
                </div>
               </div>
            </div>
            <div className="space-y-4">
               <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-2">Dificuldade</label>
                <div className="flex gap-2">
                    {['Fácil', 'Médio', 'Difícil'].map(d => (
                    <button 
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={`flex-1 py-3 rounded-xl font-bold text-xs border-2 transition-all ${difficulty === d ? 'border-secondary bg-secondary/10 text-secondaryDark' : 'border-slate-100 text-slate-400'}`}
                    >
                        {d}
                    </button>
                    ))}
                </div>
               </div>
               <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-2">Assunto / Tópico</label>
                <input 
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    placeholder="Ex: Sistema Solar" 
                    className="w-full p-3 rounded-xl bg-slate-50 border-2 border-slate-100 font-bold text-slate-700"
                />
               </div>
            </div>
          </div>
        </div>

        {/* Creation Zone */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="flex gap-2 mb-6 bg-slate-50 p-1 rounded-xl w-fit">
                <button 
                    onClick={() => setCreationMode('MANUAL')}
                    className={`px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${creationMode === 'MANUAL' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <PenTool className="w-4 h-4" /> Manual
                </button>
                <button 
                    onClick={() => setCreationMode('AI')}
                    className={`px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${creationMode === 'AI' ? (isParent ? 'bg-white shadow-sm text-orange-500' : 'bg-white shadow-sm text-primary') : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <Sparkles className="w-4 h-4" /> Usar IA
                </button>
            </div>

            {creationMode === 'AI' ? (
                <div className={`rounded-2xl p-6 border text-center ${isParent ? 'bg-orange-50 border-orange-100' : 'bg-indigo-50 border-indigo-100'}`}>
                    <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <Sparkles className={`w-8 h-8 ${isParent ? 'text-orange-500' : 'text-primary'}`} />
                    </div>
                    <h4 className={`font-display font-bold text-lg mb-2 ${isParent ? 'text-orange-900' : 'text-indigo-900'}`}>Gerador Mágico</h4>
                    
                    {/* Question Count Slider */}
                    <div className="mb-6 bg-white/50 p-4 rounded-xl border border-dashed border-slate-200">
                        <label className="block text-xs font-black text-slate-400 uppercase mb-2">Quantidade de Perguntas: {aiQuestionCount}</label>
                        <input
                            type="range"
                            min="1"
                            max="10"
                            step="1"
                            value={aiQuestionCount}
                            onChange={(e) => setAiQuestionCount(parseInt(e.target.value))}
                            className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${isParent ? 'bg-orange-200 accent-orange-500' : 'bg-indigo-200 accent-primary'}`}
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1 uppercase">
                            <span>1</span>
                            <span>10</span>
                        </div>
                    </div>

                    <p className={`text-sm mb-6 font-medium ${isParent ? 'text-orange-600/80' : 'text-indigo-600/80'}`}>
                        A IA vai criar {aiQuestionCount} perguntas baseadas no tópico <strong>"{topic || '...'}"</strong> para o <strong>{targetGrade}º Ano</strong>.
                    </p>
                    <Button onClick={handleGenerateAI} isLoading={loadingAI} variant={isParent ? 'secondary' : 'primary'} className="w-full shadow-xl">
                        Gerar Perguntas
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-2">Enunciado da Pergunta</label>
                        <textarea 
                            value={manualText}
                            onChange={e => setManualText(e.target.value)}
                            placeholder="Ex: Qual é a capital do Brasil?"
                            className="w-full p-4 rounded-xl bg-slate-50 border-2 border-slate-100 font-bold text-slate-700 resize-none h-24"
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {manualOptions.map((opt, idx) => (
                            <div key={idx} className="relative">
                                <div className={`absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-colors ${manualCorrectIdx === idx ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 text-slate-400 hover:border-green-400'}`}
                                     onClick={() => setManualCorrectIdx(idx)}
                                >
                                    {manualCorrectIdx === idx && <CheckCircle className="w-3 h-3" />}
                                </div>
                                <input 
                                    value={opt}
                                    onChange={e => {
                                        const newOpts = [...manualOptions];
                                        newOpts[idx] = e.target.value;
                                        setManualOptions(newOpts);
                                    }}
                                    placeholder={`Opção ${String.fromCharCode(65+idx)}`}
                                    className={`w-full pl-12 pr-3 py-3 rounded-xl border-2 outline-none font-medium text-sm ${manualCorrectIdx === idx ? 'bg-green-50 border-green-200 text-green-800' : 'bg-slate-50 border-slate-100'}`}
                                />
                            </div>
                        ))}
                    </div>
                    <div>
                         <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-2">Explicação</label>
                         <textarea 
                            value={manualExplanation}
                            onChange={e => setManualExplanation(e.target.value)}
                            placeholder="Ex: Brasília foi inaugurada em 1960..."
                            className="w-full p-3 rounded-xl bg-slate-50 border-2 border-slate-100 font-medium text-sm text-slate-700 h-20 resize-none"
                        />
                    </div>
                    <Button onClick={handleAddManual} variant="secondary" className="w-full mt-2">
                        <PlusCircle className="w-5 h-5" /> Adicionar ao Quiz
                    </Button>
                </div>
            )}
        </div>
      </div>

      {/* Right Panel: Preview & Action */}
      <div className="lg:col-span-5 flex flex-col h-full">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-6 border-b border-slate-50 pb-4">
                <h3 className="text-lg font-display font-black text-slate-800">
                    Perguntas ({questions.length})
                </h3>
                <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-lg">
                    Rascunho
                </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 max-h-[500px]">
                {questions.length === 0 ? (
                    <div className="text-center py-10 opacity-50">
                        <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-slate-400 font-bold text-sm">Nenhuma pergunta ainda.</p>
                    </div>
                ) : (
                    questions.map((q, i) => (
                        <div key={q.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-slate-200 transition-all">
                            <div className="flex justify-between items-start mb-2 gap-2">
                                <p className="font-bold text-slate-700 text-sm line-clamp-2 flex-1">
                                    <span className={isParent ? "text-orange-500 mr-2" : "text-primary mr-2"}>#{i+1}</span> 
                                    {q.text}
                                </p>
                                <button onClick={() => handleRemoveQuestion(q.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                    <Trash className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            <div className="pt-6 mt-4 border-t border-slate-50">
                <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-2">Descrição (Opcional)</label>
                <input 
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Pequena descrição..." 
                    className="w-full p-3 rounded-xl bg-slate-50 border-2 border-slate-100 font-medium text-xs text-slate-700 mb-4"
                />
                <Button 
                    onClick={handleSaveQuiz} 
                    variant="success" 
                    className="w-full py-4 shadow-xl shadow-green-200"
                    disabled={questions.length === 0}
                >
                    {quizToEdit ? 'Atualizar Atividade' : (isParent ? 'Salvar Tarefa' : 'Salvar Atividade')}
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
};

// NEW COMPONENT: MANAGE QUIZZES
const ManageQuizzesView = ({ onEdit, onCreate }: { onEdit: (quiz: Quiz) => void, onCreate: () => void }) => {
    const [quizzes, setQuizzes] = useState(dataService.getQuizzes());
    const [searchTerm, setSearchTerm] = useState('');
    const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);

    const executeDelete = () => {
        if (quizToDelete) {
            dataService.deleteQuiz(quizToDelete.id);
            setQuizzes(dataService.getQuizzes());
            setQuizToDelete(null);
            playSound('click');
        }
    };

    const filteredQuizzes = quizzes.filter(q => 
        q.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        q.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8 relative">
            {/* Custom Confirmation Modal */}
            {quizToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl border-4 border-red-50 transform transition-all scale-100">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                                <Trash className="w-10 h-10 text-red-500" />
                            </div>
                            <h3 className="text-2xl font-display font-black text-slate-800 mb-2">Excluir Atividade?</h3>
                            <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                                Você tem certeza que deseja remover <span className="font-bold text-slate-800">"{quizToDelete.title}"</span>? 
                                <br/><span className="text-xs text-red-400 font-bold mt-2 block">ESSA AÇÃO NÃO PODE SER DESFEITA.</span>
                            </p>
                            <div className="flex gap-3 w-full">
                                <Button 
                                    variant="outline" 
                                    onClick={() => setQuizToDelete(null)}
                                    className="flex-1 border-slate-200"
                                >
                                    Cancelar
                                </Button>
                                <Button 
                                    variant="danger" 
                                    onClick={executeDelete}
                                    className="flex-1 shadow-red-200"
                                >
                                    Sim, Excluir
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-3xl font-display font-black text-slate-800">Atividades Salvas</h2>
                    <p className="text-slate-400 font-bold">Gerencie seus planejamentos e quizzes.</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input 
                            placeholder="Buscar atividade..." 
                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-indigo-500 outline-none font-bold text-slate-700"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button onClick={onCreate} variant="primary" className="shadow-lg whitespace-nowrap">
                        <Plus className="w-5 h-5" /> Nova
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredQuizzes.length === 0 ? (
                    <div className="col-span-full text-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-200">
                        <Library className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold">Nenhuma atividade encontrada.</p>
                    </div>
                ) : (
                    filteredQuizzes.map(quiz => (
                        <div key={quiz.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col h-full">
                            <div className="flex justify-between items-start mb-4">
                                <span className={`text-[10px] uppercase font-black px-2 py-1 rounded-lg ${quiz.difficulty === 'Fácil' ? 'bg-green-100 text-green-700' : quiz.difficulty === 'Médio' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                    {quiz.difficulty}
                                </span>
                                <div className="flex items-center gap-2 text-slate-500 text-xs font-bold bg-slate-50 px-2 py-1 rounded-lg">
                                    <BookOpen className="w-3 h-3" />
                                    <span>{quiz.questions.length} Qst</span>
                                </div>
                            </div>
                            
                            <div className="flex-1 mb-6">
                                <h3 className="font-display font-black text-xl text-slate-800 mb-1 line-clamp-2 leading-tight">{quiz.title}</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase">{quiz.subject} • {quiz.targetGrade}º Ano</p>
                            </div>
                            
                            <div className="flex gap-3 pt-4 border-t border-slate-50">
                                <button 
                                    onClick={() => { onEdit(quiz); playSound('click'); }}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-indigo-50 text-indigo-600 font-bold text-sm hover:bg-indigo-100 transition-colors"
                                >
                                    <Pencil className="w-4 h-4" /> Editar
                                </button>
                                <button 
                                    onClick={() => setQuizToDelete(quiz)}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-red-50 text-red-500 font-bold text-sm hover:bg-red-100 transition-colors"
                                >
                                    <Trash className="w-4 h-4" /> Excluir
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};


const ManageClassesView = () => {
    const [classes, setClasses] = useState(dataService.getClasses()); const [grade, setGrade] = useState(1); const [className, setClassName] = useState('');
    const handleAddClass = () => { if (!className) return alert('Nome?'); dataService.saveClass({ id: `c-${Date.now()}`, grade, name: className, schoolId: 's1' }); setClasses(dataService.getClasses()); setClassName(''); };
    const displayedClasses = classes.filter(c => c.grade === grade);
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white p-8 rounded-[2rem] border shadow-sm">
                <h3 className="text-xl font-display font-black mb-6">Cadastrar Nova Turma</h3>
                <div className="flex flex-col md:flex-row gap-4 md:items-end">
                    <div className="flex-1 w-full order-2 md:order-1"><label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-2">Série</label><div className="flex gap-1 overflow-x-auto pb-2">{[1,2,3,4,5].map(g => (<button key={g} onClick={() => setGrade(g)} className={`w-10 h-10 rounded-lg font-black text-sm flex-shrink-0 ${grade === g ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>{g}º</button>))}</div></div>
                    <div className="flex-[2] w-full order-1 md:order-2"><label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-2">Nome</label><input value={className} onChange={e => setClassName(e.target.value)} className="w-full p-3 rounded-xl bg-slate-50 border-2" /></div>
                    <Button onClick={handleAddClass} variant="primary" className="h-[50px] w-full md:w-auto order-3 md:order-3"><Plus className="w-5 h-5" /> Adicionar</Button>
                </div>
            </div>
            <div className="bg-white p-8 rounded-[2rem] border shadow-sm">
                <h3 className="text-xl font-display font-black mb-6">Turmas ({grade}º Ano)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">{displayedClasses.length === 0 ? (<p className="col-span-3 text-center text-slate-400 font-bold py-8">Nenhuma turma.</p>) : (displayedClasses.map(c => (<div key={c.id} className="p-4 rounded-2xl bg-slate-50 border flex justify-between items-center group"><div><span className="text-lg font-black text-slate-800">Turma {c.name}</span></div><button onClick={() => { dataService.deleteClass(c.id); setClasses(dataService.getClasses()); }} className="text-slate-300 hover:text-red-500"><Trash className="w-4 h-4" /></button></div>)))}</div>
            </div>
        </div>
    );
};


const EnrollStudentView = ({ onEnroll }: { currentUser: User, onEnroll: () => void }) => {
    const [ns, setNs] = useState({ name: '', grade: 1, classGroup: '' }); const classes = dataService.getClasses(); const fc = classes.filter(c => c.grade === ns.grade);
    const handleAdd = () => { if(!ns.name || !ns.classGroup) return alert("Preencha tudo"); dataService.saveUser({ id: `u-${Date.now()}`, role: UserRole.STUDENT, name: ns.name, email: `${ns.name.toLowerCase().replace(' ', '.')}@escola.com`, grade: ns.grade, classGroup: ns.classGroup, level: 1, points: 0, parentIds: [] }); setNs({ name: '', grade: 1, classGroup: '' }); onEnroll(); };
    return (
        <div className="max-w-3xl mx-auto"><div className="bg-white p-8 rounded-[2rem] border shadow-sm"><h3 className="text-2xl font-display font-black mb-6">Matricular Aluno</h3><div className="grid gap-6"><div><label className="text-xs font-black text-slate-400 mb-2 block">Nome</label><input className="w-full p-4 rounded-xl bg-slate-50 border-2" value={ns.name} onChange={e => setNs({...ns, name: e.target.value})} /></div><div className="flex gap-4"><div className="flex-1"><label className="text-xs font-black text-slate-400 mb-2 block">Série</label><select className="w-full p-4 rounded-xl bg-slate-50 border-2" value={ns.grade} onChange={e => setNs({...ns, grade: parseInt(e.target.value)})}>{[1,2,3,4,5].map(g => <option key={g} value={g}>{g}º Ano</option>)}</select></div><div className="flex-1"><label className="text-xs font-black text-slate-400 mb-2 block">Turma</label><select className="w-full p-4 rounded-xl bg-slate-50 border-2" value={ns.classGroup} onChange={e => setNs({...ns, classGroup: e.target.value})}><option value="">Selecione</option>{fc.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div></div><Button onClick={handleAdd} variant="primary" size="lg" className="mt-4">Matricular</Button></div></div></div>
    );
};

const ManageUsersView = ({ currentUser }: { currentUser: User }) => {
  const [users, setUsers] = useState(dataService.getUsers());
  const [newStudent, setNewStudent] = useState({ name: '', email: '', grade: 1, classGroup: '' });
  const isParent = currentUser.role === UserRole.PARENT;
  
  // State for Staff Filters (Diário de Classe)
  const [filterGrade, setFilterGrade] = useState(1);
  const [filterClass, setFilterClass] = useState('');

  // State for Parent Linking
  const [parentTab, setParentTab] = useState<'CREATE' | 'LINK'>('CREATE');
  const [linkSearchTerm, setLinkSearchTerm] = useState('');
  const [linkSearchGrade, setLinkSearchGrade] = useState(1);
  const [foundStudents, setFoundStudents] = useState<User[]>([]);
  
  // Modal State for Deletion
  const [studentToDelete, setStudentToDelete] = useState<User | null>(null);

  const availableClasses = dataService.getClasses();

  const handleAddStudent = () => {
    if(!newStudent.name || !newStudent.classGroup) return alert("Preencha nome e turma");
    const user: User = {
      id: `u-${Date.now()}`,
      role: UserRole.STUDENT,
      name: newStudent.name,
      email: `${newStudent.name.toLowerCase().replace(' ', '.')}@escola.com`, 
      grade: newStudent.grade,
      classGroup: newStudent.classGroup,
      level: 1,
      points: 0,
      // If Parent creates, automatically link
      parentIds: isParent ? [currentUser.id] : []
    };
    dataService.saveUser(user);
    setUsers(dataService.getUsers());
    setNewStudent({ ...newStudent, name: '' });
  };

  const handleSearchStudent = () => {
      if (!linkSearchTerm) return;
      const results = users.filter(u => 
        u.role === UserRole.STUDENT &&
        u.grade === linkSearchGrade &&
        u.name.toLowerCase().includes(linkSearchTerm.toLowerCase()) &&
        // Exclude already linked
        (!u.parentIds || !u.parentIds.includes(currentUser.id))
      );
      setFoundStudents(results);
  };

  const handleLinkStudent = (student: User) => {
      const updatedUser = {
          ...student,
          parentIds: [...(student.parentIds || []), currentUser.id]
      };
      dataService.saveUser(updatedUser);
      setUsers(dataService.getUsers());
      setFoundStudents(prev => prev.filter(u => u.id !== student.id));
      alert(`Você agora está vinculado a ${student.name}!`);
  };
  
  // HANDLER FOR DELETE CONFIRMATION
  const executeDelete = () => {
      if (studentToDelete) {
          dataService.deleteStudent(studentToDelete.id);
          setUsers(dataService.getUsers());
          setStudentToDelete(null);
          playSound('click');
      }
  };

  // Filter classes for the "Add Student" or "Link Student" logic
  const filteredClasses = availableClasses.filter(c => c.grade === newStudent.grade);

  // Filter classes for the "Class Diary" view logic
  const filteredClassesForDiary = availableClasses.filter(c => c.grade === filterGrade);

  // If Parent, only show their children
  const displayedStudents = isParent 
    ? users.filter(u => u.role === UserRole.STUDENT && u.parentIds?.includes(currentUser.id))
    : users.filter(u => u.role === UserRole.STUDENT);

  // Logic for Staff Diary Filter
  const diaryStudents = users.filter(u => 
    u.role === UserRole.STUDENT && 
    u.grade === filterGrade && 
    (filterClass === '' || u.classGroup === filterClass)
  );

  if (isParent) {
     return (
        <div className="max-w-4xl mx-auto space-y-10">
            <div className="bg-orange-50 rounded-[2rem] p-8 border border-orange-100">
                <div className="flex justify-between items-center mb-6">
                     <h3 className="text-2xl font-display font-black text-orange-900">Gerenciar Meus Filhos</h3>
                     <div className="flex bg-white rounded-lg p-1 border border-orange-200">
                        <button 
                            onClick={() => setParentTab('CREATE')}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${parentTab === 'CREATE' ? 'bg-orange-100 text-orange-700' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Novo Cadastro
                        </button>
                        <button 
                             onClick={() => setParentTab('LINK')}
                             className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${parentTab === 'LINK' ? 'bg-orange-100 text-orange-700' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Vincular Existente
                        </button>
                     </div>
                </div>

                {parentTab === 'CREATE' ? (
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="flex-1 w-full">
                            <p className="text-orange-700/80 font-medium mb-6">Crie uma conta para seu filho se ele ainda não estiver na escola.</p>
                            <div className="space-y-4">
                                <input 
                                    placeholder="Nome da Criança" 
                                    className="w-full p-4 rounded-xl bg-white border-2 border-orange-100 focus:border-orange-400 outline-none font-bold text-slate-700"
                                    value={newStudent.name}
                                    onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                                />
                                <div className="flex gap-4">
                                    <select 
                                        className="flex-1 p-3 rounded-xl bg-white border-2 border-orange-100 font-bold text-slate-700"
                                        value={newStudent.grade}
                                        onChange={e => { setNewStudent({...newStudent, grade: parseInt(e.target.value)}); }}
                                    >
                                        {[1,2,3,4,5].map(g => <option key={g} value={g}>{g}º Ano</option>)}
                                    </select>
                                    
                                    <select 
                                        className="flex-1 p-3 rounded-xl bg-white border-2 border-orange-100 font-bold text-slate-700"
                                        value={newStudent.classGroup}
                                        onChange={e => setNewStudent({...newStudent, classGroup: e.target.value})}
                                    >
                                        <option value="">Selecione Turma</option>
                                        {filteredClasses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    </select>
                                </div>
                                <Button onClick={handleAddStudent} variant="secondary" className="w-full shadow-lg shadow-orange-200">
                                    Criar Conta e Vincular
                                </Button>
                            </div>
                        </div>
                         <div className="hidden md:flex justify-center">
                            <div className="bg-orange-200 w-48 h-48 rounded-full flex items-center justify-center">
                                <Baby className="w-24 h-24 text-orange-600" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="w-full">
                        <p className="text-orange-700/80 font-medium mb-6">Seu filho já foi cadastrado pela escola? Pesquise e vincule aqui.</p>
                         <div className="flex flex-col md:flex-row gap-4 mb-6">
                            <div className="relative w-full md:flex-[2]">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input 
                                    placeholder="Nome do aluno..." 
                                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border-2 border-orange-100 focus:border-orange-400 outline-none font-bold text-slate-700"
                                    value={linkSearchTerm}
                                    onChange={e => setLinkSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-4 w-full md:w-auto">
                                 <select 
                                    className="w-32 p-3 rounded-xl bg-white border-2 border-orange-100 font-bold text-slate-700"
                                    value={linkSearchGrade}
                                    onChange={e => setLinkSearchGrade(parseInt(e.target.value))}
                                >
                                    {[1,2,3,4,5].map(g => <option key={g} value={g}>{g}º Ano</option>)}
                                </select>
                                <Button onClick={handleSearchStudent} variant="primary" className="h-[50px] flex-1 md:w-auto md:flex-none">
                                    Buscar
                                </Button>
                            </div>
                        </div>
                        
                        {foundStudents.length > 0 && (
                            <div className="space-y-3">
                                {foundStudents.map(student => (
                                    <div key={student.id} className="bg-white p-4 rounded-xl border border-orange-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <UserAvatar name={student.name} />
                                            <div>
                                                <p className="font-bold text-slate-700">{student.name}</p>
                                                <p className="text-xs text-slate-400 font-bold">{student.grade}º Ano - Turma {student.classGroup}</p>
                                            </div>
                                        </div>
                                        <Button onClick={() => handleLinkStudent(student)} size="sm" variant="success">
                                            <LinkIcon className="w-4 h-4" /> Vincular
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {foundStudents.length === 0 && linkSearchTerm && (
                            <p className="text-center text-slate-400 font-bold mt-4">Nenhum aluno encontrado com estes critérios.</p>
                        )}
                    </div>
                )}
            </div>

            <div>
                <h3 className="text-xl font-display font-black text-slate-700 mb-6">Meus Filhos Cadastrados</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {displayedStudents.map(child => (
                        <div key={child.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden flex items-center gap-4">
                            <UserAvatar name={child.name} colorClass="bg-orange-400 w-16 h-16 text-xl" />
                            <div className="flex-1 z-10">
                                <h4 className="font-display font-black text-xl text-slate-800">{child.name}</h4>
                                <p className="text-sm font-bold text-slate-400 uppercase mb-2">{child.grade}º Ano • {child.classGroup}</p>
                                <button 
                                    onClick={() => { 
                                        const updated = {...child, parentIds: child.parentIds?.filter(id => id !== currentUser.id)};
                                        dataService.saveUser(updated);
                                        setUsers(dataService.getUsers());
                                    }} 
                                    className="text-red-400 text-xs font-bold hover:underline"
                                >
                                    Desvincular
                                </button>
                            </div>
                            <div className="absolute right-0 top-0 w-24 h-24 bg-orange-50 rounded-bl-[4rem]"></div>
                        </div>
                    ))}
                    {displayedStudents.length === 0 && (
                        <p className="text-slate-400 font-bold">Nenhuma criança vinculada ainda.</p>
                    )}
                </div>
            </div>
        </div>
     )
  }
  
  // STAFF VIEW (DIARY)
  return (
    <div className="space-y-10 relative">
        {/* Custom Confirmation Modal */}
        {studentToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl border-4 border-red-50 transform transition-all scale-100">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                            <Trash className="w-10 h-10 text-red-500" />
                        </div>
                        <h3 className="text-2xl font-display font-black text-slate-800 mb-2">Remover Aluno?</h3>
                        <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                            Você tem certeza que deseja remover <span className="font-bold text-slate-800">{studentToDelete.name}</span>? 
                            <br/><span className="text-xs text-red-400 font-bold mt-2 block">ISSO APAGARÁ O HISTÓRICO E DESVINCULARÁ DOS PAIS.</span>
                        </p>
                        <div className="flex gap-3 w-full">
                            <Button 
                                variant="outline" 
                                onClick={() => setStudentToDelete(null)}
                                className="flex-1 border-slate-200"
                            >
                                Cancelar
                            </Button>
                            <Button 
                                variant="danger" 
                                onClick={executeDelete}
                                className="flex-1 shadow-red-200"
                            >
                                Sim, Remover
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        )}

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b bg-slate-50/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h3 className="text-xl font-display font-black text-slate-800">Diário de Classe</h3>
            
            {/* Filter Controls */}
            <div className="flex flex-col md:flex-row gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-400 uppercase ml-2">Ano:</span>
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(g => (
                            <button
                                key={g}
                                onClick={() => { setFilterGrade(g); setFilterClass(''); }}
                                className={`w-8 h-8 rounded-lg font-black text-xs transition-all ${filterGrade === g ? 'bg-indigo-500 text-white shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-indigo-50'}`}
                            >
                                {g}º
                            </button>
                        ))}
                    </div>
                </div>
                <div className="w-px h-8 bg-slate-100 hidden md:block"></div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-400 uppercase">Turma:</span>
                    <select
                        value={filterClass}
                        onChange={(e) => setFilterClass(e.target.value)}
                        className="p-1 pr-8 rounded-lg bg-slate-50 border border-slate-200 font-bold text-slate-600 text-sm outline-none focus:border-indigo-500 cursor-pointer min-w-[100px]"
                    >
                        <option value="">Todas</option>
                        {filteredClassesForDiary.map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b">
                        <th className="p-3 md:p-6 text-[10px] md:text-xs font-black text-slate-400 uppercase">Nome</th>
                        <th className="p-3 md:p-6 text-[10px] md:text-xs font-black text-slate-400 uppercase">Grupo</th>
                        <th className="p-3 md:p-6 text-[10px] md:text-xs font-black text-slate-400 uppercase text-center">Nível</th>
                        <th className="p-3 md:p-6 text-[10px] md:text-xs font-black text-slate-400 uppercase text-right">Ações</th>
                    </tr>
                </thead>
                <tbody>
                {diaryStudents.length === 0 ? (
                    <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-400 font-bold">
                            Nenhum aluno encontrado para {filterGrade}º Ano {filterClass ? ` - Turma ${filterClass}` : ''}.
                        </td>
                    </tr>
                ) : (
                    diaryStudents.map(u => (
                        <tr key={u.id} className="border-b last:border-0 hover:bg-slate-50/50">
                            <td className="p-3 md:p-6">
                                <span className="font-bold text-slate-700 text-sm md:text-lg">{u.name}</span>
                            </td>
                            <td className="p-3 md:p-6">
                                <span className="bg-indigo-100 text-indigo-600 px-2 py-1 md:px-3 rounded-lg text-xs font-black whitespace-nowrap">
                                    {u.grade}º - {u.classGroup}
                                </span>
                            </td>
                            <td className="p-3 md:p-6 text-center">
                                <span className="font-black text-secondaryDark flex items-center justify-center gap-1 text-sm md:text-lg">
                                    <Star className="w-4 h-4 md:w-5 md:h-5 fill-current" /> {u.level}
                                </span>
                            </td>
                            <td className="p-3 md:p-6 text-right">
                                <button 
                                    onClick={(e) => { 
                                        e.stopPropagation();
                                        setStudentToDelete(u);
                                        playSound('click');
                                    }} 
                                    className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 md:p-3 rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-end gap-2 ml-auto"
                                    title="Desmatricular e Desvincular"
                                >
                                    <Trash className="w-5 h-5" />
                                    <span className="hidden md:inline font-bold text-sm">Desmatricular</span>
                                </button>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

const LeaderboardView = ({ currentUser }: { currentUser: User }) => {
  const users = dataService.getUsers();
  const students = users.filter(u => u.role === UserRole.STUDENT).sort((a, b) => (b.points || 0) - (a.points || 0));
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 mb-8 text-center relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-300"></div>
         <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
         <h2 className="text-3xl font-display font-black text-slate-800">Galeria de Campeões</h2>
         <p className="text-slate-500 font-bold">Quem está brilhando mais?</p>
      </div>

      <div className="grid gap-4">
        {students.map((student, index) => {
           const isTop3 = index < 3;
           const medalColor = index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-slate-300' : 'bg-orange-300';
           
           return (
             <div key={student.id} className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${isTop3 ? 'bg-white border-yellow-100 scale-[1.02] shadow-md' : 'bg-slate-50 border-transparent opacity-80'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-white text-xl shadow-sm ${isTop3 ? medalColor : 'bg-slate-200 text-slate-400'}`}>
                    {index + 1}
                </div>
                <UserAvatar name={student.name} />
                <div className="flex-1">
                    <p className="font-bold text-slate-700 text-lg">{student.name}</p>
                    <p className="text-xs font-bold text-slate-400 uppercase">{student.grade}º Ano • {student.classGroup}</p>
                </div>
                <div className="text-right">
                    <p className="font-black text-2xl text-indigo-600">{student.points || 0}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Pontos</p>
                </div>
             </div>
           );
        })}
      </div>
    </div>
  );
};

const ReportsView = ({ currentUser }: { currentUser?: User }) => {
    // 1. Get Data
    const results = dataService.getResults();
    const quizzes = dataService.getQuizzes();
    const users = dataService.getUsers(); 
    const classes = dataService.getClasses();

    // Determine if Parent mode
    const isParent = currentUser?.role === UserRole.PARENT;
    const parentChildren = isParent ? users.filter(u => u.parentIds?.includes(currentUser?.id || '')) : [];

    // 2. State for Filters
    const [filterGrade, setFilterGrade] = useState<number | 'ALL'>('ALL');
    const [filterClass, setFilterClass] = useState<string>('ALL');
    // Parent specific filter (optional, default to ALL children or a specific child ID)
    const [filterChildId, setFilterChildId] = useState<string>('ALL');

    // 3. Filter Logic
    const filteredResults = results.filter(r => {
        const student = users.find(u => u.id === r.studentId);
        if (!student) return false;

        if (isParent) {
            // Must be one of the parent's children
            if (!parentChildren.find(c => c.id === student.id)) return false;
            // Apply child filter if selected
            if (filterChildId !== 'ALL' && student.id !== filterChildId) return false;
        } else {
            // Teacher filters
            if (filterGrade !== 'ALL' && student.grade !== filterGrade) return false;
            if (filterClass !== 'ALL' && student.classGroup !== filterClass) return false;
        }

        return true;
    });
    
    // 4. Calculate Stats
    const totalQuizzesTaken = filteredResults.length;
    const avgScore = totalQuizzesTaken > 0 ? filteredResults.reduce((a, b) => a + b.score, 0) / totalQuizzesTaken : 0;
    
    const subjectScores: Record<string, { total: number, count: number }> = {};
    filteredResults.forEach(r => {
        const quiz = quizzes.find(q => q.id === r.quizId);
        if (quiz) {
            if (!subjectScores[quiz.subject]) subjectScores[quiz.subject] = { total: 0, count: 0 };
            subjectScores[quiz.subject].total += r.score;
            subjectScores[quiz.subject].count += 1;
        }
    });
    
    const chartData = Object.keys(subjectScores).map(sub => ({
        name: sub,
        score: Math.round(subjectScores[sub].total / subjectScores[sub].count)
    }));

    const availableClasses = classes.filter(c => filterGrade === 'ALL' || c.grade === filterGrade);

    // 5. Prepare Detailed List Data
    const detailedResults = filteredResults.map(r => {
        const student = users.find(u => u.id === r.studentId);
        const quiz = quizzes.find(q => q.id === r.quizId);

        let progressLabel = "(0/0)";
        if (student && student.grade) {
             const availableCount = quizzes.filter(q => q.targetGrade === student.grade).length;
             const takenCount = new Set(results.filter(res => res.studentId === student.id).map(res => res.quizId)).size;
             progressLabel = `(${takenCount}/${availableCount})`;
        }

        return {
            id: `${r.studentId}-${r.quizId}-${r.date}`,
            studentName: student?.name || 'Aluno Removido',
            quizTitle: quiz?.title || 'Atividade Removida',
            score: r.score,
            maxScore: r.maxScore,
            date: new Date(r.date).toLocaleDateString('pt-BR'),
            timestamp: r.date,
            grade: student?.grade,
            classGroup: student?.classGroup,
            progressLabel
        };
    }).sort((a, b) => b.timestamp - a.timestamp);

    return (
         <div className="max-w-5xl mx-auto space-y-8 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-display font-black text-slate-800">Relatórios de Desempenho</h2>
                    <p className="text-slate-500 font-bold">{isParent ? 'Acompanhe a jornada dos seus filhos.' : 'Visão geral da escola.'}</p>
                </div>
                
                {/* FILTER BAR */}
                <div className="flex flex-col md:flex-row gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm w-full md:w-auto">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-slate-400 ml-2" />
                        <span className="text-xs font-black text-slate-400 uppercase">Filtros:</span>
                    </div>
                    
                    {isParent ? (
                         <select 
                            value={filterChildId} 
                            onChange={e => setFilterChildId(e.target.value)}
                            className="p-2 rounded-lg bg-slate-50 border border-slate-200 font-bold text-slate-600 text-sm outline-none focus:border-indigo-500 cursor-pointer w-full md:w-auto"
                        >
                            <option value="ALL">Todos os Filhos</option>
                            {parentChildren.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    ) : (
                        <>
                            <select 
                                value={filterGrade} 
                                onChange={e => {
                                    const val = e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value);
                                    setFilterGrade(val as any);
                                    setFilterClass('ALL'); 
                                }}
                                className="p-2 rounded-lg bg-slate-50 border border-slate-200 font-bold text-slate-600 text-sm outline-none focus:border-indigo-500 cursor-pointer"
                            >
                                <option value="ALL">Todas as Séries</option>
                                {[1, 2, 3, 4, 5].map(g => <option key={g} value={g}>{g}º Ano</option>)}
                            </select>

                            <div className="w-px h-8 bg-slate-100 hidden md:block"></div>

                            <select 
                                value={filterClass} 
                                onChange={e => setFilterClass(e.target.value)}
                                className="p-2 rounded-lg bg-slate-50 border border-slate-200 font-bold text-slate-600 text-sm outline-none focus:border-indigo-500 cursor-pointer"
                            >
                                <option value="ALL">Todas as Turmas</option>
                                {availableClasses.map(c => <option key={c.id} value={c.name}>{c.name} ({c.grade}º)</option>)}
                            </select>
                        </>
                    )}
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-slate-400 font-bold text-xs uppercase mb-2">Total de Atividades Feitas</p>
                    <p className="text-4xl font-black text-primary">{totalQuizzesTaken}</p>
                    <p className="text-xs font-medium text-slate-400 mt-2">Neste filtro</p>
                </div>
                 <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-slate-400 font-bold text-xs uppercase mb-2">Média Geral</p>
                    <p className="text-4xl font-black text-secondaryDark">{Math.round(avgScore)} pts</p>
                    <p className="text-xs font-medium text-slate-400 mt-2">Pontuação (0-100)</p>
                </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm h-96">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-slate-700">Desempenho por Matéria</h3>
                </div>
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="80%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} />
                            <Tooltip 
                                cursor={{fill: '#f8fafc'}}
                                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                            />
                            <Bar dataKey="score" fill="#6366f1" radius={[8, 8, 8, 8]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300">
                        <BarChartIcon className="w-16 h-16 mb-4 opacity-50" />
                        <p className="font-bold">Sem dados para este filtro</p>
                    </div>
                )}
            </div>

            {/* Detailed Results Table */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h3 className="font-bold text-lg text-slate-700 mb-6">Detalhamento por Atividade</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="pb-4 font-black text-slate-400 uppercase text-xs">Data</th>
                                <th className="pb-4 font-black text-slate-400 uppercase text-xs">Aluno</th>
                                <th className="pb-4 font-black text-slate-400 uppercase text-xs">Atividade</th>
                                <th className="pb-4 font-black text-slate-400 uppercase text-xs text-right">Nota</th>
                            </tr>
                        </thead>
                        <tbody>
                            {detailedResults.map(item => (
                                <tr key={item.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                                    <td className="py-4 text-slate-500 font-bold text-sm">{item.date}</td>
                                    <td className="py-4">
                                        <div className="flex items-center gap-2">
                                            <p className="font-black text-slate-700">{item.studentName}</p>
                                        </div>
                                        <p className="text-xs text-slate-400 font-bold flex items-center gap-2">
                                            {item.grade}º - {item.classGroup}
                                        </p>
                                    </td>
                                    <td className="py-4 text-slate-600 font-medium text-sm">{item.quizTitle}</td>
                                    <td className="py-4 text-right">
                                        <span className={`px-3 py-1 rounded-lg font-black text-sm ${item.score >= (item.maxScore * 0.7) ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {item.score}/{item.maxScore}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {detailedResults.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-8 text-center text-slate-400 font-bold">Nenhum resultado encontrado.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
         </div>
    );
};

const DashboardStaff = ({ currentUser, setView }: { currentUser: User, setView: (v: ViewState) => void }) => {
    const isParent = currentUser.role === UserRole.PARENT;
    
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-display font-black text-slate-800">Olá, {currentUser.name}</h2>
                    <p className="text-slate-500 font-bold">Bem-vindo à sua central de controle.</p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {isParent ? (
                    <>
                        <DashboardQuickAction icon={Baby} label="Meus Filhos" colorClass="bg-orange-500" onClick={() => setView('MANAGE_USERS')} />
                        <DashboardQuickAction icon={Sparkles} label="Nova Tarefa" colorClass="bg-pink-500" onClick={() => setView('CREATE_QUIZ')} />
                        <DashboardQuickAction icon={Library} label="Atividades" colorClass="bg-indigo-500" onClick={() => setView('MANAGE_QUIZZES')} />
                        <DashboardQuickAction icon={BarChartIcon} label="Relatórios" colorClass="bg-green-500" onClick={() => setView('REPORTS')} />
                    </>
                ) : (
                    <>
                        <DashboardQuickAction icon={UserPlus} label="Matricular" colorClass="bg-blue-500" onClick={() => setView('ENROLL_STUDENT')} />
                        <DashboardQuickAction icon={PenTool} label="Criar Quiz" colorClass="bg-purple-500" onClick={() => setView('CREATE_QUIZ')} />
                        <DashboardQuickAction icon={Library} label="Atividades" colorClass="bg-indigo-500" onClick={() => setView('MANAGE_QUIZZES')} />
                        <DashboardQuickAction icon={Grid3X3} label="Turmas" colorClass="bg-orange-500" onClick={() => setView('MANAGE_CLASSES')} />
                        <DashboardQuickAction icon={BarChartIcon} label="Relatórios" colorClass="bg-green-500" onClick={() => setView('REPORTS')} />
                    </>
                )}
            </div>
            
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-xl">
                 <div className="relative z-10 max-w-lg">
                     <h3 className="text-3xl font-display font-black mb-4">Inspire o Futuro!</h3>
                     <p className="font-medium opacity-90 mb-8 leading-relaxed">
                        "A educação é a arma mais poderosa que você pode usar para mudar o mundo." 
                        <br/><span className="text-sm opacity-75">- Nelson Mandela</span>
                     </p>
                     <Button variant="secondary" onClick={() => setView('CREATE_QUIZ')}>
                        Criar Nova Atividade <ArrowRight className="w-5 h-5" />
                     </Button>
                 </div>
                 <Sparkles className="absolute top-10 right-10 w-48 h-48 text-white opacity-10 animate-pulse" />
                 <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white opacity-5 rounded-full blur-3xl"></div>
            </div>
        </div>
    );
};

const DashboardStudent = ({ currentUser, onPlayQuiz, setView }: { currentUser: User, onPlayQuiz: (q: Quiz) => void, setView: (v: ViewState) => void }) => {
    const quizzes = dataService.getQuizzes().filter(q => !q.targetGrade || q.targetGrade === currentUser.grade);
    const results = dataService.getResults().filter(r => r.studentId === currentUser.id);
    
    // Filter quizzes not yet taken or allow retake? Let's just list all available for grade.
    
    return (
        <div className="space-y-8">
             <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-2xl md:text-3xl font-display font-black text-slate-800 mb-1">Olá, {currentUser.name}!</h2>
                    <p className="text-slate-500 font-bold text-sm md:text-base">Você tem {currentUser.points || 0} pontos e está no Nível {currentUser.level || 1}.</p>
                </div>
                <div className="relative z-10 bg-yellow-400 text-yellow-900 font-black px-4 py-2 rounded-2xl shadow-lg transform rotate-3 flex flex-col items-center">
                    <Trophy className="w-6 h-6 mb-1" />
                    <span>NVL {currentUser.level || 1}</span>
                </div>
                <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-yellow-50 to-transparent"></div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => setView('GAMES_HUB')} className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-[2rem] p-6 text-white text-left relative overflow-hidden group hover:scale-[1.02] transition-all shadow-lg shadow-pink-200">
                    <Gamepad2 className="w-10 h-10 mb-4 bg-white/20 p-2 rounded-xl" />
                    <p className="font-display font-black text-xl mb-1">Minigames</p>
                    <p className="text-xs font-bold opacity-80">Jogar Agora</p>
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                 </button>
                 <button onClick={() => setView('LEADERBOARD')} className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-[2rem] p-6 text-white text-left relative overflow-hidden group hover:scale-[1.02] transition-all shadow-lg shadow-indigo-200">
                    <Trophy className="w-10 h-10 mb-4 bg-white/20 p-2 rounded-xl" />
                    <p className="font-display font-black text-xl mb-1">Ranking</p>
                    <p className="text-xs font-bold opacity-80">Ver Posição</p>
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                 </button>
             </div>

             <div>
                <h3 className="text-xl font-display font-black text-slate-800 mb-6 flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-primary" /> Suas Missões
                </h3>
                <div className="grid gap-4">
                    {quizzes.length === 0 ? (
                        <p className="text-slate-400 font-bold text-center py-10 bg-slate-50 rounded-3xl border border-dashed border-slate-200">Nenhuma tarefa disponível por enquanto.</p>
                    ) : (
                        quizzes.map(quiz => {
                            const result = results.find(r => r.quizId === quiz.id);
                            return (
                                <div key={quiz.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group hover:border-primary/30 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-md ${result ? 'bg-green-500 shadow-green-200' : 'bg-primary shadow-indigo-200'}`}>
                                            {result ? <CheckCircle className="w-8 h-8" /> : quiz.subject.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-700 text-lg group-hover:text-primary transition-colors">{quiz.title}</h4>
                                            <p className="text-xs font-bold text-slate-400 uppercase">{quiz.subject} • {quiz.questions.length} Questões</p>
                                        </div>
                                    </div>
                                    <div className="w-full md:w-auto">
                                        {result ? (
                                            <div className="bg-green-50 text-green-700 px-4 py-2 rounded-xl font-black text-sm text-center border border-green-100">
                                                Feito! {result.score} pts
                                            </div>
                                        ) : (
                                            <Button onClick={() => onPlayQuiz(quiz)} size="sm" className="w-full md:w-auto">
                                                Começar <Play className="w-4 h-4 ml-1 fill-current" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
             </div>
        </div>
    );
};

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [view, setView] = useState<ViewState>('LOGIN');
    const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
    const [activeGame, setActiveGame] = useState<string | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    
    // New state for editing
    const [quizToEdit, setQuizToEdit] = useState<Quiz | null>(null);

    const handleLogin = (u: User) => {
        setUser(u);
        if (u.role === UserRole.STUDENT) setView('DASHBOARD_STUDENT');
        else setView('DASHBOARD_STAFF');
    };

    const handleLogout = () => {
        setUser(null);
        setView('LOGIN');
        setActiveQuiz(null);
        setActiveGame(null);
        setMenuOpen(false);
        setQuizToEdit(null);
    };

    const handleQuizComplete = (score: number) => {
        if (user && activeQuiz) {
            const result: QuizResult = {
                studentId: user.id,
                quizId: activeQuiz.id,
                score,
                maxScore: activeQuiz.questions.length * 10,
                date: Date.now()
            };
            dataService.saveResult(result);
            
            const updatedUsers = dataService.getUsers();
            const me = updatedUsers.find(u => u.id === user.id);
            if (me) setUser(me);
        }
    };

    const handleChangeView = (v: ViewState) => {
        if (v === 'CREATE_QUIZ' && view !== 'CREATE_QUIZ') {
            // Reset edit state when navigating to Create Quiz from menu
            setQuizToEdit(null);
        }
        setView(v);
        setMenuOpen(false);
    };

    const handleEditQuiz = (quiz: Quiz) => {
        setQuizToEdit(quiz);
        setView('CREATE_QUIZ');
    };

    // Main Render Logic
    if (!user) {
        return <LoginView onLogin={handleLogin} />;
    }

    if (activeQuiz) {
        return <QuizPlayer quiz={activeQuiz} student={user} onComplete={handleQuizComplete} onExit={() => setActiveQuiz(null)} />;
    }

    if (activeGame) {
        if (activeGame === 'math-memory') return <MathMemoryGame grade={user.grade || 1} onExit={() => setActiveGame(null)} />;
        if (activeGame === 'tic-tac-toe') return <TicTacToeGame grade={user.grade || 1} onExit={() => setActiveGame(null)} />;
        if (activeGame === 'sequence-master') return <SequenceGame grade={user.grade || 1} onExit={() => setActiveGame(null)} />;
        if (activeGame === 'speed-math') return <SpeedMathGame grade={user.grade || 1} onExit={() => setActiveGame(null)} />;
    }

    const renderView = () => {
        switch(view) {
            case 'DASHBOARD_STAFF':
                return <DashboardStaff currentUser={user} setView={handleChangeView} />;
            case 'DASHBOARD_STUDENT':
                return <DashboardStudent currentUser={user} onPlayQuiz={setActiveQuiz} setView={handleChangeView} />;
            case 'MANAGE_USERS':
                return <ManageUsersView currentUser={user} />;
            case 'ENROLL_STUDENT':
                return <EnrollStudentView currentUser={user} onEnroll={() => handleChangeView('MANAGE_USERS')} />;
            case 'MANAGE_CLASSES':
                return <ManageClassesView />;
            case 'CREATE_QUIZ':
                return <CreateQuizView 
                    currentUser={user} 
                    quizToEdit={quizToEdit}
                    onSuccess={() => {
                        setQuizToEdit(null);
                        setView('MANAGE_QUIZZES');
                    }} 
                />;
            case 'MANAGE_QUIZZES':
                return <ManageQuizzesView onEdit={handleEditQuiz} onCreate={() => handleChangeView('CREATE_QUIZ')} />;
            case 'REPORTS':
                return <ReportsView currentUser={user} />;
            case 'LEADERBOARD':
                return <LeaderboardView currentUser={user} />;
            case 'GAMES_HUB':
                return <GamesHubView onSelectGame={setActiveGame} />;
            default:
                return <div className="p-10 text-center text-slate-400 font-bold">Em construção... 🚧</div>;
        }
    };

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            {/* Mobile Menu Overlay */}
            {menuOpen && (
                <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm md:hidden" onClick={() => setMenuOpen(false)}>
                    <Sidebar 
                        currentUser={user} 
                        currentView={view} 
                        setView={handleChangeView} 
                        onLogout={handleLogout} 
                        onClose={() => setMenuOpen(false)}
                    />
                </div>
            )}
            
            {/* Desktop Sidebar */}
            <div className="hidden md:block h-screen sticky top-0">
                <Sidebar currentUser={user} currentView={view} setView={handleChangeView} onLogout={handleLogout} />
            </div>

            <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
                <div className="md:hidden flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-xl text-white ${user.role === UserRole.PARENT ? 'bg-orange-500' : 'bg-primary'}`}>
                            {user.role === UserRole.PARENT ? <Heart className="w-6 h-6 fill-current" /> : <SchoolIcon className="w-6 h-6" />}
                        </div>
                        <span className="font-display font-black text-slate-700 text-xl">EducaGame</span>
                    </div>
                    <button onClick={() => setMenuOpen(true)} className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-600">
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="max-w-7xl mx-auto animate-fade-in">
                    {renderView()}
                </div>
            </main>
        </div>
    );
};

export default App;