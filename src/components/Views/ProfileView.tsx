import React from 'react';
import { User, ShieldCheck, RefreshCw, LogOut, ChevronRight, Zap, Star, ShieldAlert } from 'lucide-react';
import { useEngineStore } from '../../store/useEngineStore';
import { auth } from '../../services/firebase';

const ProfileView: React.FC = () => {
    const { user, baseIq, resetAssessment } = useEngineStore();

    const sections = [
        {
            title: "Configuración Humana",
            items: [
                { id: 'iq', label: 'Línea Base Cognitiva', sub: `CI Base Actual: ${baseIq}`, icon: Zap, action: resetAssessment, color: 'text-indigo-500' },
                { id: 'biopay', label: 'Bio-Parámetros', sub: 'Ajustes de sensibilidad', icon: ShieldCheck, color: 'text-emerald-500' },
                { id: 'sync', label: 'Ecosistema de Datos', sub: 'Configurar Google Fit', icon: RefreshCw, color: 'text-sky-500' },
            ]
        },
        {
            title: "Seguridad y Privacidad",
            items: [
                { id: 'security', label: 'Protección de Datos', sub: 'Encriptación biométrica activa', icon: Star, color: 'text-amber-500' },
                { id: 'support', label: 'Protocolo de Soporte', sub: 'Guía de uso v8.5 PRO', icon: ShieldAlert, color: 'text-rose-500' },
            ]
        }
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8 pb-10">
            {/* Profile Header */}
            <header className="flex flex-col items-center text-center pt-4">
                <div className="relative mb-4">
                    <div className="w-24 h-24 rounded-[2.5rem] bg-indigo-100 border-4 border-white shadow-xl overflow-hidden">
                        {user?.photoURL ? (
                            <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-indigo-500">
                                <User size={40} />
                            </div>
                        )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white border-4 border-white shadow-lg">
                        <Star size={14} className="fill-current" />
                    </div>
                </div>
                <h2 className="text-2xl font-black text-slate-800">{user?.displayName || 'Biovacker Pro'}</h2>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">Nivel: Optimizador Alfa</p>
                <div className="mt-4 px-4 py-1.5 bg-white rounded-full border border-slate-200 shadow-sm text-[10px] font-bold text-slate-500 flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    Sincronización Cloud Activa
                </div>
            </header>

            {/* Menu Sections */}
            {sections.map((section) => (
                <div key={section.title} className="space-y-3">
                    <h3 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{section.title}</h3>
                    <div className="glass-card rounded-[2.5rem] overflow-hidden border border-white/40">
                        {section.items.map((item, idx) => (
                            <button
                                key={item.id}
                                onClick={item.action}
                                className={`w-full flex items-center justify-between p-5 hover:bg-white/50 transition-colors ${
                                    idx !== section.items.length - 1 ? 'border-b border-slate-100/50' : ''
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 bg-slate-50 rounded-2xl ${item.color}`}>
                                        <item.icon size={20} strokeWidth={2.5} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-black text-slate-800">{item.label}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">{item.sub}</p>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-slate-300" />
                            </button>
                        ))}
                    </div>
                </div>
            ))}

            {/* Logout Button */}
            <button 
                onClick={() => auth.signOut()}
                className="w-full mt-6 bg-rose-50 hover:bg-rose-100 text-rose-500 font-black text-xs uppercase tracking-widest py-5 rounded-[2rem] flex items-center justify-center gap-2 transition-all active:scale-95 border border-rose-100/50 mb-10"
            >
                <LogOut size={18} />
                Finalizar Sesión Operativa
            </button>
        </div>
    );
};

export default ProfileView;
