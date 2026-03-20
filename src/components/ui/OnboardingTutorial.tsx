import React, { useState } from 'react';
import { X, ChevronRight, Zap, Target, BookOpen, Sparkles } from 'lucide-react';
import { useEngineStore } from '../../store/useEngineStore';

const OnboardingTutorial: React.FC = () => {
    const { hasSeenTutorial, setHasSeenTutorial } = useEngineStore();
    const [step, setStep] = useState(0);

    if (hasSeenTutorial) return null;

    const steps = [
        {
            title: "¡Bienvenido a Quantum!",
            desc: "Tu motor personal de Biohacking Cognitivo. Aquí optimizamos tu cerebro basándonos en datos reales.",
            icon: <Sparkles className="text-amber-500" size={48} />,
            color: "from-amber-500/20 to-orange-500/20"
        },
        {
            title: "Análisis de CI Base y Peak",
            desc: "El 'Base' es tu estado natural hoy. El 'Peak' es el máximo rendimiento que puedes alcanzar con optimización.",
            icon: <Target className="text-indigo-500" size={48} />,
            color: "from-indigo-500/20 to-purple-500/20"
        },
        {
            title: "Tu Curva de Rendimiento",
            desc: "Visualiza cómo tu energía sube y baja durante el día. Evita los bajones y aprovecha tus zonas de flujo.",
            icon: <Zap className="text-emerald-500" size={48} />,
            color: "from-emerald-500/20 to-teal-500/20"
        },
        {
            title: "Registro de Optimización",
            desc: "Usa el botón '+' para registrar suplementos, café o hábitos. Observa en tiempo real cómo impactan tu cerebro.",
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
            </div>
        </div>
    );
};

export default OnboardingTutorial;
