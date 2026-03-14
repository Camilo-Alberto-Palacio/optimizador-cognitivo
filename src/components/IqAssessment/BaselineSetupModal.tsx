import React, { useState } from 'react';
import { Target, Zap, Check } from 'lucide-react';
import IqTestEngine from './IqTestEngine';
import { useEngineStore } from '../../store/useEngineStore';

export const BaselineSetupModal: React.FC = () => {
  const [mode, setMode] = useState<'selection' | 'manual' | 'test'>('selection');
  const [manualIq, setManualIq] = useState<string>('100');
  
  const setBaseIq = useEngineStore(state => state.setBaseIq);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(manualIq, 10);
    if (!isNaN(parsed) && parsed >= 50 && parsed <= 200) {
      setBaseIq(parsed);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blackout blur */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-white border border-slate-200 shadow-2xl rounded-3xl overflow-hidden min-h-[400px] flex flex-col">
         {/* Decorative gradient line */}
         <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />
         
         <div className="p-6 md:p-8 flex-1 flex flex-col">
            
            {/* 1. SELECTION MODE */}
            {mode === 'selection' && (
              <div className="animate-fade-in flex flex-col h-full justify-center">
                 <h2 className="text-3xl font-black text-slate-800 mb-2 leading-tight">Configura tu Línea Base Cognitiva</h2>
                 <p className="text-slate-500 text-sm mb-8">
                   Conocer tu CI Base nos permite proyectar de forma precisa cómo los distintos hábitos y estrategias impactan tu cerebro en el día.
                 </p>

                 <div className="grid grid-cols-1 gap-4">
                    {/* Test Option */}
                    <button 
                      onClick={() => setMode('test')}
                      className="group relative bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 p-5 rounded-2xl text-left transition-all active:scale-[0.98] overflow-hidden"
                    >
                       <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/80 transition-all opacity-50" />
                       <div className="flex items-start gap-4 relative z-10">
                          <div className="bg-white/80 p-3 rounded-xl shadow-sm">
                            <Zap className="text-indigo-600 w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-indigo-900 font-bold text-lg mb-1 flex items-center gap-2">Evaluación Sistema <span className="text-[9px] bg-indigo-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm">Recomendado</span></h3>
                            <p className="text-indigo-700/70 text-xs">Toma un test riguroso de 3 minutos de razonamiento espacial, biológico y matemático.</p>
                          </div>
                       </div>
                    </button>

                    {/* Manual Option */}
                    <button 
                      onClick={() => setMode('manual')}
                      className="group bg-slate-50 hover:bg-slate-100 border border-slate-200 p-5 rounded-2xl text-left transition-all active:scale-[0.98]"
                    >
                       <div className="flex items-start gap-4">
                          <div className="bg-white p-3 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                            <Target className="text-slate-500 w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-slate-800 font-bold text-lg mb-1">Ingreso Manual</h3>
                            <p className="text-slate-500 text-xs">Si ya te haz realizado una evaluación cognitiva supervisada, puedes ingresar tu resultado.</p>
                          </div>
                       </div>
                    </button>
                 </div>
              </div>
            )}

            {/* 2. MANUAL MODE */}
            {mode === 'manual' && (
              <div className="animate-fade-in flex flex-col h-full">
                 <button onClick={() => setMode('selection')} className="text-slate-400 hover:text-slate-800 text-xs font-bold uppercase tracking-widest w-fit mb-8">&larr; Volver</button>
                 
                 <div className="flex-1 flex flex-col justify-center">
                    <h2 className="text-2xl font-black text-slate-800 mb-2">Ingresar CI Estático</h2>
                    <p className="text-slate-500 text-sm mb-8">Ingresa tu coeficiente intelectual comprobado.</p>

                    <form onSubmit={handleManualSubmit} className="flex flex-col gap-6">
                       <div>
                         <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">CI Estimado (50 - 200)</label>
                         <input 
                           type="number" 
                           min="50" max="250"
                           value={manualIq} 
                           onChange={(e) => setManualIq(e.target.value)}
                           className="w-full bg-slate-50 border border-slate-200 shadow-inner rounded-xl px-5 py-4 text-3xl font-black text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-center"
                         />
                       </div>

                       <button 
                         type="submit"
                         className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-xl font-bold w-full transition-all active:scale-95 flex justify-center items-center gap-2 shadow-md"
                        >
                         Guardar e Iniciar <Check size={18} />
                       </button>
                    </form>
                 </div>
              </div>
            )}

            {/* 3. TEST MODE */}
            {mode === 'test' && (
                <IqTestEngine onComplete={() => {}} />
            )}

         </div>
      </div>
    </div>
  );
};

export default BaselineSetupModal;
