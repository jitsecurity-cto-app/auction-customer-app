import mixpanel from 'mixpanel-browser';

let initialized = false;

export function initAnalytics(): void {
  const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
  if (!token || initialized) return;

  mixpanel.init(token, {
    track_pageview: false, // We handle this manually
    persistence: 'localStorage',
  });
  initialized = true;
}

export function identifyUser(userId: string, traits?: Record<string, any>): void {
  if (!initialized) return;
  mixpanel.identify(userId);
  if (traits) {
    mixpanel.people.set(traits);
  }
}

export function trackEvent(name: string, properties?: Record<string, any>): void {
  if (!initialized) return;
  mixpanel.track(name, properties);
}

export function resetAnalytics(): void {
  if (!initialized) return;
  mixpanel.reset();
}
