import React from 'react';
import { Lightbulb, TrendingUp, AlertTriangle } from 'lucide-react';
import { useEngineStore } from '../store/useEngineStore';

const DynamicInsights: React.FC = () => {
    const { fitnessData, stressLevel, chartData, baseIq, selectedDate } = useEngineStore();
    
    const currentStress = stressLevel[selectedDate] || 1;
    const maxIq = chartData.reduce((max, point) => point.iq > max ? point.iq : max, baseIq || 100);
    const steps = fitnessData?.steps || 0;
    const sleep = fitnessData?.sleepHours || 0;
    const staticBaseIq = baseIq || 100;

    // Logic for Primary Insight
    let insight = {
        title: "Motor Calibrado",
        desc: "Tu sistema está en equilibrio. Mantén la hidratación para sostener este nivel.",
        type: 'success',
        icon: Lightbulb
    };

    if (currentStress >= 7) {
        insight = {
            title: "Estrés Elevado",
            desc: "Cortisol detectado. Considera una pausa activa o 5 min de respiración profunda.",
            type: 'warning',
            icon: AlertTriangle
        };
    } else if (sleep > 0 && sleep < 6.5) {
        insight = {
            title: "Recuperación Insuficiente",
            desc: "Baja latencia de sueño. Prioriza hoy tareas mecánicas y evita decisiones críticas.",
            type: 'warning',
            icon: AlertTriangle
        };
    } else if (maxIq > staticBaseIq + 12) {
        insight = {
            title: "Estado de Flow",
            desc: "Gran optimización bioquímica. Es el momento ideal para resolver problemas complejos.",
            type: 'success',
            icon: TrendingUp
        };
    }

    // Logic for Secondary Insight (Umbral)
    let umbralText = "Manteniendo CI sobre el Umbral Operativo.";
    if (steps > 0 && steps < 4000) {
        umbralText = "Movilidad baja: camina 5 min para reactivar la circulación cerebral.";
    } else if (steps >= 10000) {
        umbralText = "¡Excelente! El impulso metabólico por pasos está maximizando tu claridad.";
    }

    return (
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200 mt-8 shadow-xl shadow-slate-200/50 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2 flex items-start gap-5">
                <div className={`p-4 rounded-2xl shrink-0 border ${
                    insight.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-500 border-emerald-100' 
                    : 'bg-amber-50 text-amber-500 border-amber-100'
                }`}>
                    <insight.icon size={24} />
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full ${
                            insight.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                        }`}>
                            Insight PRO
                        </span>
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">{insight.title}</h4>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium max-w-2xl">
                        {insight.desc}
                    </p>
                </div>
            </div>
            
            <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100/50 flex flex-col justify-center text-center lg:text-right h-full">
                <p className="text-[10px] text-indigo-500 font-bold mb-1 uppercase tracking-widest">Estado del Umbral</p>
                <p className="text-xs text-indigo-900/70 font-black leading-tight italic">
                    "{umbralText}"
                </p>
            </div>
        </div>
    );
};

export default DynamicInsights;
