import React from 'react';
import { User, ShieldCheck, RefreshCw, LogOut, ChevronRight, Zap, Star, ShieldAlert, Eye, GraduationCap, Briefcase, Code, HeartPulse } from 'lucide-react';
import { useEngineStore } from '../../store/useEngineStore';
import { auth } from '../../services/firebase';
import BibliographyView from './BibliographyView';


const ProfileView: React.FC = () => {
    const { 
        user, 
        baseIq, 
        resetAssessment, 
        loadFitnessData, 
        isFetchingFitness,
        accessibility,
        setHighContrast,
        setFontSize,
        setHasSeenTutorial,
        userProfile,
        setUserProfile
    } = useEngineStore();
    const [activeSubView, setActiveSubView] = React.useState<string | null>(null);

    const handleSync = async () => {
        await loadFitnessData();
    };

    const sections = [
        {
            title: "Configuración Humana",
            items: [
                { id: 'iq', label: 'Línea Base Cognitiva', sub: `CI Base Actual: ${baseIq}`, icon: Zap, action: resetAssessment, color: 'text-indigo-500' },
                { id: 'biopay', label: 'Bio-Parámetros', sub: 'Ajustes de sensibilidad', icon: ShieldCheck, action: () => setActiveSubView('biopay'), color: 'text-emerald-500' },
                { id: 'sync', label: 'Ecosistema de Datos', sub: 'Configurar Google Fit', icon: RefreshCw, action: () => setActiveSubView('sync'), color: 'text-sky-500' },
                { id: 'accessibility', label: 'Accesibilidad', sub: 'Contraste y tamaño de texto', icon: Eye, action: () => setActiveSubView('accessibility'), color: 'text-purple-500' },
            ]
        },
        {
            title: "Seguridad y Privacidad",
            items: [
                { id: 'security', label: 'Protección de Datos', sub: 'Encriptación biométrica activa', icon: Star, action: () => setActiveSubView('security'), color: 'text-amber-500' },
                { id: 'support', label: 'Protocolo de Soporte', sub: 'Guía de uso v9.5 PRO', icon: ShieldAlert, action: () => setActiveSubView('support'), color: 'text-rose-500' },
            ]
        },
        {
            title: "Evidencia y Ciencia",
            items: [
                { id: 'bibliography', label: 'Bibliografía Científica', sub: 'Fuentes APA 7 y Modelos', icon: GraduationCap, action: () => setActiveSubView('bibliography'), color: 'text-indigo-600' },
            ]
        }
    ];

    if (activeSubView) {
        return (
            <div className="animate-in slide-in-from-right duration-300 space-y-6">
                <button 
                    onClick={() => setActiveSubView(null)}
                    className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest mb-4"
                >
                    <ChevronRight className="rotate-180" size={16} /> Volver al Perfil
                </button>

                {activeSubView === 'biopay' && (
                    <div className="glass-card p-8 rounded-[2.5rem] space-y-6">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl"><ShieldCheck size={24}/></div>
                            <h3 className="text-xl font-black text-slate-800">Bio-Parámetros</h3>
                        </div>
                        <p className="text-sm text-slate-500 font-medium">Calibración de sensibilidad para el algoritmo de CI Ajustado.</p>
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">CI Base Detectado</p>
                                <p className="text-2xl font-black text-slate-800">{baseIq || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeSubView === 'sync' && (
                    <div className="glass-card p-8 rounded-[2.5rem] space-y-6">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-sky-50 text-sky-500 rounded-2xl"><RefreshCw className={isFetchingFitness ? 'animate-spin' : ''} size={24}/></div>
                            <h3 className="text-xl font-black text-slate-800">Ecosistema</h3>
                        </div>
                        <p className="text-sm text-slate-500 font-medium">Sincronización con Google Fit Enterprise.</p>
                        <button 
                            onClick={handleSync}
                            disabled={isFetchingFitness}
                            className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 active:scale-95 transition-all"
                        >
                            {isFetchingFitness ? 'Sincronizando...' : 'Sincronizar Ahora'}
                        </button>
                    </div>
                )}

                {activeSubView === 'security' && (
                    <div className="glass-card p-8 rounded-[2.5rem] space-y-4 text-center">
                        <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-2">
                            <Star size={32} className="fill-current" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800">Seguridad Grado Bio</h3>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            Tus registros están protegidos mediante **AES-256** en Google Cloud.
                        </p>
                    </div>
                )}

                {activeSubView === 'support' && (
                    <div className="glass-card p-8 rounded-[2.5rem] space-y-4">
                        <h3 className="text-xl font-black text-slate-800">Soporte PRO</h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 rounded-2xl text-xs font-medium text-slate-600 border border-slate-100">
                                <p className="font-black text-slate-800 mb-1">Versión del Motor</p>
                                v9.5.0 Stable PRO
                            </div>
                        </div>
                        <div className="mt-6 pt-6 border-t border-slate-100">
                            <button 
                                onClick={() => {
                                    setHasSeenTutorial(false);
                                    setActiveSubView(null);
                                }}
                                className="w-full bg-slate-800 text-white font-black py-4 rounded-2xl hover:bg-slate-700 transition-colors shadow-lg active:scale-95"
                            >
                                Iniciar Tutorial de Bienvenida
                            </button>
                        </div>
                    </div>
                )}
                
                {activeSubView === 'accessibility' && (
                    <div className="glass-card p-8 rounded-[2.5rem] space-y-8">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-purple-50 text-purple-500 rounded-2xl"><Eye size={24}/></div>
                            <h3 className="text-xl font-black text-slate-800">Visualización</h3>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div>
                                    <p className="text-sm font-black text-slate-800">Alto Contraste</p>
                                </div>
                                <button 
                                    onClick={() => setHighContrast(!accessibility.highContrast)}
                                    className={`w-12 h-6 rounded-full transition-all relative ${accessibility.highContrast ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${accessibility.highContrast ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Escalado de Texto</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <button 
                                        onClick={() => setFontSize('normal')}
                                        className={`p-4 rounded-2xl border font-black text-sm transition-all ${accessibility.fontSize === 'normal' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-slate-400 border-slate-100'}`}
                                    >
                                        Aa Standard
                                    </button>
                                    <button 
                                        onClick={() => setFontSize('large')}
                                        className={`p-4 rounded-2xl border font-black text-xl transition-all ${accessibility.fontSize === 'large' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-slate-400 border-slate-100'}`}
                                    >
                                        Aa Grande
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeSubView === 'bibliography' && (
                    <BibliographyView />
                )}
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8 pb-10">
            {/* Perfil de Objetivo (v9.5 PRO) */}
            <div className="glass-card p-6 rounded-[2rem] border-2 border-slate-100">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-2">Objetivo de Optimización</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                        { id: 'student', label: 'Estudio y Memoria', icon: <GraduationCap size={16} /> },
                        { id: 'athlete', label: 'Rendimiento Deportivo', icon: <Zap size={16} /> },
                        { id: 'executive', label: 'Negocios y Energía', icon: <Briefcase size={16} /> },
                        { id: 'developer', label: 'Software y Flow', icon: <Code size={16} /> },
                        { id: 'elderly', label: 'Longevidad y Salud', icon: <HeartPulse size={16} /> },
                    ].map((p) => (
                        <button
                            key={p.id}
                            onClick={() => setUserProfile(p.id as any)}
                            className={`flex items-center gap-3 p-3 rounded-2xl transition-all font-black text-xs border-2 ${
                                userProfile === p.id 
                                ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20 scale-[1.02]' 
                                : 'bg-white text-slate-600 border-slate-100 hover:border-slate-200'
                            }`}
                        >
                            {p.icon}
                            {p.label}
                            {userProfile === p.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                        </button>
                    ))}
                </div>
            </div>

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
                </div>

                <h2 className="text-2xl font-black text-slate-800 tracking-tight">{user?.displayName || 'Usuario Quantum'}</h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">{user?.email}</p>
            </header>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">CI Base</p>
                    <p className="text-xl font-black text-slate-800">{baseIq || '--'}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sesiones</p>
                    <p className="text-xl font-black text-slate-800">Pro Activa</p>
                </div>
            </div>

            {/* Sections */}
            <div className="space-y-6">
                {sections.map((section, idx) => (
                    <div key={idx} className="space-y-3">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">{section.title}</h3>
                        <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                            {section.items.map((item, iIdx) => (
                                <button
                                    key={iIdx}
                                    onClick={item.action}
                                    className={`w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 text-left`}
                                >
                                    <div className={`p-2.5 rounded-xl bg-slate-50 ${item.color}`}>
                                        <item.icon size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black text-slate-800 tracking-tight">{item.label}</p>
                                        <p className="text-[10px] text-slate-400 font-bold truncate uppercase">{item.sub}</p>
                                    </div>
                                    <ChevronRight size={16} className="text-slate-300" />
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Logout */}
            <button 
                onClick={() => auth.signOut()}
                className="w-full flex items-center justify-center gap-3 p-5 rounded-3xl bg-rose-50 text-rose-500 font-black text-sm hover:bg-rose-100 transition-colors"
            >
                <LogOut size={20} />
                Cerrar Sesión Segura
            </button>

            <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">
                Quantum Engine v9.5 PRO • 2026
            </p>
        </div>
    );
};

export default ProfileView;
