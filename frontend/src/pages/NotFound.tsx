import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-coffee-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background subtle pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(227,204,173,0.5) 1px, transparent 0)',
        backgroundSize: '32px 32px',
      }} />

      <div className="relative text-center max-w-md">
        <p className="text-cream-500 text-xs tracking-[0.35em] uppercase mb-4 font-body">
          Erreur 404
        </p>
        <h1 className="text-6xl md:text-8xl font-display font-bold text-cream-100 mb-4 tracking-wide">
          404
        </h1>
        <p className="text-cream-400/70 font-body text-base md:text-lg leading-relaxed mb-10">
          Cette page n'existe pas ou a été déplacée.
        </p>
        <Link
          to="/"
          className="inline-block px-8 py-4 bg-cream-400/10 border border-cream-400/40 text-cream-300 text-sm tracking-[0.15em] uppercase font-body font-semibold hover:bg-cream-400/20 active:bg-cream-400/25 transition-all duration-300"
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
