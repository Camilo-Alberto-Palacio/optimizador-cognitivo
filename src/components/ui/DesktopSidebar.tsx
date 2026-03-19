import React from 'react';
import { 
    LayoutDashboard, 
    BarChart3, 
    User, 
    LogOut, 
    Zap,
    HeartPulse
} from 'lucide-react';
import { useEngineStore } from '../../store/useEngineStore';
import { auth } from '../../services/firebase';

const DesktopSidebar: React.FC = () => {
    const { activeView, setActiveView, user, loadWeeklyFitnessData } = useEngineStore();

    const menuItems = [
        { id: 'dashboard', label: 'Panel Diario', icon: LayoutDashboard, action: () => setActiveView('dashboard') },
        { id: 'analytics', label: 'Tendencias Pro', icon: BarChart3, action: () => { 
            setActiveView('analytics'); 
            loadWeeklyFitnessData(); 
        }},
        { id: 'health', label: 'Bio-Métricas', icon: HeartPulse, action: () => setActiveView('dashboard') }, // Por ahora redirige al dashboard
    ];

    return (
        <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-white border-r border-slate-200 z-50">
            {/* Logo Area */}
            <div className="p-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                        <Zap size={20} className="text-white fill-current" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-800 leading-none">Quantum</h1>
                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-tighter">Bio-Engine v8.5</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-4 space-y-2">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={item.action}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200 ${
                            activeView === item.id 
                            ? 'bg-indigo-50 text-indigo-600 shadow-sm' 
                            : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                        }`}
                    >
                        <item.icon size={18} strokeWidth={2.5} />
                        {item.label}
                    </button>
                ))}
            </nav>

            {/* User Profile & Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 overflow-hidden border-2 border-white shadow-sm">
                        {user?.photoURL ? (
                            <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-500">
                                <User size={20} />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-slate-800 truncate">{user?.displayName || 'Biovacker'}</p>
                        <p className="text-[9px] font-bold text-slate-400 truncate uppercase">Plan Optimizador</p>
                    </div>
                </div>
                
                <button 
                    onClick={() => auth.signOut()}
                    className="w-full mt-2 flex items-center gap-3 px-4 py-2.5 rounded-xl text-[11px] font-black text-rose-400 hover:bg-rose-50 transition-all uppercase tracking-wider"
                >
                    <LogOut size={14} />
                    Cerrar Sesión
                </button>
            </div>
        </aside>
    );
};

export default DesktopSidebar;
