import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { ChartDataPoint, Warning, LogEvent, FitnessData } from '../types';
import MathEngine from '../engine/calculator';
import { evaluateInteractions } from '../engine/rules';
import { fetchFitnessData, calculateFitnessImpact } from '../services/googleFit';
import { refreshGoogleFitToken } from '../services/firebase';

// Helper to get today's date as YYYY-MM-DD
export const getTodayStr = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export interface ToastNotification {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

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
  isFetchingFitness: boolean;
  manualSleepAdjustment: Record<string, number>; // Ajuste de horas por 'YYYY-MM-DD'
  // Analytics
  activeView: 'dashboard' | 'analytics' | 'health' | 'profile';
  weeklyFitnessData: Record<string, FitnessData>;
  isLoadingWeekly: boolean;
  stressLevel: Record<string, number>; // Nivel de estrés por 'YYYY-MM-DD' (1-10)
  manualSpO2: Record<string, number>; // Oxígeno manual por 'YYYY-MM-DD'
  iqModalDismissed: boolean;
  // Notifications
  notifications: ToastNotification[];
  notify: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissNotification: (id: string) => void;

  setFitToken: (token: string) => void;
  loadFitnessData: () => Promise<void>;
  loadWeeklyFitnessData: () => Promise<void>;
  setActiveView: (view: 'dashboard' | 'analytics' | 'health' | 'profile') => void;
  updateManualSleep: (hours: number) => void;
  updateStressLevel: (level: number) => void;
  updateManualSpO2: (value: number) => void;
  hasSeenTutorial: boolean;
  setHasSeenTutorial: (val: boolean) => void;
  // Methods
  setBaseIq: (iq: number) => void;
  resetAssessment: () => void;
  dismissIqModal: () => void;
  setSelectedDate: (date: string) => void;
  addLog: (supplementId: string, timeStr: string, quantity?: number, note?: string) => void;
  updateLog: (id: string, supplementId: string, timeStr: string, quantity: number, note?: string) => void;
  removeLog: (id: string) => void;
  toggleFavorite: (supplementId: string) => void;
  toggleLogVisibility: (id: string) => void;
  recalculate: () => void;
  // Derived helpers
  getLogsForDate: (date: string) => LogEvent[];
  getHistoricalSeries: (days?: number) => { date: string; ci: number; sleep: number; steps: number; supplements: Record<string, number> }[];
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
      isFetchingFitness: false,
      manualSleepAdjustment: {},
      activeView: 'dashboard',
      weeklyFitnessData: {},
      isLoadingWeekly: false,
      stressLevel: {},
      manualSpO2: {},
      iqModalDismissed: false,
      notifications: [],
      hasSeenTutorial: false,

      setHasSeenTutorial: (val) => set({ hasSeenTutorial: val }),

      notify: (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const id = crypto.randomUUID();
        set((state) => ({
          notifications: [...state.notifications, { id, message, type }]
        }));
        // Auto-remove after 3 seconds
        setTimeout(() => get().dismissNotification(id), 3000);
      },

      dismissNotification: (id: string) => {
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }));
      },

      setFitToken: (token: string) => {
        set({ fitAccessToken: token });
        // Auto-cargar datos al recibir un token nuevo
        setTimeout(() => get().loadFitnessData(), 500);
      },

      setActiveView: (view: 'dashboard' | 'analytics' | 'health' | 'profile') => set({ activeView: view }),

      loadFitnessData: async () => {
        const { fitAccessToken, selectedDate } = get();
        if (!fitAccessToken) return;
        
        // Capturar la fecha al inicio de la petición para detectar cambios
        const requestDate = selectedDate;
        set({ isFetchingFitness: true, fitnessData: null });
        
        try {
          const data = await fetchFitnessData(fitAccessToken as string, requestDate);
          
          // Si el usuario cambió de fecha mientras esperábamos, descartar el resultado
          if (get().selectedDate !== requestDate) {
            console.log(`[GoogleFit] Resultado obsoleto para ${requestDate}, descartando.`);
            return; // finally limpiará isFetchingFitness de todos modos
          }

          if (data && data.lastFetched) {
            set({ fitnessData: data });
            get().recalculate();
            console.log(`[GoogleFit] Datos cargados para ${requestDate}:`, data);
          } else {
            console.warn('[GoogleFit] La API no devolvió datos para', requestDate);
            set({ fitnessData: null });
          }
        } catch (error: any) {
          console.error('[GoogleFit] Error cargando datos:', error);
          set({ fitnessData: null });
          if (error.message === 'UNAUTHORIZED') {
            console.warn('[Store] Token expirado. Intentando renovar silenciosamente...');
            set({ fitAccessToken: null });
            refreshGoogleFitToken().then(newToken => {
              if (newToken) {
                console.log('[Store] Token renovado, recargando datos...');
                set({ fitAccessToken: newToken });
                setTimeout(() => get().loadFitnessData(), 500);
              }
            });
          }
        } finally {
          // SIEMPRE limpiar el spinner — sin condición de fecha
          set({ isFetchingFitness: false });
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

      updateStressLevel: (level: number) => {
        const { selectedDate, stressLevel, user } = get();
        const newStress = {
          ...stressLevel,
          [selectedDate]: Math.round(Math.max(1, Math.min(10, level)))
        };
        set({ stressLevel: newStress });
        if (user) {
          setDoc(doc(db, 'users', user.uid), { stressLevel: newStress }, { merge: true })
            .catch(err => console.error("Error saving stress level to cloud:", err));
        }
        get().recalculate();
      },

      updateManualSpO2: (value: number) => {
        const { selectedDate, manualSpO2, user } = get();
        const newSpO2 = {
          ...manualSpO2,
          [selectedDate]: Math.round(Math.max(50, Math.min(100, value))) // Rango seguro
        };
        set({ manualSpO2: newSpO2 });
        if (user) {
          setDoc(doc(db, 'users', user.uid), { manualSpO2: newSpO2 }, { merge: true })
            .catch(err => console.error("Error saving manual SpO2 to cloud:", err));
        }
        get().recalculate();
      },

      getLogsForDate: (date: string) => {
        return get().allLogs[date] || [];
      },

      /**
       * Extractor de series temporales para analítica
       */
      getHistoricalSeries: (days: number = 7) => {
        const { allLogs, baseIq, weeklyFitnessData, manualSleepAdjustment } = get();
        const staticBaseIq = baseIq || 133;
        const series: { date: string; ci: number; sleep: number; steps: number; supplements: Record<string, number> }[] = [];
        
        const today = new Date();
        for (let i = 0; i < days; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          
          const logs = allLogs[dStr] || [];
          const fit = weeklyFitnessData[dStr] || { sleepHours: null, steps: null };
          
          // Calcular CI Pico para ese día
          const adj = Number(manualSleepAdjustment[dStr] || 0);
          // Importante: No usar toISOString para evitar desfase UTC
          const rawSleep = fit.sleepHours !== null ? Number(fit.sleepHours) : null;
          const adjustedFitness = {
            ...fit,
            sleepHours: rawSleep !== null ? Math.max(0, rawSleep + adj) : (adj > 0 ? adj : null)
          };
          const effectiveBaseIq = calculateFitnessImpact(adjustedFitness as any, staticBaseIq);
          const dailyChart = MathEngine.calculateDailyPerformance(logs, effectiveBaseIq, staticBaseIq);
          const peakCi = Math.max(...dailyChart.map(p => p.iq), staticBaseIq);

          // Contar suplementos únicos ese día
          const supplementCounts: Record<string, number> = {};
          logs.filter(l => !l.hidden).forEach(l => {
            supplementCounts[l.supplementId] = (supplementCounts[l.supplementId] || 0) + (l.quantity || 1);
          });

          series.push({
            date: dStr,
            ci: peakCi,
            sleep: adjustedFitness.sleepHours || 0,
            steps: fit.steps || 0,
            supplements: supplementCounts
          });
        }
        return series.reverse();
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

              if (data.stressLevel) {
                set({ stressLevel: data.stressLevel });
              }

              if (data.manualSpO2) {
                set({ manualSpO2: data.manualSpO2 });
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
          set({ hasCompletedAssessment: false, baseIq: null, iqModalDismissed: false });
      },

      dismissIqModal: () => set({ iqModalDismissed: true }),

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
            ...(note ? { note } : { note: "" })
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

      updateLog: (id: string, supplementId: string, timeStr: string, quantity: number, note?: string) => {
        set((state) => {
          const date = state.selectedDate;
          const newDateLogs = (state.allLogs[date] || []).map(log => 
            log.id === id ? { ...log, supplementId, timeStr, quantity, note: note || "" } : log
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
        const { allLogs, selectedDate, baseIq, fitnessData, manualSleepAdjustment, stressLevel, manualSpO2 } = get();
        const logs = allLogs[selectedDate] || [];
        
        const staticBaseIq = baseIq || 133;
        let effectiveBaseIq = staticBaseIq;

        // --- IMPACTO DEL ESTRÉS (MANUAL) ---
        const currentStress = stressLevel[selectedDate] || 1;
        if (currentStress >= 4) {
          // El estrés penaliza el baseIq directamente
          // 4-6: -5 a -10
          // 7-10: -15 a -30
          const stressPenalty = currentStress < 7 
            ? (currentStress - 3) * 3 
            : 10 + (currentStress - 6) * 5;
          effectiveBaseIq -= stressPenalty;
        }

        if (fitnessData) {
          // Ajustar los datos de fitness con el offset manual antes de calcular el impacto
          const adj = Number(manualSleepAdjustment[selectedDate] || 0);
          const rawSleep = fitnessData.sleepHours !== null ? Number(fitnessData.sleepHours) : null;
          
          const adjustedFitness = {
            ...fitnessData,
            sleepHours: rawSleep !== null ? Math.max(0, rawSleep + adj) : (adj > 0 ? adj : null),
            spo2: manualSpO2[selectedDate] || fitnessData.spo2 // Priorizar manual
          };
          effectiveBaseIq = calculateFitnessImpact(adjustedFitness, staticBaseIq);
        } else {
          // Si no hay datos de fitness, pero hay ajustes manuales de sueño o SpO2
          const manualSleep = Number(manualSleepAdjustment[selectedDate] || 0);
          const manualOxy = manualSpO2[selectedDate] || null;
          if (manualSleep !== 0 || manualOxy !== null) {
              const dummyFitness: FitnessData = {
                  sleepHours: manualSleep > 0 ? manualSleep : null,
                  restingHeartRate: null,
                  steps: null,
                  spo2: manualOxy,
                  activeCalories: null,
                  lastFetched: Date.now()
              };
              effectiveBaseIq = calculateFitnessImpact(dummyFitness, staticBaseIq);
          }
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
          stressLevel: state.stressLevel,
          manualSpO2: state.manualSpO2,
          weeklyFitnessData: state.weeklyFitnessData,
          iqModalDismissed: state.iqModalDismissed,
          hasSeenTutorial: state.hasSeenTutorial
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
