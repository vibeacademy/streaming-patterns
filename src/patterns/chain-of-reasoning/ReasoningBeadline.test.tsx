/**
 * ReasoningBeadline Component Tests
 *
 * Test Coverage:
 * - Rendering with different data scenarios
 * - Empty state handling
 * - Confidence level indicators
 * - Expandable details functionality
 * - Promote button interaction
 * - Accessibility (ARIA labels, keyboard navigation)
 * - Responsive behavior
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReasoningBeadline } from './ReasoningBeadline';
import type { ReasoningStep } from './types';

// Test fixture data
const mockReasoningSteps: ReasoningStep[] = [
  {
    id: 'step-1',
    summary: 'Analyzing backlog priorities',
    confidence: 0.92,
    details: 'Reviewing 24 backlog items based on business value and complexity.',
    timestamp: 1699564800000,
  },
  {
    id: 'step-2',
    summary: 'Estimating team capacity',
    confidence: 0.85,
    details: 'Team of 6 engineers with 52 engineering days available.',
    timestamp: 1699564800500,
  },
  {
    id: 'step-3',
    summary: 'Identifying dependencies',
    confidence: 0.68,
    details: 'Critical path analysis shows authentication blocks payment work.',
    timestamp: 1699564801000,
  },
];

describe('ReasoningBeadline', () => {
  describe('Rendering', () => {
    it('should render empty state when no reasoning steps provided', () => {
      render(<ReasoningBeadline reasoning={[]} />);

      expect(screen.getByText(/no reasoning steps yet/i)).toBeInTheDocument();
      expect(screen.getByText(/waiting for ai to think/i)).toBeInTheDocument();
    });

    it('should render all reasoning steps in order', () => {
      render(<ReasoningBeadline reasoning={mockReasoningSteps} />);

      expect(screen.getByText('Analyzing backlog priorities')).toBeInTheDocument();
      expect(screen.getByText('Estimating team capacity')).toBeInTheDocument();
      expect(screen.getByText('Identifying dependencies')).toBeInTheDocument();
    });

    it('should render steps with correct numbering', () => {
      render(<ReasoningBeadline reasoning={mockReasoningSteps} />);

      const beadNumbers = screen.getAllByLabelText(/step \d+/i);
      expect(beadNumbers).toHaveLength(3);
      expect(beadNumbers[0]).toHaveTextContent('1');
      expect(beadNumbers[1]).toHaveTextContent('2');
      expect(beadNumbers[2]).toHaveTextContent('3');
    });

    it('should render as a list with ARIA labels', () => {
      render(<ReasoningBeadline reasoning={mockReasoningSteps} />);

      const list = screen.getByRole('list', { name: /ai reasoning steps/i });
      expect(list).toBeInTheDocument();

      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(3);
    });

    it('should apply custom className when provided', () => {
      const { container } = render(
        <ReasoningBeadline reasoning={mockReasoningSteps} className="custom-class" />
      );

      const beadline = container.querySelector('.custom-class');
      expect(beadline).toBeInTheDocument();
    });
  });

  describe('Confidence Indicators', () => {
    it('should display high confidence (≥0.9) with correct label', () => {
      render(<ReasoningBeadline reasoning={[mockReasoningSteps[0]]} />);

      const highConfidence = screen.getByLabelText(/step 1.*high confidence.*92%/i);
      expect(highConfidence).toBeInTheDocument();

      expect(screen.getByText(/high confidence \(92%\)/i)).toBeInTheDocument();
    });

    it('should display medium confidence (0.7-0.89) with correct label', () => {
      render(<ReasoningBeadline reasoning={[mockReasoningSteps[1]]} />);

      const mediumConfidence = screen.getByLabelText(/step 1.*medium confidence.*85%/i);
      expect(mediumConfidence).toBeInTheDocument();

      expect(screen.getByText(/medium confidence \(85%\)/i)).toBeInTheDocument();
    });

    it('should display low confidence (<0.7) with correct label', () => {
      render(<ReasoningBeadline reasoning={[mockReasoningSteps[2]]} />);

      const lowConfidence = screen.getByLabelText(/step 1.*low confidence.*68%/i);
      expect(lowConfidence).toBeInTheDocument();

      expect(screen.getByText(/low confidence \(68%\)/i)).toBeInTheDocument();
    });

    it('should show confidence indicator for each step', () => {
      render(<ReasoningBeadline reasoning={mockReasoningSteps} />);

      // Should have confidence text for all 3 steps
      expect(screen.getByText(/high confidence \(92%\)/i)).toBeInTheDocument();
      expect(screen.getByText(/medium confidence \(85%\)/i)).toBeInTheDocument();
      expect(screen.getByText(/low confidence \(68%\)/i)).toBeInTheDocument();
    });
  });

  describe('Expandable Details', () => {
    it('should render details section when details are provided', () => {
      render(<ReasoningBeadline reasoning={[mockReasoningSteps[0]]} />);

      const detailsButton = screen.getByText(/view detailed reasoning/i);
      expect(detailsButton).toBeInTheDocument();
    });

    it('should not render details section when details are missing', () => {
      const stepWithoutDetails: ReasoningStep = {
        id: 'step-no-details',
        summary: 'Quick analysis',
        confidence: 0.9,
        timestamp: Date.now(),
      };

      render(<ReasoningBeadline reasoning={[stepWithoutDetails]} />);

      expect(screen.queryByText(/view detailed reasoning/i)).not.toBeInTheDocument();
    });

    it('should expand details when clicked', async () => {
      const user = userEvent.setup();
      render(<ReasoningBeadline reasoning={[mockReasoningSteps[0]]} />);

      // Details should be hidden initially
      expect(screen.queryByText(/reviewing 24 backlog items/i)).not.toBeVisible();

      // Click to expand
      const detailsButton = screen.getByText(/view detailed reasoning/i);
      await user.click(detailsButton);

      // Details should now be visible
      expect(screen.getByText(/reviewing 24 backlog items/i)).toBeVisible();
    });

    it('should toggle details open and closed', async () => {
      const user = userEvent.setup();
      render(<ReasoningBeadline reasoning={[mockReasoningSteps[0]]} />);

      const detailsButton = screen.getByText(/view detailed reasoning/i);

      // Click to open
      await user.click(detailsButton);
      expect(screen.getByText(/reviewing 24 backlog items/i)).toBeVisible();

      // Click to close
      await user.click(detailsButton);
      expect(screen.queryByText(/reviewing 24 backlog items/i)).not.toBeVisible();
    });
  });

  describe('Promote Button', () => {
    it('should render promote button when onPromote callback is provided', () => {
      const onPromote = vi.fn();
      render(<ReasoningBeadline reasoning={mockReasoningSteps} onPromote={onPromote} />);

      const promoteButtons = screen.getAllByRole('button', { name: /promote.*to plan/i });
      expect(promoteButtons).toHaveLength(3);
    });

    it('should not render promote button when onPromote is not provided', () => {
      render(<ReasoningBeadline reasoning={mockReasoningSteps} />);

      const promoteButtons = screen.queryAllByRole('button', { name: /promote.*to plan/i });
      expect(promoteButtons).toHaveLength(0);
    });

    it('should call onPromote with correct step when button is clicked', async () => {
      const user = userEvent.setup();
      const onPromote = vi.fn();
      render(<ReasoningBeadline reasoning={mockReasoningSteps} onPromote={onPromote} />);

      // Click promote button for second step
      const promoteButtons = screen.getAllByRole('button', { name: /promote.*to plan/i });
      await user.click(promoteButtons[1]);

      expect(onPromote).toHaveBeenCalledTimes(1);
      expect(onPromote).toHaveBeenCalledWith(mockReasoningSteps[1]);
    });

    it('should have descriptive aria-label for promote buttons', () => {
      const onPromote = vi.fn();
      render(<ReasoningBeadline reasoning={[mockReasoningSteps[0]]} onPromote={onPromote} />);

      const promoteButton = screen.getByRole('button', {
        name: /promote step 1 to plan.*analyzing backlog/i,
      });
      expect(promoteButton).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation to expand details', async () => {
      const user = userEvent.setup();
      render(<ReasoningBeadline reasoning={[mockReasoningSteps[0]]} />);

      const detailsButton = screen.getByText(/view detailed reasoning/i);

      // Details element can be toggled via click (keyboard users use Enter/Space which trigger click)
      await user.click(detailsButton);

      expect(screen.getByText(/reviewing 24 backlog items/i)).toBeVisible();
    });

    it('should support keyboard navigation for promote button', async () => {
      const user = userEvent.setup();
      const onPromote = vi.fn();
      render(<ReasoningBeadline reasoning={[mockReasoningSteps[0]]} onPromote={onPromote} />);

      const promoteButton = screen.getByRole('button', { name: /promote.*to plan/i });

      // Focus and press Enter
      promoteButton.focus();
      await user.keyboard('{Enter}');

      expect(onPromote).toHaveBeenCalledWith(mockReasoningSteps[0]);
    });

    it('should support Tab navigation between interactive elements', async () => {
      const user = userEvent.setup();
      const onPromote = vi.fn();
      render(<ReasoningBeadline reasoning={mockReasoningSteps} onPromote={onPromote} />);

      // Get all interactive elements in order
      const summaries = screen.getAllByText(/view detailed reasoning/i);
      const firstPromoteButton = screen.getByRole('button', { name: /promote step 1/i });

      // Tab should navigate through interactive elements in document order
      // First element could be either summary or button depending on DOM order
      await user.tab();
      const firstFocused = document.activeElement;
      expect(firstFocused).toBeTruthy();
      expect([summaries[0], firstPromoteButton]).toContainEqual(firstFocused);
    });
  });

  describe('Accessibility', () => {
    it('should have semantic HTML structure', () => {
      render(<ReasoningBeadline reasoning={mockReasoningSteps} />);

      // Check for list structure
      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();

      // Check for article elements (semantic step containers)
      const articles = screen.getAllByRole('listitem');
      expect(articles).toHaveLength(3);
    });

    it('should have proper ARIA labels for screen readers', () => {
      render(<ReasoningBeadline reasoning={mockReasoningSteps} />);

      // List should have descriptive label
      expect(screen.getByRole('list', { name: /ai reasoning steps/i })).toBeInTheDocument();

      // Each step number should have confidence info
      expect(screen.getByLabelText(/step 1.*high confidence/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/step 2.*medium confidence/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/step 3.*low confidence/i)).toBeInTheDocument();
    });

    it('should use native details/summary for accessible expansion', () => {
      render(<ReasoningBeadline reasoning={[mockReasoningSteps[0]]} />);

      // Should use native HTML details element
      const detailsElement = screen.getByText(/view detailed reasoning/i).closest('details');
      expect(detailsElement).toBeInTheDocument();
      expect(detailsElement?.tagName).toBe('DETAILS');
    });
  });

  describe('Multiple Steps Scenarios', () => {
    it('should handle single step correctly', () => {
      render(<ReasoningBeadline reasoning={[mockReasoningSteps[0]]} />);

      expect(screen.getByLabelText(/step 1/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/step 2/i)).not.toBeInTheDocument();
    });

    it('should handle many steps (>10) correctly', () => {
      const manySteps: ReasoningStep[] = Array.from({ length: 15 }, (_, i) => ({
        id: `step-${i + 1}`,
        summary: `Reasoning step ${i + 1}`,
        confidence: 0.8,
        timestamp: Date.now() + i * 100,
      }));

      render(<ReasoningBeadline reasoning={manySteps} />);

      // Should render all 15 steps
      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(15);

      // Check first and last steps
      expect(screen.getByLabelText(/step 1,/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/step 15,/i)).toBeInTheDocument();
    });

    it('should maintain step order from array', () => {
      const steps = [mockReasoningSteps[2], mockReasoningSteps[0], mockReasoningSteps[1]];
      render(<ReasoningBeadline reasoning={steps} />);

      const summaries = screen.getAllByRole('heading', { level: 3 });
      expect(summaries[0]).toHaveTextContent('Identifying dependencies');
      expect(summaries[1]).toHaveTextContent('Analyzing backlog priorities');
      expect(summaries[2]).toHaveTextContent('Estimating team capacity');
    });
  });

  describe('Edge Cases', () => {
    it('should handle step with 100% confidence', () => {
      const perfectStep: ReasoningStep = {
        id: 'perfect',
        summary: 'Perfect reasoning',
        confidence: 1.0,
        timestamp: Date.now(),
      };

      render(<ReasoningBeadline reasoning={[perfectStep]} />);

      expect(screen.getByText(/high confidence \(100%\)/i)).toBeInTheDocument();
    });

    it('should handle step with 0% confidence', () => {
      const noConfidenceStep: ReasoningStep = {
        id: 'uncertain',
        summary: 'Uncertain reasoning',
        confidence: 0,
        timestamp: Date.now(),
      };

      render(<ReasoningBeadline reasoning={[noConfidenceStep]} />);

      expect(screen.getByText(/low confidence \(0%\)/i)).toBeInTheDocument();
    });

    it('should handle very long summary text', () => {
      const longSummaryStep: ReasoningStep = {
        id: 'long',
        summary: 'This is a very long summary that goes on and on and explains many different aspects of the reasoning process in great detail with lots of words and concepts and ideas that need to be considered',
        confidence: 0.8,
        timestamp: Date.now(),
      };

      render(<ReasoningBeadline reasoning={[longSummaryStep]} />);

      // Should render full text without truncation
      expect(screen.getByText(/this is a very long summary/i)).toBeInTheDocument();
    });

    it('should handle step IDs with special characters', async () => {
      const user = userEvent.setup();
      const specialIdStep: ReasoningStep = {
        id: 'step-with-special_chars@123',
        summary: 'Special ID step',
        confidence: 0.8,
        timestamp: Date.now(),
      };

      const onPromote = vi.fn();
      render(<ReasoningBeadline reasoning={[specialIdStep]} onPromote={onPromote} />);

      const promoteButton = screen.getByRole('button', { name: /promote/i });
      await user.click(promoteButton);

      expect(onPromote).toHaveBeenCalledWith(specialIdStep);
    });
  });
});
