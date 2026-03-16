import React from 'react';
import { Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart, ReferenceLine } from 'recharts';
import { Clock } from 'lucide-react';
import { useEngineStore } from '../store/useEngineStore';
import { ChartDataPoint } from '../types';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length > 0) {
    const dp = payload[0].payload as ChartDataPoint;
    return (
      <div className="bg-white border border-slate-200 p-3 md:p-4 rounded-3xl shadow-2xl min-w-[170px] md:min-w-[240px]">
        <div className="flex justify-between items-center mb-2 md:mb-3 border-b border-slate-100 pb-2">
          <span className="text-slate-500 font-bold text-[10px] md:text-xs flex items-center gap-1"><Clock size={10}/> {label}</span>
          {dp.flow && <span className="bg-amber-500 text-white text-[7px] md:text-[8px] px-2 py-0.5 rounded-full font-black shadow-md">FLOW 🔥</span>}
        </div>
        
        <div className="bg-indigo-50 p-2 md:p-3 rounded-2xl border border-indigo-100 text-center mb-3 shadow-inner">
          <p className="text-[8px] md:text-[9px] text-indigo-500 font-black uppercase tracking-widest mb-0.5 md:mb-1">CI Real Calculado</p>
          <p className="text-2xl md:text-4xl font-black text-indigo-700 leading-none">{dp.iq}</p>
        </div>

        {/* Desglose Matemático */}
        <div className="space-y-1.5 mb-3 bg-slate-50/50 p-2.5 rounded-2xl border border-slate-100/50">
            <div className="flex justify-between text-[9px] font-bold text-slate-400">
                <span>CI Base (Assess.)</span>
                <span>{dp.iqBase}</span>
            </div>
            <div className={`flex justify-between text-[9px] font-bold ${dp.iqFitness >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                <span>Ajuste Salud (Fit)</span>
                <span>{dp.iqFitness >= 0 ? '+' : ''}{dp.iqFitness}</span>
            </div>
            <div className="flex justify-between text-[9px] font-bold text-indigo-500">
                <span>Impulso Suplementos</span>
                <span>+{dp.iqBoost}</span>
            </div>
        </div>

        <div className="flex justify-between text-[9px] md:text-[10px] font-bold px-1 text-slate-400 border-t border-slate-100 pt-2 mt-2">
          <span>Potencial: {dp.optimized}%</span>
          <span className="text-emerald-500">+{dp.optimized - dp.natural}%</span>
        </div>
      </div>
    );
  }
  return null;
};

const MasterChart: React.FC = () => {
  const chartData = useEngineStore((state) => state.chartData);

  return (
    <div className="lg:col-span-8 bg-white p-4 md:p-6 rounded-[2.5rem] md:rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
      <div className="h-[300px] md:h-[450px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <defs>
              <linearGradient id="colorIQ" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
                dataKey="time" 
                interval="preserveStartEnd" 
                minTickGap={30}
                stroke="#94a3b8" 
                fontSize={9} 
                axisLine={false} 
                tickLine={false} 
            />
            <YAxis domain={[0, 100]} hide />
            <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ stroke: '#6366f1', strokeWidth: 1 }}
                position={{ y: 0 }} // Keep tooltip at top on mobile
            />
            <Area type="monotone" dataKey="optimized" stroke="#6366f1" strokeWidth={5} fillOpacity={1} fill="url(#colorIQ)" />
            <Line type="monotone" dataKey="natural" stroke="#64748b" strokeWidth={3} dot={false} strokeDasharray="4 4" />
            <ReferenceLine y={90} stroke="#818cf8" strokeDasharray="10 5" label={{ value: 'ZONA ALTO RENDIMIENTO', fill: '#818cf8', fontSize: 9, fontWeight: '900', position: 'insideTopRight' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MasterChart;
