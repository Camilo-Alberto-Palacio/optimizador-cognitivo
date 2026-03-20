import React from 'react';
import { Book, ExternalLink, GraduationCap, Zap, Activity, Brain, Moon, Footprints } from 'lucide-react';

const BibliographyView: React.FC = () => {
    const references = [
        {
            category: "Modelo de Cálculo (CI/Performance)",
            title: "A two process model of sleep regulation",
            authors: "Borbély, A. A.",
            year: 1982,
            journal: "Human Neurobiology, 1(3), 195–204",
            url: "https://pubmed.ncbi.nlm.nih.gov/7154438/",
            description: "Fundamento del algoritmo Base vs Peak. Explica cómo la presión del sueño y los ritmos circadianos regulan el estado de alerta.",
            icon: Moon,
            color: "text-indigo-500",
            bg: "bg-indigo-50"
        },
        {
            category: "Predicción Biofísica",
            title: "Wearable-based physiological features highly predict cognitive performance",
            authors: "Rahat, M., et al.",
            year: 2022,
            journal: "Frontiers in Psychology",
            url: "https://www.frontiersin.org/articles/10.3389/fpsyg.2022.842751/full",
            description: "Valida científicamente que los pasos, el sueño y la variabilidad cardiaca (HRV) predicen con precisión las funciones ejecutivas.",
            icon: Activity,
            color: "text-emerald-500",
            bg: "bg-emerald-50"
        },
        {
            category: "Neurociencia del Ejercicio",
            title: "Be smart, exercise your heart: exercise effects on brain and cognition",
            authors: "Hillman, C. H., Erickson, K. I., & Kramer, A. F.",
            year: 2008,
            journal: "Nature Reviews Neuroscience, 9(1), 58-65",
            url: "https://www.nature.com/articles/nrn2298",
            description: "Demuestra cómo el fitness aeróbico aumenta el volumen cerebral y mejora los procesos de atención y control inhibitorio.",
            icon: Footprints,
            color: "text-rose-500",
            bg: "bg-rose-50"
        },
        {
            category: "Nootrópicos y Suplementación",
            title: "Nootropics as Cognitive Enhancers: Types, Dosage and Side Effects",
            authors: "Malík, M., & Tlustoš, P.",
            year: 2022,
            journal: "Nutrients, 14(16), 3367",
            url: "https://www.mdpi.com/2072-6643/14/16/3367",
            description: "Revisión sistemática sobre la eficacia biológica de cafeína, L-teanina y otros optimizadores incluidos en el catálogo.",
            icon: Zap,
            color: "text-amber-500",
            bg: "bg-amber-50"
        },
        {
            category: "Optimización SpO2",
            title: "Correlation between peripheral oxygen saturation and cognitive impairment",
            authors: "Zhu, Y., et al.",
            year: 2022,
            journal: "Frontiers in Neurology, 13, 831614",
            url: "https://www.frontiersin.org/articles/10.3389/fneur.2022.831614/full",
            description: "Evidencia la degradación inmediata de la velocidad de procesamiento mental ante caídas leves en la saturación de oxígeno.",
            icon: Brain,
            color: "text-cyan-500",
            bg: "bg-cyan-50"
        }
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 pb-12">
            <header className="px-2">
                <div className="flex items-center gap-2 text-indigo-600 font-bold tracking-[0.2em] text-[10px] uppercase bg-indigo-50 px-3 py-1 rounded-full w-fit mb-3">
                    <GraduationCap size={12} /> Evidencia Científica
                </div>
                <h2 className="text-3xl font-black text-slate-800 leading-tight">Bibliografía PRO</h2>
                <p className="text-slate-500 text-xs font-medium mt-1">Fuentes académicas y modelos que avalan el motor Quantum.</p>
            </header>

            <div className="grid grid-cols-1 gap-4">
                {references.map((ref, idx) => (
                    <div key={idx} className="glass-card p-6 rounded-[2.5rem] border border-white/60 shadow-xl space-y-4 hover:shadow-2xl hover:shadow-indigo-100 transition-all group">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`p-4 ${ref.bg} ${ref.color} rounded-[1.5rem] shadow-inner group-hover:scale-110 transition-transform`}>
                                    <ref.icon size={24} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{ref.category}</p>
                                    <h4 className="text-sm font-black text-slate-800 leading-tight mt-0.5 line-clamp-2">{ref.title}</h4>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                            <p className="text-[11px] font-bold text-slate-700 italic">
                                "{ref.authors} ({ref.year}). {ref.journal}"
                            </p>
                            <div className="h-px bg-slate-200/50 my-3" />
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                {ref.description}
                            </p>
                        </div>

                        <div className="flex justify-end pt-2">
                            <a 
                                href={ref.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-700 transition-colors"
                            >
                                Ver Estudio <ExternalLink size={12} />
                            </a>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-slate-900 p-8 rounded-[3rem] text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 blur-3xl rounded-full" />
                <div className="relative z-10 flex items-center gap-6">
                    <div className="hidden sm:flex w-16 h-16 bg-white/10 rounded-2xl items-center justify-center backdrop-blur-md border border-white/20">
                        <Book size={32} className="text-indigo-400" />
                    </div>
                    <div>
                        <h5 className="text-lg font-black mb-1">Compromiso Académico</h5>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">
                            El motor de rendimiento cognitivo se actualiza semanalmente basándose en los últimos meta-análisis de neurociencia y medicina deportiva.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BibliographyView;
