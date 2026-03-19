import React from 'react';
import { Heart, Moon, Footprints, Activity, Zap, TrendingUp, ChevronRight } from 'lucide-react';
import { useEngineStore } from '../../store/useEngineStore';

const HealthView: React.FC = () => {
    const { fitnessData, weeklyFitnessData, stressLevel, selectedDate } = useEngineStore();
    
    // Calcular promedios semanales simples
    const weekDays = Object.values(weeklyFitnessData);
    const avgSteps = weekDays.length > 0 
        ? Math.round(weekDays.reduce((acc, d) => acc + (d.steps || 0), 0) / weekDays.length)
        : 0;
    
    const currentStress = stressLevel[selectedDate] || 1;

    const healthMetrics = [
        { 
            id: 'sleep', 
            label: 'Calidad de Sueño', 
            value: `${fitnessData?.sleepHours || 0}h`, 
            sub: 'Recuperación profunda',
            icon: Moon, 
            color: 'text-indigo-500', 
            bg: 'bg-indigo-50' 
        },
        { 
            id: 'heart', 
            label: 'Frecuencia Reposo', 
            value: `${fitnessData?.restingHeartRate || '--'} bpm`, 
            sub: 'Ritmo basal óptimo',
            icon: Heart, 
            color: 'text-rose-500', 
            bg: 'bg-rose-50' 
        },
        { 
            id: 'steps', 
            label: 'Pasos Diarios', 
            value: (fitnessData?.steps || 0).toLocaleString(), 
            sub: `Promedio semanal: ${avgSteps.toLocaleString()}`,
            icon: Footprints, 
            color: 'text-amber-500', 
            bg: 'bg-amber-50' 
        }
    ];

    const { manualSpO2, updateManualSpO2 } = useEngineStore();
    const currentSpO2 = manualSpO2[selectedDate] || fitnessData?.spo2 || 98;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8 pb-10">
            <header className="px-2">
                <div className="flex items-center gap-2 text-indigo-600 font-bold tracking-[0.2em] text-[10px] uppercase bg-indigo-50 px-3 py-1 rounded-full w-fit mb-3">
                    <Zap size={10} /> Quantum Bio-Metrics
                </div>
                <h2 className="text-3xl font-black text-slate-800 leading-tight">Estado Vital</h2>
                <p className="text-slate-500 text-xs font-medium mt-1">Análisis detallado de tu motor biológico.</p>
            </header>

            {/* SpO2 - Phone Ergonomic Controller (Full Width in Health View too) */}
            <div className="bg-slate-900 rounded-[3rem] p-8 text-white border border-slate-800 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 blur-[80px] rounded-full translate-x-12 -translate-y-12" />
                
                <div className="relative z-10 space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-cyan-500/20 rounded-2xl border border-cyan-500/30 text-cyan-400">
                                <Activity size={28} strokeWidth={2.5} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Nivel Saturación</p>
                                <h3 className="text-sm font-black text-white">Oxígeno Sangre</h3>
                            </div>
                        </div>
                        {manualSpO2[selectedDate] && (
                            <span className="text-[9px] font-black text-cyan-400 uppercase px-3 py-1 bg-cyan-500/10 rounded-full border border-cyan-500/20">Modo Manual</span>
                        )}
                    </div>

                    <div className="flex items-center justify-between gap-4">
                        <button 
                            onClick={() => updateManualSpO2(currentSpO2 - 1)}
                            className="w-16 h-16 rounded-3xl bg-slate-800 text-white hover:bg-slate-700 transition-all flex items-center justify-center shadow-lg active:scale-90 border border-slate-700"
                        >
                            <span className="text-3xl font-light">-</span>
                        </button>
                        
                        <div className="text-center">
                            <p className="text-5xl font-black text-white tracking-tighter">{currentSpO2}%</p>
                            <p className="text-[10px] font-bold text-cyan-500 mt-1">Saturación Actual</p>
                        </div>

                        <button 
                            onClick={() => updateManualSpO2(currentSpO2 + 1)}
                            className="w-16 h-16 rounded-3xl bg-cyan-600 text-white hover:bg-cyan-500 transition-all flex items-center justify-center shadow-lg active:scale-90 shadow-cyan-900/40"
                        >
                            <span className="text-3xl font-light">+</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Stress Summary Row */}
            <div className="glass-card p-6 rounded-[2.5rem] flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-500 border border-purple-100">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nivel de Estrés</p>
                        <p className="text-lg font-black text-slate-800">
                            {currentStress < 4 ? 'Calma Total' : currentStress < 7 ? 'Moderado' : 'Carga Alta'}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-black text-purple-600">{currentStress}</span>
                    <span className="text-xs text-slate-400 font-bold">/10</span>
                </div>
            </div>

            {/* Metrics List */}
            <div className="space-y-4">
                {healthMetrics.map((m) => (
                    <div key={m.id} className="glass-card p-5 rounded-[2rem] flex items-center justify-between group active:scale-95 transition-all">
                        <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 ${m.bg} ${m.color} rounded-[1.5rem] flex items-center justify-center border border-white/50 shadow-inner`}>
                                <m.icon size={28} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{m.label}</h4>
                                <p className="text-xl font-black text-slate-800 leading-tight">{m.value}</p>
                                <p className="text-[9px] text-slate-500 font-medium mt-0.5">{m.sub}</p>
                            </div>
                        </div>
                        <ChevronRight className="text-slate-300 group-hover:text-indigo-400 transition-colors" size={20} />
                    </div>
                ))}
            </div>

            {/* Pro Tip Card */}
            <div className="bg-indigo-600 p-8 rounded-[3rem] text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 blur-3xl rounded-full" />
                <div className="relative z-10">
                    <h5 className="text-lg font-black mb-2 flex items-center gap-2">
                        <Zap size={20} className="fill-current text-indigo-200" />
                        Bio-Hack del Día
                    </h5>
                    <p className="text-xs text-indigo-100 leading-relaxed font-medium">
                        Tu nivel de SpO2 es óptimo. Para maximizar tu CI Pico hoy, realiza 15 min de exposición a luz solar directa antes del mediodía para regular tu ritmo circadiano.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default HealthView;
