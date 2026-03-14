import { LogEvent, Warning } from '../types';
import { SUPPLEMENT_CATALOG } from '../data/supplements';

export const evaluateInteractions = (logs: LogEvent[]): Warning[] => {
    const warnings: Warning[] = [];
    
    // Parse events mapping to catalog definition and default quantity
    const parsedEvents = logs.map(log => {
        const def = SUPPLEMENT_CATALOG.find(s => s.id === log.supplementId);
        return { ...log, def, quantity: log.quantity || 1 };
    }).filter(e => e.def !== undefined);

    let totalToxicity = 0;
    let totalStimulants = 0;
    let cyp3a4Inhibitors = 0;
    
    let macros = { protein: 0, carbs: 0, fats: 0, calories: 0 };

    parsedEvents.forEach(e => {
        const qty = e.quantity;
        const def = e.def!;
        
        if (def.toxicityScore) {
            totalToxicity += def.toxicityScore * qty;
        }
        if (def.isStimulant) {
            totalStimulants += qty;
        }
        if (def.interactionTags?.includes('cyp3a4_inhibitor')) {
            cyp3a4Inhibitors += qty;
        }
        if (def.macronutrients) {
            macros.protein += def.macronutrients.protein * qty;
            macros.carbs += def.macronutrients.carbs * qty;
            macros.fats += def.macronutrients.fats * qty;
            macros.calories += def.macronutrients.calories * qty;
        }
    });

    // 1. TOXICITY ALERT
    if (totalToxicity >= 12) {
        warnings.push({
            id: 'critical-toxicity',
            type: 'toxicity',
            message: 'Alerta Renal/Hepática: La carga metabólica tóxica de tus suplementos excede peligrosamente el límite seguro.',
            severity: 'high',
            suggestion: 'Suspende de inmediato cualquier nootrópico o estimulante sintético por hoy e hidrátate con electrolitos.'
        });
    } else if (totalToxicity >= 6) {
        warnings.push({
            id: 'med-toxicity',
            type: 'toxicity',
            message: 'Carga metabólica elevada. Tus riñones e hígado están trabajando extra para limpiar estas moléculas.',
            severity: 'medium',
            suggestion: 'Asegura una ingesta alta de agua hoy.'
        });
    }

    // 2. ENZYME INHIBITION ALERT (CYP450)
    if (cyp3a4Inhibitors > 0 && totalStimulants > 0) {
        warnings.push({
            id: 'cyp3a4-stimulant',
            type: 'interaction',
            message: 'Interacción Enzimática Peligrosa: Consumiste un inhibidor enzimático junto con estimulantes. El hígado no podrá filtrar el estimulante a tiempo.',
            severity: 'high',
            suggestion: 'Separa los inhibidores (Ej: Cúrcuma/Jugo de Pomelo) de tus estimulantes por al menos 8 horas para evitar insomnio severo.'
        });
    }

    // 3. DIETARY ALERTS (Stimulants vs Substrate)
    if (totalStimulants >= 3 && macros.calories < 400) {
         warnings.push({
            id: 'stimulants-no-food',
            type: 'dietary',
            message: 'Crash Hipoglucémico Inminente: Has consumido altas dosis de aceleradores cognitivos sin proveer sustrato calórico (comida).',
            severity: 'high',
            suggestion: 'Tu cerebro necesita ATP para sostener este nivel de disparo neuronal. Consume grasas o carbohidratos (Ej. Nueces, Aguacate, Fruta).'
         });
    }

    // 4. SPECIFIC COMPOUND COMBINATIONS (Original rules adapted)
    const activeIds = parsedEvents.map(e => e.def!.id);
    
    if (activeIds.includes('rhodiola') && activeIds.includes('curcuma')) {
        warnings.push({
            id: 'hypo-risk-botanical',
            type: 'interaction',
            message: 'Riesgo de Azúcar Baja: Rhodiola y Cúrcuma juntas tienen un potente efecto reductor de glucosa.',
            severity: 'medium',
            suggestion: 'Monitoriza mareos y ten una fuente de glucosa rápida a mano si estás en ayunas.'
        });
    }

    if (activeIds.includes('citicolina') && activeIds.includes('alpha_gpc')) {
         warnings.push({
            id: 'cholinergic-overload',
            type: 'interaction',
            message: 'Exceso Colinérgico: Mezclar Alpha-GPC y Citicolina puede saturar los receptores de acetilcolina causando niebla mental o tensión muscular.',
            severity: 'medium',
            suggestion: 'Elige solo una fuente principal de colina al día.'
        });
    }

    return warnings;
};
