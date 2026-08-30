import type { Metadata } from 'next';

// Shared per-route metadata builder. `metadataBase` is set once in the root
// layout, so the relative `path` values here resolve to absolute URLs
// (canonical + og:url) at render time without repeating the domain.
export const SITE_NAME = 'EasyFeezy';

/**
 * Metadata for a normal content route. `title` is a bare page title (it is
 * passed through the root layout's "%s | EasyFeezy" template for the
 * <title> tag); the Open Graph/Twitter title has "| EasyFeezy" appended
 * explicitly because the title template does not apply to those fields.
 */
export function pageMetadata({
  path,
  title,
  description,
}: {
  path: string;
  title: string;
  description: string;
}): Metadata {
  const socialTitle = `${title} | ${SITE_NAME}`;
  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: socialTitle,
      description,
      url: path,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'en_GB',
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
    },
  };
}

/**
 * Metadata for the homepage. `title` is already the full branded phrase
 * (e.g. "EasyFeezy — Marketplace Fee & Profit Calculator"), so it is set as
 * `title.absolute` to bypass the root title template rather than being
 * suffixed with "| EasyFeezy" a second time.
 */
export function homeMetadata({ title, description }: { title: string; description: string }): Metadata {
  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: '/',
    },
    openGraph: {
      title,
      description,
      url: '/',
      siteName: SITE_NAME,
      type: 'website',
      locale: 'en_GB',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}
