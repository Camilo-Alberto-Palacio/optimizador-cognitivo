import React, { useState } from 'react';
import { Moon, Heart, Footprints, Flame, RefreshCw, AlertCircle, CheckCircle2, Activity } from 'lucide-react';
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
        <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Heart size={14} className="text-rose-400" fill="currentColor" /> Google Fit · {dateLabel}
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">Act. {lastFetchTime}</span>
                    <button
                        onClick={handleRefresh}
                        disabled={isFetchingFitness}
                        className={`p-1.5 rounded-lg transition-all active:scale-90 ${isFetchingFitness ? 'bg-indigo-50 text-indigo-400 cursor-not-allowed' : 'bg-slate-100 hover:bg-indigo-100 hover:text-indigo-600 text-slate-500'}`}
                        title="Actualizar datos de Fit"
                    >
                        <RefreshCw size={14} className={isFetchingFitness ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Sync Tip (v8.1) */}
            <div className="mb-4 px-3 py-2 bg-indigo-50/50 rounded-xl border border-indigo-100/50 flex items-start gap-2">
                <AlertCircle size={14} className="text-indigo-400 mt-0.5" />
                <p className="text-[9px] text-indigo-600 font-medium leading-tight">
                    Si los pasos no coinciden, abre Google Fit en tu teléfono para sincronizarlos.
                </p>
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

                    {/* Oxígeno (SpO2) */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Activity size={13} className="text-cyan-400" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Oxígeno SpO2</span>
                        </div>
                        
                        <div className="flex items-end justify-between">
                            <div>
                                <p className={`text-xl font-black ${currentSpO2 !== null && currentSpO2 >= 95 ? 'text-cyan-600' : currentSpO2 !== null && currentSpO2 >= 90 ? 'text-amber-500' : 'text-rose-600'}`}>
                                    {currentSpO2 !== null ? `${currentSpO2}%` : '--'}
                                </p>
                                <p className="text-[10px] text-slate-400 font-medium">
                                    {currentSpO2 !== null ? (currentSpO2 >= 95 ? 'Óptimo ✓' : currentSpO2 >= 90 ? 'Bajo' : 'Alerta') : 'Sin datos'}
                                </p>
                            </div>

                            {/* Ajuste Manual SpO2 */}
                            <div className="flex flex-col items-center gap-1">
                                <button 
                                    onClick={() => updateManualSpO2((currentSpO2 || 98) + 1)}
                                    className="p-1 rounded-md bg-cyan-50 text-cyan-600 hover:bg-cyan-100 transition-colors"
                                    title="Aumentar SpO2"
                                >
                                    <Activity size={10} className="rotate-90" />
                                    <span className="text-[8px] font-bold">+1%</span>
                                </button>
                                <button 
                                    onClick={() => updateManualSpO2((currentSpO2 || 98) - 1)}
                                    className="p-1 rounded-md bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-400 transition-colors"
                                    title="Disminuir SpO2"
                                >
                                    <span className="text-[8px] font-bold">-1%</span>
                                </button>
                            </div>
                        </div>
                        
                        {manualSpO2[selectedDate] !== undefined && (
                            <div className="mt-1 text-[8px] font-bold text-cyan-500 italic bg-cyan-50/50 px-1.5 py-0.5 rounded-full inline-block">
                                Ajuste manual: {manualSpO2[selectedDate]}%
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Stress Slider Section */}
            <div className="mt-5 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                        <Activity size={13} className="text-violet-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Estrés Percibido</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${currentStress < 4 ? 'bg-emerald-100 text-emerald-600' : currentStress < 7 ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}>
                        {currentStress < 4 ? 'Bajo' : currentStress < 7 ? 'Moderado' : 'Alto'}
                    </span>
                </div>
                
                <div className="flex items-center gap-4">
                    <span className="text-lg">😌</span>
                    <input 
                        type="range" 
                        min="1" 
                        max="10" 
                        step="1"
                        value={currentStress}
                        onChange={(e) => updateStressLevel(parseInt(e.target.value))}
                        className="flex-1 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-violet-500"
                    />
                    <span className="text-lg">🤯</span>
                </div>
                <div className="flex justify-between px-7 mt-1">
                    <span className="text-[9px] font-bold text-slate-400">1</span>
                    <span className="text-[9px] font-bold text-slate-400">5</span>
                    <span className="text-[9px] font-bold text-slate-400">10</span>
                </div>
                <p className="text-[9px] text-slate-400 mt-2 italic leading-tight">
                    * El estrés alto reduce drásticamente tu capacidad cognitiva base debido a la carga de cortisol.
                </p>
            </div>
        </div>
    );
};

export default FitnessPanel;
