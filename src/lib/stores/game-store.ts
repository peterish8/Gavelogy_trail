import { create } from 'zustand';

interface GamePlayer {
  id: string;
  displayName: string;
  avatarUrl?: string;
  isBot: boolean;
  score: number;
  currentQuestion: number;
  eliminated?: boolean;
}

interface GameQuestion {
  id: string;
  text: string;
  options: string[]; // ['Option A', 'Option B', ...]
  title?: string; // Case Title
  passage?: string; // Case Passage
  correctAnswer?: string;
  explanation?: string;
}

interface GameState {
  // Lobby state
  lobbyId: string | null;
  mode: 'duel' | 'arena' | 'tagteam' | 'speed_court' | null;
  status: 'matchmaking' | 'waiting' | 'active' | 'finished';
  
  
  // Players
  players: GamePlayer[];
  currentUserId: string;
  
  // Questions
  questions: GameQuestion[];
  currentQuestionIndex: number;
  currentRound: number;
  
  // Scoring
  userScore: number;
  userAnswers: Record<string, { answer: string; timeTaken: number }>;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  showResults: boolean;
  
  // Actions
  setLobbyId: (id: string | null) => void;
  setMode: (mode: 'duel' | 'arena' | 'tagteam' | 'speed_court' | null) => void;
  setStatus: (status: GameState['status']) => void;
  setPlayers: (players: GamePlayer[]) => void;
  addPlayer: (player: GamePlayer) => void;
  removePlayer: (playerId: string) => void;
  updatePlayerProgress: (playerId: string, progress: Partial<GamePlayer>) => void;
  setQuestions: (questions: GameQuestion[]) => void;
  nextQuestion: () => void;
  submitAnswer: (questionId: string, answer: string, timeTaken: number) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  // Initial state
  lobbyId: null,
  mode: null,
  status: 'matchmaking',
  players: [],
  currentUserId: '',
  questions: [],
  currentQuestionIndex: 0,
  currentRound: 1,
  userScore: 0,
  userAnswers: {},
  isLoading: false,
  error: null,
  showResults: false,
  
  // Actions
  setLobbyId: (id) => set({ lobbyId: id }),
  setMode: (mode) => set({ mode }),
  setStatus: (status) => set({ status }),
  setPlayers: (players) => set({ players }),
  
  addPlayer: (player) => set((state) => ({
    players: [...state.players, player]
  })),
  
  removePlayer: (playerId) => set((state) => ({
    players: state.players.filter(p => p.id !== playerId)
  })),
  
  updatePlayerProgress: (playerId, progress) => set((state) => ({
    players: state.players.map(p =>
      p.id === playerId ? { ...p, ...progress } : p
    )
  })),
  
  setQuestions: (questions) => set({ questions }),
  
  nextQuestion: () => set((state) => ({
    currentQuestionIndex: state.currentQuestionIndex + 1
  })),
  
  submitAnswer: (questionId, answer, timeTaken) => set((state) => ({
    userAnswers: {
      ...state.userAnswers,
      [questionId]: { answer, timeTaken }
    }
  })),

  setError: (error) => set({ error }),
  
  reset: () => set({
    lobbyId: null,
    mode: null,
    status: 'matchmaking',
    players: [],
    questions: [],
    currentQuestionIndex: 0,
    currentRound: 1,
    userScore: 0,
    userAnswers: {},
    showResults: false,
    error: null
  })
}));
