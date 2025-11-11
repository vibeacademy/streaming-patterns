/**
 * Tests for Annotated Source Code Viewer Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnnotatedSource } from './AnnotatedSource';
import type { Annotation } from './AnnotatedSource';

// Mock Prism.js
vi.mock('prismjs', () => ({
  default: {
    highlightElement: vi.fn(),
  },
}));

vi.mock('prismjs/components/prism-typescript', () => ({}));
vi.mock('prismjs/components/prism-jsx', () => ({}));
vi.mock('prismjs/components/prism-tsx', () => ({}));
vi.mock('prismjs/themes/prism-tomorrow.css', () => ({}));

describe('AnnotatedSource', () => {
  const sampleCode = `function greet(name: string): string {
  return \`Hello, \${name}!\`;
}`;

  beforeEach(() => {
    // Mock clipboard API
    // eslint-disable-next-line no-undef
    Object.defineProperty(navigator, 'clipboard', {
      writable: true,
      configurable: true,
      value: {
        writeText: vi.fn(() => Promise.resolve()),
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render code with default props', () => {
      render(<AnnotatedSource code={sampleCode} />);

      expect(screen.getByText(/function greet/)).toBeInTheDocument();
    });

    it('should render file name when provided', () => {
      render(<AnnotatedSource code={sampleCode} fileName="greet.ts" />);

      expect(screen.getByText('greet.ts')).toBeInTheDocument();
    });

    it('should render language label', () => {
      render(<AnnotatedSource code={sampleCode} language="typescript" />);

      expect(screen.getByText('typescript')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <AnnotatedSource code={sampleCode} className="custom-class" />
      );

      const containerDiv = container.firstChild as HTMLElement;
      expect(containerDiv.className).toContain('custom-class');
    });

    it('should apply custom maxHeight style', () => {
      const { container } = render(
        <AnnotatedSource code={sampleCode} maxHeight="400px" />
      );

      const codeWrapper = container.querySelector('[style*="max-height"]');
      expect(codeWrapper).toBeInTheDocument();
    });
  });

  describe('Line Numbers', () => {
    it('should render line numbers by default', () => {
      render(<AnnotatedSource code={sampleCode} />);

      // Sample code has 3 lines
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should hide line numbers when showLineNumbers is false', () => {
      const { container } = render(
        <AnnotatedSource code={sampleCode} showLineNumbers={false} />
      );

      const lineNumbers = container.querySelector('.lineNumbers');
      expect(lineNumbers).not.toBeInTheDocument();
    });
  });

  describe('Copy to Clipboard', () => {
    it('should render copy button', () => {
      render(<AnnotatedSource code={sampleCode} />);

      const copyButton = screen.getByRole('button', {
        name: /copy code to clipboard/i,
      });
      expect(copyButton).toBeInTheDocument();
    });
  });

  describe('Annotations', () => {
    const annotations: Annotation[] = [
      {
        line: 1,
        content: 'This function greets a person',
        type: 'info',
      },
      {
        line: 2,
        content: 'Using **template literals** for string interpolation',
        type: 'tip',
      },
    ];

    it('should render annotation toggles', () => {
      render(<AnnotatedSource code={sampleCode} annotations={annotations} />);

      const toggleButtons = screen.getAllByRole('button', {
        name: /expand annotation/i,
      });
      expect(toggleButtons).toHaveLength(2);
    });

    it('should set aria-expanded attribute correctly', async () => {
      const user = userEvent.setup();
      render(<AnnotatedSource code={sampleCode} annotations={annotations} />);

      const toggleButton = screen.getByRole('button', {
        name: /expand annotation for line 1/i,
      });

      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

      await user.click(toggleButton);

      expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible copy button', () => {
      render(<AnnotatedSource code={sampleCode} />);

      const copyButton = screen.getByRole('button', {
        name: /copy code to clipboard/i,
      });
      expect(copyButton).toHaveAttribute('aria-label');
      expect(copyButton).toHaveAttribute('title');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<AnnotatedSource code={sampleCode} annotations={[
        { line: 1, content: 'Test', type: 'info' }
      ]} />);

      // Tab to copy button
      await user.tab();
      expect(screen.getByRole('button', { name: /copy/i })).toHaveFocus();

      // Tab to annotation toggle
      await user.tab();
      const annotationToggle = screen.getByRole('button', {
        name: /expand annotation/i,
      });
      expect(annotationToggle).toHaveFocus();
    });
  });

  describe('Language Support', () => {
    it('should support typescript language', () => {
      const { container } = render(
        <AnnotatedSource code={sampleCode} language="typescript" />
      );

      const code = container.querySelector('code');
      expect(code).toHaveClass('language-typescript');
    });

    it('should support tsx language', () => {
      const { container } = render(
        <AnnotatedSource code={sampleCode} language="tsx" />
      );

      const code = container.querySelector('code');
      expect(code).toHaveClass('language-tsx');
    });

    it('should support javascript language', () => {
      const { container } = render(
        <AnnotatedSource code={sampleCode} language="javascript" />
      );

      const code = container.querySelector('code');
      expect(code).toHaveClass('language-javascript');
    });

    it('should support jsx language', () => {
      const { container } = render(
        <AnnotatedSource code={sampleCode} language="jsx" />
      );

      const code = container.querySelector('code');
      expect(code).toHaveClass('language-jsx');
    });

    it('should default to typescript if no language is specified', () => {
      const { container } = render(<AnnotatedSource code={sampleCode} />);

      const code = container.querySelector('code');
      expect(code).toHaveClass('language-typescript');
    });
  });
});
