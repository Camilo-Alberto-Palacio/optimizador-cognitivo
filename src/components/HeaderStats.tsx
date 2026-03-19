import React from 'react';
import { Activity, LogOut, RefreshCw, ChevronLeft, ChevronRight, Calendar, Info } from 'lucide-react';
import { useEngineStore } from '../store/useEngineStore';
import { logoutFromFirebase } from '../services/firebase';

const HeaderStats: React.FC = () => {
    const { chartData, user, baseIq, resetAssessment, selectedDate, setSelectedDate } = useEngineStore();
    
    const today = new Date().toISOString().split('T')[0];

    const navigateDate = (direction: 'prev' | 'next') => {
        const d = new Date(selectedDate + 'T12:00:00');
        d.setDate(d.getDate() + (direction === 'next' ? 1 : -1));
        const newDate = d.toISOString().split('T')[0];
        setSelectedDate(newDate);
    };

    const formatDisplayDate = (dateStr: string): string => {
        if (dateStr === today) return 'Hoy';
        const d = new Date(dateStr + 'T12:00:00');
        return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
    };
    
    // Calcula el IQ máximo que se alcanza en el día para mostrar en el "Peak IQ"
    const maxIq = chartData.reduce((max, point) => point.iq > max ? point.iq : max, baseIq || 100);

    return (
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 gap-6">
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-indigo-600 font-bold tracking-[0.2em] text-[10px] uppercase bg-indigo-50 px-3 py-1 rounded-full w-fit border border-indigo-200">
                    <Activity size={12} /> Quantum Performance Engine v8.5 PRO
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter">
                    Estado <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500">Cognitivo</span>
                </h1>
                <p className="text-slate-500 text-xs font-medium">Análisis de rendimiento distribuido en tiempo real.</p>
            </div>

            <div className="flex flex-row gap-1.5 md:gap-4 items-center w-full lg:w-auto pb-1 md:pb-0">
                {/* DATE SELECTOR */}
                <div className="bg-white shadow-xl shadow-slate-200/50 p-1.5 md:p-2 px-2 md:px-4 rounded-2xl md:rounded-3xl border border-slate-200 flex items-center gap-1.5 md:gap-4 h-[64px] md:h-[68px] flex-[1.4] min-w-0">
                    <button 
                        onClick={() => navigateDate('prev')}
                        className="p-1.5 md:p-2 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-all shrink-0"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <div className="text-center flex-1 min-w-0">
                        <p className="hidden md:flex text-[8px] text-slate-400 font-black uppercase items-center justify-center gap-1">
                            <Calendar size={10} /> {selectedDate === today ? 'Fecha Actual' : 'Historial'}
                        </p>
                        <p className="text-xs md:text-sm font-black text-slate-800 capitalize leading-tight truncate">
                            {formatDisplayDate(selectedDate)}
                        </p>
                        {selectedDate !== today && (
                            <button onClick={() => setSelectedDate(today)} className="text-[9px] text-indigo-500 font-bold hover:underline block mx-auto">
                                Reset
                            </button>
                        )}
                    </div>
                    <button 
                        onClick={() => navigateDate('next')}
                        disabled={selectedDate >= today}
                        className="p-1.5 md:p-2 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-all disabled:opacity-20 shrink-0"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>

                <div className="flex gap-2 flex-1">
                    <div className="group relative bg-white shadow-xl shadow-slate-200/50 p-2 md:p-4 rounded-2xl md:rounded-3xl border border-slate-200 text-center flex-1 min-w-0 h-[64px] md:h-[68px] flex flex-col justify-center cursor-help">
                        {/* Tooltip explanation for BASE */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-white text-[10px] p-3 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl z-50 leading-relaxed text-left">
                            <p className="font-black text-slate-300 uppercase mb-1 flex items-center gap-1"><Info size={10}/> CI BASE</p>
                            Es tu potencial natural medido en el test inicial.
                        </div>
                        <p className="text-[7px] md:text-[8px] text-slate-400 font-black uppercase mb-0.5">Base</p>
                        <p className="text-lg md:text-2xl font-black text-slate-800">{baseIq}</p>
                    </div>

                    <div className="group relative bg-indigo-50 shadow-xl shadow-indigo-200/50 p-2 md:p-4 rounded-2xl md:rounded-3xl border border-indigo-200 text-center flex-1 min-w-0 h-[64px] md:h-[68px] flex flex-col justify-center cursor-help">
                        {/* Tooltip explanation for PEAK */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-slate-800 text-white text-[10px] p-3 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl z-50 leading-relaxed text-left">
                            <p className="font-black text-indigo-300 uppercase mb-1 flex items-center gap-1"><Info size={10}/> PEAK ESTIMADO</p>
                            Máximo potencial alcanzable hoy.
                        </div>
                        <p className="text-[7px] md:text-[8px] text-indigo-500 font-black uppercase mb-0.5">Peak</p>
                        <p className="text-lg md:text-2xl font-black text-indigo-700">{maxIq}</p>
                    </div>
                </div>

                {user && (
                    <div className="hidden lg:flex items-center gap-3 bg-white shadow-lg shadow-slate-200/30 p-2 pr-4 rounded-full border border-slate-200 lg:ml-auto w-full md:w-auto">
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
