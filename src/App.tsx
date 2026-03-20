import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';
import { useEngineStore } from './store/useEngineStore';
import HeaderStats from './components/HeaderStats';
import SupplementSelector from './components/SupplementSelector';
import WarningAlerts from './components/ui/WarningAlerts';
import LoginScreen from './components/LoginScreen';
import BaselineSetupModal from './components/IqAssessment/BaselineSetupModal';
import ContextualAssistant from './components/ContextualAssistant';
import FitnessPanel from './components/FitnessPanel';
import JournalTimeline from './components/JournalTimeline';
import MasterChart from './components/MasterChart';
import AnalyticsDashboard from './components/Analytics/AnalyticsDashboard';
import DesktopSidebar from './components/ui/DesktopSidebar';
import MobileNav from './components/ui/MobileNav';
import ProfileView from './components/Views/ProfileView';
import HealthView from './components/Views/HealthView';
import { LogEvent } from './types';
import ToastContainer from './components/ui/ToastContainer';
import OnboardingTutorial from './components/ui/OnboardingTutorial';
import Modal from './components/ui/Modal';

const App: React.FC = () => {
    const {
        user,
        setUser,
        authLoading,
        hasCompletedAssessment,
        iqModalDismissed,
        dismissIqModal,
        activeView,
        accessibility
    } = useEngineStore();

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<LogEvent | null>(null);

    const accessibilityClasses = [
        accessibility.highContrast ? 'high-contrast' : '',
        accessibility.fontSize === 'large' ? 'accessibility-large' : ''
    ].join(' ');

    useEffect(() => {
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

    if (!user) {
        return <LoginScreen />;
    }

    return (
        <div className={`min-h-screen performance-bg font-sans text-slate-800 flex flex-col lg:flex-row transition-all duration-500 ${accessibilityClasses}`}>
            {!hasCompletedAssessment && !iqModalDismissed && (
                <BaselineSetupModal onClose={dismissIqModal} />
            )}
            
            <DesktopSidebar onOpenAddModal={() => setIsAddModalOpen(true)} />
            <div className="hidden lg:block w-64 flex-shrink-0" />

            <main className="flex-1 min-w-0 overflow-x-hidden pb-24 lg:pb-0">
                <div className="w-full max-w-[1400px] mx-auto p-4 md:p-8 lg:p-10 space-y-12">
                    
                    <HeaderStats />
                    <WarningAlerts />

                    {activeView === 'dashboard' ? (
                        <div className="flex flex-col gap-6">
                            <ContextualAssistant />
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                                <div className="lg:col-span-8 flex flex-col gap-8">
                                    <MasterChart />
                                    <div className="hidden lg:block">
                                        <SupplementSelector />
                                    </div>
                                </div>

                                <div className="lg:col-span-4 flex flex-col gap-8">
                                    <FitnessPanel />
                                    <JournalTimeline onEdit={(log) => setEditingEvent(log)} />
                                </div>
                            </div>
                        </div>
                    ) : activeView === 'analytics' ? (
                        <AnalyticsDashboard />
                    ) : activeView === 'health' ? (
                        <HealthView />
                    ) : activeView === 'profile' ? (
                        <ProfileView />
                    ) : null}
                </div>
            </main>

            <MobileNav onOpenAddModal={() => setIsAddModalOpen(true)} />
            <ToastContainer />
            <OnboardingTutorial />

            {/* Modal de Registro (FAB Action) */}
            <Modal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)}
                title="Nueva Optimización"
            >
                <SupplementSelector onComplete={() => setIsAddModalOpen(false)} />
            </Modal>

            {/* Modal de Edición */}
            <Modal
                isOpen={!!editingEvent}
                onClose={() => setEditingEvent(null)}
                title="Editar Registro"
            >
                {editingEvent && (
                    <SupplementSelector 
                        initialData={editingEvent} 
                        onComplete={() => setEditingEvent(null)} 
                    />
                )}
            </Modal>
        </div>
    );
};

export default App;
