'use client';

import { useState, useEffect } from 'react';

/**
 * Resolves a route parameter that may be 'placeholder' from static export.
 * CloudFront rewrites /auctions/7/ to /auctions/placeholder/ so S3 finds the
 * pre-generated HTML. This hook reads the real ID from window.location.pathname.
 *
 * NOTE: usePathname() cannot be used here — it reads from the RSC payload baked
 * into the static HTML, which contains 'placeholder'. Only window.location has
 * the real browser URL.
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
      const segments = window.location.pathname.split('/').filter(Boolean);
      const realId = segments[segmentIndex];
      if (realId && realId !== 'placeholder') {
        setResolved(realId);
      }
    }
  }, [paramValue, segmentIndex]);

  return resolved;
}
