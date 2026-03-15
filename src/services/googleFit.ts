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
  end.setHours(12, 0, 0, 0);
  
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
  console.log(`Fitness Raw [${dataTypeName}]:`, rawData);
  return rawData;
};

export const fetchFitnessData = async (accessToken: string, targetDate: string): Promise<FitnessData> => {
  const { startMs: dayStart, endMs: dayEnd } = getDayRange(targetDate);
  const { startMs: sleepStart, endMs: sleepEnd } = getNightSleepRange(targetDate);

  console.log(`Fetching Fit for ${targetDate}. Range: ${new Date(dayStart).toLocaleString()} - ${new Date(dayEnd).toLocaleString()}`);

  try {
    const [sleepRes, hrRes, stepsRes, calRes] = await Promise.all([
      fetchAggregate(accessToken, 'com.google.sleep.segment', sleepStart, sleepEnd),
      fetchAggregate(accessToken, 'com.google.heart_rate.summary', dayStart, dayEnd),
      fetchAggregate(accessToken, 'com.google.step_count.delta', dayStart, dayEnd),
      fetchAggregate(accessToken, 'com.google.calories.expended', dayStart, dayEnd),
    ]);


    // --- PARSEO DE SUEÑO ---
    let sleepHours: number | null = null;
    if (sleepRes?.bucket?.[0]?.dataset?.[0]?.point?.length) {
      let totalSleepMs = 0;
      sleepRes.bucket[0].dataset[0].point.forEach((p: any) => {
        // Solo contamos el sueño profundo/ligero (segment type < 5 = asleep)
        const segmentType = p.value?.[0]?.intVal ?? 0;
        if (segmentType >= 1 && segmentType <= 4) {
          const durationMs = (Number(p.endTimeNanos) - Number(p.startTimeNanos)) / 1e6;
          totalSleepMs += durationMs;
        }
      });
      sleepHours = totalSleepMs > 0 ? Math.round((totalSleepMs / 3600000) * 10) / 10 : null;
    }

    // --- PARSEO DE RITMO CARDIACO ---
    let restingHeartRate: number | null = null;
    if (hrRes?.bucket?.[0]?.dataset?.[0]?.point?.length) {
      const points = hrRes.bucket[0].dataset[0].point;
      const minValues = points.map((p: any) => p.value?.[1]?.fpVal ?? 0).filter((v: number) => v > 0);
      if (minValues.length) {
        restingHeartRate = Math.round(minValues.reduce((a: number, b: number) => a + b, 0) / minValues.length);
      }
    }

    // --- PARSEO DE PASOS ---
    let steps: number | null = null;
    if (stepsRes?.bucket?.[0]?.dataset?.[0]?.point?.length) {
      steps = stepsRes.bucket[0].dataset[0].point.reduce((sum: number, p: any) => {
        return sum + (p.value?.[0]?.intVal ?? 0);
      }, 0);
    }

    // --- PARSEO DE CALORÍAS ---
    let activeCalories: number | null = null;
    if (calRes?.bucket?.[0]?.dataset?.[0]?.point?.length) {
      activeCalories = Math.round(calRes.bucket[0].dataset[0].point.reduce((sum: number, p: any) => {
        return sum + (p.value?.[0]?.fpVal ?? 0);
      }, 0));
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
