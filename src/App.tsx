import { useState } from 'react';

/**
 * App component - Root component for the Streaming Patterns library
 *
 * This is the main entry point for the educational pattern library
 * demonstrating streaming AI/LLM UX patterns for the StreamFlow PM product.
 */
function App(): JSX.Element {
  const [count, setCount] = useState<number>(0);

  return (
    <div style={{
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <h1>Streaming Patterns</h1>
      <p style={{ fontSize: '1.2rem', color: '#666' }}>
        Educational Pattern Library for Streaming AI/LLM UX
      </p>

      <div style={{ marginTop: '2rem' }}>
        <button
          onClick={() => setCount((count) => count + 1)}
          style={{
            fontSize: '1rem',
            padding: '0.75rem 1.5rem',
            cursor: 'pointer',
            borderRadius: '8px',
            border: '1px solid #ddd',
            background: '#fff'
          }}
        >
          Count is {count}
        </button>
      </div>

      <p style={{ marginTop: '2rem', color: '#888', fontSize: '0.9rem' }}>
        Vite + React + TypeScript foundation initialized successfully
      </p>
    </div>
  );
}

export default App;
