import { useState, useMemo, useEffect } from "react";
import { useNavigate, Link, useSearchParams, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import { PasswordToggle } from "../components/ui/PasswordToggle";
import { Spinner } from "../components/ui/Spinner";
import { SaasSEO } from "../components/SaasSEO";
import { api, csrf, resolveLogoUrl } from "../lib/api";

// Read the branding to show above the login form.
// Priority: URL path /r/:slug/login > ?tenant=slug query > SaaS default.
// Deliberately NO localStorage fallback — the plain /login is the SaaS-level
// admin entry (NA Innovations). It must never inherit a tenant name from a
// previously visited public site, otherwise anyone landing on /login sees
// the last-visited restaurant's branding, which is semantically wrong and
// looks like a bug. Tenants that want their own branding on the login screen
// should be linked from their own footer to /r/:slug/login.
function useLoginBranding(): { name: string; logoUrl: string | null; slug: string | null } {
  const [params] = useSearchParams();
  const { slug: pathSlug } = useParams<{ slug: string }>();
  return useMemo(() => {
    const slug = pathSlug || params.get('tenant');
    if (!slug) return { name: 'NA Innovations', logoUrl: null, slug: null };
    let name = 'Restaurant';
    let logoUrl: string | null = null;
    try {
      const raw = localStorage.getItem(`publicSettings:${slug}`);
      if (raw) {
        const s = JSON.parse(raw) as { restaurant_name?: string; logo_url?: string | null };
        if (s.restaurant_name) name = s.restaurant_name;
        if (s.logo_url) logoUrl = resolveLogoUrl(s.logo_url);
      }
    } catch { /* corrupt cache */ }
    return { name, logoUrl, slug };
  }, [params, pathSlug]);
}

const inputClass =
  "w-full bg-transparent border border-cream-400/30 rounded-none px-4 py-3.5 text-cream-100 text-sm font-body placeholder-cream-400/40 focus:outline-none focus:border-cream-400/60 transition-colors min-h-[48px]";

interface DevAdmin {
  id: number;
  name: string;
  email: string;
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [devAdmins, setDevAdmins] = useState<DevAdmin[]>([]);
  const [devPickedAdminId, setDevPickedAdminId] = useState<number>(0);
  const [devLoading, setDevLoading] = useState(false);
  const { login, refreshMe } = useAuth();
  const navigate = useNavigate();
  const branding = useLoginBranding();
  const isDev = import.meta.env.DEV;

  // Fetch platform superadmins in dev when we're on the SaaS-level /login
  // (no tenant slug). The tenant-scoped /r/:slug/login already knows which
  // owner to log in as and just needs the one-click button below.
  useEffect(() => {
    if (!isDev || branding.slug) return;
    api.get<DevAdmin[]>("/api/dev/admins")
      .then((r) => {
        setDevAdmins(r.data);
        if (r.data[0]) setDevPickedAdminId(r.data[0].id);
      })
      .catch(() => { /* endpoint 404s outside local, silently ignore */ });
  }, [isDev, branding.slug]);

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

  const handleDevLoginAsOwner = async (slug: string) => {
    setDevLoading(true);
    try {
      await csrf();
      await api.post("/api/dev/login-as-owner", { tenant: slug });
      await refreshMe();
      toast.success(`Connecté sur ${slug}`);
      navigate("/dashboard");
    } catch (err: any) {
      const status = err?.response?.status;
      toast.error(
        status === 404
          ? "Endpoint dev indisponible (activez APP_ENV=local)."
          : "Impossible de se connecter en tant que propriétaire."
      );
    } finally {
      setDevLoading(false);
    }
  };

  // Superadmin shortcut used on the SaaS-level /login.
  const handleDevLoginAsAdmin = async (userId: number) => {
    setDevLoading(true);
    try {
      await csrf();
      await api.post("/api/dev/login-as-user", { user_id: userId });
      await refreshMe();
      toast.success("Connecté en tant que superadmin");
      navigate("/dashboard/admin");
    } catch (err: any) {
      const status = err?.response?.status;
      toast.error(
        status === 404
          ? "Endpoint dev indisponible (activez APP_ENV=local)."
          : "Impossible de se connecter en tant que superadmin."
      );
    } finally {
      setDevLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-coffee-950 flex items-center justify-center px-4 relative overflow-hidden">
      <SaasSEO
        page="auth"
        title={`Connexion — ${branding.name}`}
      />
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
        {/* Logo — tenant-aware: restaurant branding if visited previously, else SaaS default */}
        <div className="flex justify-center mb-10 opacity-0 animate-hero-fade-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
          <Link
            to={branding.slug ? `/r/${branding.slug}` : "/"}
            className="flex items-center gap-3 group"
          >
            {branding.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt={branding.name}
                className="w-10 h-10 object-contain group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-coffee-400 to-coffee-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="text-white font-display font-bold text-lg">{branding.name.charAt(0)}</span>
              </div>
            )}
            <span className="text-cream-200 font-display font-bold text-xl tracking-wide">{branding.name}</span>
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

        {/* ─── DEV-only shortcut ─── */}
        {isDev && (
          <div className="mt-6 border border-amber-400/30 bg-amber-400/[0.03] p-5 opacity-0 animate-hero-fade-up" style={{ animationDelay: '820ms', animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-amber-400/80 bg-amber-400/10 px-2 py-1 rounded">
                DEV
              </span>
              <span className="text-amber-200/80 text-xs font-body">
                Raccourci de connexion — désactivé hors <code>APP_ENV=local</code>
              </span>
            </div>

            {branding.slug ? (
              // /r/:slug/login — this restaurant has a single owner account.
              // Backend loginAsOwner picks the non-admin user; a single button
              // is enough.
              <button
                type="button"
                onClick={() => handleDevLoginAsOwner(branding.slug!)}
                disabled={devLoading}
                className="w-full py-3 bg-amber-400/10 border border-amber-400/40 text-amber-200 text-xs tracking-[0.15em] uppercase font-body font-semibold hover:bg-amber-400/20 active:bg-amber-400/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 min-h-[44px]"
              >
                {devLoading ? (
                  <span className="flex items-center justify-center gap-3">
                    <Spinner size="xs" className="text-current" /> Connexion…
                  </span>
                ) : (
                  <>Se connecter en tant que propriétaire de <strong className="text-amber-100">{branding.name}</strong></>
                )}
              </button>
            ) : (
              // Plain /login — SaaS-level entry, meant for platform superadmins
              // who approve/reject restaurant signups. Only role=admin users are
              // surfaced here; picking any tenant owner belongs to /r/:slug/login.
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={devPickedAdminId}
                  onChange={(e) => setDevPickedAdminId(Number(e.target.value))}
                  className="flex-1 bg-coffee-950 border border-amber-400/30 text-amber-100 text-sm font-body px-3 py-2 focus:outline-none focus:border-amber-400/60"
                >
                  {devAdmins.length === 0 && <option value={0}>Aucun superadmin en base</option>}
                  {devAdmins.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.email}{a.name ? ` — ${a.name}` : ''}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => devPickedAdminId && handleDevLoginAsAdmin(devPickedAdminId)}
                  disabled={devLoading || !devPickedAdminId}
                  className="px-4 py-2 bg-amber-400/10 border border-amber-400/40 text-amber-200 text-xs tracking-[0.15em] uppercase font-body font-semibold hover:bg-amber-400/20 active:bg-amber-400/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 min-h-[40px] whitespace-nowrap"
                >
                  {devLoading ? <Spinner size="xs" className="text-current" /> : 'Se connecter'}
                </button>
              </div>
            )}
          </div>
        )}

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
