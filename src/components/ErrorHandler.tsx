'use client';

import { useEffect } from 'react';

/**
 * Global error handler to prevent unhandled errors from displaying in popups
 * This catches errors that might otherwise show browser alert dialogs
 */
export default function ErrorHandler() {
  useEffect(() => {
    // Prevent unhandled errors from displaying in popups
    const handleError = (event: ErrorEvent) => {
      // Log error but don't display in popup
      console.error('Unhandled error:', event.error);
      // Prevent default error popup
      event.preventDefault();
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      // Log promise rejection but don't display in popup
      console.error('Unhandled promise rejection:', event.reason);
      // Prevent default error popup
      event.preventDefault();
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  // This component doesn't render anything
  return null;
}
