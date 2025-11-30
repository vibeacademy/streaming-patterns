/**
 * ScenarioCard Component Tests
 *
 * Tests for the ScenarioCard component that displays business context
 * and scenario descriptions for pattern demos.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScenarioCard } from './ScenarioCard';

describe('ScenarioCard', () => {
  describe('Basic Rendering', () => {
    it('renders with default title', () => {
      render(
        <ScenarioCard description="Test description" />
      );

      expect(screen.getByText('Scenario')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    it('renders with custom title', () => {
      render(
        <ScenarioCard
          title="Custom Title"
          description="Test description"
        />
      );

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    it('renders description text correctly', () => {
      const description = "StreamFlow PM's AI assistant helps plan a 2-week sprint, showing its reasoning process before presenting the final plan.";

      render(<ScenarioCard description={description} />);

      expect(screen.getByText(description)).toBeInTheDocument();
    });
  });

  describe('Prompt Section', () => {
    it('renders prompt when provided', () => {
      const prompt = 'Plan a 2-week sprint for the StreamFlow PM dashboard project';

      render(
        <ScenarioCard
          description="Test description"
          prompt={prompt}
        />
      );

      expect(screen.getByText('Prompt')).toBeInTheDocument();
      expect(screen.getByText(prompt)).toBeInTheDocument();
    });

    it('does not render prompt section when not provided', () => {
      render(<ScenarioCard description="Test description" />);

      expect(screen.queryByText('Prompt')).not.toBeInTheDocument();
    });

    it('renders prompt in code element', () => {
      const prompt = 'Test prompt';

      render(
        <ScenarioCard
          description="Test description"
          prompt={prompt}
        />
      );

      const codeElement = screen.getByText(prompt);
      expect(codeElement.tagName).toBe('CODE');
    });
  });

  describe('Styling', () => {
    it('applies custom className when provided', () => {
      const { container } = render(
        <ScenarioCard
          description="Test description"
          className="custom-class"
        />
      );

      const card = container.querySelector('.custom-class');
      expect(card).toBeInTheDocument();
    });

    it('uses outlined variant from Card component', () => {
      const { container } = render(
        <ScenarioCard description="Test description" />
      );

      // The Card component should be rendered
      // (Variant styling is tested in Card.test.tsx)
      const card = container.firstChild;
      expect(card).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('renders description as paragraph', () => {
      const description = "Test description";

      render(<ScenarioCard description={description} />);

      const paragraph = screen.getByText(description);
      expect(paragraph.tagName).toBe('P');
    });

    it('renders title as heading level 3', () => {
      render(<ScenarioCard description="Test description" />);

      const heading = screen.getByText('Scenario');
      expect(heading.tagName).toBe('H3');
    });

    it('has semantic structure with header and content sections', () => {
      render(
        <ScenarioCard
          description="Test description"
          prompt="Test prompt"
        />
      );

      // Check for heading (header structure)
      const heading = screen.getByText('Scenario');
      expect(heading.tagName).toBe('H3');

      // Check for description and prompt (content structure)
      expect(screen.getByText('Test description')).toBeInTheDocument();
      expect(screen.getByText('Test prompt')).toBeInTheDocument();
    });
  });

  describe('Integration with Pattern Scenarios', () => {
    it('renders Chain of Reasoning scenario correctly', () => {
      const description = "StreamFlow PM's AI assistant helps plan a 2-week sprint, showing its reasoning process before presenting the final plan.";

      render(<ScenarioCard description={description} />);

      expect(screen.getByText(description)).toBeInTheDocument();
    });

    it('renders Tabular Stream View scenario correctly', () => {
      const description = "StreamFlow PM analyzes your engineering team's availability for Q1 2025, streaming results progressively.";

      render(<ScenarioCard description={description} />);

      expect(screen.getByText(description)).toBeInTheDocument();
    });

    it('renders Multi-Turn Memory scenario correctly', () => {
      const description = "StreamFlow PM's agent maintains visible memory across a multi-turn project planning conversation.";

      render(<ScenarioCard description={description} />);

      expect(screen.getByText(description)).toBeInTheDocument();
    });

    it('renders Agent-Await-Prompt scenario correctly', () => {
      const description = "StreamFlow PM discovers missing project metadata during setup and pauses to request it inline.";

      render(<ScenarioCard description={description} />);

      expect(screen.getByText(description)).toBeInTheDocument();
    });

    it('renders Streaming Validation Loop scenario correctly', () => {
      const description = "AI allocates Q1 budget across engineering teams with checkpoint approvals at each decision point.";

      render(<ScenarioCard description={description} />);

      expect(screen.getByText(description)).toBeInTheDocument();
    });

    it('renders Turn-Taking Co-Creation scenario correctly', () => {
      const description = "AI and user collaborate in real-time to co-create a project charter with visible authorship.";

      render(<ScenarioCard description={description} />);

      expect(screen.getByText(description)).toBeInTheDocument();
    });

    it('renders Schema-Governed Exchange scenario correctly', () => {
      const description = "StreamFlow PM validates incoming project setup data against a Zod schema in real-time.";

      render(<ScenarioCard description={description} />);

      expect(screen.getByText(description)).toBeInTheDocument();
    });
  });
});
