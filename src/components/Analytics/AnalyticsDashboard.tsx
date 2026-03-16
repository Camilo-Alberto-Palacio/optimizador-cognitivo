import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar, Zap } from 'lucide-react';
import { useEngineStore } from '../../store/useEngineStore';
import MathEngine from '../../engine/calculator';

const AnalyticsDashboard: React.FC = () => {
    const { allLogs, baseIq } = useEngineStore();
    const staticBaseIq = baseIq || 133;

    // Generar datos de los últimos 7 días
    const weeklyTrends = useMemo(() => {
        const trends = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const dayLogs = allLogs[dateStr] || [];
            // Nota: El impacto de fitness es difícil de calcular retroactivamente si no tenemos los datos guardados por día.
            // Por ahora, calcularemos solo el impacto de suplementos sobre la base.
            const dayPoints = MathEngine.calculateDailyPerformance(dayLogs, staticBaseIq, staticBaseIq);
            
            // Encontrar el CI máximo del día
            const peakIq = Math.max(...dayPoints.map(p => p.iq));
            const avgIq = dayPoints.reduce((acc, p) => acc + p.iq, 0) / dayPoints.length;
            
            trends.push({
                date: dateStr,
                label: date.toLocaleDateString('es-ES', { weekday: 'short' }),
                peakIq: Math.round(peakIq),
                avgIq: Math.round(avgIq),
                logsCount: dayLogs.length
            });
        }
        return trends;
    }, [allLogs, staticBaseIq]);

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            {/* Header Analítica */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-700 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-2xl font-black mb-2 flex items-center gap-3">
                        <TrendingUp size={28} /> Tendencias Semanales
                    </h2>
                    <p className="text-indigo-100 text-sm font-medium opacity-90 max-w-md">
                        Analiza cómo tu suplementación y hábitos están elevando tu línea base cognitiva a través del tiempo.
                    </p>
                </div>
                {/* Micro decoración */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Gráfico de CI Pico */}
                <div className="lg:col-span-2 bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-black text-slate-800">Evolución de Rendimiento (Pico)</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Últimos 7 días</p>
                        </div>
                        <div className="bg-indigo-50 text-indigo-600 p-2 rounded-xl">
                            <Zap size={20} fill="currentColor" />
                        </div>
                    </div>
                    
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={weeklyTrends}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="label" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                    dy={10}
                                />
                                <YAxis 
                                    domain={['dataMin - 5', 'dataMax + 5']} 
                                    hide 
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ fontWeight: 800, color: '#4f46e5' }}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="peakIq" 
                                    stroke="#6366f1" 
                                    strokeWidth={4} 
                                    dot={{ fill: '#6366f1', strokeWidth: 2, r: 4, stroke: '#fff' }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Resúmenes Rápidos */}
                <div className="flex flex-col gap-6">
                    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
                         <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Calendar size={14} className="text-indigo-400" /> Stats de la Semana
                         </h4>
                         <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                <span className="text-xs font-bold text-slate-500">CI Promedio</span>
                                <span className="text-xl font-black text-slate-800">
                                    {Math.round(weeklyTrends.reduce((acc, t) => acc + t.avgIq, 0) / 7)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                <span className="text-xs font-bold text-slate-500">Día más Activo</span>
                                <span className="text-sm font-black text-indigo-600">
                                    {weeklyTrends.reduce((prev, current) => (prev.logsCount > current.logsCount) ? prev : current).label}
                                </span>
                            </div>
                         </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100 flex-1 relative overflow-hidden">
                        <div className="relative z-10">
                            <h4 className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-2">Próximamente</h4>
                            <p className="text-lg font-black leading-tight">Motor de Correlaciones con IA</p>
                            <p className="text-[10px] text-indigo-100 mt-2 font-medium opacity-80">
                                Analizaremos cómo el sueño y cada suplemento afectan específicamente tu enfoque.
                            </p>
                        </div>
                        <Zap size={80} className="absolute -bottom-4 -right-4 text-white/10 rotate-12" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
