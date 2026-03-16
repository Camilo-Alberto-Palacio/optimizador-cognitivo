import React, { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';
import { useEngineStore } from './store/useEngineStore';
import HeaderStats from './components/HeaderStats';
import MasterChart from './components/MasterChart';
import SupplementSelector from './components/SupplementSelector';
import FooterAnalysis from './components/FooterAnalysis';
import WarningAlerts from './components/ui/WarningAlerts';
import LoginScreen from './components/LoginScreen';
import BaselineSetupModal from './components/IqAssessment/BaselineSetupModal';
import FitnessPanel from './components/FitnessPanel';
import JournalTimeline from './components/JournalTimeline';
import AnalyticsDashboard from './components/Analytics/AnalyticsDashboard';

const App: React.FC = () => {
  const { user, authLoading, setUser, activeView, setActiveView, loadWeeklyFitnessData } = useEngineStore();

  useEffect(() => {
    // Escucha en tiempo real si el usuario inicia o cierra sesión
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [setUser]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Si no hay usuario, bloqueamos la app y mostramos el Login
  if (!user) {
    return <LoginScreen />;
  }

  const hasCompletedAssessment = useEngineStore.getState().hasCompletedAssessment;

  // Dashboard de Usuario Autenticado
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 font-sans text-slate-800">
      {!hasCompletedAssessment && <BaselineSetupModal />}
      
      <div className="max-w-7xl mx-auto">
        <HeaderStats />
        <WarningAlerts />

        {/* Navigation Tabs (v8.0 PRO) */}
        <div className="flex justify-center mb-8">
          <div className="bg-white border border-slate-200 p-1 rounded-2xl flex gap-1 shadow-sm">
            <button 
              onClick={() => setActiveView('dashboard')}
              className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${activeView === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Dashboard Diario
            </button>
            <button 
              onClick={() => {
                setActiveView('analytics');
                loadWeeklyFitnessData();
              }}
              className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${activeView === 'analytics' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Tendencias PRO
            </button>
          </div>
        </div>

        {activeView === 'dashboard' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Barra Lateral Izquierda: Datos de Salud y Bitácora */}
            <div className="lg:col-span-3 flex flex-col gap-6">
              <FitnessPanel />
              <JournalTimeline />
            </div>

            {/* Columna Principal: Visualización y Acción */}
            <div className="lg:col-span-9 flex flex-col gap-6">
              <MasterChart />
              <SupplementSelector />
            </div>
          </div>
        ) : (
          <AnalyticsDashboard />
        )}

        <FooterAnalysis />
      </div>
    </div>
  );
};

export default App;
