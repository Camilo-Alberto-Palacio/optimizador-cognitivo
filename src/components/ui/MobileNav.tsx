import React from 'react';
import { 
    LayoutDashboard, 
    BarChart3, 
    Plus, 
    Heart, 
    User 
} from 'lucide-react';
import { useEngineStore } from '../../store/useEngineStore';

interface MobileNavProps {
    onOpenAddModal: () => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ onOpenAddModal }) => {
    const { activeView, setActiveView, loadWeeklyFitnessData } = useEngineStore();

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-6 py-3 z-50 flex items-center justify-between pb-safe">
            <button 
                onClick={() => setActiveView('dashboard')}
                className={`flex flex-col items-center gap-1 transition-all ${activeView === 'dashboard' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}
            >
                <LayoutDashboard size={20} strokeWidth={activeView === 'dashboard' ? 3 : 2} />
                <span className="text-[9px] font-bold uppercase tracking-widest">Hoy</span>
            </button>

            <button 
                onClick={() => {
                    setActiveView('analytics');
                    loadWeeklyFitnessData();
                }}
                className={`flex flex-col items-center gap-1 transition-all ${activeView === 'analytics' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}
            >
                <BarChart3 size={20} strokeWidth={activeView === 'analytics' ? 3 : 2} />
                <span className="text-[9px] font-bold uppercase tracking-widest">Pro</span>
            </button>

            {/* FAB Middle Button */}
            <div className="relative -top-6">
                <button 
                    onClick={onOpenAddModal}
                    className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-indigo-200 border-4 border-white active:scale-95 transition-transform"
                >
                    <Plus size={28} strokeWidth={3} />
                </button>
            </div>

            <button className="flex flex-col items-center gap-1 text-slate-400">
                <Heart size={20} strokeWidth={2} />
                <span className="text-[9px] font-bold uppercase tracking-widest">Salud</span>
            </button>

            <button className="flex flex-col items-center gap-1 text-slate-400">
                <User size={20} strokeWidth={2} />
                <span className="text-[9px] font-bold uppercase tracking-widest">Tú</span>
            </button>
        </nav>
    );
};

export default MobileNav;
