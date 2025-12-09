/**
 * PatternHelmet Component
 *
 * This component provides dynamic meta tags for pattern pages using react-helmet-async.
 * It handles SEO optimization by injecting unique titles, descriptions, and Open Graph tags
 * for each pattern page.
 *
 * Usage:
 * ```tsx
 * <PatternHelmet patternId="chain-of-reasoning" />
 * ```
 */

import { Helmet } from 'react-helmet-async';
import {
  getPatternMetadata,
  getPatternCanonicalUrl,
  getPatternOgImage
} from '../../lib/metadata/patternMetadata';

interface PatternHelmetProps {
  /**
   * The pattern identifier (e.g., 'chain-of-reasoning', 'agent-await-prompt')
   * This should match the route path segment
   */
  patternId: string;
}

/**
 * PatternHelmet component for dynamic meta tag injection
 *
 * This component uses react-helmet-async to dynamically update meta tags
 * on pattern pages. It ensures each pattern has:
 * - Unique page title
 * - SEO-optimized meta description (150-155 chars)
 * - Open Graph tags for social sharing
 * - Twitter Card tags
 * - Canonical URL
 * - Relevant keywords
 *
 * @param patternId - The pattern identifier matching the route
 */
export function PatternHelmet({ patternId }: PatternHelmetProps): JSX.Element {
  const metadata = getPatternMetadata(patternId);
  const canonicalUrl = getPatternCanonicalUrl(patternId);
  const ogImage = getPatternOgImage();

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{metadata.title}</title>
      <meta name="title" content={metadata.title} />
      <meta name="description" content={metadata.description} />
      <meta name="keywords" content={metadata.keywords.join(', ')} />

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={metadata.title} />
      <meta property="og:description" content={metadata.description} />
      <meta property="og:image" content={ogImage} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={metadata.title} />
      <meta name="twitter:description" content={metadata.description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}
