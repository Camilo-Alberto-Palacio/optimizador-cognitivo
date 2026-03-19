import React, { useState } from 'react';
import { Moon, Heart, Footprints, Flame, RefreshCw, AlertCircle, Activity } from 'lucide-react';
import { useEngineStore } from '../store/useEngineStore';
import { calculateFitnessImpact } from '../services/googleFit';
import { refreshGoogleFitToken } from '../services/firebase';

const FitnessPanel: React.FC = () => {
    const { 
        fitnessData, 
        isFetchingFitness,
        fitAccessToken, 
        loadFitnessData,
        setFitToken,
        baseIq, 
        manualSleepAdjustment,
        selectedDate,
        updateManualSleep,
        stressLevel,
        updateStressLevel,
        manualSpO2,
        updateManualSpO2
    } = useEngineStore();

    const [isReconnecting, setIsReconnecting] = useState(false);

    const handleRefresh = async () => {
        if (fitAccessToken && !isFetchingFitness) await loadFitnessData();
    };

    const handleReconnect = async () => {
        setIsReconnecting(true);
        try {
            const newToken = await refreshGoogleFitToken();
            if (newToken) {
                setFitToken(newToken); // setFitToken ahora auto-carga los datos
            }
        } catch (e) {
            console.error('Error reconectando Google Fit:', e);
        } finally {
            setIsReconnecting(false);
        }
    };

    // Auto-refresco cada 10 minutos si estamos en el día de hoy
    React.useEffect(() => {
        if (!fitAccessToken || selectedDate !== new Date().toISOString().split('T')[0]) return;

        const interval = setInterval(() => {
            console.log("FitnessPanel: Auto-refreshing fitness data...");
            loadFitnessData();
        }, 10 * 60 * 1000); // 10 minutos

        return () => clearInterval(interval);
    }, [fitAccessToken, selectedDate, loadFitnessData]);


    // Si no hay token => mostrar botón de reconexión
    if (!fitAccessToken) {
        return (
            <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Heart size={14} className="text-rose-400" /> Google Fit
                </h3>
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
                    <AlertCircle size={20} className="text-amber-500 mx-auto mb-2" />
                    <p className="text-xs text-slate-700 font-semibold mb-1">Tu sesión de Google Fit expiró</p>
                    <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">
                        El token de acceso dura 1 hora. Haz clic para renovarlo sin cerrar sesión.
                    </p>
                    <button
                        onClick={handleReconnect}
                        disabled={isReconnecting}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white font-bold text-sm py-3 rounded-xl transition-all active:scale-95 shadow-md shadow-indigo-100"
                    >
                        <RefreshCw size={16} className={isReconnecting ? 'animate-spin' : ''} />
                        {isReconnecting ? 'Reconectando...' : 'Reconectar Google Fit'}
                    </button>
                </div>
            </div>
        );
    }

    if (!fitnessData) {
        // Estado: petición en vuelo
        if (isFetchingFitness) {
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

        // Estado: carga terminada pero sin datos — permitir reintento
        return (
            <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Heart size={14} className="text-rose-400" /> Google Fit
                </h3>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
                    <Activity size={20} className="text-slate-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-600 font-semibold mb-1">Sin datos por ahora</p>
                    <p className="text-[10px] text-slate-400 mb-3 leading-relaxed px-2">
                        Google Fit aún no tiene registros para este día o la respuesta llegó vacía.
                    </p>
                    <button
                        onClick={handleRefresh}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm py-2.5 rounded-xl transition-all active:scale-95"
                    >
                        <RefreshCw size={14} /> Reintentar
                    </button>
                </div>
            </div>
        );
    }


    const adjustment = manualSleepAdjustment[selectedDate] || 0;
    const rawSleep = fitnessData.sleepHours;
    // Combinar dato de Google Fit con ajuste manual
    const sleepHours = rawSleep !== null ? Math.max(0, rawSleep + adjustment) : (adjustment > 0 ? adjustment : null);
    const { restingHeartRate, steps, activeCalories, lastFetched } = fitnessData;
    const currentStress = stressLevel[selectedDate] || 1;
    const currentSpO2 = manualSpO2[selectedDate] || fitnessData.spo2;
    
    // Alertas y cálculos
    const hasData = sleepHours !== null || restingHeartRate !== null || steps !== null || activeCalories !== null || currentSpO2 !== null;

    const adjustedIq = (baseIq && fitnessData) ? calculateFitnessImpact({ ...fitnessData, sleepHours, spo2: currentSpO2 }, baseIq) : null;
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

    const isToday = selectedDate === new Date().toISOString().split('T')[0] || selectedDate === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
    const dateLabel = isToday ? 'Hoy' : new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

    return (
        <div className="glass-card p-6 rounded-[2.5rem] relative overflow-hidden transition-all duration-500">
            {/* Background Decorative Blur */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-500/5 rounded-full blur-3xl" />
            
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-rose-50 rounded-xl">
                            <Heart size={18} className="text-rose-500" fill="currentColor" />
                        </div>
                        <div>
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">Estado Vital</h3>
                            <p className="text-[10px] font-bold text-slate-400">{dateLabel} · {lastFetchTime}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={isFetchingFitness}
                        className={`p-2 rounded-xl transition-all active:scale-90 ${isFetchingFitness ? 'bg-indigo-50 text-indigo-400 cursor-not-allowed' : 'bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-indigo-600'}`}
                    >
                        <RefreshCw size={16} className={isFetchingFitness ? 'animate-spin' : ''} />
                    </button>
                </div>

                {/* IQ Impact Badge */}
                {adjustedIq && baseIq && (
                    <div className={`mb-6 p-4 rounded-2xl border flex items-center justify-between group transition-all duration-300 ${iqDelta >= 0 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${iqDelta >= 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                <Activity size={16} />
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase block tracking-wider">Potencial Cognitivo</span>
                                <span className="text-sm font-bold text-slate-700">CI Ajustado</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-black text-slate-800 tracking-tighter">{adjustedIq}</span>
                            <div className={`text-[10px] font-black px-1.5 py-0.5 rounded-md inline-block ml-2 ${iqDelta >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                {iqDelta >= 0 ? '+' : ''}{iqDelta} pts
                            </div>
                        </div>
                    </div>
                )}

                {/* Bento Grid Metrics */}
                {!hasData ? (
                    <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-8 text-center">
                        <Activity size={32} className="text-slate-200 mx-auto mb-3" />
                        <p className="text-[11px] text-slate-400 font-bold px-4 leading-relaxed uppercase tracking-widest">
                            Sincronizando datos de Google Fit...
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {/* Sueño - Large Card (2 cols) */}
                        <div className="col-span-2 bento-item bg-indigo-50/30 p-4 rounded-[2rem] border border-indigo-100/50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-2xl shadow-sm">
                                    <Moon size={20} className="text-indigo-500" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Calidad de Sueño</p>
                                    <div className="flex items-baseline gap-1">
                                        <p className={`text-2xl font-black ${getSleepColor(sleepHours)}`}>
                                            {sleepHours !== null ? `${sleepHours}h` : '--'}
                                        </p>
                                        <span className="text-[9px] font-bold text-slate-400 truncate">
                                            {sleepHours !== null ? (sleepHours >= 7 ? '✓ Óptimo' : '⚠️ Insuficiente') : ''}
                                        </span>
                                    </div>
                                    {adjustment !== 0 && (
                                        <p className="text-[9px] font-black text-indigo-400 italic">Manual: {adjustment > 0 ? '+' : ''}{adjustment}h</p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => updateManualSleep(0.5)}
                                    className="w-10 h-10 rounded-xl bg-white border border-indigo-100 text-indigo-500 hover:bg-indigo-500 hover:text-white transition-all flex items-center justify-center font-black text-xs shadow-sm active:scale-90"
                                >
                                    +0.5
                                </button>
                                <button 
                                    onClick={() => updateManualSleep(-0.5)}
                                    className="w-10 h-10 rounded-xl bg-white border border-slate-100 text-slate-400 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center font-black text-xs shadow-sm active:scale-90"
                                >
                                    -0.5
                                </button>
                            </div>
                        </div>

                        {/* SpO2 - Rediseño Premium Glass */}
                        <div className="col-span-2 glass-card rounded-[2.5rem] p-6 border-white/40 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/5 blur-3xl rounded-full translate-x-12 -translate-y-12" />
                            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-4 w-full sm:w-auto">
                                    <div className="p-3 bg-cyan-50 text-cyan-500 rounded-2xl shadow-sm border border-cyan-100/50">
                                        <Activity size={24} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Saturación Oxígeno</p>
                                        <div className="flex items-baseline gap-2">
                                            <p className="text-4xl font-black text-slate-800 tracking-tighter">
                                                {currentSpO2 !== null ? `${currentSpO2}%` : '--'}
                                            </p>
                                            {manualSpO2[selectedDate] && (
                                                <span className="text-[9px] font-black text-cyan-600 uppercase px-2 py-0.5 bg-cyan-50 rounded-lg border border-cyan-100 flex items-center gap-1">
                                                    <span className="w-1 h-1 bg-cyan-500 rounded-full animate-pulse" /> Manual
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 w-full sm:w-auto justify-center">
                                    <button 
                                        onClick={() => updateManualSpO2((currentSpO2 || 98) - 1)}
                                        className="h-12 px-5 rounded-xl bg-white border border-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all flex items-center justify-center font-black text-xl shadow-sm active:scale-90"
                                    >
                                        -
                                    </button>
                                    <div className="w-[1px] h-6 bg-slate-200 mx-1" />
                                    <button 
                                        onClick={() => updateManualSpO2((currentSpO2 || 98) + 1)}
                                        className="h-12 px-5 rounded-xl bg-white border border-slate-100 text-indigo-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100 transition-all flex items-center justify-center font-black text-xl shadow-sm active:scale-90"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Pasos */}
                        <div className="bento-item bg-emerald-50/30 p-4 rounded-[1.5rem] border border-emerald-100/50">
                            <div className="flex items-center gap-2 mb-2">
                                <Footprints size={14} className="text-emerald-500" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pasos</span>
                            </div>
                            <p className={`text-xl font-black ${steps !== null && steps >= 7500 ? 'text-emerald-600' : 'text-slate-700'}`}>
                                {steps !== null ? steps.toLocaleString('es-ES') : '--'}
                            </p>
                            <div className={`mt-1 h-1 w-full bg-slate-100 rounded-full overflow-hidden`}>
                                <div 
                                    className="h-full bg-emerald-500 transition-all duration-1000" 
                                    style={{ width: `${Math.min(100, (steps || 0) / 100)}%` }}
                                />
                            </div>
                        </div>

                        {/* Calorías */}
                        <div className="bento-item bg-orange-50/30 p-4 rounded-[1.5rem] border border-orange-100/50">
                            <div className="flex items-center gap-2 mb-2">
                                <Flame size={14} className="text-orange-500" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Energía</span>
                            </div>
                            <p className="text-xl font-black text-slate-700">
                                {activeCalories !== null ? `${activeCalories}` : '--'}
                                <span className="text-[10px] lowercase ml-0.5">kcal</span>
                            </p>
                            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Quemadas act.</p>
                        </div>

                        {/* FC Reposo */}
                        <div className="bento-item bg-rose-50/30 p-4 rounded-[1.5rem] border border-rose-100/50">
                            <div className="flex items-center gap-2 mb-2">
                                <Heart size={14} className="text-rose-500" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">FC Reposo</span>
                            </div>
                            <p className={`text-xl font-black ${getHrColor(restingHeartRate)}`}>
                                {restingHeartRate !== null ? `${restingHeartRate}` : '--'}
                                <span className="text-[10px] lowercase ml-0.5">bpm</span>
                            </p>
                        </div>
                    </div>
                )}

                {/* Stress Slider Section */}
                <div className="mt-8 p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-white rounded-xl shadow-sm">
                                <Activity size={16} className="text-violet-500" />
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] block">Carga Mental</span>
                                <span className="text-xs font-bold text-slate-700">Estrés Percibido</span>
                            </div>
                        </div>
                        <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${currentStress < 4 ? 'bg-emerald-100 text-emerald-600' : currentStress < 7 ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}>
                            {currentStress < 4 ? 'Flow' : currentStress < 7 ? 'Moderado' : 'Alerta'}
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-5">
                        <span className="text-lg grayscale hover:grayscale-0 transition-all cursor-default scale-110">😌</span>
                        <input 
                            type="range" 
                            min="1" 
                            max="10" 
                            step="1"
                            value={currentStress}
                            onChange={(e) => updateStressLevel(parseInt(e.target.value))}
                            className="flex-1 h-2 bg-white rounded-full appearance-none cursor-pointer accent-violet-600 shadow-inner"
                        />
                        <span className="text-lg grayscale hover:grayscale-0 transition-all cursor-default scale-110">🤯</span>
                    </div>
                    <div className="flex justify-between px-8 mt-2">
                        <span className="text-[9px] font-black text-slate-300 tracking-tighter italic">Baja Carga</span>
                        <span className="text-[9px] font-black text-slate-300 tracking-tighter italic">Carga Máxima</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FitnessPanel;
