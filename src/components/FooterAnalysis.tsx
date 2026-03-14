import React from 'react';
import { Brain } from 'lucide-react';

const FooterAnalysis: React.FC = () => {
    return (
        <div className="bg-white p-8 rounded-[3.5rem] border border-slate-200 mt-8 shadow-xl shadow-slate-200/50 grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="flex items-start gap-4">
                <div className="p-4 bg-indigo-50 rounded-3xl text-indigo-500 border border-indigo-100 shrink-0">
                    <Brain size={24} />
                </div>
                <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-2 underline decoration-indigo-200 decoration-2 underline-offset-4">Análisis Biométrico</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed italic font-medium">
                        El seguimiento temporal permite ver la superposición de compuestos en la sangre. Las métricas indicadas en color índigo son las zonas de mayor neuroplasticidad. Minimiza la "Deuda" espaciando los estimulantes de alta intensidad e hidratándote.
                    </p>
                </div>
            </div>
            
            <div className="bg-emerald-50 p-6 rounded-[2.5rem] border border-emerald-100 flex flex-col justify-center text-center md:text-right">
                <p className="text-[10px] text-emerald-600 font-black mb-1 uppercase tracking-widest">Umbral Operativo</p>
                <p className="text-sm text-slate-500 font-medium">
                    Mantener el CI cognitivo sobre la <span className="text-slate-800 font-black underline">Zona de Alto Rendimiento</span> previene la fatiga en las decisiones críticas de tu día.
                </p>
            </div>
        </div>
    );
};

export default FooterAnalysis;
