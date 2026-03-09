import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import { PasswordToggle } from "../components/ui/PasswordToggle";
import { Spinner } from "../components/ui/Spinner";

const inputClass =
  "w-full bg-transparent border border-cream-400/30 rounded-none px-4 py-3.5 text-cream-100 text-sm font-body placeholder-cream-400/40 focus:outline-none focus:border-cream-400/60 transition-colors min-h-[48px]";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success("Connexion réussie !");
      navigate("/dashboard");
    } catch (error: any) {
      if (error.response?.status === 429) {
        toast.error("Trop de tentatives. Veuillez réessayer dans une minute.");
      } else {
        toast.error(error.response?.data?.message || "Erreur de connexion");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-coffee-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background subtle pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(227,204,173,0.5) 1px, transparent 0)',
        backgroundSize: '32px 32px',
      }} />

      {/* Animated ambient glow */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-coffee-600/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cream-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Card */}
      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-10 opacity-0 animate-hero-fade-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-coffee-400 to-coffee-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="text-white font-display font-bold text-lg">N</span>
            </div>
            <span className="text-cream-200 font-display font-bold text-xl tracking-wide">NA Innovations</span>
          </Link>
        </div>

        {/* Title */}
        <div className="text-center mb-10 opacity-0 animate-hero-fade-up" style={{ animationDelay: '250ms', animationFillMode: 'forwards' }}>
          <p className="text-cream-500 text-xs tracking-[0.35em] uppercase mb-3 font-body">
            Espace Admin
          </p>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-cream-100 tracking-wide">
            Connexion
          </h1>
        </div>

        {/* Form Card */}
        <div className="border border-cream-400/15 bg-cream-400/[0.02] p-8 md:p-10 opacity-0 animate-hero-fade-up" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="opacity-0 animate-hero-fade-up" style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}>
              <label htmlFor="email" className="block text-cream-500 text-xs tracking-[0.2em] uppercase mb-2.5 font-body">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
                placeholder="vous@exemple.com"
              />
            </div>

            <div className="opacity-0 animate-hero-fade-up" style={{ animationDelay: '570ms', animationFillMode: 'forwards' }}>
              <label htmlFor="password" className="block text-cream-500 text-xs tracking-[0.2em] uppercase mb-2.5 font-body">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`${inputClass} pr-12`}
                  placeholder="••••••••"
                />
                <PasswordToggle visible={showPassword} onToggle={() => setShowPassword(!showPassword)} />
              </div>
            </div>

            <div className="opacity-0 animate-hero-fade-up" style={{ animationDelay: '640ms', animationFillMode: 'forwards' }}>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-cream-400/10 border border-cream-400/40 text-cream-300 text-sm tracking-[0.15em] uppercase font-body font-semibold hover:bg-cream-400/20 active:bg-cream-400/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 rounded-none min-h-[52px]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <Spinner size="xs" className="text-current" />
                    Connexion...
                  </span>
                ) : (
                  "Se connecter"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Register link */}
        <p className="mt-8 text-center text-cream-400/50 font-body text-sm opacity-0 animate-hero-fade-up" style={{ animationDelay: '780ms', animationFillMode: 'forwards' }}>
          Pas encore de compte ?{" "}
          <Link
            to="/register"
            className="text-cream-400/80 hover:text-cream-300 transition-colors underline underline-offset-4 decoration-cream-400/30"
          >
            S'inscrire
          </Link>
        </p>

        {/* Back to site */}
        <div className="mt-6 text-center opacity-0 animate-hero-fade-up" style={{ animationDelay: '900ms', animationFillMode: 'forwards' }}>
          <Link
            to="/"
            className="text-cream-400/40 hover:text-cream-400/70 font-body text-xs tracking-[0.15em] uppercase transition-colors"
          >
            Retour au site
          </Link>
        </div>
      </div>
    </div>
  );
}
