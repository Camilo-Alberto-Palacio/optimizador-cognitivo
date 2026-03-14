import { ChartDataPoint, LogEvent, SupplementDef } from '../types';
import { SUPPLEMENT_CATALOG } from '../data/supplements';

function parseTimeStr(timeStr: string): number {
    const [h, m] = timeStr.split(':').map(Number);
    return h + (m / 60);
}

const MathEngine = {
    calculateDailyPerformance(logs: LogEvent[], baseIq: number = 133): ChartDataPoint[] {
        const peakLimitIq = baseIq + 12; 
        const points: ChartDataPoint[] = [];

        // Pre-parse events and attach definitions
        const parsedEvents = logs.map(log => {
            const def = SUPPLEMENT_CATALOG.find(s => s.id === log.supplementId);
            return {
                ...log,
                eventTime: parseTimeStr(log.timeStr),
                def
            };
        }).filter(e => e.def !== undefined) as (LogEvent & { eventTime: number, def: SupplementDef })[];

        // Check for specific global states
        const hasRhodiola = parsedEvents.some(e => e.def.id === 'rhodiola');
        const hasFlowState = parsedEvents.some(e => e.def.id === 'meditacion' || e.def.id === 'cold_plunge'); // Proxies for flow

        for (let hour = 4; hour <= 23.5; hour += 0.5) {
            const timeStr = `${Math.floor(hour).toString().padStart(2, '0')}:${(hour % 1) === 0 ? '00' : '30'}`;

            // 1. CIRCADIAN RHYTHM (Natural Baseline)
            const circadian = 45 + 12 * Math.sin(((hour - 7) * Math.PI) / 12);

            // 2. DYNAMIC ACCUMULADORS
            let iTotal = 0;
            let stimDebt = 0;
            let floorBonus = 0;
            let lateMagnesio = false;

            for (const event of parsedEvents) {
                if (hour >= event.eventTime) {
                    const age = hour - event.eventTime;
                    const def = event.def;
                    // Exponencial decay of effect, multiplied by volume (quantity)
                    const qty = event.quantity || 1;
                    const baseEffect = def.effectK * qty;
                    const currentEffect = baseEffect * Math.exp(-age / def.durationH);

                    if (def.category === 'mineral') {
                        floorBonus += currentEffect;
                        if (def.id === 'magnesio' && event.eventTime > 18) {
                            lateMagnesio = true;
                        }
                    } else if (def.isStimulant) {
                        iTotal += currentEffect;
                        // Acumula deuda de estimulantes
                        stimDebt += (def.effectK * 0.15) * Math.exp(-age / (def.durationH * 1.5)); 
                    } else {
                        // Nootrópicos, nutrición, adaptógenos
                        iTotal += currentEffect;
                    }
                }
            }

            // Resistance factor from Adaptogens
            const resFactor = hasRhodiola ? 0.4 : 1.0;

            // 3. ASYMPTOTIC SATURATION 
            const S = 35;
            const optimizedGain = S * Math.tanh(iTotal / S);

            // 4. CRASH MITIGATION
            const crashMitigation = lateMagnesio ? 0.7 : 1.0;
            const compensatoryDrop = hour > 15 ? (stimDebt * resFactor * crashMitigation) : 0;

            // 5. FLOW STATE BONUS
            const flowActive = hasFlowState && iTotal > 12 && hour > 6;
            const flowBonus = flowActive ? 7 : 0;

            const rawCap = circadian + optimizedGain + flowBonus - compensatoryDrop;
            const finalCapacity = Math.max(35 + floorBonus, Math.min(100, rawCap));

            // Mapping to actual IQ
            const functionalIQ = baseIq + ((finalCapacity - 55) * (peakLimitIq - baseIq)) / 45;

            points.push({
                time: timeStr,
                natural: Math.round(circadian),
                optimized: Math.round(finalCapacity),
                iq: Math.round(Math.max(105, functionalIQ)),
                flow: flowActive,
            });
        }
        return points;
    }
}

export default MathEngine;
