export interface FitnessData {
  sleepHours: number | null;       // Horas de sueño anoche
  restingHeartRate: number | null; // BPM en reposo (promedio del día)
  steps: number | null;            // Pasos del día
  activeCalories: number | null;   // Calorías activas quemadas
  lastFetched: number | null;      // timestamp de la última consulta
}

const FITNESS_BASE = 'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate';

// Construye los milisegundos del inicio y fin de un día específico (00:00 - 23:59)
const getDayRange = (dateStr: string) => {
  const start = new Date(dateStr + 'T00:00:00');
  const end = new Date(dateStr + 'T23:59:59');
  return {
    startMs: start.getTime(),
    endMs: end.getTime(),
  };
};

// Construye un rango para capturar el sueño de la noche anterior (18:00 día anterior - 12:00 día actual)
const getNightSleepRange = (dateStr: string) => {
  const currentDay = new Date(dateStr + 'T00:00:00');
  const start = new Date(currentDay);
  start.setDate(start.getDate() - 1);
  start.setHours(18, 0, 0, 0);
  
  const end = new Date(currentDay);
  end.setHours(14, 0, 0, 0); // Extendido a las 2 PM para capturar despertares tardíos
  
  return {
    startMs: start.getTime(),
    endMs: end.getTime(),
  };
};

const fetchAggregate = async (token: string, dataTypeName: string, startMs: number, endMs: number) => {
  const response = await fetch(FITNESS_BASE, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      aggregateBy: [{ dataTypeName }],
      bucketByTime: { durationMillis: endMs - startMs },
      startTimeMillis: startMs,
      endTimeMillis: endMs,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    console.error(`Fitness API error [${dataTypeName}]:`, err);
    return null;
  }
  const rawData = await response.json();
  // console.log(`Fitness Raw [${dataTypeName}]:`, rawData);
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
  const { startMs: dayStart, endMs: dayEnd } = getDayRange(targetDate);
  const { startMs: sleepStart, endMs: sleepEnd } = getNightSleepRange(targetDate);

  console.log(`Fetching Fit for ${targetDate}. Range: ${new Date(dayStart).toLocaleString()} - ${new Date(dayEnd).toLocaleString()}`);

  try {
    const [sleepRes, sleepActivityRes, sleepSessionsRes, hrRes, stepsRes, calRes] = await Promise.all([
      fetchAggregate(accessToken, 'com.google.sleep.segment', sleepStart, sleepEnd),
      fetchAggregate(accessToken, 'com.google.activity.segment', sleepStart, sleepEnd),
      fetchSessions(accessToken, sleepStart, sleepEnd),
      fetchAggregate(accessToken, 'com.google.heart_rate.bpm', dayStart, dayEnd),
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
            allIntervals.push({
              start: Number(BigInt(p.startTimeNanos) / 1000000n),
              end: Number(BigInt(p.endTimeNanos) / 1000000n)
            });
          }
        });
      });
    }

    // 2. Por actividad general (Activity 72 = SLEEP)
    if (sleepActivityRes?.bucket) {
      sleepActivityRes.bucket.forEach((bucket: any) => {
        bucket.dataset?.[0]?.point?.forEach((p: any) => {
          if ((p.value?.[0]?.intVal ?? 0) === 72) {
            allIntervals.push({
              start: Number(BigInt(p.startTimeNanos) / 1000000n),
              end: Number(BigInt(p.endTimeNanos) / 1000000n)
            });
          }
        });
      });
    }

    // 3. Por Sesiones oficiales
    if (sleepSessionsRes?.session) {
      sleepSessionsRes.session.forEach((s: any) => {
        if (s.activityType === 72) {
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

    // --- PARSEO DE RITMO CARDIACO ---
    // Buscamos el mínimo del día para aproximar el Resting Heart Rate
    let restingHeartRate: number | null = null;
    if (hrRes?.bucket) {
      let hrValues: number[] = [];
      hrRes.bucket.forEach((bucket: any) => {
        bucket.dataset?.[0]?.point?.forEach((p: any) => {
          // Index 2 suele ser el min en resúmenes, pero en bpm raw/aggregateBy dataTypeName: bpm
          // obtenemos buckets con min, max, avg si usamos aggregateBy.
          const val = p.value?.[2]?.fpVal || p.value?.[0]?.fpVal || 0;
          if (val > 0) hrValues.push(val);
        });
      });
      if (hrValues.length) {
        restingHeartRate = Math.round(Math.min(...hrValues));
      }
    }

    // --- PARSEO DE PASOS ---
    let steps: number | null = null;
    if (stepsRes?.bucket) {
      let totalSteps = 0;
      stepsRes.bucket.forEach((bucket: any) => {
        bucket.dataset?.[0]?.point?.forEach((p: any) => {
          totalSteps += (p.value?.[0]?.intVal ?? 0);
        });
      });
      if (totalSteps > 0) steps = totalSteps;
    }

    // --- PARSEO DE CALORÍAS ---
    let activeCalories: number | null = null;
    if (calRes?.bucket) {
      let totalCals = 0;
      calRes.bucket.forEach((bucket: any) => {
        bucket.dataset?.[0]?.point?.forEach((p: any) => {
          totalCals += (p.value?.[0]?.fpVal ?? 0);
        });
      });
      if (totalCals > 0) activeCalories = Math.round(totalCals);
    }

    const result = { sleepHours, restingHeartRate, steps, activeCalories, lastFetched: Date.now() };
    console.log("Fitness Parsed Results:", result);
    return result;
  } catch (error) {
    console.error('Error fetching Google Fit data:', error);
    return { sleepHours: null, restingHeartRate: null, steps: null, activeCalories: null, lastFetched: null };
  }
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

  return Math.round(adjusted);
};
