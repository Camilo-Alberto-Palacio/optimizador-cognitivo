import React from 'react';
import { ChevronLeft, ChevronRight, BookOpen, Eye, EyeOff, Trash2 } from 'lucide-react';
import { useEngineStore, getTodayStr } from '../store/useEngineStore';
import { SUPPLEMENT_CATALOG } from '../data/supplements';

const JournalTimeline: React.FC = () => {
    const { allLogs, selectedDate, setSelectedDate, toggleLogVisibility, removeLog } = useEngineStore();
    const today = getTodayStr();

    const logs = allLogs[selectedDate] || [];
    const sortedLogs = [...logs].sort((a, b) => a.timeStr.localeCompare(b.timeStr));

    const navigateDate = (direction: 'prev' | 'next') => {
        const d = new Date(selectedDate + 'T12:00:00');
        d.setDate(d.getDate() + (direction === 'next' ? 1 : -1));
        const newDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        setSelectedDate(newDate);
    };

    const formatDisplayDate = (dateStr: string): string => {
        const d = new Date(dateStr + 'T12:00:00');
        if (dateStr === today) return 'Hoy';
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
        if (dateStr === yStr) return 'Ayer';
        return d.toLocaleDateString('es-ES', { weekday: 'long', month: 'long', day: 'numeric' });
    };

    const daysWithLogs = Object.keys(allLogs).filter(d => (allLogs[d] || []).length > 0).sort();
    const totalLoggedDays = daysWithLogs.length;

    return (
        <div className="flex flex-col gap-4">
            {/* DATE NAVIGATOR */}
            <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigateDate('prev')}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-indigo-100 hover:text-indigo-600 transition-all active:scale-90"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    
                    <div className="text-center">
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-0.5">Bitácora</p>
                        <h2 className="text-sm font-black text-slate-800 capitalize">{formatDisplayDate(selectedDate)}</h2>
                        {selectedDate !== today && (
                            <button onClick={() => setSelectedDate(today)} className="text-[9px] text-indigo-500 font-bold hover:underline">
                                Volver a Hoy
                            </button>
                        )}
                    </div>
                    
                    <button
                        onClick={() => navigateDate('next')}
                        disabled={selectedDate >= today}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-indigo-100 hover:text-indigo-600 transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
                
                {/* Journal stats */}
                <div className="flex justify-center gap-6 mt-3 pt-3 border-t border-slate-100">
                    <div className="text-center">
                        <p className="text-xl font-black text-indigo-600">{logs.length}</p>
                        <p className="text-[8px] text-slate-400 uppercase font-bold">Registros</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xl font-black text-emerald-600">{totalLoggedDays}</p>
                        <p className="text-[8px] text-slate-400 uppercase font-bold">Días Bitácora</p>
                    </div>
                </div>
            </div>

            {/* LISTA DE EVENTOS */}
            <div className="bg-slate-50 p-4 rounded-[2rem] border border-slate-200">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <BookOpen size={14} className="text-slate-400" /> Eventos del Día ({logs.length})
                </h3>
                <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                    {sortedLogs.length === 0 ? (
                        <div className="text-center py-6 text-slate-400 text-[10px] font-medium italic">No hay registros para este día.</div>
                    ) : (
                        sortedLogs.map(log => {
                            const def = SUPPLEMENT_CATALOG.find(s => s.id === log.supplementId);
                            return (
                                <div key={log.id} className={`border rounded-xl p-3 shadow-sm transition-all ${log.hidden ? 'opacity-40 grayscale bg-slate-100 border-slate-200' : (def && def.effectK < 0 ? 'bg-rose-50/30 border-rose-100' : 'bg-white border-slate-200')}`}>
                                    <div className="flex justify-between items-center gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className={`${log.hidden ? 'bg-slate-200 text-slate-500' : (def && def.effectK < 0 ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700')} text-[10px] font-black px-1.5 py-0.5 rounded-md flex-shrink-0`}>
                                                {log.timeStr}
                                            </span>
                                            <div className="truncate">
                                                <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5 truncate">
                                                    {def?.name || 'Desconocido'} 
                                                    {(log.quantity && log.quantity > 1) ? (
                                                        <span className={`${log.hidden ? 'bg-slate-400' : (def && def.effectK < 0 ? 'bg-rose-600' : 'bg-indigo-600')} text-white text-[8px] px-1 py-0.5 rounded-md`}>x{log.quantity}</span>
                                                    ) : null}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1.5 flex-shrink-0">
                                            <button 
                                                type="button"
                                                onClick={() => toggleLogVisibility(log.id)}
                                                className={`p-1 rounded-lg border transition-all ${log.hidden ? 'bg-indigo-500 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-300 hover:text-indigo-500'}`}
                                            >
                                                {log.hidden ? <Eye size={12} /> : <EyeOff size={12} />}
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => removeLog(log.id)}
                                                className={`${def && def.effectK < 0 ? 'text-rose-600 bg-rose-100 hover:bg-rose-200' : 'text-rose-500 bg-rose-50 hover:bg-rose-100'} p-1 rounded-lg transition-colors`}
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                    {log.note && !log.hidden && (
                                        <p className="mt-2 text-[10px] text-slate-400 italic border-t border-slate-100 pt-1 leading-tight truncate">💬 {log.note}</p>
                                    )}
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default JournalTimeline;
