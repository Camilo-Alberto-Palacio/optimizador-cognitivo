import React, { useState } from 'react';
import { X, ChevronRight, Zap, Target, BookOpen, Sparkles, GraduationCap, Dumbbell, Briefcase, Code, HeartPulse } from 'lucide-react';
import { useEngineStore } from '../../store/useEngineStore';

const OnboardingTutorial: React.FC = () => {
    const { hasSeenTutorial, setHasSeenTutorial, userProfile, setUserProfile } = useEngineStore();
    const [step, setStep] = useState(-1); // -1 is Profile Selection

    if (hasSeenTutorial) return null;

    const profiles = [
        { id: 'student', label: 'Estudiar', icon: <GraduationCap size={24} />, desc: 'Finales, memoria y foco' },
        { id: 'athlete', label: 'Deporte', icon: <Dumbbell size={24} />, desc: 'Recuperación y SpO2' },
        { id: 'executive', label: 'Negocios', icon: <Briefcase size={24} />, desc: 'Jet lag y energía' },
        { id: 'developer', label: 'Software', icon: <Code size={24} />, desc: 'Flow y Deep Work' },
        { id: 'elderly', label: 'Salud Aa', icon: <HeartPulse size={24} />, desc: 'Longevidad y vitalidad' },
    ] as const;

    const steps = [
        {
            title: "¡Bienvenido a Quantum!",
            desc: userProfile === 'athlete' 
                ? "Tu motor de recuperación física y mental avanzada."
                : userProfile === 'student'
                ? "Tu aliado para dominar los exámenes finales."
                : "Tu motor personal de Biohacking Cognitivo.",
            icon: <Sparkles className="text-amber-500" size={48} />,
            color: "from-amber-500/20 to-orange-500/20"
        },
        {
            title: "Análisis de CI Base y Peak",
            desc: "Identificamos tus ventanas de máxima alerta para que programes tus tareas más difíciles cuando tu cerebro rinde al 100%.",
            icon: <Target className="text-indigo-500" size={48} />,
            color: "from-indigo-500/20 to-purple-500/20"
        },
        {
            title: "Tu Curva de Rendimiento",
            desc: "Visualiza el impacto de tu sueño, estrés y suplementos. Evita los bajones y mantén el flujo.",
            icon: <Zap className="text-emerald-500" size={48} />,
            color: "from-emerald-500/20 to-teal-500/20"
        },
        {
            title: "Registro de Optimización",
            desc: "Registra café, nootrópicos o hábitos y observa en tiempo real cómo cambia tu potencial intelectual.",
            icon: <BookOpen className="text-sky-500" size={48} />,
            color: "from-sky-500/20 to-blue-500/20"
        }
    ];

    const nextStep = () => {
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            setHasSeenTutorial(true);
        }
    };

    const handleProfileSelect = (pid: typeof profiles[number]['id']) => {
        setUserProfile(pid);
        setStep(0);
    };

    const handleSkip = () => setHasSeenTutorial(true);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-500">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col relative animate-in zoom-in slide-in-from-bottom-8 duration-500">
                {/* Close/Skip button */}
                <button 
                    onClick={handleSkip}
                    className="absolute top-6 right-6 p-2 bg-slate-100 text-slate-400 rounded-full hover:bg-slate-200 transition-colors z-10"
                >
                    <X size={18} />
                </button>

                {step === -1 ? (
                    /* PROFILE SELECTION */
                    <div className="px-8 pt-10 pb-8 flex flex-col items-center text-center">
                        <div className="w-20 h-20 rounded-3xl bg-slate-900 flex items-center justify-center mb-6 shadow-xl shadow-slate-900/20">
                            <Target className="text-white" size={32} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 mb-2 leading-tight">
                            ¿Cuál es tu objetivo?
                        </h2>
                        <p className="text-slate-500 text-sm mb-8">
                            Personalizaremos tu experiencia según tu meta.
                        </p>

                        <div className="grid grid-cols-1 gap-3 w-full mb-8">
                            {profiles.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => handleProfileSelect(p.id)}
                                    className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border-2 border-transparent hover:border-slate-900/10 transition-all text-left group"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 group-hover:text-slate-900 group-hover:bg-white shadow-sm transition-colors">
                                        {p.icon}
                                    </div>
                                    <div>
                                        <div className="font-black text-slate-800 text-sm tracking-tight">{p.label}</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{p.desc}</div>
                                    </div>
                                    <ChevronRight className="ml-auto text-slate-300 group-hover:text-slate-900 transition-colors" size={16} />
                                </button>
                            ))}
                        </div>
                        
                        <p className="text-[10px] text-slate-300 font-bold uppercase">v9.5 PRO • Quantum Engine</p>
                    </div>
                ) : (
                    /* CLASSIC TUTORIAL STEPS */
                    <>
                        {/* Progress Indicators */}
                        <div className="flex gap-1.5 px-8 pt-8 pb-4">
                            {steps.map((_, i) => (
                                <div 
                                    key={i} 
                                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-slate-900' : 'bg-slate-100'}`}
                                />
                            ))}
                        </div>

                        {/* Content */}
                        <div className="px-8 pb-8 flex flex-col items-center text-center flex-1">
                            <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${steps[step].color} flex items-center justify-center mb-8 animate-pulse`}>
                                {steps[step].icon}
                            </div>
                            
                            <h2 className="text-2xl font-black text-slate-800 mb-4 leading-tight">
                                {steps[step].title}
                            </h2>
                            <p className="text-slate-500 leading-relaxed mb-8">
                                {steps[step].desc}
                            </p>

                            <button 
                                onClick={nextStep}
                                className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95"
                            >
                                {step === steps.length - 1 ? "¡Comenzar Ahora!" : "Siguiente Paso"}
                                <ChevronRight size={20} />
                            </button>
                            
                            {step < steps.length - 1 && (
                                <button 
                                    onClick={handleSkip}
                                    className="mt-4 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest"
                                >
                                    Saltar Tutorial
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default OnboardingTutorial;

