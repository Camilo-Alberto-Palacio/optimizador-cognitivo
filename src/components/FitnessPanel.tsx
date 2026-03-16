import React from 'react';
import { Moon, Heart, Footprints, Flame, RefreshCw, AlertCircle, CheckCircle2, Activity } from 'lucide-react';
import { useEngineStore } from '../store/useEngineStore';
import { calculateFitnessImpact } from '../services/googleFit';

const FitnessPanel: React.FC = () => {
    const { 
        fitnessData, 
        fitAccessToken, 
        loadFitnessData, 
        baseIq, 
        manualSleepAdjustment, 
        selectedDate,
        updateManualSleep 
    } = useEngineStore();

    const handleRefresh = async () => {
        console.log("FitnessPanel: Intentando refrescar datos manual... token:", !!fitAccessToken);
        if (fitAccessToken) await loadFitnessData();
    };

    // Si no hay token (usuario no re-autorizado), mostramos botón de conexión directa
    if (!fitAccessToken) {
        return (
            <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Heart size={14} className="text-rose-400" /> Google Fit
                </h3>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
                    <AlertCircle size={20} className="text-amber-500 mx-auto mb-2" />
                    <p className="text-xs text-slate-600 font-semibold mb-4 leading-relaxed">
                        Conecta tu cuenta para sincronizar sueño, pasos y ritmo cardíaco.
                    </p>
                    <button
                        onClick={() => {
                            // Usamos el botón de login que ya sabe pedir los scopes necesarios
                            // El LoginScreen maneja setFitToken y loadFitnessData
                            window.location.reload(); // Forma más simple de activar el flow de login si el token falta
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm py-3 rounded-xl transition-all active:scale-95 shadow-md shadow-indigo-100"
                    >
                        <RefreshCw size={16} /> Conectar con Google Fit
                    </button>
                </div>
            </div>
        );
    }

    if (!fitnessData) {
        return (
            <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Heart size={14} className="text-rose-400" /> Google Fit
                </h3>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <RefreshCw className="text-indigo-500 animate-spin mb-3" size={24} />
                    <p className="text-[10px] text-slate-500 font-medium italic px-4">
                        Sincronizando bio-datos...
                    </p>
                </div>
            </div>
        );
    }

    const adjustment = manualSleepAdjustment[selectedDate] || 0;
    const rawSleep = fitnessData.sleepHours;
    // Combinar dato de Google Fit con ajuste manual
    const sleepHours = rawSleep !== null ? Math.max(0, rawSleep + adjustment) : (adjustment > 0 ? adjustment : null);
    const { restingHeartRate, steps, activeCalories, lastFetched } = fitnessData;
    
    // Check if ALL fields are null (indicates successful API call but no data found)
    const hasData = sleepHours !== null || restingHeartRate !== null || steps !== null || activeCalories !== null;

    const adjustedIq = (baseIq && fitnessData) ? calculateFitnessImpact({ ...fitnessData, sleepHours }, baseIq) : null;
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
            {!hasData ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                    <Activity size={24} className="text-slate-300 mx-auto mb-2" />
                    <p className="text-[10px] text-slate-500 font-medium px-4">
                        API conectada pero no se encontraron registros recientes. Asegúrate de tener datos en la app de Fit de tu teléfono.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3">
                    {/* Sueño */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Moon size={13} className="text-indigo-400" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Sueño</span>
                        </div>
                        <div className="flex items-end justify-between">
                            <div>
                                <p className={`text-xl font-black ${getSleepColor(sleepHours)}`}>
                                    {sleepHours !== null ? `${sleepHours}h` : '--'}
                                </p>
                                <p className="text-[10px] text-slate-400 font-medium">
                                    {sleepHours !== null ? (sleepHours >= 7 ? 'Óptimo ✓' : sleepHours >= 6 ? 'Sub-óptimo' : 'Insuficiente ⚠️') : 'Sin datos'}
                                </p>
                            </div>
                            
                            {/* Ajuste Manual */}
                            <div className="flex flex-col items-center gap-1">
                                <button 
                                    onClick={() => updateManualSleep(0.5)}
                                    className="p-1 rounded-md bg-indigo-50 text-indigo-500 hover:bg-indigo-100 transition-colors"
                                    title="Añadir 30 min de sueño"
                                >
                                    <Activity size={10} className="rotate-90" />
                                    <span className="text-[8px] font-bold">+0.5</span>
                                </button>
                                <button 
                                    onClick={() => updateManualSleep(-0.5)}
                                    className="p-1 rounded-md bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-400 transition-colors"
                                    title="Quitar 30 min de sueño"
                                >
                                    <span className="text-[8px] font-bold">-0.5</span>
                                </button>
                            </div>
                        </div>
                        {adjustment !== 0 && (
                            <div className="mt-1 text-[8px] font-bold text-indigo-400 italic bg-indigo-50/50 px-1.5 py-0.5 rounded-full inline-block">
                                Ajustado manual: {adjustment > 0 ? '+' : ''}{adjustment}h
                            </div>
                        )}
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
            )}
        </div>
    );
};

export default FitnessPanel;
