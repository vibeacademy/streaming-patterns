/**
 * Pattern Metadata Configuration
 *
 * This file contains unique meta descriptions and titles for each pattern page.
 * These are optimized for SEO (150-155 characters) and target frontend developers
 * building AI-powered applications.
 *
 * Each pattern's metadata includes:
 * - title: Full page title (pattern name + context)
 * - description: SEO-optimized meta description for search results
 * - keywords: Relevant search terms for discoverability
 */

export interface PatternMetadata {
  title: string;
  description: string;
  keywords: string[];
}

export const PATTERN_METADATA: Record<string, PatternMetadata> = {
  'chain-of-reasoning': {
    title:
      'Chain-of-Reasoning Pattern | Streaming AI UX Patterns | StreamFlow PM',
    description:
      'Learn to expose AI reasoning steps in real-time. Interactive React demo shows chain-of-thought streaming for transparent AI decision-making.',
    keywords: [
      'chain of reasoning',
      'reasoning tokens',
      'AI transparency',
      'streaming AI',
      'React patterns',
      'LLM reasoning',
      'chain of thought'
    ]
  },

  'agent-await-prompt': {
    title:
      'Agent-Await-Prompt Pattern | Streaming AI UX Patterns | StreamFlow PM',
    description:
      'Build AI agents that pause for user input mid-stream. React demo teaches async prompt collection during LLM streaming workflows.',
    keywords: [
      'agent await prompt',
      'async user input',
      'streaming pause',
      'AI agents',
      'React streaming',
      'interactive AI',
      'mid-stream input'
    ]
  },

  'tabular-stream-view': {
    title:
      'Tabular Stream View Pattern | Streaming AI UX Patterns | StreamFlow PM',
    description:
      'Stream structured data into live-updating tables. React demo shows progressive table rendering for AI-generated datasets and reports.',
    keywords: [
      'tabular streaming',
      'streaming table',
      'live data table',
      'React table',
      'AI data streams',
      'structured streaming',
      'progressive rendering'
    ]
  },

  'multi-turn-memory': {
    title:
      'Multi-Turn Memory Timeline | Streaming AI UX Patterns | StreamFlow PM',
    description:
      'Visualize AI conversation memory with timeline UI. React demo teaches context management for multi-turn LLM interactions.',
    keywords: [
      'multi-turn memory',
      'conversation timeline',
      'AI memory',
      'chat history',
      'React chat',
      'LLM context',
      'conversational AI'
    ]
  },

  'turn-taking-co-creation': {
    title:
      'Turn-Taking Co-Creation Pattern | Streaming AI UX Patterns | StreamFlow PM',
    description:
      'Orchestrate human-AI collaboration workflows. React demo shows turn-based editing for co-creating content with AI assistance.',
    keywords: [
      'turn taking',
      'co-creation',
      'human AI collaboration',
      'collaborative editing',
      'React workflow',
      'AI assisted editing',
      'bidirectional flow'
    ]
  },

  'streaming-validation-loop': {
    title:
      'Streaming Validation Loop | Streaming AI UX Patterns | StreamFlow PM',
    description:
      'Handle AI output validation in real-time. React demo teaches error recovery patterns for streaming LLM responses with validation.',
    keywords: [
      'streaming validation',
      'error recovery',
      'AI validation',
      'schema validation',
      'React error handling',
      'LLM validation',
      'validation loop'
    ]
  },

  'schema-governed-exchange': {
    title:
      'Schema-Governed Exchange | Streaming AI UX Patterns | StreamFlow PM',
    description:
      'Enforce structured AI output with JSON schemas. React demo shows type-safe streaming for predictable LLM data exchange patterns.',
    keywords: [
      'schema governance',
      'structured output',
      'JSON schema',
      'type safe streaming',
      'React TypeScript',
      'LLM schemas',
      'structured AI'
    ]
  }
};

/**
 * Get metadata for a specific pattern
 *
 * @param patternId - The pattern identifier (e.g., 'chain-of-reasoning')
 * @returns Pattern metadata or default metadata if pattern not found
 */
export function getPatternMetadata(patternId: string): PatternMetadata {
  return (
    PATTERN_METADATA[patternId] || {
      title: 'Streaming Patterns - Educational Library for AI/LLM UX',
      description:
        'Learn production-ready streaming interface patterns for AI applications with interactive demos and annotated source code.',
      keywords: [
        'streaming patterns',
        'AI UX',
        'LLM interfaces',
        'React patterns'
      ]
    }
  );
}

/**
 * Get the full canonical URL for a pattern page
 *
 * @param patternId - The pattern identifier (e.g., 'chain-of-reasoning')
 * @returns Full canonical URL for the pattern
 */
export function getPatternCanonicalUrl(patternId: string): string {
  return `https://streamingpatterns.com/patterns/${patternId}`;
}

/**
 * Get the Open Graph image URL
 * Currently uses the default OG image, but could be customized per pattern in the future
 *
 * @returns URL to the OG image
 */
export function getPatternOgImage(): string {
  return 'https://streamingpatterns.com/og-image.png';
}
