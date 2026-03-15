import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { ChartDataPoint, Warning, LogEvent } from '../types';
import MathEngine from '../engine/calculator';
import { evaluateInteractions } from '../engine/rules';

// Helper to get today's date as YYYY-MM-DD
export const getTodayStr = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

interface EngineState {
  // Multi-day journal: keyed by 'YYYY-MM-DD'
  allLogs: Record<string, LogEvent[]>;
  // The currently viewed date
  selectedDate: string;
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
  setSelectedDate: (date: string) => void;
  addLog: (supplementId: string, timeStr: string, quantity?: number, note?: string) => void;
  removeLog: (id: string) => void;
  toggleFavorite: (supplementId: string) => void;
  recalculate: () => void;
  // Derived helpers
  getLogsForDate: (date: string) => LogEvent[];
}

export const useEngineStore = create<EngineState>()(
  persist(
    (set, get) => ({
      allLogs: {},
      selectedDate: getTodayStr(),
      favorites: ['creatina_mono', 'mag_glicinato', 'cafe'],
      chartData: MathEngine.calculateDailyPerformance([], 133),
      warnings: evaluateInteractions([]),
      
      baseIq: null,
      hasCompletedAssessment: false,

      user: null,
      authLoading: true,

      getLogsForDate: (date: string) => {
        return get().allLogs[date] || [];
      },

      setUser: async (user) => {
        set({ user, authLoading: false });
        if (user) {
          try {
            const docRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const data = docSnap.data();
              const cloudAllLogs = data.allLogs;
              const cloudFavorites = data.favorites;
              const cloudBaseIq = data.baseIq;
              
              if (cloudBaseIq !== undefined) {
                  set({ baseIq: cloudBaseIq, hasCompletedAssessment: cloudBaseIq !== null });
              }

              if (cloudAllLogs) {
                set({ allLogs: cloudAllLogs });
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

      setSelectedDate: (date: string) => {
        set({ selectedDate: date });
        get().recalculate();
      },

      addLog: (supplementId: string, timeStr: string, quantity: number = 1, note?: string) => {
        set((state) => {
          const date = state.selectedDate;
          const newEvent: LogEvent = {
            id: crypto.randomUUID(),
            supplementId,
            date,
            timeStr,
            timestamp: Date.now(),
            quantity,
            ...(note ? { note } : {})
          };
          const todayLogs = state.allLogs[date] || [];
          const newAllLogs = {
            ...state.allLogs,
            [date]: [...todayLogs, newEvent]
          };

          if (state.user) {
            setDoc(doc(db, 'users', state.user.uid), { allLogs: newAllLogs }, { merge: true })
              .catch(err => console.error("Error saving to cloud:", err));
          }
          
          const logsForSelected = newAllLogs[date] || [];
          return { 
            allLogs: newAllLogs,
            chartData: MathEngine.calculateDailyPerformance(logsForSelected, state.baseIq || 133),
            warnings: evaluateInteractions(logsForSelected)
          };
        });
      },

      removeLog: (id: string) => {
        set((state) => {
          const date = state.selectedDate;
          const newDateLogs = (state.allLogs[date] || []).filter(log => log.id !== id);
          const newAllLogs = { ...state.allLogs, [date]: newDateLogs };
          if (state.user) {
            setDoc(doc(db, 'users', state.user.uid), { allLogs: newAllLogs }, { merge: true });
          }
          return { 
            allLogs: newAllLogs,
            chartData: MathEngine.calculateDailyPerformance(newDateLogs, state.baseIq || 133),
            warnings: evaluateInteractions(newDateLogs)
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
        const { allLogs, selectedDate, baseIq } = get();
        const logs = allLogs[selectedDate] || [];
        set({
          chartData: MathEngine.calculateDailyPerformance(logs, baseIq || 133),
          warnings: evaluateInteractions(logs)
        });
      }
    }),
    {
      name: 'quantum-engine-storage-v2', // incremented to avoid stale state
      partialize: (state) => ({ 
          allLogs: state.allLogs,
          favorites: state.favorites,
          baseIq: state.baseIq,
          hasCompletedAssessment: state.hasCompletedAssessment,
          selectedDate: state.selectedDate
      }), 
      onRehydrateStorage: () => (state) => {
        if (state) {
            // Snap selected date back to today when reloading
            state.selectedDate = getTodayStr();
            state.recalculate();
        }
      }
    }
  )
);
