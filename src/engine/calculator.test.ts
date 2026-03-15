import { describe, it, expect } from 'vitest';
import MathEngine from './calculator';
import { LogEvent } from '../types';

describe('Pharmacokinetics Math Engine (Event-Based)', () => {

    it('should calculate natural baseline curves correctly (Circadian Rhythm)', () => {
        const emptyLogs: LogEvent[] = [];
        const result = MathEngine.calculateDailyPerformance(emptyLogs, 133);
        
        // At 4:00 AM, the circadian should be at lowest
        const earlyPoint = result.find(p => p.time === '04:00');
        expect(earlyPoint?.natural).toBeDefined();
        
        // At 13:00 (1 PM), circadian natural peak
        const peakPoint = result.find(p => p.time === '13:00');
        expect(peakPoint?.natural).toBeGreaterThan(earlyPoint!.natural);
    });

    it('should boost IQ dramatically when premium upgrades and Flow State are active', () => {
        const testLogs: LogEvent[] = [
            { id: '1', supplementId: 'citicolina', timeStr: '13:00', timestamp: 0, date: '2026-03-15' },
            { id: '2', supplementId: 'huevos', timeStr: '08:00', timestamp: 0, date: '2026-03-15' },
            { id: '3', supplementId: 'cocoa', timeStr: '08:30', timestamp: 0, date: '2026-03-15' },
            { id: '4', supplementId: 'cold_plunge', timeStr: '07:00', timestamp: 0, date: '2026-03-15' },
            { id: '5', supplementId: 'rhodiola', timeStr: '09:00', timestamp: 0, date: '2026-03-15' }
        ];

        const result = MathEngine.calculateDailyPerformance(testLogs, 133);
        
        // Find peak IQ at 14:00 (when Citicoline hits hardest after 13:00)
        const at2pm = result.find(r => r.time === '14:00');
        
        expect(at2pm).toBeDefined();
        // The IQ should be significantly higher than base 133
        expect(at2pm!.iq).toBeGreaterThan(135);
        // Flow state should be active after early morning habits
        expect(at2pm!.flow).toBe(true);
    });
});
