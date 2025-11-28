/**
 * Tests for Patterns catalog page
 */

import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Patterns } from './Patterns';

/**
 * Test wrapper with Router
 */
function renderWithRouter(component: React.ReactElement): ReturnType<typeof render> {
  return render(<BrowserRouter>{component}</BrowserRouter>);
}

describe('Patterns Page', () => {
  describe('Page Structure', () => {
    it('should render the main heading', () => {
      renderWithRouter(<Patterns />);
      expect(
        screen.getByRole('heading', { name: /streaming patterns catalog/i })
      ).toBeInTheDocument();
    });

    it('should render the page description', () => {
      renderWithRouter(<Patterns />);
      expect(
        screen.getByText(/educational patterns for building modern streaming AI interfaces/i)
      ).toBeInTheDocument();
    });

    it('should have main landmark role', () => {
      renderWithRouter(<Patterns />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Foundational Patterns Section', () => {
    it('should render Foundational Patterns section heading', () => {
      renderWithRouter(<Patterns />);
      expect(
        screen.getByRole('heading', { name: /foundational patterns/i })
      ).toBeInTheDocument();
    });

    it('should render section description for foundational patterns', () => {
      renderWithRouter(<Patterns />);
      expect(
        screen.getByText(/core patterns that establish the basics of streaming ux/i)
      ).toBeInTheDocument();
    });

    it('should render all 3 foundational patterns', () => {
      renderWithRouter(<Patterns />);

      // Check for foundational pattern titles
      expect(screen.getByText('Chain-of-Reasoning Guide')).toBeInTheDocument();
      expect(screen.getByText('Agent-Await-Prompt')).toBeInTheDocument();
      expect(screen.getByText('Tabular Stream View')).toBeInTheDocument();
    });

    it('should display Chain-of-Reasoning as available', () => {
      renderWithRouter(<Patterns />);

      const chainCard = screen.getByText('Chain-of-Reasoning Guide').closest('div');
      expect(chainCard).toBeInTheDocument();
      if (chainCard) {
        expect(within(chainCard).getByText(/✓ available/i)).toBeInTheDocument();
      }
    });

    it('should display Agent-Await-Prompt as available', () => {
      renderWithRouter(<Patterns />);

      const agentCard = screen.getByText('Agent-Await-Prompt').closest('div');
      expect(agentCard).toBeInTheDocument();
      if (agentCard) {
        expect(within(agentCard).getByText(/✓ available/i)).toBeInTheDocument();
      }
    });

    it('should display Tabular Stream View as available', () => {
      renderWithRouter(<Patterns />);

      const tabularCard = screen.getByText('Tabular Stream View').closest('div');
      expect(tabularCard).toBeInTheDocument();
      if (tabularCard) {
        expect(within(tabularCard).getByText(/✓ available/i)).toBeInTheDocument();
      }
    });
  });

  describe('Advanced Patterns Section', () => {
    it('should render Advanced Patterns section heading', () => {
      renderWithRouter(<Patterns />);
      expect(
        screen.getByRole('heading', { name: /advanced patterns/i })
      ).toBeInTheDocument();
    });

    it('should render section description for advanced patterns', () => {
      renderWithRouter(<Patterns />);
      expect(
        screen.getByText(/complex patterns for stateful interactions/i)
      ).toBeInTheDocument();
    });

    it('should render all 4 advanced patterns', () => {
      renderWithRouter(<Patterns />);

      // Check for advanced pattern titles
      expect(screen.getByText('Multi-Turn Memory Timeline')).toBeInTheDocument();
      expect(screen.getByText('Turn-Taking Co-Creation')).toBeInTheDocument();
      expect(screen.getByText('Streaming Validation Loop')).toBeInTheDocument();
      expect(screen.getByText('Schema-Governed Exchange')).toBeInTheDocument();
    });

    it('should display Multi-Turn Memory Timeline as available', () => {
      renderWithRouter(<Patterns />);

      const memoryCard = screen.getByText('Multi-Turn Memory Timeline').closest('div');
      expect(memoryCard).toBeInTheDocument();
      if (memoryCard) {
        expect(within(memoryCard).getByText(/✓ available/i)).toBeInTheDocument();
      }
    });

    it('should display Turn-Taking Co-Creation as available', () => {
      renderWithRouter(<Patterns />);

      const turnTakingCard = screen.getByText('Turn-Taking Co-Creation').closest('div');
      expect(turnTakingCard).toBeInTheDocument();
      if (turnTakingCard) {
        expect(within(turnTakingCard).getByText(/✓ available/i)).toBeInTheDocument();
      }
    });

    it('should display other advanced patterns as coming soon', () => {
      renderWithRouter(<Patterns />);

      const schemaGovernedCard = screen.getByText('Schema-Governed Exchange').closest('div');
      expect(schemaGovernedCard).toBeInTheDocument();
      if (schemaGovernedCard) {
        expect(within(schemaGovernedCard).getByText(/coming soon/i)).toBeInTheDocument();
      }
    });
  });

  describe('Pattern Card Content', () => {
    it('should display pattern description', () => {
      renderWithRouter(<Patterns />);
      expect(
        screen.getByText(/expose intermediate reasoning tokens to build user trust/i)
      ).toBeInTheDocument();
    });

    it('should display demo scenario', () => {
      renderWithRouter(<Patterns />);
      expect(screen.getByText(/AI Sprint Planning Assistant/i)).toBeInTheDocument();
    });

    it('should display difficulty indicator', () => {
      renderWithRouter(<Patterns />);
      // Multiple foundational patterns exist, so use getAllByText
      const difficultyBadges = screen.getAllByText(/^foundational$/i);
      expect(difficultyBadges.length).toBeGreaterThan(0);
    });

    it('should display key concepts', () => {
      renderWithRouter(<Patterns />);
      // Key concepts are comma-separated in conceptsList span
      expect(screen.getByText(/streaming reasoning, transparency, trust building/i)).toBeInTheDocument();
    });

    it('should show "View Demo" CTA for available patterns', () => {
      renderWithRouter(<Patterns />);
      const chainCard = screen.getByText('Chain-of-Reasoning Guide').closest('a');
      expect(chainCard).toHaveTextContent(/view demo/i);
    });

    it('should show "View Demo" CTA for Agent-Await-Prompt', () => {
      renderWithRouter(<Patterns />);
      const agentCard = screen.getByText('Agent-Await-Prompt').closest('a');
      expect(agentCard).toHaveTextContent(/view demo/i);
    });

    it('should show "View Demo" CTA for Tabular Stream View', () => {
      renderWithRouter(<Patterns />);
      const tabularCard = screen.getByText('Tabular Stream View').closest('a');
      expect(tabularCard).toHaveTextContent(/view demo/i);
    });

    it('should show "View Demo" CTA for Multi-Turn Memory Timeline', () => {
      renderWithRouter(<Patterns />);
      const memoryCard = screen.getByText('Multi-Turn Memory Timeline').closest('a');
      expect(memoryCard).toHaveTextContent(/view demo/i);
    });

    it('should show "View Demo" CTA for Turn-Taking Co-Creation', () => {
      renderWithRouter(<Patterns />);
      const turnTakingCard = screen.getByText('Turn-Taking Co-Creation').closest('a');
      expect(turnTakingCard).toHaveTextContent(/view demo/i);
    });

    it('should not show "View Demo" CTA for coming soon patterns', () => {
      renderWithRouter(<Patterns />);
      const streamingValidationCard = screen.getByText('Streaming Validation Loop').closest('div');
      expect(streamingValidationCard).not.toHaveTextContent(/view demo/i);
    });
  });

  describe('Navigation Links', () => {
    it('should have a clickable link for available patterns', () => {
      renderWithRouter(<Patterns />);
      const link = screen.getByRole('link', { name: /view chain-of-reasoning guide demo/i });
      expect(link).toHaveAttribute('href', '/patterns/chain-of-reasoning');
    });

    it('should have a clickable link for Agent-Await-Prompt', () => {
      renderWithRouter(<Patterns />);
      const link = screen.getByRole('link', { name: /view agent-await-prompt demo/i });
      expect(link).toHaveAttribute('href', '/patterns/agent-await-prompt');
    });

    it('should have a clickable link for Tabular Stream View', () => {
      renderWithRouter(<Patterns />);
      const link = screen.getByRole('link', { name: /view tabular stream view demo/i });
      expect(link).toHaveAttribute('href', '/patterns/tabular-stream-view');
    });

    it('should have a clickable link for Multi-Turn Memory Timeline', () => {
      renderWithRouter(<Patterns />);
      const link = screen.getByRole('link', { name: /view multi-turn memory timeline demo/i });
      expect(link).toHaveAttribute('href', '/patterns/multi-turn-memory');
    });

    it('should have a clickable link for Turn-Taking Co-Creation', () => {
      renderWithRouter(<Patterns />);
      const link = screen.getByRole('link', { name: /view turn-taking co-creation demo/i });
      expect(link).toHaveAttribute('href', '/patterns/turn-taking-co-creation');
    });

    it('should not have links for coming soon patterns', () => {
      renderWithRouter(<Patterns />);
      const schemaGovernedTitle = screen.getByText('Schema-Governed Exchange');
      const schemaGovernedCard = schemaGovernedTitle.closest('a');
      expect(schemaGovernedCard).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      renderWithRouter(<Patterns />);

      // h1 for main title
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        /streaming patterns catalog/i
      );

      // h2 for section titles
      const h2Headings = screen.getAllByRole('heading', { level: 2 });
      expect(h2Headings).toHaveLength(2);
      expect(h2Headings[0]).toHaveTextContent(/foundational patterns/i);
      expect(h2Headings[1]).toHaveTextContent(/advanced patterns/i);
    });

    it('should have section headings with proper aria-labelledby', () => {
      renderWithRouter(<Patterns />);

      const foundationalSection = screen
        .getByRole('heading', { name: /foundational patterns/i })
        .closest('section');
      expect(foundationalSection).toHaveAttribute(
        'aria-labelledby',
        'foundational-heading'
      );

      const advancedSection = screen
        .getByRole('heading', { name: /advanced patterns/i })
        .closest('section');
      expect(advancedSection).toHaveAttribute(
        'aria-labelledby',
        'advanced-heading'
      );
    });

    it('should have aria-label on status badges', () => {
      renderWithRouter(<Patterns />);

      const availableBadges = screen.getAllByLabelText(/available now/i);
      expect(availableBadges.length).toBe(6); // Chain-of-Reasoning, Agent-Await-Prompt, Tabular Stream View, Multi-Turn Memory Timeline, Turn-Taking Co-Creation, and Streaming Validation Loop

      const comingSoonBadges = screen.getAllByLabelText(/coming soon/i);
      expect(comingSoonBadges.length).toBe(1); // Schema-Governed Exchange
    });

    it('should have aria-label on pattern links', () => {
      renderWithRouter(<Patterns />);

      const link = screen.getByRole('link', {
        name: /view chain-of-reasoning guide demo/i
      });
      expect(link).toBeInTheDocument();
    });

    it('should mark coming soon cards as disabled', () => {
      renderWithRouter(<Patterns />);

      // Coming soon patterns are wrapped in divs with aria-disabled
      const schemaGovernedTitle = screen.getByText('Schema-Governed Exchange');
      const schemaGovernedContainer = schemaGovernedTitle.closest('[aria-disabled="true"]');
      expect(schemaGovernedContainer).toBeInTheDocument();
    });

    it('should use semantic list markup for pattern grids', () => {
      renderWithRouter(<Patterns />);

      const lists = screen.getAllByRole('list');
      expect(lists).toHaveLength(2); // Foundational and Advanced sections

      // Each list should have multiple listitems
      lists.forEach((list) => {
        const items = within(list).getAllByRole('listitem');
        expect(items.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Pattern Data Completeness', () => {
    it('should render exactly 7 patterns total', () => {
      renderWithRouter(<Patterns />);

      // Count all pattern titles (h3 headings)
      const patternTitles = screen.getAllByRole('heading', { level: 3 });
      expect(patternTitles).toHaveLength(7);
    });

    it('should have 3 foundational patterns', () => {
      renderWithRouter(<Patterns />);

      const foundationalSection = screen
        .getByRole('heading', { name: /foundational patterns/i })
        .closest('section');

      if (foundationalSection) {
        const foundationalCards = within(foundationalSection).getAllByRole('listitem');
        expect(foundationalCards).toHaveLength(3);
      }
    });

    it('should have 4 advanced patterns', () => {
      renderWithRouter(<Patterns />);

      const advancedSection = screen
        .getByRole('heading', { name: /advanced patterns/i })
        .closest('section');

      if (advancedSection) {
        const advancedCards = within(advancedSection).getAllByRole('listitem');
        expect(advancedCards).toHaveLength(4);
      }
    });
  });

  describe('Responsive Behavior', () => {
    it('should render all patterns in a grid layout', () => {
      renderWithRouter(<Patterns />);

      const grids = screen.getAllByRole('list');
      expect(grids).toHaveLength(2);

      // Check that grids have the appropriate CSS module class
      grids.forEach((grid) => {
        expect(grid.className).toContain('patternGrid');
      });
    });
  });
});
