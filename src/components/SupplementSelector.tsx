import React, { useState } from 'react';
import { Plus, Star, Search, FileText, Zap, Save, CheckCircle, ArrowRight } from 'lucide-react';
import { useEngineStore } from '../store/useEngineStore';
import { LogEvent } from '../types';
import { SUPPLEMENT_CATALOG } from '../data/supplements';

interface SupplementSelectorProps {
    initialData?: LogEvent;
    onComplete?: () => void;
}

const SupplementSelector: React.FC<SupplementSelectorProps> = ({ initialData, onComplete }) => {
    const { favorites, addLog, updateLog, toggleFavorite, notify } = useEngineStore();
    
    // getCurrentTime helper 'HH:mm'
    const getCurrentTimeStr = () => {
        const now = new Date();
        return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    };

    const [selectedSuppId, setSelectedSuppId] = useState<string>(initialData?.supplementId || '');
    const [selectedTime, setSelectedTime] = useState<string>(initialData?.timeStr || getCurrentTimeStr());
    const [selectedQuantity, setSelectedQuantity] = useState<number>(initialData?.quantity || 1);
    const [note, setNote] = useState<string>(initialData?.note || '');
    const [searchTerm, setSearchTerm] = useState<string>(initialData ? (SUPPLEMENT_CATALOG.find(s => s.id === initialData.supplementId)?.name || '') : '');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();

        // DETAILED VALIDATION
        if (!selectedSuppId) {
            notify("Error: Debes seleccionar un ítem (Suplemento o Bebida) de la lista.", "error");
            return;
        }

        if (selectedQuantity <= 0) {
            notify("Error: La dosis debe ser al menos de 1 unidad.", "error");
            return;
        }

        if (!selectedTime) {
            notify("Error: La hora es obligatoria para el registro.", "error");
            return;
        }

        if (selectedSuppId && selectedTime && selectedQuantity > 0) {
            if (initialData) {
                updateLog(initialData.id, selectedSuppId, selectedTime, selectedQuantity, note);
            } else {
                addLog(selectedSuppId, selectedTime, selectedQuantity, note);
            }
            
            // SHOW SUCCESS SCREEN
            setIsSuccess(true);
        }
    };

    if (isSuccess) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300 min-h-[400px]">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-100/50">
                    <CheckCircle size={40} className="animate-bounce" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">¡Operación Exitosa!</h3>
                <p className="text-slate-500 mb-8 max-w-[240px]">
                    {initialData ? 'Los cambios han sido guardados correctamente en la nube.' : 'El evento ha sido registrado en tu bitácora diaria.'}
                </p>
                <button 
                    onClick={() => {
                        if (onComplete) {
                            onComplete();
                        } else {
                            // RESET FOR DESKTOP INLINE USE
                            setIsSuccess(false);
                            setSearchTerm('');
                            setSelectedSuppId('');
                            setNote('');
                            setSelectedQuantity(1);
                        }
                    }}
                    className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                    {onComplete ? 'Continuar al Inicio' : 'Registrar Nuevo Evento'} <ArrowRight size={20} />
                </button>
            </div>
        );
    }

    const filteredSupplements = SUPPLEMENT_CATALOG.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const categoryLabels: Record<string, string> = {
        mineral: 'Mineral/Base',
        stimulant: 'Estimulante',
        nootropic: 'Nootrópico',
        adaptation: 'Adaptógeno',
        nutrition: 'Nutrición',
        other: 'Hábito / Práctica'
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* FAVORITOS RAPIDOS */}
            <div className="glass-card p-6 rounded-[2rem] border border-slate-100 flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-amber-50 rounded-xl">
                        <Star size={16} className="text-amber-500" fill="currentColor" />
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Favoritos</h3>
                        <p className="text-[9px] font-bold text-slate-400">Acceso Rápido</p>
                    </div>
                </div>
                
                {favorites.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-8 opacity-40">
                        <Star size={32} className="text-slate-300 mb-2" />
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight text-center">Sin favoritos guardados</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {favorites.slice(0, 6).map(favId => {
                            const def = SUPPLEMENT_CATALOG.find(s => s.id === favId);
                            if (!def) return null;
                            return (
                                <button 
                                    type="button"
                                    key={favId} 
                                    onClick={() => { 
                                        setSelectedSuppId(favId); 
                                        setSearchTerm(def.name);
                                        setSelectedTime(getCurrentTimeStr()); 
                                        setSelectedQuantity(1);
                                        setIsDropdownOpen(false);
                                    }}
                                    className="group bento-item bg-white/50 hover:bg-indigo-600 hover:text-white border border-slate-100 p-3 rounded-2xl transition-all flex flex-col items-center text-center gap-2"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 group-hover:bg-white/20 flex items-center justify-center transition-colors">
                                        <Zap size={14} className="text-indigo-500 group-hover:text-white" />
                                    </div>
                                    <span className="text-[10px] font-black leading-tight truncate w-full">{def.name}</span>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* REGISTRO DINAMICO */}
            <div className="glass-card p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-indigo-500/5">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-indigo-50 rounded-xl">
                        <Plus size={16} className="text-indigo-500" />
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Registro</h3>
                        <p className="text-[9px] font-bold text-slate-400">Nuevo Evento</p>
                    </div>
                </div>
                
                <form onSubmit={handleAdd} className="flex flex-col gap-6">
                    <div className="space-y-2 relative">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Seleccionar Ítem</label>
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                            <input 
                                type="text"
                                placeholder="..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setSelectedSuppId('');
                                    setIsDropdownOpen(true);
                                }}
                                onFocus={() => setIsDropdownOpen(true)}
                                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all"
                            />
                        </div>
                        {isDropdownOpen && filteredSupplements.length > 0 && (
                            <ul className="absolute z-[60] top-full mt-2 w-full bg-white border border-slate-100 shadow-2xl rounded-[1.5rem] max-h-60 overflow-y-auto overflow-x-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                {filteredSupplements.map(s => (
                                    <li 
                                        key={s.id}
                                        onMouseDown={() => {
                                            setSelectedSuppId(s.id);
                                            setSearchTerm(s.name);
                                            setIsDropdownOpen(false);
                                        }}
                                        className={`px-6 py-4 hover:bg-indigo-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors flex justify-between items-center ${selectedSuppId === s.id ? 'bg-indigo-50' : ''}`}
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-black text-sm text-slate-700">{s.name}</span>
                                            <span className="text-[9px] text-slate-400 uppercase font-black">{categoryLabels[s.category]}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dosis (u)</label>
                            <input 
                                type="number" 
                                min="0.5"
                                step="0.5"
                                value={selectedQuantity}
                                onChange={(e) => setSelectedQuantity(Number(e.target.value))}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-black text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hora</label>
                            <input 
                                type="time" 
                                value={selectedTime}
                                onChange={(e) => setSelectedTime(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-black text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <FileText size={12} /> Comentario <span className="text-[9px] opacity-40 lowercase font-bold">(opcional)</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Ej: Ayuno, Pre-Work..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-xs font-bold text-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all placeholder:font-medium placeholder:text-slate-300"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button 
                            type="button" 
                            onClick={() => selectedSuppId ? toggleFavorite(selectedSuppId) : null}
                            className={`h-14 w-14 flex items-center justify-center rounded-2xl border transition-all active:scale-90 ${favorites.includes(selectedSuppId) ? 'bg-amber-50 border-amber-200 text-amber-500' : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-amber-400'}`}
                        >
                            <Star size={20} fill={favorites.includes(selectedSuppId) ? 'currentColor' : 'none'} />
                        </button>
                        <button 
                            type="submit" 
                            disabled={!selectedSuppId}
                            className={`${initialData ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'} flex-1 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all active:scale-[0.98] flex justify-center items-center gap-3 uppercase tracking-[0.1em] text-xs shadow-lg`}
                        >
                            {initialData ? <Save size={16} fill="currentColor" /> : <Zap size={16} fill="currentColor" />}
                            {initialData ? 'Guardar Cambios' : 'Registrar Ahora'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SupplementSelector;
