# Optimizador Cognitivo v8.0 Enterprise 🧠⚡

Plataforma avanzada de biohacking diseñada para monitorear, predecir y optimizar el rendimiento cognitivo mediante farmacocinética simulada y bio-sincronización en tiempo real.

## 🚀 Vision General
Este sistema utiliza un motor matemático de decaimiento exponencial para calcular tu **Índice Cognitivo (CI)** actual basándose en:
- **Biometrías (Google Fit)**: Sueño, pasos y ritmo cardíaco.
- **Suplementación (Journal)**: Registro de nootrópicos, estimulantes y hábitos con curvas de efecto realistas.
- **Base Cognitiva**: Evaluación inicial de CI.

## 🛠️ Versiones Disponibles
- **[Main] (Producción)**: Versión estable con layout optimizado, bitácora lateral y sincronización Google Fit blindada.
- **[PRO] (feature/advanced-analytics)**: Versión experimental con tendencias de 7 días y pronto, matrices de correlación inteligente.

## 🏗️ Arquitectura Técnica
- **Frontend**: React + Vite + TypeScript.
- **Estilos**: TailwindCSS (Modern Glassmorphism & Vibrant UI).
- **Estado**: Zustand v5 (Persistencia con Firestore Sync).
- **Base de Datos**: Firebase Firestore (NoSQL).
- **Autenticación**: Firebase Auth (Google OAuth).
- **Visualización**: Recharts para curvas farmacocinéticas dinámicas.

## 🧬 Motor Matemático
El sistema calcula el CI Real mediante la fórmula:
`CI_Real = CI_Base + Ajuste_Salud(Fit) + Suma(Impacto_Suplementos(t))`

- El impacto de cada suplemento decae según su `half-life` (vida media) definida en el catálogo.

## 📦 Instalación y Desarrollo
1. Clonar repositorio: `git clone ...`
2. Instalar dependencias: `npm install`
3. Variables de Entorno: Configurar `.env` con las claves de Firebase.
4. Ejecutar: `npm run dev`

## 📊 Documentación Adicional
Puedes encontrar más detalles en la carpeta `/diagramas`:
- `architecture.puml`: Mapa de componentes.
- `dataflow.puml`: Flujo de bio-sincronización.
- `state_structure.puml`: Definición del estado global.

---
*Desarrollado para Biohackers de alto rendimiento.*
