import React, { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';
import { useEngineStore } from './store/useEngineStore';
import HeaderStats from './components/HeaderStats';
import MasterChart from './components/MasterChart';
import SupplementSelector from './components/SupplementSelector';
import DynamicInsights from './components/DynamicInsights';
import WarningAlerts from './components/ui/WarningAlerts';
import LoginScreen from './components/LoginScreen';
import BaselineSetupModal from './components/IqAssessment/BaselineSetupModal';
import FitnessPanel from './components/FitnessPanel';
import JournalTimeline from './components/JournalTimeline';
import AnalyticsDashboard from './components/Analytics/AnalyticsDashboard';
import DesktopSidebar from './components/ui/DesktopSidebar';
import MobileNav from './components/ui/MobileNav';
import Modal from './components/ui/Modal';
import HealthView from './components/Views/HealthView';
import ProfileView from './components/Views/ProfileView';
import { useState } from 'react';

const App: React.FC = () => {
  const { user, authLoading, setUser, activeView, hasCompletedAssessment } = useEngineStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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

  const { iqModalDismissed, dismissIqModal } = useEngineStore();

  // Dashboard de Usuario Autenticado
  return (
    <div className="min-h-screen performance-bg font-sans text-slate-800 flex flex-col lg:flex-row">
      {!hasCompletedAssessment && !iqModalDismissed && (
        <BaselineSetupModal onClose={dismissIqModal} />
      )}
      
      {/* Sidebar Desktop */}
      <DesktopSidebar />
      <div className="hidden lg:block w-64 flex-shrink-0" />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-x-hidden pb-24 lg:pb-0">
        <div className="w-full max-w-[1400px] mx-auto p-4 md:p-8 lg:p-10 space-y-8">
          
          <HeaderStats />
          <WarningAlerts />

          {activeView === 'dashboard' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Columna Principal: Visualización y Gráfico */}
              <div className="lg:col-span-8 flex flex-col gap-8 order-2 lg:order-1">
                <MasterChart />
                <div className="hidden lg:block">
                    <SupplementSelector />
                </div>
              </div>

              {/* Barra Lateral Derecha (Desktop) / Arriba (Mobile): Salud y Bitácora */}
              <div className="lg:col-span-4 flex flex-col gap-8 order-1 lg:order-2">
                <FitnessPanel />
                <JournalTimeline />
              </div>
            </div>
          ) : activeView === 'analytics' ? (
            <AnalyticsDashboard />
          ) : activeView === 'health' ? (
            <HealthView />
          ) : (
            <ProfileView />
          )}

          <DynamicInsights />
        </div>
      </main>

      {/* Navegación Móvil */}
      <MobileNav onOpenAddModal={() => setIsAddModalOpen(true)} />

      {/* Modal de Registro (FAB Action) */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Registrar Optimización"
      >
        <SupplementSelector />
      </Modal>
    </div>
  );
};

export default App;
