import React from 'react';
import { AlertTriangle, Info, Activity, ShieldAlert, Utensils } from 'lucide-react';
import { useEngineStore } from '../../store/useEngineStore';
import { Warning } from '../../types';

const WarningAlerts: React.FC = () => {
    const warnings = useEngineStore((state) => state.warnings);

    if (warnings.length === 0) return null;

    const getIcon = (type?: string) => {
        switch(type) {
            case 'toxicity': return <ShieldAlert className="shrink-0 mt-0.5" size={18} />;
            case 'dietary': return <Utensils className="shrink-0 mt-0.5" size={18} />;
            case 'interaction': return <Activity className="shrink-0 mt-0.5" size={18} />;
            default: return <AlertTriangle className="shrink-0 mt-0.5" size={18} />;
        }
    };

    const getTitle = (type?: string) => {
        switch(type) {
            case 'toxicity': return 'ALERTA METABÓLICA';
            case 'dietary': return 'CONSEJO NUTRICIONAL';
            case 'interaction': return 'INTERACCIÓN CLÍNICA';
            default: return 'ADVERTENCIA DE SISTEMA';
        }
    }

    return (
        <div className="flex flex-col gap-3 mb-6">
            {warnings.map((warning: Warning) => (
                <div 
                    key={warning.id} 
                    className={`p-4 rounded-2xl border flex items-start gap-4 shadow-sm 
                        ${warning.severity === 'high' 
                            ? 'bg-red-50 border-red-200 text-red-900' 
                            : 'bg-amber-50 border-amber-200 text-amber-900'}`}
                >
                    <div className={warning.severity === 'high' ? 'text-red-500' : 'text-amber-500'}>
                        {getIcon(warning.type)}
                    </div>
                    <div className="flex flex-col w-full">
                        <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${warning.severity === 'high' ? 'text-red-600' : 'text-amber-600'}`}>
                            {getTitle(warning.type)}
                        </span>
                        <p className="text-sm font-bold leading-relaxed mb-1">
                            {warning.message}
                        </p>
                        {warning.suggestion && (
                            <div className={`mt-2 p-3 rounded-xl border text-xs font-semibold
                                ${warning.severity === 'high' ? 'bg-red-100/50 border-red-200' : 'bg-amber-100/50 border-amber-200'}
                            `}>
                                <span className="flex items-center gap-1.5 mb-1 opacity-80 uppercase tracking-wider text-[9px] font-black">
                                    <Info size={12}/> SUGERENCIA DE ACCIÓN
                                </span>
                                {warning.suggestion}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default WarningAlerts;
