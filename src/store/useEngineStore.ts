import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { ChartDataPoint, Warning, LogEvent } from '../types';
import MathEngine from '../engine/calculator';
import { evaluateInteractions } from '../engine/rules';

interface EngineState {
  logs: LogEvent[];
  favorites: string[];
  chartData: ChartDataPoint[];
  warnings: Warning[];
  // Assessment State
  baseIq: number | null;
  hasCompletedAssessment: boolean;
  // Auth State
  user: User | null;
  authLoading: boolean;
  setUser: (user: User | null) => void;
  // Methods
  setBaseIq: (iq: number) => void;
  resetAssessment: () => void;
  addLog: (supplementId: string, timeStr: string, quantity?: number) => void;
  removeLog: (id: string) => void;
  toggleFavorite: (supplementId: string) => void;
  recalculate: () => void;
}

export const useEngineStore = create<EngineState>()(
  persist(
    (set, get) => ({
      logs: [],
      favorites: ['creatina', 'magnesio', 'cafe'], // Default favorites
      // We initialize the chart and warnings immediately on creation
      chartData: MathEngine.calculateDailyPerformance([], 133), // default 133 will be recalculated when loaded
      warnings: evaluateInteractions([]),
      
      baseIq: null,
      hasCompletedAssessment: false,

      user: null,
      authLoading: true,

      setUser: async (user) => {
        set({ user, authLoading: false });
        if (user) {
          try {
            const docRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const data = docSnap.data();
              const cloudLogs = data.logs;
              const cloudFavorites = data.favorites;
              const cloudBaseIq = data.baseIq;
              
              if (cloudBaseIq !== undefined) {
                  set({ baseIq: cloudBaseIq, hasCompletedAssessment: cloudBaseIq !== null });
              }

              if (cloudLogs) {
                set({ logs: cloudLogs });
              }

              if (cloudFavorites) {
                set({ favorites: cloudFavorites });
              }

              get().recalculate();
            }
          } catch (e) {
            console.error("Error loading state from Firestore:", e);
          }
        }
      },

  setBaseIq: (iq: number) => {
      set({ baseIq: iq, hasCompletedAssessment: true });
      const state = get();
      if (state.user) {
          setDoc(doc(db, 'users', state.user.uid), { baseIq: iq }, { merge: true })
            .catch(err => console.error("Error saving to cloud:", err));
      }
      state.recalculate();
  },

  resetAssessment: () => {
      set({ hasCompletedAssessment: false, baseIq: null });
  },

  addLog: (supplementId: string, timeStr: string, quantity: number = 1) => {
    set((state) => {
      const newEvent: LogEvent = {
        id: crypto.randomUUID(), // Usando UUID nativo del navegador
        supplementId,
        timeStr,
        timestamp: Date.now(),
        quantity
      };
      const newLogs = [...state.logs, newEvent];

      if (state.user) {
        setDoc(doc(db, 'users', state.user.uid), { logs: newLogs }, { merge: true })
          .catch(err => console.error("Error saving to cloud:", err));
      }
      
      return { 
        logs: newLogs,
        chartData: MathEngine.calculateDailyPerformance(newLogs, state.baseIq || 133),
        warnings: evaluateInteractions(newLogs)
      };
    });
  },

  removeLog: (id: string) => {
    set((state) => {
      const newLogs = state.logs.filter(log => log.id !== id);
      if (state.user) {
        setDoc(doc(db, 'users', state.user.uid), { logs: newLogs }, { merge: true });
      }
      return { 
        logs: newLogs,
        chartData: MathEngine.calculateDailyPerformance(newLogs, state.baseIq || 133),
        warnings: evaluateInteractions(newLogs)
      };
    });
  },

  toggleFavorite: (supplementId: string) => {
    set((state) => {
      const exists = state.favorites.includes(supplementId);
      const newFavs = exists 
        ? state.favorites.filter(f => f !== supplementId)
        : [...state.favorites, supplementId];

      if (state.user) {
        setDoc(doc(db, 'users', state.user.uid), { favorites: newFavs }, { merge: true });
      }

      return { favorites: newFavs };
    });
  },

      recalculate: () => {
        const { logs, baseIq } = get();
        set({
          chartData: MathEngine.calculateDailyPerformance(logs, baseIq || 133),
          warnings: evaluateInteractions(logs)
        });
      }
    }),
    {
      name: 'quantum-engine-storage', // name of the item in the storage (must be unique)
      partialize: (state) => ({ 
          logs: state.logs,
          favorites: state.favorites,
          baseIq: state.baseIq,
          hasCompletedAssessment: state.hasCompletedAssessment
      }), 
      onRehydrateStorage: () => (state) => {
        // Cuando se recarga la página y saca los botones del localStorage, forzamos que se recalcule la gráfica con esos botones viejos.
        if (state) {
            state.recalculate();
        }
      }
    }
  )
);
