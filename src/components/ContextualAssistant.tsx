import React, { useMemo } from 'react';
import { Lightbulb, AlertTriangle, TrendingUp, Clock, Info, Code, HeartPulse } from 'lucide-react';
import { useEngineStore } from '../store/useEngineStore';

const ContextualAssistant: React.FC = () => {
    const { 
        userProfile, 
        chartData, 
        fitnessData, 
        selectedDate, 
        stressLevel,
        manualSpO2
    } = useEngineStore();

    const insight = useMemo(() => {
        const now = new Date();
        const hour = now.getHours();
        const currentIq = chartData.find(p => parseInt(p.time.split(':')[0]) === hour)?.iq || 0;
        const peakIq = Math.max(...chartData.map(p => p.iq));
        const isPeakTime = currentIq >= peakIq * 0.95;

        // --- REGLAS GENERALES ---
        const spo2 = manualSpO2[selectedDate] || fitnessData?.spo2 || 99;
        const stress = stressLevel[selectedDate] || 1;

        if (spo2 < 95) {
            return {
                type: 'warning',
                icon: <AlertTriangle className="text-rose-500" size={24} />,
                title: "Hipoxia leve detectada",
                text: "Tu nivel de oxígeno es bajo. Ventila el lugar o realiza respiraciones profundas para recuperar claridad mental.",
                bg: "bg-rose-500/10",
                border: "border-rose-500/20"
            };
        }

        if (stress >= 7) {
            return {
                type: 'warning',
                icon: <AlertTriangle className="text-amber-500" size={24} />,
                title: "Estrés elevado",
                text: "Tu motor cognitivo está bajo presión. Un descanso de 5 min (NSDR) restaurará tu capacidad de enfoque.",
                bg: "bg-amber-500/10",
                border: "border-amber-500/20"
            };
        }

        // --- REGLAS POR PERFIL ---
        switch (userProfile) {
            case 'student':
                if (isPeakTime) {
                    return {
                        type: 'info',
                        icon: <TrendingUp className="text-indigo-500" size={24} />,
                        title: "¡Ventana de CI Peak Activa!",
                        text: "Estás en tu máximo potencial. Es el momento perfecto para estudiar los temas más difíciles o realizar simulacros.",
                        bg: "bg-indigo-500/10",
                        border: "border-indigo-500/20"
                    };
                }
                if (hour >= 15) {
                    return {
                        type: 'tip',
                        icon: <Clock className="text-amber-500" size={24} />,
                        title: "Protección de Sueño",
                        text: "A partir de ahora, evita la cafeína. Tu cerebro necesita limpiar adenosina para rendir en los exámenes de mañana.",
                        bg: "bg-amber-500/10",
                        border: "border-amber-500/20"
                    };
                }
                break;

            case 'athlete':
                if ((fitnessData?.steps || 0) > 10000) {
                    return {
                        type: 'success',
                        icon: <TrendingUp className="text-emerald-500" size={24} />,
                        title: "Meta de Actividad Superada",
                        text: "Has oxigenado tu cerebro con más de 10k pasos. Esto eleva tu neuroplasticidad para el trabajo de hoy.",
                        bg: "bg-emerald-500/10",
                        border: "border-emerald-500/20"
                    };
                }
                return {
                    type: 'tip',
                    icon: <Info className="text-sky-500" size={24} />,
                    title: "Recuperación Activa",
                    text: "Registra tu Cúrcuma o Magnesio para mitigar el cortisol post-entreno y mantener el foco.",
                    bg: "bg-sky-500/10",
                    border: "border-sky-500/20"
                };

            case 'executive':
                if (hour < 10) {
                    return {
                        type: 'tip',
                        icon: <Lightbulb className="text-amber-500" size={24} />,
                        title: "Protocolo de Luz Solar",
                        text: "Busca luz natural inmediatamente. Sincronizará tu ritmo circadiano para evitar el bajón de energía de la tarde.",
                        bg: "bg-amber-500/10",
                        border: "border-amber-500/20"
                    };
                }
                break;

            case 'developer':
                if (isPeakTime) {
                    return {
                        type: 'info',
                        icon: <Code className="text-emerald-500" size={24} />,
                        title: "Deep Work Sugerido",
                        text: "Entra en estado de Flow ahora. Tu velocidad de procesamiento y memoria de trabajo están al máximo.",
                        bg: "bg-emerald-500/10",
                        border: "border-emerald-500/20"
                    };
                }
                break;

            case 'elderly':
                return {
                    type: 'tip',
                    icon: <HeartPulse className="text-rose-500" size={24} />,
                    title: "Mantenimiento Vital",
                    text: "Recuerda hidratarte y realizar una caminata ligera. Mantener el flujo sanguíneo cerebral es clave para tu longevidad.",
                    bg: "bg-rose-500/10",
                    border: "border-rose-500/20"
                };
        }

        // Default
        return {
            type: 'info',
            icon: <Info className="text-slate-500" size={24} />,
            title: "Optimización en curso",
            text: "Registra tus suplementos usando el botón '+' para ver el impacto en tu curva de rendimiento.",
            bg: "bg-slate-500/5",
            border: "border-slate-500/10"
        };
    }, [userProfile, chartData, fitnessData, selectedDate, stressLevel, manualSpO2]);

    return (
        <div className={`p-5 rounded-[24px] border-2 ${insight.border} ${insight.bg} transition-all duration-500 animate-in fade-in slide-in-from-left-4`}>
            <div className="flex gap-4 items-start">
                <div className="p-3 bg-white rounded-2xl shadow-sm">
                    {insight.icon}
                </div>
                <div>
                    <h3 className="text-sm font-black text-slate-800 mb-1 flex items-center gap-2">
                        {insight.title}
                        {insight.type === 'tip' && <span className="text-[10px] bg-slate-900 text-white px-1.5 py-0.5 rounded-full uppercase tracking-widest">TIP</span>}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        {insight.text}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ContextualAssistant;
