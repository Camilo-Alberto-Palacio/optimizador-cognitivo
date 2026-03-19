import React from 'react';
import { User, ShieldCheck, RefreshCw, LogOut, ChevronRight, Zap, Star, ShieldAlert, Eye, GraduationCap } from 'lucide-react';
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
        setHasSeenTutorial
    } = useEngineStore();
    const [activeSubView, setActiveSubView] = React.useState<string | null>(null);

    const handleSync = async () => {
        await loadFitnessData();
        // Podríamos añadir un toast aquí si fuera necesario
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
                { id: 'support', label: 'Protocolo de Soporte', sub: 'Guía de uso v8.5 PRO', icon: ShieldAlert, action: () => setActiveSubView('support'), color: 'text-rose-500' },
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
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sensibilidad Metabólica</p>
                                <p className="text-sm font-bold text-slate-600">Dinámica (Basada en logs)</p>
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
                            Tus registros están protegidos mediante **AES-256** en Google Cloud. El motor Quantum procesa tus datos localmente siempre que es posible para garantizar la máxima soberanía digital.
                        </p>
                    </div>
                )}

                {activeSubView === 'support' && (
                    <div className="glass-card p-8 rounded-[2.5rem] space-y-4">
                        <h3 className="text-xl font-black text-slate-800">Soporte PRO</h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 rounded-2xl text-xs font-medium text-slate-600 border border-slate-100">
                                <p className="font-black text-slate-800 mb-1">Versión del Motor</p>
                                v8.5.2 Stable PRO
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl text-xs font-medium text-slate-600 border border-slate-100">
                                <p className="font-black text-slate-800 mb-1">Contacto Operativo</p>
                                soporte@quantumperformance.ai
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
                    <div className="glass-card p-4 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] space-y-8">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-purple-50 text-purple-500 rounded-2xl"><Eye size={24}/></div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tighter">Visualización</h3>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                                <div>
                                    <p className="text-sm font-black text-slate-800">Alto Contraste</p>
                                    <p className="text-[10px] text-slate-400 font-black uppercase">Legibilidad Extrema</p>
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
