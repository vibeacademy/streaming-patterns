/**
 * Test suite for App component with routing
 *
 * Tests the main App component with React Router integration,
 * verifying navigation and route handling.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  describe('routing', () => {
    it('renders the home page by default', () => {
      render(<App />);

      // Check for home page content
      const heading = screen.getByRole('heading', { name: /streaming patterns/i, level: 1 });
      expect(heading).toBeInTheDocument();

      const subtitle = screen.getByText(/Educational Pattern Library for Streaming AI\/LLM UX/i);
      expect(subtitle).toBeInTheDocument();
    });

    it('renders AppShell with navigation', () => {
      render(<App />);

      // Check for navigation links
      const homeLink = screen.getByRole('link', { name: /^home$/i });
      expect(homeLink).toBeInTheDocument();

      const patternsLink = screen.getByRole('link', { name: /^patterns$/i });
      expect(patternsLink).toBeInTheDocument();

      const githubLink = screen.getByRole('link', { name: /github/i });
      expect(githubLink).toBeInTheDocument();
    });

    it('displays StreamFlow PM branding', () => {
      render(<App />);

      // Check for logo heading in header
      const logoHeading = screen.getByRole('heading', { name: /StreamFlow PM/i, level: 1 });
      expect(logoHeading).toBeInTheDocument();
    });

    it('displays footer content', () => {
      render(<App />);

      // Check for footer
      const footerText = screen.getByText(/Streaming Patterns Library/i);
      expect(footerText).toBeInTheDocument();

      const copyright = screen.getByText(/StreamFlow PM. MIT License/i);
      expect(copyright).toBeInTheDocument();
    });
  });

  describe('home page content', () => {
    it('displays available patterns section', () => {
      render(<App />);

      const heading = screen.getByRole('heading', { name: /available patterns/i });
      expect(heading).toBeInTheDocument();
    });

    it('displays Chain-of-Reasoning pattern card', () => {
      render(<App />);

      const patternTitle = screen.getByText(/chain-of-reasoning guide/i);
      expect(patternTitle).toBeInTheDocument();

      const patternDescription = screen.getByText(/expose intermediate reasoning tokens/i);
      expect(patternDescription).toBeInTheDocument();
    });

    it('displays about section', () => {
      render(<App />);

      const aboutHeading = screen.getByRole('heading', { name: /about this library/i });
      expect(aboutHeading).toBeInTheDocument();

      const educationalTitle = screen.getByRole('heading', { name: /educational focus/i });
      expect(educationalTitle).toBeInTheDocument();

      const mockStreamingTitle = screen.getByRole('heading', { name: /mock streaming/i });
      expect(mockStreamingTitle).toBeInTheDocument();

      const productionTitle = screen.getByRole('heading', { name: /production ready/i });
      expect(productionTitle).toBeInTheDocument();
    });

    it('has a link to the chain-of-reasoning pattern', () => {
      render(<App />);

      const patternLink = screen.getByRole('link', { name: /chain-of-reasoning guide/i });
      expect(patternLink).toBeInTheDocument();
      expect(patternLink).toHaveAttribute('href', '/patterns/chain-of-reasoning');
    });
  });
});
