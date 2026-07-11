import { useState } from 'react';
import { Loader2, Camera } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

export default function Auth() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-4">
            <Camera size={28} className="text-black" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">PhotoStory</h1>
          <p className="text-sm text-neutral-500 mt-1">Votre journal de vie en photos</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="flex gap-1 p-1 bg-neutral-800 rounded-xl mb-5">
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                mode === 'signup' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Inscription
            </button>
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                mode === 'signin' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Connexion
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-300">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-all"
                placeholder="vous@exemple.com"
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-300">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-all"
                placeholder="Minimum 6 caracteres"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-black rounded-xl font-medium hover:bg-neutral-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />{' '}
                  {mode === 'signup' ? 'Inscription...' : 'Connexion...'}
                </>
              ) : mode === 'signup' ? (
                "S'inscrire"
              ) : (
                'Se connecter'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
