import { usePublicSettings } from '../../contexts/PublicSettingsContext';
import { Navbar } from './Navbar';
import { CinematicNav } from '../cinematic/CinematicNav';

interface PublicNavProps {
  onReservationClick: () => void;
  hideReservation?: boolean;
}

/**
 * Picks the right nav component for the current tenant layout.
 * - `classic`   → the original bordered Navbar (used on RR Ice)
 * - `cinematic` → the minimal transparent CinematicNav (used on Chez Chegrouni)
 *
 * All secondary pages (Gallery, Menu, Contact, Reservation) render this instead
 * of hard-picking one, so switching layout in the admin propagates everywhere.
 */
export function PublicNav(props: PublicNavProps) {
  const settings = usePublicSettings();
  const Nav = settings?.layout === 'cinematic' ? CinematicNav : Navbar;
  return <Nav {...props} />;
}
