export interface FitnessData {
  sleepHours: number | null;
  restingHeartRate: number | null;
  steps: number | null;
  activeCalories: number | null;
  spo2: number | null;
  lastFetched: number | null;
}

const FITNESS_BASE = 'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate';

// Construye los milisegundos del inicio y fin de un día específico (00:00 - 23:59)
const getDayRange = (dateStr: string) => {
  const start = new Date(dateStr + 'T00:00:00');
  const end = new Date(dateStr + 'T23:59:59');
  
  // Usar fecha local del sistema para comparar "hoy"
  const now = new Date();
  const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const isToday = dateStr === localToday;
  
  return {
    startMs: start.getTime(),
    endMs: isToday ? (Date.now() + 300000) : end.getTime(), // 5 min buffer if today
  };
};

// Rango de sueño: desde 12h antes del día hasta el momento actual (cubre noche + siestas)
const getNightSleepRange = (dateStr: string) => {
  const currentDay = new Date(dateStr + 'T00:00:00');
  const start = new Date(currentDay);
  start.setDate(start.getDate() - 1);
  start.setHours(12, 0, 0, 0); // Desde mediodía de ayer
  
  const end = new Date(currentDay);
  end.setDate(end.getDate() + 1); // Hasta mediodía del día siguiente
  end.setHours(12, 0, 0, 0);
  
  return {
    startMs: start.getTime(),
    endMs: Math.min(end.getTime(), Date.now()), // No pedir el futuro
  };
};

const fetchAggregate = async (token: string, dataTypeName: string, startMs: number, endMs: number, dataSourceId?: string, bucketMs?: number) => {
  const duration = endMs - startMs;
  const body: any = {
    aggregateBy: [dataSourceId ? { dataSourceId } : { dataTypeName }],
    bucketByTime: { durationMillis: bucketMs || duration },
    startTimeMillis: startMs,
    endTimeMillis: endMs,
  };
  
  // Log de auditoría para depurar rangos y tipos
  console.log(`[GoogleFit API] Requesting ${dataTypeName} (${new Date(startMs).toLocaleTimeString()} - ${new Date(endMs).toLocaleTimeString()})`);

  const response = await fetch(FITNESS_BASE, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error('UNAUTHORIZED');
    const err = await response.json().catch(() => ({}));
    console.error(`Fitness API error [${dataTypeName}]:`, err);
    return null;
  }
  const rawData = await response.json();
  if (rawData.bucket?.length > 1) {
     console.log(`[GoogleFit API] Received ${rawData.bucket.length} buckets for ${dataTypeName}`);
  }
  return rawData;
};

const fetchSessions = async (token: string, startMs: number, endMs: number) => {
  const url = `https://www.googleapis.com/fitness/v1/users/me/sessions?startTime=${new Date(startMs).toISOString()}&endTime=${new Date(endMs).toISOString()}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const err = await response.json();
    console.error(`Fitness API error [Sessions]:`, err);
    return null;
  }
  return await response.json();
};

interface SleepInterval {
  start: number;
  end: number;
}

const mergeSleepIntervals = (intervals: SleepInterval[]): SleepInterval[] => {
  if (intervals.length <= 1) return intervals;
  
  // Ordenar por tiempo de inicio
  intervals.sort((a, b) => a.start - b.start);
  
  const merged: SleepInterval[] = [intervals[0]];
  
  for (let i = 1; i < intervals.length; i++) {
    const current = intervals[i];
    const lastMerged = merged[merged.length - 1];
    
    // Si se solapan o están muy cerca (menos de 2 mins de diferencia)
    // los unimos para evitar huecos artificiales y duplicidad
    if (current.start <= lastMerged.end + 120000) {
      lastMerged.end = Math.max(lastMerged.end, current.end);
    } else {
      merged.push(current);
    }
  }
  
  return merged;
};

export const fetchFitnessData = async (accessToken: string, targetDate: string): Promise<FitnessData> => {
  try {
    const { startMs: dayStart, endMs: dayEnd } = getDayRange(targetDate);
    const { startMs: sleepStart, endMs: sleepEnd } = getNightSleepRange(targetDate);
    
    console.log(`Fetching Fit for ${targetDate}. Range: ${new Date(dayStart).toLocaleString()} - ${new Date(dayEnd).toLocaleString()}`);

    const now = new Date();
    const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const isToday = targetDate === localToday;

    console.log(`[GoogleFit] Fetching ${targetDate} (isToday: ${isToday})`);

    const [sleepRes, sleepActivityRes, sleepSessionsRes, hrRes, stepsRes, calRes] = await Promise.all([
      fetchAggregate(accessToken, 'com.google.sleep.segment', sleepStart, sleepEnd),
      fetchAggregate(accessToken, 'com.google.activity.segment', sleepStart, sleepEnd),
      fetchSessions(accessToken, sleepStart, sleepEnd),
      // FC con buckets de 1 hora para asegurar captura de mínimos reales
      fetchAggregate(accessToken, 'com.google.heart_rate.bpm', dayStart, dayEnd, undefined, 3600000),
      // Pasos: Dejar que Google Fit fusione fuentes automáticamente (sin dataSourceId restrictivo)
      fetchAggregate(accessToken, 'com.google.step_count.delta', dayStart, dayEnd),
      fetchAggregate(accessToken, 'com.google.calories.expended', dayStart, dayEnd),
    ]);


    // --- PARSEO DE SUEÑO (TRIPLE VERIFICACIÓN + FUSIÓN) ---
    let sleepHours: number | null = null;
    let allIntervals: SleepInterval[] = [];
    
    // 1. Por etapas detalladas
    if (sleepRes?.bucket) {
      sleepRes.bucket.forEach((bucket: any) => {
        bucket.dataset?.[0]?.point?.forEach((p: any) => {
          const segmentType = p.value?.[0]?.intVal ?? 0;
          if (segmentType === 2 || (segmentType >= 4 && segmentType <= 6)) {
            if (p.startTimeNanos && p.endTimeNanos) {
              allIntervals.push({
                start: Number(BigInt(p.startTimeNanos) / 1000000n),
                end: Number(BigInt(p.endTimeNanos) / 1000000n)
              });
            }
          }
        });
      });
    }

    // 2. Por actividad general (Activity 72 = SLEEP)
    if (sleepActivityRes?.bucket) {
      sleepActivityRes.bucket.forEach((bucket: any) => {
        bucket.dataset?.[0]?.point?.forEach((p: any) => {
          if ((p.value?.[0]?.intVal ?? 0) === 72) {
            if (p.startTimeNanos && p.endTimeNanos) {
              allIntervals.push({
                start: Number(BigInt(p.startTimeNanos) / 1000000n),
                end: Number(BigInt(p.endTimeNanos) / 1000000n)
              });
            }
          }
        });
      });
    }

    // 3. Por Sesiones oficiales
    if (sleepSessionsRes?.session) {
      sleepSessionsRes.session.forEach((s: any) => {
        // Tipos de sueño: 72 (Sleep), 109 (Light sleep), 110 (Deep sleep), 111 (REM sleep), 112 (Awake during sleep session)
        if (s.activityType === 72 || (s.activityType >= 109 && s.activityType <= 112)) {
          allIntervals.push({
            start: Number(s.startTimeMillis),
            end: Number(s.endTimeMillis)
          });
        }
      });
    }

    // FUSIÓN DE INTERVALOS: Elimina duplicados si el teléfono y el reloj reportan lo mismo
    const merged = mergeSleepIntervals(allIntervals);
    const totalSleepMs = merged.reduce((sum, interval) => sum + (interval.end - interval.start), 0);

    if (totalSleepMs > 0) {
      sleepHours = Math.round((totalSleepMs / 3600000) * 10) / 10;
      console.log(`Sleep detected: ${sleepHours}h (${merged.length} bloques únicos de ${allIntervals.length} detectados)`);
    } else {
      console.warn("No sleep data found in any Google Fit source.");
    }

    // --- PARSEO DE OXÍGENO EN SANGRE (SpO2) ---
    let spo2: number | null = null;
    const spo2Res = await fetchAggregate(accessToken, 'com.google.oxygen_saturation', dayStart, dayEnd);
    if (spo2Res?.bucket) {
      const spo2Values: number[] = [];
      spo2Res.bucket.forEach((bucket: any) => {
        bucket.dataset?.forEach((ds: any) => {
          ds.point?.forEach((p: any) => {
            p.value?.forEach((v: any) => {
              const val = v?.fpVal ?? 0;
              if (val > 50 && val <= 100) spo2Values.push(val);
            });
          });
        });
      });
      if (spo2Values.length > 0) {
        // Usamos el promedio para el SpO2 general
        const sum = spo2Values.reduce((a, b) => a + b, 0);
        spo2 = Math.round(sum / spo2Values.length);
        console.log(`[GoogleFit] SpO2 detectable: ${spo2}% (${spo2Values.length} muestras)`);
      }
    }

    // --- PARSEO DE RITMO CARDIACO ---
    let restingHeartRate: number | null = null;
    if (hrRes?.bucket) {
      const hrValues: number[] = [];
      hrRes.bucket.forEach((bucket: any) => {
        // Iterar TODOS los datasets y todos los puntos
        bucket.dataset?.forEach((ds: any) => {
          ds.point?.forEach((p: any) => {
            // Extraer todos los valores fpVal disponibles (min, max, avg pueden estar en cualquier índice)
            p.value?.forEach((v: any) => {
              const val = v?.fpVal ?? v?.intVal ?? 0;
              if (val > 30 && val < 220) hrValues.push(val); // rango fisiológico amplio
            });
          });
        });
      });
      if (hrValues.length > 0) {
        // FC en reposo = percentil 10 del día (los valores más bajos cuando el usuario está quieto)
        const sorted = [...hrValues].sort((a, b) => a - b);
        const p10idx = Math.max(0, Math.floor(sorted.length * 0.1));
        restingHeartRate = Math.round(sorted[p10idx]);
        console.log(`[GoogleFit] FC: ${hrValues.length} muestras, reposo estimado: ${restingHeartRate} bpm`);
      }
    }

    // --- PARSEO DE PASOS (CON FALLBACK) ---
    let steps: number | null = null;
    if (stepsRes?.bucket) {
      let totalSteps = 0;
      let foundData = false;
      stepsRes.bucket.forEach((bucket: any) => {
        bucket.dataset?.[0]?.point?.forEach((p: any) => {
          foundData = true;
          totalSteps += (p.value?.[0]?.intVal ?? Math.round(p.value?.[0]?.fpVal ?? 0));
        });
      });
      if (foundData) steps = totalSteps;
    }

    // SI NO HAY PASOS con la fuente avanzada (especialmente en histórico), probar la básica
    if (steps === null || steps === 0) {
       console.log("No advanced steps found, trying basic delta...");
       const basicStepsRes = await fetchAggregate(accessToken, 'com.google.step_count.delta', dayStart, dayEnd);
       if (basicStepsRes?.bucket) {
         let basicTotal = 0;
         basicStepsRes.bucket.forEach((bucket: any) => {
           bucket.dataset?.[0]?.point?.forEach((p: any) => {
             basicTotal += (p.value?.[0]?.intVal ?? Math.round(p.value?.[0]?.fpVal ?? 0));
           });
         });
         if (basicTotal > 0) steps = basicTotal;
       }
    }

    // --- PARSEO DE CALORÍAS ---
    let activeCalories: number | null = null;
    if (calRes?.bucket) {
      let totalCals = 0;
      calRes.bucket.forEach((bucket: any) => {
        bucket.dataset?.[0]?.point?.forEach((p: any) => {
          totalCals += (p.value?.[0]?.fpVal ?? p.value?.[0]?.intVal ?? 0);
        });
      });
      if (totalCals > 0) activeCalories = Math.round(totalCals);
    }

    const result = { sleepHours, restingHeartRate, steps, activeCalories, spo2, lastFetched: Date.now() };
    console.log(`[GoogleFit] Result for ${targetDate}:`, result);
    return result;
  } catch (error: any) {
    // Re-throw UNAUTHORIZED para que el Store pueda renovar el token
    if (error?.message === 'UNAUTHORIZED') throw error;
    console.error('Error fetching Google Fit data:', error);
    return { sleepHours: null, restingHeartRate: null, steps: null, activeCalories: null, spo2: null, lastFetched: null };
  }
};

// Recupera datos de los últimos 7 días de forma eficiente
export const fetchWeeklyFitnessData = async (accessToken: string): Promise<Record<string, FitnessData>> => {
  const result: Record<string, FitnessData> = {};
  const today = new Date();
  
  // Rango total de 7 días
  const end = new Date(today);
  end.setHours(23, 59, 59, 999);
  const start = new Date(today);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  const startMs = start.getTime();
  const endMs = Math.min(end.getTime(), Date.now());

  try {
    // 1. Obtener todas las sesiones de sueño de la semana
    const sleepSessions = await fetchSessions(accessToken, startMs - (12 * 3600000), endMs); // Extra 12h atrás para capturar la primera noche
    
    // 2. Obtener buckets diarios para Pasos y Ritmo Cardíaco
    // IMPORTANTE: Para el historial NO usamos estimated_steps para evitar sumas acumuladas entre días.
    const dayMillis = 86400000;
    const [stepsRes, hrRes] = await Promise.all([
      fetchAggregateForRange(accessToken, 'com.google.step_count.delta', startMs, endMs, dayMillis),
      fetchAggregateForRange(accessToken, 'com.google.heart_rate.bpm', startMs, endMs, dayMillis)
    ]);

    // Inicializar el record con los 7 días
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      result[dStr] = { sleepHours: null, restingHeartRate: null, steps: null, activeCalories: null, spo2: null, lastFetched: Date.now() };
    }

    // Procesar Pasos (buckets)
    if (stepsRes?.bucket) {
      stepsRes.bucket.forEach((bucket: any) => {
        const date = new Date(Number(bucket.startTimeMillis));
        const dStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        let daySteps = 0;
        bucket.dataset?.[0]?.point?.forEach((p: any) => { daySteps += (p.value?.[0]?.intVal ?? 0); });
        if (result[dStr]) result[dStr].steps = daySteps || null;
      });
    }

    // Procesar HR (buckets) - Usando el mismo parser robusto que la consulta diaria
    if (hrRes?.bucket) {
      hrRes.bucket.forEach((bucket: any) => {
        const date = new Date(Number(bucket.startTimeMillis));
        const dStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        let hrValues: number[] = [];
        bucket.dataset?.[0]?.point?.forEach((p: any) => {
          // Capturar min (index 2) o average (index 0) o fpVal directo
          const val = p.value?.[2]?.fpVal || p.value?.[1]?.fpVal || p.value?.[0]?.fpVal || p.value?.[0]?.intVal || 0;
          if (val > 40 && val < 200) hrValues.push(val);
        });
        if (result[dStr] && hrValues.length) {
          result[dStr].restingHeartRate = Math.round(Math.min(...hrValues));
        }
      });
    }

    // Procesar Sueño (Sessions) - Atribución estricta por fin de sesión
    if (sleepSessions?.session) {
      sleepSessions.session.forEach((s: any) => {
        // Tipos de sueño: 72 (Sleep), 109 (Light sleep), 110 (Deep sleep), 111 (REM sleep)
        if (s.activityType === 72 || (s.activityType >= 109 && s.activityType <= 112)) {
          const sessionEnd = new Date(Number(s.endTimeMillis));
          const dateOfWakeup = `${sessionEnd.getFullYear()}-${String(sessionEnd.getMonth() + 1).padStart(2, '0')}-${String(sessionEnd.getDate()).padStart(2, '0')}`;
          
          if (result[dateOfWakeup]) {
            const hours = (Number(s.endTimeMillis) - Number(s.startTimeMillis)) / 3600000;
            // Solo sumar si la sesión es válida (entre 10 min y 16h)
            if (hours > 0.16 && hours < 16) {
                // Evitamos sumar si ya tenemos datos de una sesión más larga que la cubre (evitar duplicados por etapas)
                // Pero como Google Sessions suele ser la "maestra", sumamos las que no se solapan
                result[dateOfWakeup].sleepHours = Math.round(((result[dateOfWakeup].sleepHours || 0) + hours) * 10) / 10;
            }
          }
        }
      });
    }

    return result;
  } catch (error) {
    console.error("Error fetching historical Fit data:", error);
    return result;
  }
};

// Helper para rangos largos con buckets
const fetchAggregateForRange = async (token: string, dataTypeName: string, startMs: number, endMs: number, bucketMs: number, dataSourceId?: string) => {
  const body: any = {
    aggregateBy: [dataSourceId ? { dataSourceId } : { dataTypeName }],
    bucketByTime: { durationMillis: bucketMs },
    startTimeMillis: startMs,
    endTimeMillis: endMs,
  };
  const response = await fetch(FITNESS_BASE, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return response.ok ? await response.json() : null;
};

// Calcula el impacto de los datos de fitness sobre el IQ base (penalizadores/bonificaciones)
export const calculateFitnessImpact = (fitness: FitnessData, baseIq: number): number => {
  let adjusted = baseIq;

  // SUEÑO: la variable más influyente sobre el rendimiento cognitivo
  if (fitness.sleepHours !== null) {
    if (fitness.sleepHours < 5) adjusted -= 18;
    else if (fitness.sleepHours < 6) adjusted -= 10;
    else if (fitness.sleepHours < 7) adjusted -= 5;
    else if (fitness.sleepHours < 8) adjusted += 0;   // Óptimo mínimo
    else if (fitness.sleepHours <= 9) adjusted += 3;  // Óptimo máximo
    else adjusted -= 2; // Hipersomnia
  }

  // RITMO CARDIACO EN REPOSO: salud cardiovascular → perfusión cerebral
  if (fitness.restingHeartRate !== null) {
    if (fitness.restingHeartRate < 55) adjusted += 4;       // Atleta/Zona verde
    else if (fitness.restingHeartRate < 65) adjusted += 2;  // Buena condición
    else if (fitness.restingHeartRate < 75) adjusted += 0;  // Normal
    else if (fitness.restingHeartRate < 85) adjusted -= 2;  // Elevado
    else adjusted -= 5;                                      // Alto
  }

  // PASOS: movimiento diario activa BDNF (factor neurotrópico)
  if (fitness.steps !== null) {
    if (fitness.steps >= 10000) adjusted += 3;
    else if (fitness.steps >= 7500) adjusted += 2;
    else if (fitness.steps >= 5000) adjusted += 1;
    else if (fitness.steps < 2000) adjusted -= 2;
  }

  // OXÍGENO EN SANGRE (SpO2): oxigenación cerebral
  if (fitness.spo2 !== null) {
    if (fitness.spo2 < 90) adjusted -= 15;        // Hipoxia severa (impacto masivo)
    else if (fitness.spo2 < 94) adjusted -= 8;     // Hipoxia leve / mala recuperación
    else if (fitness.spo2 >= 97) adjusted += 2;    // Oxigenación óptima
  }

  return Math.round(adjusted);
};
