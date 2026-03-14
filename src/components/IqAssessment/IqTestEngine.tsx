import React, { useState, useEffect } from 'react';
import { Brain, ChevronRight, Clock } from 'lucide-react';
import { useEngineStore } from '../../store/useEngineStore';

// Tipos adaptados para el engine de test
interface Question {
  id: number;
  type: 'logic' | 'pattern' | 'math';
  query: string;
  image?: string;
  options: string[];
  correctIndex: number;
  weight: number; // Peso del 1 al 10 en rigurosidad
}

const IQ_QUESTIONS: Question[] = [
  {
    id: 1,
    type: 'math',
    query: 'Si 5 máquinas hacen 5 artículos en 5 minutos. ¿Cuánto tardarán 100 máquinas en hacer 100 artículos?',
    options: ['100 minutos', '5 minutos', '20 minutos', '10  minutos'],
    correctIndex: 1,
    weight: 3
  },
  {
    id: 2,
    type: 'logic',
    query: 'Si algunos Zetas son Alfas, y todos los Alfas son Betas. Entonces...',
    options: [
      'Todos los Zetas son Betas', 
      'Algunos Zetas son Betas', 
      'Ningún Zeta es Beta', 
      'Todos los Betas son Alfas'
    ],
    correctIndex: 1,
    weight: 4
  },
  {
    id: 3,
    type: 'pattern',
    query: 'Descifra el patrón: 2, 6, 12, 20, 30, ?',
    options: ['42', '40', '36', '44'],
    correctIndex: 0, // Difs: 4, 6, 8, 10, 12 -> 30+12 = 42
    weight: 5
  },
  {
    id: 4,
    type: 'logic',
    query: 'Un lirio acuático dobla su tamaño cada día. Tarda 48 días en cubrir el lago. ¿Cuánto tardará en cubrir la mitad del lago?',
    options: ['24 días', '47 días', '26 días', '46 días'],
    correctIndex: 1,
    weight: 6
  },
  {
    id: 5,
    type: 'math',
    query: 'En un estante hay 45 libros. Hay 15 libros más de ficción que de no-ficción. ¿Cuántos son de ficción?',
    options: ['25', '30', '35', '20'],
    correctIndex: 1, // x + (x-15) = 45 -> 2x = 60 -> x = 30
    weight: 5
  },
  {
    id: 6,
    type: 'pattern',
    query: '¿Qué letra sigue en esta secuencia: u, d, t, c, c, s, ?',
    options: ['o', 'n', 's', 'm'],
    correctIndex: 2, // Uno, Dos, Tres, Cuatro, Cinco, Seis, Siete
    weight: 8
  }
];

// Reglas de puntuación base:
// Base mínima teórica 80, Máxima 148+
const MIN_IQ = 85;
const MAX_BASE_IQ = 145;

export const IqTestEngine: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [startTime] = useState<number>(Date.now());
  const [timeSpent, setTimeSpent] = useState<number>(0); // En segundos
  const [isFinished, setIsFinished] = useState(false);
  const [calculatedIq, setCalculatedIq] = useState<number>(100);

  const setBaseIq = useEngineStore(state => state.setBaseIq);

  useEffect(() => {
    let interval: any;
    if (!isFinished) {
      interval = setInterval(() => {
        setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isFinished, startTime]);

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...answers, optionIndex];
    setAnswers(newAnswers);

    if (currentQuestion < IQ_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      finishTest(newAnswers);
    }
  };

  const finishTest = (finalAnswers: number[]) => {
    setIsFinished(true);
    let totalWeightScore = 0;
    let maxPossibleWeight = 0;

    IQ_QUESTIONS.forEach((q, idx) => {
      maxPossibleWeight += q.weight;
      if (finalAnswers[idx] === q.correctIndex) {
        totalWeightScore += q.weight;
      }
    });

    // Ratio de acierto (0 a 1)
    const accuracyRatio = totalWeightScore / maxPossibleWeight;
    
    // Penalización por tiempo. Teóricamente damos 20s por pregunta para no perder puntos.
    const maxOptimizedTime = IQ_QUESTIONS.length * 20; 
    let timePenalty = 0;
    
    if (timeSpent > maxOptimizedTime) {
      // Retamos -1 punto de IQ por cada 5 segundos extra, máximo hasta 15 puntos.
      timePenalty = Math.min(15, Math.floor((timeSpent - maxOptimizedTime) / 5));
    }

    // Cálulo Final de IQ (Curva campana simplificada)
    let finalIqCalculated = MIN_IQ + (accuracyRatio * (MAX_BASE_IQ - MIN_IQ)) - timePenalty;
    
    // Suavizamos mínimos y máximos ridículos
    finalIqCalculated = Math.max(80, Math.min(150, Math.round(finalIqCalculated)));
    
    setCalculatedIq(finalIqCalculated);
    
    // Lo guardamos en el estado y en Firestore
    setBaseIq(finalIqCalculated);
  };

  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center animate-fade-in">
         <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/30">
            <Brain className="text-white w-12 h-12" />
         </div>
         <h2 className="text-2xl font-black text-slate-800 mb-2">Evaluación Completada</h2>
         <p className="text-slate-500 mb-8 max-w-sm">Hemos evaluado tu razonamiento lógico, velocidad de procesamiento y memoria temporal.</p>
         
         <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 w-full mb-8 shadow-inner">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 mb-2">CI Base Estimado</p>
            <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 to-emerald-600">
               {calculatedIq}
            </p>
         </div>

         <button 
           onClick={onComplete}
           className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold w-full transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md"
          >
           Iniciar Optimizador <ChevronRight size={18} />
         </button>
      </div>
    );
  }

  const q = IQ_QUESTIONS[currentQuestion];
  const progress = ((currentQuestion) / IQ_QUESTIONS.length) * 100;
  
  // Format Time
  const mins = Math.floor(timeSpent / 60).toString().padStart(2, '0');
  const secs = (timeSpent % 60).toString().padStart(2, '0');

  return (
    <div className="flex flex-col h-full">
       <div className="flex items-center justify-between mb-8 pl-1">
          <div className="flex items-center gap-2 text-indigo-600 font-bold bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200">
             <Clock size={16} /> <span className="text-sm font-mono">{mins}:{secs}</span>
          </div>
          <div className="text-slate-400 text-xs font-bold tracking-widest uppercase">
            {currentQuestion + 1} / {IQ_QUESTIONS.length}
          </div>
       </div>

       {/* Progress line */}
       <div className="w-full bg-slate-100 h-1.5 rounded-full mb-8 overflow-hidden">
          <div className="h-full bg-indigo-500 transition-all duration-300 ease-out flex" style={{ width: `${progress}%` }} />
       </div>

       <div className="flex-1 flex flex-col justify-center">
         <h3 className="text-xl md:text-2xl font-black text-slate-800 mb-8 leading-relaxed">
            {q.query}
         </h3>

         <div className="grid grid-cols-1 gap-3">
           {q.options.map((option, idx) => (
             <button
               key={idx}
               onClick={() => handleAnswer(idx)}
               className="bg-white hover:bg-slate-50 border border-slate-200 text-left p-4 rounded-xl text-slate-700 font-medium transition-all hover:pl-6 active:scale-[0.98] group flex justify-between items-center shadow-sm"
             >
               {option}
               <div className="w-6 h-6 rounded-full border border-slate-300 group-hover:border-indigo-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-white">
                 <div className="w-2 h-2 bg-indigo-500 rounded-full" />
               </div>
             </button>
           ))}
         </div>
       </div>
    </div>
  );
};

export default IqTestEngine;
