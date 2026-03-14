import React from 'react';
import { Activity, LogOut, RefreshCw } from 'lucide-react';
import { useEngineStore } from '../store/useEngineStore';
import { logoutFromFirebase } from '../services/firebase';

const HeaderStats: React.FC = () => {
    const chartData = useEngineStore((state) => state.chartData);
    const user = useEngineStore((state) => state.user);
    const baseIq = useEngineStore((state) => state.baseIq) || 100;
    const resetAssessment = useEngineStore((state) => state.resetAssessment);
    
    // Calcula el IQ máximo que se alcanza en el día para mostrar en el "Peak IQ"
    const maxIq = chartData.reduce((max, point) => point.iq > max ? point.iq : max, baseIq);

    return (
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 gap-6">
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-indigo-600 font-bold tracking-[0.2em] text-[10px] uppercase bg-indigo-50 px-3 py-1 rounded-full w-fit border border-indigo-200">
                    <Activity size={12} /> Quantum Performance Engine v8.0
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter">
                    Bienestar <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500">Universal</span>
                </h1>
                <p className="text-slate-500 text-xs font-medium">Línea de tiempo estructurada para máximo rendimiento cognitivo.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-start md:items-end w-full lg:w-auto">
                <div className="flex gap-3">
                    <div className="bg-white shadow-xl shadow-slate-200/50 p-4 rounded-3xl border border-slate-200 text-center min-w-[100px]">
                        <p className="text-[8px] text-slate-400 font-black uppercase mb-1">Tu CI Base</p>
                        <p className="text-xl md:text-2xl font-black text-slate-800">{baseIq}</p>
                    </div>
                    <div className="bg-indigo-50 shadow-xl shadow-indigo-200/50 p-4 rounded-3xl border border-indigo-200 text-center min-w-[100px]">
                        <p className="text-[8px] text-indigo-500 font-black uppercase mb-1">Peak Hoy</p>
                        <p className="text-xl md:text-2xl font-black text-indigo-700">{maxIq}</p>
                    </div>
                </div>

                {user && (
                    <div className="flex items-center gap-3 bg-white shadow-lg shadow-slate-200/30 p-2 pr-4 rounded-full border border-slate-200 lg:ml-auto w-full md:w-auto">
                        <img 
                            src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}&background=6366f1&color=fff`} 
                            alt="avatar" 
                            className="w-10 h-10 rounded-full border border-slate-100"
                        />
                        <div className="flex flex-col overflow-hidden gap-0.5">
                            <span className="text-[10px] text-slate-700 font-bold truncate max-w-[120px]">{user.displayName || user.email || 'Usuario'}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                                <button onClick={resetAssessment} className="text-[9px] text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-1 transition-colors text-left" title="Repetir Test IQ">
                                    <RefreshCw size={9} /> Repetir Test
                                </button>
                                <button onClick={logoutFromFirebase} className="text-[9px] text-slate-400 hover:text-rose-500 font-medium flex items-center gap-1 transition-colors text-left">
                                    <LogOut size={9} /> Salir
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HeaderStats;
