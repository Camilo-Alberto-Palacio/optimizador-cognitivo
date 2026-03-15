import React, { useState } from 'react';
import { Brain, Sparkles, Activity } from 'lucide-react';
import { loginWithGoogle, getGoogleCredential } from '../services/firebase';
import { useEngineStore } from '../store/useEngineStore';

export const LoginScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setFitToken, loadFitnessData } = useEngineStore();

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await loginWithGoogle();
      // Extraer el access token del proveedor de Google para llamar a Fitness API
      const credential = getGoogleCredential(result);
      if (credential?.accessToken) {
        setFitToken(credential.accessToken);
        // Cargar datos de Fit en background sin bloquear la UI
        setTimeout(() => loadFitnessData(), 1500);
      }
      // El estado se actualizará automáticamente por el observador onAuthStateChanged en App.tsx
    } catch (err: any) {
      console.error("Firebase Auth Error:", err);
      const errorMessage = err?.message || 'Hubo un error al iniciar sesión. Inténtalo de nuevo.';
      setError(`Error: ${errorMessage}`);
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-800 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-md bg-white p-10 rounded-[3rem] border border-slate-200 shadow-2xl relative z-10 flex flex-col items-center text-center">
        
        <div className="bg-indigo-50 p-5 rounded-3xl border border-indigo-100 mb-6 shadow-inner">
          <Brain className="text-indigo-500 w-16 h-16" />
        </div>

        <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">
          Bienestar <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-emerald-500">Universal</span>
        </h1>
        
        <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed px-4">
          Inicia sesión para registrar tus hábitos y proyectar tu rendimiento mental diario.
        </p>

        {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold p-3 rounded-2xl w-full mb-6 relative z-10">
                {error}
            </div>
        )}

        <button 
          onClick={handleLogin}
          disabled={loading}
          className="w-full relative group bg-indigo-50 hover:bg-slate-100 border border-indigo-100 text-slate-800 font-black text-sm uppercase tracking-widest py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-70 disabled:pointer-events-none shadow-sm"
        >
          {loading ? (
            <Activity className="animate-spin text-indigo-500" size={20} />
          ) : (
            <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continuar con Google
            </>
          )}
        </button>

        <p className="text-[10px] text-slate-400 font-medium mt-6 uppercase tracking-widest flex items-center justify-center gap-1">
          <Sparkles size={10} /> Sistema Operativo Mental v8.0
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
