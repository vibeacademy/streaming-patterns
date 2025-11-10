/**
 * Tests for JsonViewer component
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { JsonViewer, CompactJsonViewer } from './JsonViewer';

describe('JsonViewer', () => {
  describe('rendering', () => {
    it('should render JSON data', () => {
      const data = { name: 'test', value: 123 };

      render(<JsonViewer data={data} />);

      // Check that the data is rendered (will be in JSON format)
      const pre = document.querySelector('pre');
      expect(pre).toBeTruthy();
      expect(pre?.textContent).toContain('name');
      expect(pre?.textContent).toContain('test');
      expect(pre?.textContent).toContain('value');
      expect(pre?.textContent).toContain('123');
    });

    it('should format JSON with proper indentation', () => {
      const data = {
        nested: {
          object: {
            value: 'test',
          },
        },
      };

      render(<JsonViewer data={data} />);

      const pre = document.querySelector('pre');
      const content = pre?.textContent || '';

      // JSON.stringify with 2-space indent should create multi-line output
      expect(content.split('\n').length).toBeGreaterThan(1);
    });

    it('should handle arrays', () => {
      const data = {
        items: ['a', 'b', 'c'],
      };

      render(<JsonViewer data={data} />);

      const pre = document.querySelector('pre');
      expect(pre?.textContent).toContain('items');
      expect(pre?.textContent).toContain('a');
      expect(pre?.textContent).toContain('b');
      expect(pre?.textContent).toContain('c');
    });

    it('should handle different data types', () => {
      const data = {
        string: 'text',
        number: 42,
        boolean: true,
        nullValue: null,
      };

      render(<JsonViewer data={data} />);

      const pre = document.querySelector('pre');
      const content = pre?.textContent || '';

      expect(content).toContain('text');
      expect(content).toContain('42');
      expect(content).toContain('true');
      expect(content).toContain('null');
    });

    it('should handle empty objects', () => {
      render(<JsonViewer data={{}} />);

      const pre = document.querySelector('pre');
      expect(pre?.textContent).toContain('{}');
    });

    it('should handle primitive values', () => {
      render(<JsonViewer data="simple string" />);

      const pre = document.querySelector('pre');
      expect(pre?.textContent).toContain('simple string');
    });
  });

  describe('error handling', () => {
    it('should handle circular references gracefully', () => {
      const circular: { self?: unknown } = {};
      circular.self = circular;

      render(<JsonViewer data={circular} />);

      const pre = document.querySelector('pre');
      // Should show an error message instead of crashing
      expect(pre?.textContent).toContain('Error');
    });
  });

  describe('expansion', () => {
    it('should respect expanded prop', () => {
      const data = { test: 'data' };

      const { container } = render(<JsonViewer data={data} expanded={true} />);

      const viewer = container.querySelector('.json-viewer');
      const style = viewer?.getAttribute('style');

      expect(style).toContain('max-height: none');
    });

    it('should collapse when expanded is false', () => {
      const data = { test: 'data' };

      const { container } = render(<JsonViewer data={data} expanded={false} />);

      const viewer = container.querySelector('.json-viewer');
      const style = viewer?.getAttribute('style');

      expect(style).toContain('max-height: 200px');
    });
  });

  describe('className prop', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <JsonViewer data={{ test: 'data' }} className="custom-class" />
      );

      const viewer = container.querySelector('.json-viewer');
      expect(viewer?.className).toContain('custom-class');
    });
  });
});

describe('CompactJsonViewer', () => {
  describe('rendering', () => {
    it('should render JSON in compact format', () => {
      const data = { name: 'test', value: 123 };

      render(<CompactJsonViewer data={data} />);

      const code = document.querySelector('code');
      expect(code).toBeTruthy();

      // Should be single-line JSON
      expect(code?.textContent).toContain('name');
      expect(code?.textContent).toContain('test');
    });

    it('should truncate long JSON strings', () => {
      const data = {
        veryLongPropertyName: 'a very long string value that should be truncated',
        anotherProperty: 'more data',
      };

      render(<CompactJsonViewer data={data} maxLength={30} />);

      const code = document.querySelector('code');
      const content = code?.textContent || '';

      expect(content.length).toBeLessThanOrEqual(34); // 30 + '...'
      expect(content).toContain('...');
    });

    it('should not truncate short JSON strings', () => {
      const data = { short: 'val' };

      render(<CompactJsonViewer data={data} maxLength={100} />);

      const code = document.querySelector('code');
      const content = code?.textContent || '';

      expect(content).not.toContain('...');
    });

    it('should handle empty objects', () => {
      render(<CompactJsonViewer data={{}} />);

      const code = document.querySelector('code');
      expect(code?.textContent).toBe('{}');
    });

    it('should handle arrays', () => {
      const data = [1, 2, 3];

      render(<CompactJsonViewer data={data} />);

      const code = document.querySelector('code');
      expect(code?.textContent).toContain('[1,2,3]');
    });
  });

  describe('error handling', () => {
    it('should handle circular references', () => {
      const circular: { self?: unknown } = {};
      circular.self = circular;

      render(<CompactJsonViewer data={circular} />);

      const code = document.querySelector('code');
      expect(code?.textContent).toBe('Error');
    });
  });

  describe('className prop', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <CompactJsonViewer data={{ test: 'data' }} className="custom" />
      );

      const code = container.querySelector('code');
      expect(code?.className).toContain('custom');
    });
  });
});
