import React from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { useEngineStore } from '../../store/useEngineStore';

const ToastContainer: React.FC = () => {
    const { notifications, dismissNotification } = useEngineStore();

    if (notifications.length === 0) return null;

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 w-[90%] max-w-md pointer-events-none">
            {notifications.map((n) => (
                <div 
                    key={n.id}
                    className={`
                        pointer-events-auto
                        flex items-center gap-3 p-4 rounded-2xl shadow-2xl border
                        animate-in fade-in slide-in-from-top-4 duration-300
                        ${n.type === 'success' ? 'bg-emerald-500 text-white border-emerald-400' : 
                          n.type === 'error' ? 'bg-rose-500 text-white border-rose-400' : 
                          'bg-slate-800 text-white border-slate-700'}
                    `}
                >
                    <div className="flex-shrink-0">
                        {n.type === 'success' && <CheckCircle size={20} />}
                        {n.type === 'error' && <XCircle size={20} />}
                        {n.type === 'info' && <Info size={20} />}
                    </div>
                    <p className="text-sm font-bold flex-1">{n.message}</p>
                    <button 
                        onClick={() => dismissNotification(n.id)}
                        className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            ))}
        </div>
    );
};

export default ToastContainer;
