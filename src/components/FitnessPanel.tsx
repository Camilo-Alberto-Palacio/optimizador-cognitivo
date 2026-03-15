import React from 'react';
import { Moon, Heart, Footprints, Flame, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useEngineStore } from '../store/useEngineStore';
import { calculateFitnessImpact } from '../services/googleFit';

const FitnessPanel: React.FC = () => {
    const { fitnessData, fitAccessToken, loadFitnessData, baseIq } = useEngineStore();

    const handleRefresh = async () => {
        if (fitAccessToken) await loadFitnessData();
    };

    // Si no hay token (usuario no re-autorizado), mostramos aviso simplificado
    if (!fitAccessToken) {
        return (
            <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Heart size={14} className="text-rose-400" /> Google Fit
                </h3>
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 font-semibold">
                        Cierra sesión y vuelve a iniciar sesión con Google para autorizar el acceso a tus datos de Fit.
                    </p>
                </div>
            </div>
        );
    }

    if (!fitnessData) {
        return (
            <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    Google Fit
                </h3>
                <button
                    onClick={handleRefresh}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-sm py-3 rounded-xl border border-emerald-200 transition-all active:scale-95"
                >
                    <RefreshCw size={16} /> Cargar datos de Google Fit
                </button>
            </div>
        );
    }

    const { sleepHours, restingHeartRate, steps, activeCalories, lastFetched } = fitnessData;
    const adjustedIq = (baseIq && fitnessData) ? calculateFitnessImpact(fitnessData, baseIq) : null;
    const iqDelta = adjustedIq && baseIq ? adjustedIq - baseIq : 0;

    const getSleepColor = (h: number | null) => {
        if (h === null) return 'text-slate-400';
        if (h >= 7 && h <= 9) return 'text-emerald-600';
        if (h >= 6) return 'text-amber-600';
        return 'text-rose-600';
    };

    const getHrColor = (hr: number | null) => {
        if (hr === null) return 'text-slate-400';
        if (hr < 65) return 'text-emerald-600';
        if (hr < 80) return 'text-amber-500';
        return 'text-rose-600';
    };

    const lastFetchTime = lastFetched ? new Date(lastFetched).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '--';

    return (
        <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Heart size={14} className="text-rose-400" fill="currentColor" /> Google Fit · Hoy
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">Act. {lastFetchTime}</span>
                    <button
                        onClick={handleRefresh}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-100 hover:text-indigo-600 text-slate-500 transition-all active:scale-90"
                        title="Actualizar datos de Fit"
                    >
                        <RefreshCw size={14} />
                    </button>
                </div>
            </div>

            {/* IQ Impact Badge */}
            {adjustedIq && baseIq && (
                <div className={`mb-4 p-3 rounded-xl border flex items-center justify-between ${iqDelta >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                    <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className={iqDelta >= 0 ? 'text-emerald-500' : 'text-rose-500'} />
                        <span className="text-xs font-bold text-slate-700">CI Ajustado por Fitness</span>
                    </div>
                    <div className="text-right">
                        <span className="text-lg font-black text-slate-800">{adjustedIq}</span>
                        <span className={`text-xs font-bold ml-1 ${iqDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            ({iqDelta >= 0 ? '+' : ''}{iqDelta})
                        </span>
                    </div>
                </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
                {/* Sueño */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5 mb-1">
                        <Moon size={13} className="text-indigo-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Sueño</span>
                    </div>
                    <p className={`text-xl font-black ${getSleepColor(sleepHours)}`}>
                        {sleepHours !== null ? `${sleepHours}h` : '--'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                        {sleepHours !== null ? (sleepHours >= 7 ? 'Óptimo ✓' : sleepHours >= 6 ? 'Sub-óptimo' : 'Insuficiente ⚠️') : 'Sin datos'}
                    </p>
                </div>

                {/* Ritmo Cardíaco */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5 mb-1">
                        <Heart size={13} className="text-rose-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">FC Reposo</span>
                    </div>
                    <p className={`text-xl font-black ${getHrColor(restingHeartRate)}`}>
                        {restingHeartRate !== null ? `${restingHeartRate}` : '--'}
                        {restingHeartRate !== null && <span className="text-sm font-medium"> bpm</span>}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                        {restingHeartRate !== null ? (restingHeartRate < 65 ? 'Atlético ✓' : restingHeartRate < 80 ? 'Normal' : 'Elevado ⚠️') : 'Sin datos'}
                    </p>
                </div>

                {/* Pasos */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5 mb-1">
                        <Footprints size={13} className="text-emerald-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Pasos</span>
                    </div>
                    <p className={`text-xl font-black ${steps !== null && steps >= 7500 ? 'text-emerald-600' : steps !== null && steps >= 5000 ? 'text-amber-500' : 'text-slate-700'}`}>
                        {steps !== null ? steps.toLocaleString('es-ES') : '--'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                        {steps !== null ? (steps >= 10000 ? 'Meta ✓' : steps >= 7500 ? 'Bueno' : 'Bajo') : 'Sin datos'}
                    </p>
                </div>

                {/* Calorías */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5 mb-1">
                        <Flame size={13} className="text-orange-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Cal. Activas</span>
                    </div>
                    <p className="text-xl font-black text-slate-700">
                        {activeCalories !== null ? `${activeCalories}` : '--'}
                        {activeCalories !== null && <span className="text-sm font-medium"> kcal</span>}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                        {activeCalories !== null ? (activeCalories >= 400 ? 'Activo ✓' : 'Sedentario') : 'Sin datos'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default FitnessPanel;
