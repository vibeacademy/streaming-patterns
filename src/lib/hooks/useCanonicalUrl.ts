/**
 * useCanonicalUrl Hook
 *
 * Updates the canonical URL meta tag based on the current route.
 * This is important for SPAs to help search engines understand the canonical URL
 * for each route, preventing duplicate content issues.
 *
 * @module lib/hooks/useCanonicalUrl
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Base URL for the site (production URL)
 */
const BASE_URL = 'https://streamingpatterns.com';

/**
 * Updates the canonical URL link tag based on current route
 *
 * @example
 * ```tsx
 * function App() {
 *   useCanonicalUrl(); // Automatically updates canonical URL on route changes
 *   return <Routes>...</Routes>;
 * }
 * ```
 */
export function useCanonicalUrl(): void {
  const location = useLocation();

  useEffect(() => {
    // Get existing canonical link or create one if it doesn't exist
    let canonicalLink = document.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]'
    );

    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }

    // Build canonical URL from current pathname
    const canonicalUrl = `${BASE_URL}${location.pathname}`;

    // Update the href attribute
    canonicalLink.setAttribute('href', canonicalUrl);
  }, [location.pathname]);
}
