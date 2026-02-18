import { useEffect, useState } from 'react';
import { Navbar } from '../components/public/Navbar';
import { ReservationModal } from '../components/public/ReservationModal';
import { StarIcon, ClockIcon, MapPinIcon, PhoneIcon, BuildingStorefrontIcon } from '@heroicons/react/24/solid';
import { getMenuItems } from '../lib/api';
import type { MenuItem } from '../lib/types';

const heroImages = ['/rr-ice2.png', '/rr-ice3.png', '/rr-ice4.png'];

export function Home() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<string | null>(null);

  useEffect(() => {
    loadMenuItems();
  }, []);

  // Auto-slider pour les images de fond
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000); // Change toutes les 5 secondes

    return () => clearInterval(interval);
  }, []);

  const loadMenuItems = async () => {
    try {
      const items = await getMenuItems();
      setMenuItems(items.slice(0, 6)); // Afficher les 6 premiers
    } catch (error) {
      console.error('Failed to load menu items:', error);
    }
  };

  return (
    <div className="bg-black text-white min-h-screen">
      <Navbar onReservationClick={() => setIsReservationModalOpen(true)} />
      <ReservationModal isOpen={isReservationModalOpen} onClose={() => setIsReservationModalOpen(false)} />

      {/* Gallery Modal */}
      {selectedGalleryImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedGalleryImage(null)}
        >
          <div className="relative max-w-6xl max-h-[90vh] w-full">
            <button
              onClick={() => setSelectedGalleryImage(null)}
              className="absolute -top-10 right-0 text-cream-400 hover:text-cream-100 transition w-8 h-8 flex items-center justify-center bg-transparent"
            >
              <span className="text-2xl">×</span>
            </button>
            <img
              src={selectedGalleryImage}
              alt="Gallery Full View"
              className="w-full h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section
        id="hero"
        className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      >
        {/* Background Slider */}
        {heroImages.map((image, index) => (
          <div
            key={image}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.6) 100%), url("${image}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        ))}

        {/* Content */}
        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img 
              src="/logo.png" 
              alt="RR Ice Logo" 
              className="w-40 h-40 md:w-52 md:h-52 object-contain drop-shadow-2xl"
            />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 text-cream-200 tracking-wider">
            RR ICE
          </h1>
          <p className="text-lg md:text-xl text-cream-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Découvrez une expérience culinaire exceptionnelle dans une ambiance élégante et intime
          </p>
          <div className="flex flex-col md:flex-row gap-6 justify-center">
            <button
              onClick={() => setIsReservationModalOpen(true)}
              className="px-10 py-4 bg-transparent border-2 border-cream-400 text-cream-400 hover:bg-cream-400/10 font-medium transition-all text-sm tracking-[0.15em] uppercase"
            >
              Découvrir la carte
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section - Hidden */}
      <section className="hidden bg-gradient-to-b from-gray-900 to-black py-16 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-5xl font-display font-bold text-coffee-400 mb-2">20+</div>
            <p className="text-cream-400 text-lg">Ans de Tradition</p>
          </div>
          <div className="text-center">
            <div className="text-5xl font-display font-bold text-coffee-400 mb-2">⭐ 4.9</div>
            <p className="text-cream-400 text-lg">Notes Clients</p>
          </div>
          <div className="text-center">
            <div className="text-5xl font-display font-bold text-coffee-400 mb-2">150+</div>
            <p className="text-cream-400 text-lg">Plats Différents</p>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-24 px-4 bg-black">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-white">
            Notre Restaurant
          </h2>
          <p className="text-gray-400 text-center mb-12 text-lg">
            Découvrez l'ambiance raffinée de nos salles
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80',
              '/rr-ice5.jpg',
              'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80',
              'https://images.unsplash.com/photo-1567521464027-f127ff144326?auto=format&fit=crop&w=800&q=80',
              '/rr-ice6.jpg',
              'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
            ].map((image, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedGalleryImage(image)}
                className="relative group overflow-hidden rounded-lg h-64 cursor-pointer"
              >
                <img
                  src={image}
                  alt={`Gallery ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                  <div className="text-white text-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-lg font-semibold">Voir Plus</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Menu Preview Section */}
      <section 
        id="menu" 
        className="py-24 px-4 relative"
        style={{
          backgroundImage: 'linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.8) 100%), url("/rr-ice3.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-white">
            Notre Carte
          </h2>
          <p className="text-gray-400 text-center mb-12 text-lg">
            Sélection de nos plats les plus populaires
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.length > 0
              ? menuItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-gray-800 rounded-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 border border-gray-700"
                  >
                    {item.image_url && (
                      <div className="w-full h-48 overflow-hidden">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                        {item.is_halal && (
                          <span className="text-xs bg-green-600 text-white px-2 py-1 rounded whitespace-nowrap">
                            Halal
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                         'Plat délicieux de notre chef'
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-display font-bold text-coffee-400">
                          ${item.price.toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-400">{item.category}</span>
                      </div>
                    </div>
                  </div>
                ))
              : Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="bg-gray-800 rounded-lg h-64 animate-pulse" />
                ))}
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => setIsReservationModalOpen(true)}
              className="inline-block px-8 py-3 bg-coffee-600 hover:bg-coffee-500 text-cream-50 font-bold rounded-lg transition-colors"
            >
              Voir le Menu Complet
            </button>
          </div>
        </div>
      </section>

      {/* Reservation CTA Section */}
      <section
        id="reservation"
        className="py-24 px-4 relative"
        style={{
          backgroundImage:
            'linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.75) 100%), url("https://images.unsplash.com/photo-1519167758993-d3582a24de0e?auto=format&fit=crop&w=2000&q=80")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 text-white">
            Réservez Votre Table
          </h2>
          <p className="text-xl font-body text-cream-300 mb-8">
            Accumulez des moments inoubliables au cœur de notre établissement prestigieux
          </p>
          <button
            onClick={() => setIsReservationModalOpen(true)}
            className="inline-block px-8 py-4 bg-coffee-600 hover:bg-coffee-500 text-cream-50 font-bold text-lg rounded-lg transition-all transform hover:scale-105"
          >
            Réserver Maintenant
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gray-900 border-t border-gray-800">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-coffee-400 mb-4 flex justify-center">
              <ClockIcon className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-display font-semibold mb-2 text-white">Service Rapide</h3>
            <p className="text-cream-400">Service attentif et rapide pour une meilleure expérience</p>
          </div>
          <div className="text-center">
            <div className="text-coffee-400 mb-4 flex justify-center">
              <StarIcon className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-display font-semibold mb-2 text-white">Qualité Premium</h3>
            <p className="text-cream-400">Ingrédients frais et plats préparés par nos chefs</p>
          </div>
          <div className="text-center">
            <div className="text-coffee-400 mb-4 flex justify-center">
              <MapPinIcon className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-display font-semibold mb-2 text-white">Localisation Idéale</h3>
            <p className="text-cream-400">Situé au cœur de Ghandouri, Tanger pour votre commodité</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-black border-t border-gray-800 py-16 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BuildingStorefrontIcon className="w-8 h-8 text-coffee-400" />
              <span className="text-2xl font-display font-bold text-cream-100">RR Ice</span>
            </div>
            <p className="text-cream-400">
              Une expérience gastronomique unique à Tanger
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Navigation</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a href="#hero" className="hover:text-coffee-400 transition-colors">
                  Accueil
                </a>
              </li>
              <li>
                <a href="#gallery" className="hover:text-coffee-400 transition-colors">
                  Galerie
                </a>
              </li>
              <li>
                <a href="#menu" className="hover:text-coffee-400 transition-colors">
                  Menu
                </a>
              </li>
              <li>
                <a href="#reservation" className="hover:text-coffee-400 transition-colors">
                  Réserver
                </a>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h4 className="text-white font-semibold mb-4">Horaires</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>Lun - Jeu: 11h00 - 23h00</li>
              <li>Ven - Sam: 11h00 - 00h00</li>
              <li>Dimanche: 12h00 - 22h00</li>
              <li className="text-coffee-400 font-semibold mt-3">Fermé les jours fériés</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-center gap-2">
                <PhoneIcon className="w-4 h-4 text-coffee-400" />
                <span>+212 5393-01039</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPinIcon className="w-4 h-4 text-coffee-400 mt-1 flex-shrink-0" />
                <span>Ghandouri<br />Tanger, Maroc</span>
              </li>
              <li className="flex items-center gap-2">
                <span>📧</span>
                <span>rr.restauration@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">
              © 2026 RR Ice - Ghandouri, Tanger | rr.restauration@gmail.com | +212 5393-01039
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-gray-400 hover:text-coffee-400 transition-colors">
                Facebook
              </a>
              <a href="#" className="text-gray-400 hover:text-coffee-400 transition-colors">
                Instagram
              </a>
              <a href="#" className="text-gray-400 hover:text-coffee-400 transition-colors">
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
