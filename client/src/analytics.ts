/**
 * Analytics initialization script
 * Conditionally loads analytics if environment variables are configured
 */

function initializeAnalytics() {
  // Access Vite environment variables
  const analyticsEndpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
  const websiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID;

  // Only load analytics if both values are configured
  if (analyticsEndpoint && websiteId) {
    const script = document.createElement('script');
    script.defer = true;
    script.src = `${analyticsEndpoint}/umami`;
    script.setAttribute('data-website-id', websiteId);
    
    // Ensure document.body exists before appending
    if (document.body) {
      document.body.appendChild(script);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(script);
      });
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAnalytics);
} else {
  initializeAnalytics();
}

