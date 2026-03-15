import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { ChartDataPoint, Warning, LogEvent, FitnessData } from '../types';
import MathEngine from '../engine/calculator';
import { evaluateInteractions } from '../engine/rules';
import { fetchFitnessData, calculateFitnessImpact } from '../services/googleFit';

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
  // Google Fit
  fitAccessToken: string | null;
  fitnessData: FitnessData | null;
  setFitToken: (token: string) => void;
  loadFitnessData: () => Promise<void>;
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

      fitAccessToken: null,
      fitnessData: null,

      setFitToken: (token: string) => {
        set({ fitAccessToken: token });
      },

      loadFitnessData: async () => {
        const { fitAccessToken, baseIq, selectedDate } = get();
        if (!fitAccessToken) return;
        
        // Fetch data for the specific day being viewed
        const data = await fetchFitnessData(fitAccessToken, selectedDate);
        set({ fitnessData: data });
        
        // If we have sleep data, recalculate with adjusted IQ
        if (data.sleepHours !== null && baseIq) {
          const adjustedIq = calculateFitnessImpact(data, baseIq);
          get().recalculate();
          console.log(`Fitness IQ adjustment for ${selectedDate}: ${baseIq} → ${adjustedIq} (sleep: ${data.sleepHours}h, HR: ${data.restingHeartRate}bpm)`);
        }
      },

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
              const cloudOldLogs = data.logs; // Legacy flat array
              const cloudFavorites = data.favorites;
              const cloudBaseIq = data.baseIq;
              
              if (cloudBaseIq !== undefined) {
                  set({ baseIq: cloudBaseIq, hasCompletedAssessment: cloudBaseIq !== null });
              }

              if (cloudAllLogs) {
                // New format: use as-is
                set({ allLogs: cloudAllLogs });
              } else if (cloudOldLogs && Array.isArray(cloudOldLogs) && cloudOldLogs.length > 0) {
                // MIGRATION: convert legacy flat logs to allLogs map
                // Use timestamp to determine each log's date; fall back to yesterday
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const fallbackDate = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

                const migratedAllLogs: Record<string, LogEvent[]> = {};
                (cloudOldLogs as LogEvent[]).forEach((log) => {
                  // Determine date from timestamp or fall back
                  let dateStr = fallbackDate;
                  if (log.timestamp) {
                    const d = new Date(log.timestamp);
                    dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                  }
                  if (!migratedAllLogs[dateStr]) migratedAllLogs[dateStr] = [];
                  migratedAllLogs[dateStr].push({ ...log, date: dateStr });
                });

                set({ allLogs: migratedAllLogs });
                // Persist migrated structure to Firestore
                setDoc(docRef, { allLogs: migratedAllLogs }, { merge: true })
                  .catch(err => console.error('Migration save error:', err));
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
        // Refresh fitness data if we have a token
        if (get().fitAccessToken) {
          get().loadFitnessData();
        }
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
        const { allLogs, selectedDate, baseIq, fitnessData } = get();
        const logs = allLogs[selectedDate] || [];
        
        // Determinar el CI de base real para la gráfica (base estática vs ajustada por Fit)
        let effectiveBaseIq = baseIq || 133;
        if (fitnessData) {
          effectiveBaseIq = calculateFitnessImpact(fitnessData, effectiveBaseIq);
        }

        set({
          chartData: MathEngine.calculateDailyPerformance(logs, effectiveBaseIq),
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
