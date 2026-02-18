'use client';

import { useState, useEffect } from 'react';

declare global {
  interface Window {
    __ORIGINAL_PATHNAME__?: string;
  }
}

/**
 * Resolves a route parameter that may be 'placeholder' from static export.
 * CloudFront rewrites /auctions/7/ to /auctions/placeholder/ so S3 finds the
 * pre-generated HTML. This hook reads the real ID from the original pathname
 * captured before Next.js hydration (which may overwrite the URL).
 *
 * The root layout injects an inline script that saves window.location.pathname
 * to window.__ORIGINAL_PATHNAME__ before React hydrates, ensuring we have the
 * real browser URL even after Next.js corrects it to match the RSC payload.
 *
 * @param paramValue The param value from the page component (may be 'placeholder')
 * @param segmentIndex Which path segment contains the ID (default 1: /{resource}/{id})
 */
export function useResolvedParam(paramValue: string, segmentIndex: number = 1): string {
  const [resolved, setResolved] = useState(
    paramValue === 'placeholder' ? '' : paramValue
  );

  useEffect(() => {
    if (paramValue === 'placeholder') {
      const pathname = (typeof window !== 'undefined' && window.__ORIGINAL_PATHNAME__) || window.location.pathname;
      const segments = pathname.split('/').filter(Boolean);
      const realId = segments[segmentIndex];
      if (realId && realId !== 'placeholder') {
        setResolved(realId);
        // Restore the correct URL if Next.js changed it to /placeholder/
        if (window.location.pathname.includes('placeholder')) {
          window.history.replaceState(window.history.state, '', pathname);
        }
      }
    }
  }, [paramValue, segmentIndex]);

  return resolved;
}
