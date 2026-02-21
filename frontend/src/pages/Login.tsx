import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

const inputClass =
  "w-full bg-transparent border border-cream-400/30 rounded-none px-4 py-3.5 text-cream-100 text-sm font-body placeholder-cream-400/40 focus:outline-none focus:border-cream-400/60 transition-colors min-h-[48px]";

export function Login() {
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
      const message = error.response?.data?.message || "Erreur de connexion";
      toast.error(message);
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

      {/* Card */}
      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Link to="/">
            <img
              src="/logo.png"
              alt="RR Ice"
              className="w-20 h-20 object-contain opacity-90 hover:opacity-100 transition-opacity"
            />
          </Link>
        </div>

        {/* Title */}
        <div className="text-center mb-10">
          <p className="text-cream-500 text-xs tracking-[0.35em] uppercase mb-3 font-body">
            Espace Admin
          </p>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-cream-100 tracking-wide">
            Connexion
          </h1>
        </div>

        {/* Form Card */}
        <div className="border border-cream-400/15 bg-cream-400/[0.02] p-8 md:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
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

            <div>
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
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cream-400/40 hover:text-cream-400/70 transition-colors p-1"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-cream-400/10 border border-cream-400/40 text-cream-300 text-sm tracking-[0.15em] uppercase font-body font-semibold hover:bg-cream-400/20 active:bg-cream-400/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 rounded-none min-h-[52px]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-20" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Connexion...
                </span>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>
        </div>

        {/* Register link */}
        <p className="mt-8 text-center text-cream-400/50 font-body text-sm">
          Pas encore de compte ?{" "}
          <Link
            to="/register"
            className="text-cream-400/80 hover:text-cream-300 transition-colors underline underline-offset-4 decoration-cream-400/30"
          >
            S'inscrire
          </Link>
        </p>

        {/* Back to site */}
        <div className="mt-6 text-center">
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
