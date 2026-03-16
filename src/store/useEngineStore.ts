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
  manualSleepAdjustment: Record<string, number>; // Ajuste de horas por 'YYYY-MM-DD'
  // Analytics
  activeView: 'dashboard' | 'analytics';
  weeklyFitnessData: Record<string, FitnessData>;
  isLoadingWeekly: boolean;
  setFitToken: (token: string) => void;
  loadFitnessData: () => Promise<void>;
  loadWeeklyFitnessData: () => Promise<void>;
  setActiveView: (view: 'dashboard' | 'analytics') => void;
  updateManualSleep: (hours: number) => void;
  // Methods
  setBaseIq: (iq: number) => void;
  resetAssessment: () => void;
  setSelectedDate: (date: string) => void;
  addLog: (supplementId: string, timeStr: string, quantity?: number, note?: string) => void;
  removeLog: (id: string) => void;
  toggleFavorite: (supplementId: string) => void;
  toggleLogVisibility: (id: string) => void;
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
      manualSleepAdjustment: {},
      activeView: 'dashboard',
      weeklyFitnessData: {},
      isLoadingWeekly: false,

      setFitToken: (token: string) => {
        set({ fitAccessToken: token });
      },

      setActiveView: (view) => set({ activeView: view }),

      loadFitnessData: async () => {
        const { fitAccessToken, baseIq, selectedDate } = get();
        if (!fitAccessToken) return;
        
        try {
          // Fetch data for the specific day being viewed
          const data = await fetchFitnessData(fitAccessToken, selectedDate);
          
          // Check if the API returned null (might be due to expired token)
          if (!data.lastFetched && fitAccessToken) {
            console.warn("Fitness data fetch failed. Token might be expired.");
            // Marcamos como cargado (aunque sea con nulos) para detener el spinner de carga
            set({ fitnessData: { ...data, lastFetched: Date.now() } });
            return;
          }

          set({ fitnessData: data });
          get().recalculate();
          
          if (data.sleepHours !== null && baseIq) {
            console.log(`Fitness IQ adjustment for ${selectedDate}: ${baseIq} → ${calculateFitnessImpact(data, baseIq)} (sleep: ${data.sleepHours}h)`);
          }
        } catch (error: any) {
          console.error("Error in loadFitnessData:", error);
          // Detener el estado de carga incluso en error grave
          set({ fitnessData: get().fitnessData || { sleepHours: null, restingHeartRate: null, steps: null, activeCalories: null, lastFetched: Date.now() } });
          
          if (error.message === 'UNAUTHORIZED') {
             console.warn("Token de Google Fit expirado. Limpiando para re-vincular.");
             set({ fitAccessToken: null, fitnessData: null });
             get().recalculate();
          }
        }
      },

      loadWeeklyFitnessData: async () => {
        const { fitAccessToken } = get();
        if (!fitAccessToken) return;
        set({ isLoadingWeekly: true });
        try {
          const { fetchWeeklyFitnessData } = await import('../services/googleFit');
          const data = await fetchWeeklyFitnessData(fitAccessToken);
          set({ weeklyFitnessData: data, isLoadingWeekly: false });
        } catch (error) {
          console.error("Error loading weekly fit data:", error);
          set({ isLoadingWeekly: false });
        }
      },

      updateManualSleep: (hours: number) => {
        const { selectedDate, manualSleepAdjustment, user } = get();
        const currentAdj = Number(manualSleepAdjustment[selectedDate] || 0);
        const newAdjustment = {
          ...manualSleepAdjustment,
          [selectedDate]: Math.round(Math.max(-24, Math.min(24, currentAdj + Number(hours))) * 2) / 2
        };
        
        set({ manualSleepAdjustment: newAdjustment });
        
        if (user) {
          setDoc(doc(db, 'users', user.uid), { manualSleepAdjustment: newAdjustment }, { merge: true })
            .catch(err => console.error("Error saving manual sleep to cloud:", err));
        }
        
        get().recalculate();
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

              if (data.manualSleepAdjustment) {
                set({ manualSleepAdjustment: data.manualSleepAdjustment });
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
          
          return { allLogs: newAllLogs };
        });
        get().recalculate();
      },

      removeLog: (id: string) => {
        set((state) => {
          const date = state.selectedDate;
          const newDateLogs = (state.allLogs[date] || []).filter(log => log.id !== id);
          const newAllLogs = { ...state.allLogs, [date]: newDateLogs };
          if (state.user) {
            setDoc(doc(db, 'users', state.user.uid), { allLogs: newAllLogs }, { merge: true });
          }
          return { allLogs: newAllLogs };
        });
        get().recalculate();
      },

      toggleLogVisibility: (id: string) => {
        set((state) => {
          const date = state.selectedDate;
          const newDateLogs = (state.allLogs[date] || []).map(log => 
            log.id === id ? { ...log, hidden: !log.hidden } : log
          );
          const newAllLogs = { ...state.allLogs, [date]: newDateLogs };
          if (state.user) {
            setDoc(doc(db, 'users', state.user.uid), { allLogs: newAllLogs }, { merge: true });
          }
          return { allLogs: newAllLogs };
        });
        get().recalculate();
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
        const { allLogs, selectedDate, baseIq, fitnessData, manualSleepAdjustment } = get();
        const logs = allLogs[selectedDate] || [];
        
        const staticBaseIq = baseIq || 133;
        let effectiveBaseIq = staticBaseIq;
        if (fitnessData) {
          // Ajustar los datos de fitness con el offset manual antes de calcular el impacto
          const adj = Number(manualSleepAdjustment[selectedDate] || 0);
          const rawSleep = fitnessData.sleepHours !== null ? Number(fitnessData.sleepHours) : null;
          
          const adjustedFitness = {
            ...fitnessData,
            sleepHours: rawSleep !== null ? Math.max(0, rawSleep + adj) : (adj > 0 ? adj : null)
          };
          effectiveBaseIq = calculateFitnessImpact(adjustedFitness, staticBaseIq);
        }

        set({
          chartData: MathEngine.calculateDailyPerformance(logs, effectiveBaseIq, staticBaseIq),
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
          selectedDate: state.selectedDate,
          fitAccessToken: state.fitAccessToken,
          manualSleepAdjustment: state.manualSleepAdjustment,
          weeklyFitnessData: state.weeklyFitnessData
      }), 
      onRehydrateStorage: () => (state) => {
        if (state) {
            // Snap selected date back to today when reloading
            state.selectedDate = getTodayStr();
            state.recalculate();
            
            // Auto-load fitness data if we have a token preserved
            if (state.fitAccessToken) {
              console.log("Rehydration: Found fitAccessToken, auto-loading data...");
              setTimeout(() => state.loadFitnessData(), 1000);
            }
        }
      }
    }
  )
);
