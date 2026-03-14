import React, { useState } from 'react';
import { Clock, Plus, Star, Search, Activity, Trash2, Hash } from 'lucide-react';
import { useEngineStore } from '../store/useEngineStore';
import { SUPPLEMENT_CATALOG } from '../data/supplements';

const ControlPanel: React.FC = () => {
  const { logs, favorites, addLog, removeLog, toggleFavorite } = useEngineStore();

  // getCurrentTime helper 'HH:mm'
  const getCurrentTimeStr = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  const [selectedSuppId, setSelectedSuppId] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>(getCurrentTimeStr());
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  
  // Search Filtering State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSuppId && selectedTime && selectedQuantity > 0) {
      addLog(selectedSuppId, selectedTime, selectedQuantity);
      setSelectedSuppId('');
      setSearchTerm('');
      setSelectedQuantity(1);
    }
  };

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

  // Safe fetch defs
  const sortedLogs = [...logs].sort((a, b) => a.timeStr.localeCompare(b.timeStr));

  return (
    <div className="lg:col-span-4 flex flex-col gap-6">
      
      {/* 1. FAVORITOS RAPIDOS */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
           <Star size={14} className="text-amber-400" fill="currentColor" /> Mis Favoritos
        </h3>
        
        {favorites.length === 0 ? (
           <p className="text-xs text-slate-400 italic">No tienes favoritos aún. Selecciona uno del catálogo abajo.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {favorites.map(favId => {
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
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-2"
                >
                  <Activity size={12} /> {def.name}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* 2. REGISTRO DINAMICO */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50">
         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
           <Plus size={14} className="text-indigo-500" /> Registrar Evento
        </h3>
        
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
           
           <div className="flex flex-col gap-1.5 relative">
             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Herramienta / Suplemento</label>
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text"
                  placeholder="Escribe para buscar (Ej: Cafe, Magnesio, Siesta...)"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSelectedSuppId(''); // Reset id if user types freely
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  onBlur={() => {
                     // small delay to allow onClick on list items to fire
                     setTimeout(() => setIsDropdownOpen(false), 200);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
             </div>
             
             {/* Dropdown Menu */}
             {isDropdownOpen && filteredSupplements.length > 0 && (
                <ul className="absolute z-20 top-full mt-1 w-full bg-white border border-slate-200 shadow-2xl rounded-xl max-h-60 overflow-y-auto overflow-x-hidden">
                   {filteredSupplements.map(s => (
                     <li 
                       key={s.id}
                       onMouseDown={() => {
                         setSelectedSuppId(s.id);
                         setSearchTerm(s.name);
                         setIsDropdownOpen(false);
                       }}
                       className={`px-4 py-3 hover:bg-indigo-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors flex justify-between items-center ${selectedSuppId === s.id ? 'bg-indigo-50' : ''}`}
                     >
                        <span className="font-bold text-sm text-slate-700">{s.name}</span>
                        <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-1 rounded-md uppercase font-black">{categoryLabels[s.category]}</span>
                     </li>
                   ))}
                </ul>
             )}
           </div>

           <div className="flex gap-4">
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Cantidad / Dosis</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="number" 
                    min="1"
                    step="0.5"
                    value={selectedQuantity}
                    onChange={(e) => setSelectedQuantity(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Hora Exacta</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="time" 
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col justify-end pt-5">
                <button 
                  type="button" 
                  onClick={() => selectedSuppId ? toggleFavorite(selectedSuppId) : null}
                  className={`h-[46px] w-[46px] flex items-center justify-center rounded-xl border transition-all ${favorites.includes(selectedSuppId) ? 'bg-amber-100 border-amber-300 text-amber-500' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-amber-400'}`}
                  title={favorites.includes(selectedSuppId) ? 'Quitar de Favoritos' : 'Añadir a Favoritos'}
                >
                   <Star size={20} fill={favorites.includes(selectedSuppId) ? 'currentColor' : 'none'} />
                </button>
              </div>
           </div>

           <button 
             type="submit" 
             disabled={!selectedSuppId}
             className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all active:scale-95 flex justify-center items-center gap-2"
           >
             <Plus size={18} /> Registrar en la Línea de Tiempo
           </button>
        </form>
      </div>

      {/* 3. LÍNEA DE TIEMPO (Bitácora) */}
      <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200">
         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
           Diario de Hoy ({logs.length})
        </h3>

        <div className="flex flex-col gap-2">
           {sortedLogs.length === 0 ? (
             <div className="text-center py-6 text-slate-400 text-xs font-medium">No has registrado nada el día de hoy.</div>
           ) : (
             sortedLogs.map(log => {
               const def = SUPPLEMENT_CATALOG.find(s => s.id === log.supplementId);
               return (
                 <div key={log.id} className="bg-white border border-slate-200 rounded-xl p-3 flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-3">
                       <span className="bg-indigo-100 text-indigo-700 text-xs font-black px-2 py-1 rounded-md">{log.timeStr}</span>
                       <div>
                         <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                           {def?.name || 'Desconocido'} 
                           {(log.quantity && log.quantity > 1) ? (
                             <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-md">x{log.quantity}</span>
                           ) : null}
                         </p>
                       </div>
                    </div>
                    <button 
                      onClick={() => removeLog(log.id)}
                      className="text-rose-500 bg-rose-50 hover:bg-rose-100 hover:text-rose-600 transition-colors px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold"
                      title="Eliminar evento"
                    >
                      <Trash2 size={14} /> Borrar
                    </button>
                 </div>
               )
             })
           )}
        </div>
      </div>
      
    </div>
  );
};

export default ControlPanel;
