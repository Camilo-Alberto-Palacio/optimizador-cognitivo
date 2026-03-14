export type SupplementCategory = 'nootropic' | 'mineral' | 'stimulant' | 'nutrition' | 'adaptation' | 'other';

export interface SupplementDef {
    id: string;      // ej: 'cafe', 'citicolina', 'magnesio'
    name: string;    // Nombre para la UI
    category: SupplementCategory;
    effectK: number; // Fuerza bruta del efecto (para sumar a la capacidad bruta)
    durationH: number; // Media vida estimada o duración teórica del impacto en horas
    // Algunas propiedades específicas extras que podríamos necesitar después
    isStimulant?: boolean; 
    toxicityScore?: number; // Impacto hepático/renal (0-10)
    interactionTags?: string[]; // e.g. 'cyp3a4_inhibitor', 'gabaergic'
    macronutrients?: { protein: number, carbs: number, fats: number, calories: number };
}

export interface LogEvent {
    id: string; // uuid para poder borrarlo
    supplementId: string; // Referencia al SupplementDef
    timestamp: number;    // epoch time of the event (optional, future proofing)
    timeStr: string;      // ej: '14:30', '08:00'
    quantity?: number;    // ej: 2, 3 (multiplicador de dosis)
}

export interface ChartDataPoint {
    time: string;
    natural: number;
    optimized: number;
    iq: number;
    flow: boolean;
}

export interface Warning {
    id: string;
    type: 'interaction' | 'toxicity' | 'dietary' | 'general';
    message: string;
    severity: 'high' | 'medium' | 'low';
    suggestion?: string;
}
