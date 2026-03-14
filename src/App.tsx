import React, { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';
import { useEngineStore } from './store/useEngineStore';
import HeaderStats from './components/HeaderStats';
import MasterChart from './components/MasterChart';
import ControlPanel from './components/ControlPanel';
import FooterAnalysis from './components/FooterAnalysis';
import WarningAlerts from './components/ui/WarningAlerts';
import LoginScreen from './components/LoginScreen';
import BaselineSetupModal from './components/IqAssessment/BaselineSetupModal';

const App: React.FC = () => {
  const { user, authLoading, setUser } = useEngineStore();

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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <MasterChart />
          <ControlPanel />
        </div>

        <FooterAnalysis />
      </div>
    </div>
  );
};

export default App;
