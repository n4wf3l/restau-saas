import { useParams } from 'react-router-dom';

/**
 * Returns the base path for the current restaurant: `/r/:slug`
 * Use this to build internal links within a restaurant's public site.
 */
export function useRestaurantBasePath(): string {
  const { slug } = useParams<{ slug: string }>();
  return `/r/${slug}`;
}
