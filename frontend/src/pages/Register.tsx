import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import { PasswordToggle } from "../components/ui/PasswordToggle";
import { Spinner } from "../components/ui/Spinner";

const inputClass =
  "w-full bg-transparent border border-cream-400/30 rounded-none px-4 py-3.5 text-cream-100 text-sm font-body placeholder-cream-400/40 focus:outline-none focus:border-cream-400/60 transition-colors min-h-[48px]";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  const passwordTooShort = password.length > 0 && password.length < 8;
  const passwordMismatch = passwordConfirmation.length > 0 && password !== passwordConfirmation;

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Le logo ne doit pas dépasser 5 Mo");
      return;
    }
    setLogo(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogo(null);
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    if (password !== passwordConfirmation) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);

    try {
      await register({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        ...(logo ? { logo } : {}),
      });
      toast.success("Compte créé avec succès !");
      navigate("/dashboard");
    } catch (error: any) {
      if (error.response?.status === 429) {
        toast.error("Trop de tentatives. Veuillez réessayer dans une minute.");
      } else {
        toast.error(error.response?.data?.message || "Erreur lors de l'inscription");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-coffee-950 flex items-center justify-center px-4 py-12 relative overflow-hidden">
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
            Créer un compte
          </p>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-cream-100 tracking-wide">
            Inscription
          </h1>
        </div>

        {/* Form Card */}
        <div className="border border-cream-400/15 bg-cream-400/[0.02] p-8 md:p-10 opacity-0 animate-hero-fade-up" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Logo upload */}
            <div className="opacity-0 animate-hero-fade-up" style={{ animationDelay: '480ms', animationFillMode: 'forwards' }}>
              <label className="block text-cream-500 text-xs tracking-[0.2em] uppercase mb-2.5 font-body">
                Logo du restaurant
              </label>
              <div className="flex items-center gap-4">
                {logoPreview ? (
                  <div className="relative group">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-16 h-16 object-contain border border-cream-400/20 bg-cream-400/[0.03] p-1"
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      &times;
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-16 h-16 border border-dashed border-cream-400/30 flex flex-col items-center justify-center text-cream-400/40 hover:text-cream-400/60 hover:border-cream-400/50 transition-colors cursor-pointer"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                    </svg>
                  </button>
                )}
                <div className="flex-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-cream-400/60 hover:text-cream-300 text-xs font-body transition-colors underline underline-offset-2"
                  >
                    {logoPreview ? 'Changer le logo' : 'Choisir une image'}
                  </button>
                  <p className="text-cream-400/30 text-[11px] font-body mt-1">PNG, JPG — max 5 Mo (optionnel)</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </div>
            </div>

            <div className="opacity-0 animate-hero-fade-up" style={{ animationDelay: '540ms', animationFillMode: 'forwards' }}>
              <label htmlFor="name" className="block text-cream-500 text-xs tracking-[0.2em] uppercase mb-2.5 font-body">
                Nom du restaurant
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={inputClass}
                placeholder="Le nom de votre restaurant"
              />
            </div>

            <div className="opacity-0 animate-hero-fade-up" style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}>
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

            <div className="opacity-0 animate-hero-fade-up" style={{ animationDelay: '660ms', animationFillMode: 'forwards' }}>
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
                  minLength={8}
                  className={`${inputClass} pr-12 ${passwordTooShort ? "border-red-400/50" : ""}`}
                  placeholder="••••••••"
                />
                <PasswordToggle visible={showPassword} onToggle={() => setShowPassword(!showPassword)} />
              </div>
              {passwordTooShort && (
                <p className="mt-1.5 text-xs text-red-400/80 font-body">
                  Minimum 8 caractères ({password.length}/8)
                </p>
              )}
            </div>

            <div className="opacity-0 animate-hero-fade-up" style={{ animationDelay: '720ms', animationFillMode: 'forwards' }}>
              <label htmlFor="password_confirmation" className="block text-cream-500 text-xs tracking-[0.2em] uppercase mb-2.5 font-body">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  id="password_confirmation"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  required
                  minLength={8}
                  className={`${inputClass} pr-12 ${passwordMismatch ? "border-red-400/50" : ""}`}
                  placeholder="••••••••"
                />
                <PasswordToggle visible={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} />
              </div>
              {passwordMismatch && (
                <p className="mt-1.5 text-xs text-red-400/80 font-body">
                  Les mots de passe ne correspondent pas
                </p>
              )}
            </div>

            <div className="opacity-0 animate-hero-fade-up" style={{ animationDelay: '780ms', animationFillMode: 'forwards' }}>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-cream-400/10 border border-cream-400/40 text-cream-300 text-sm tracking-[0.15em] uppercase font-body font-semibold hover:bg-cream-400/20 active:bg-cream-400/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 rounded-none min-h-[52px]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <Spinner size="xs" className="text-current" />
                    Inscription...
                  </span>
                ) : (
                  "Créer mon restaurant"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Login link */}
        <p className="mt-8 text-center text-cream-400/50 font-body text-sm opacity-0 animate-hero-fade-up" style={{ animationDelay: '900ms', animationFillMode: 'forwards' }}>
          Déjà un compte ?{" "}
          <Link
            to="/login"
            className="text-cream-400/80 hover:text-cream-300 transition-colors underline underline-offset-4 decoration-cream-400/30"
          >
            Se connecter
          </Link>
        </p>

        {/* Back to site */}
        <div className="mt-6 text-center opacity-0 animate-hero-fade-up" style={{ animationDelay: '1000ms', animationFillMode: 'forwards' }}>
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
