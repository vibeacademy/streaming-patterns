import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initErrorTracking } from './lib/monitoring/errorTracking';
import { initWebVitals } from './lib/monitoring/webVitals';
import './styles/variables.css';
import './styles/themes.css';
import './styles/globals.css';

// Initialize monitoring services
initErrorTracking({
  enabled: true,
  sampleRate: 1.0, // 100% sampling - adjust in production if needed
  debug: process.env.NODE_ENV === 'development'
});

// Initialize Web Vitals tracking
initWebVitals((metric) => {
  // Log metrics in development
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log(`[Web Vitals] ${metric.name}: ${metric.value.toFixed(2)}ms (${metric.rating})`);
  }

  // Future: Send metrics to analytics service
  // analytics.track('web_vital', {
  //   metric: metric.name,
  //   value: metric.value,
  //   rating: metric.rating
  // });
});

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
