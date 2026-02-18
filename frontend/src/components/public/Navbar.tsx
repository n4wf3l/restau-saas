import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

interface NavbarProps {
  onReservationClick: () => void;
}

export function Navbar({ onReservationClick }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { label: 'Accueil', href: '#hero' },
    { label: 'Galerie', href: '#gallery' },
    { label: 'Menu', href: '#menu' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <nav className="fixed top-0 w-full backdrop-blur-sm z-40">
      <div className="max-w-full mx-auto">
        {/* Desktop Layout */}
        <div className="hidden md:flex items-center h-20">
          {/* Logo Section */}
          <div className="flex-1 flex justify-center items-center border-r border-cream-400/30 px-8">
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="RR Ice" className="w-12 h-12 object-contain" />
            </Link>
          </div>

          {/* Nav Links Section */}
          <div className="flex-[2] flex justify-center items-center gap-16 border-r border-cream-400/30 px-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-white hover:text-cream-300 transition-colors text-sm font-medium tracking-[0.25em] uppercase"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA Section */}
          <div className="flex-1 flex justify-center items-center gap-8 px-8">
            <Link
              to="/login"
              className="text-white hover:text-cream-300 transition-colors text-sm tracking-[0.25em] uppercase"
            >
              Admin
            </Link>
            <button
              onClick={onReservationClick}
              className="px-8 py-3 bg-transparent border-2 border-cream-400 text-cream-400 hover:bg-cream-400/10 font-medium transition-all text-sm tracking-[0.2em] uppercase"
            >
              Réserver
            </button>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden flex items-center justify-between h-20 px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="RR Ice" className="w-12 h-12 object-contain" />
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-white p-2"
          >
            {isOpen ? (
              <XMarkIcon className="w-6 h-6" />
            ) : (
              <Bars3Icon className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Nav */}
        {isOpen && (
          <div className="md:hidden border-t border-cream-400/30 py-6 space-y-4 bg-black/95">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-white hover:text-cream-300 transition-colors text-sm tracking-[0.2em] uppercase text-center"
              >
                {link.label}
              </a>
            ))}
            <div className="px-4">
              <button
                onClick={() => {
                  onReservationClick();
                  setIsOpen(false);
                }}
                className="block w-full px-8 py-3 bg-transparent border-2 border-cream-400 text-cream-400 hover:bg-cream-400/10 font-medium transition-all text-sm tracking-[0.2em] uppercase"
              >
                Réserver
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
