# Documentación del Motor Matemático (Quantum Engine) 🧪

Este documento detalla los algoritmos utilizados para calcular el Índice Cognitivo (CI) y la farmacocinética de los suplementos.

## 1. Algoritmo de Decaimiento Exponencial
El sistema utiliza una función de decaimiento exponencial para simular cómo los suplementos abandonan el torrente sanguíneo.

**Fórmula:**
`I(t) = Q * K * e^(-ln(2) * (t - t0) / t1/2)`

- **Q**: Cantidad/Dosis administrada.
- **K**: Coeficiente de impacto (`effectK`) definido en el catálogo.
- **t - t0**: Tiempo transcurrido en horas desde la administración.
- **t1/2**: Vida media (`durationH`) en la que el efecto se reduce al 50%.

## 2. Cálculo del Índice Cognitivo (CI)
El CI mostrado en pantalla es una composición de tres factores:

`CI_Total = CI_Base + Ajuste_Salud + Suma(Impactos_Suplementos)`

### A. CI Base
Puntuación estática obtenida en el test inicial del usuario.

### B. Ajuste de Salud (Biometrías)
Factor dinámico calculado a partir de los datos de Google Fit o ajustes manuales:
- **Sueño**: 
  - < 7h: Penalización progresiva (hasta -18 pts).
  - 8h-9h: Bonificación (+3 pts).
- **Pasos**: Bonificación por actividad (+1 a +3 pts).
- **RHR (Ritmo Cardiaco)**: Bonificación por salud cardiovascular (hasta +4 pts).

### C. Impulso de Suplementos (Boost)
La suma de todos los efectos residuales de los suplementos consumidos en las últimas 24-48 horas, aplicando la fórmula de decaimiento a cada uno.

## 3. Lógica de Sincronización de Sueño (Triple Verificación)
Para garantizar datos precisos de Google Fit, el sistema consulta tres fuentes:
1. `com.google.sleep.segment` (Datos nativos de sueño).
2. `com.google.activity.segment` (Detección de actividad tipo 72).
3. `Sessions API` (Sesiones registradas manualmente o por otras apps).

Los intervalos de estas fuentes se fusionan mediante un algoritmo de **Unión de Intervalos** para evitar duplicidad si el usuario usa más de un dispositivo.

---
*Nota: Estas fórmulas están diseñadas para estimación y propósitos de biohacking personal, no para uso diagnóstico médico.*
