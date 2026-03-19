import { describe, it, expect, vi, beforeEach } from 'vite-plus/test';
import {
  findNextCard,
  scanForWork,
  formatCompletionSummary,
  formatScanningStatus,
  formatStartingCard,
  formatNoMoreCards,
  formatQueueStatus,
  type CardForWork,
} from './continuation.js';
import type { FizzyClient } from '@fizzy-do-mcp/client';

// Create a fully mocked FizzyClient
function createMockClient() {
  return {
    cards: {
      list: vi.fn(),
      getByNumber: vi.fn(),
    },
  } as unknown as FizzyClient & {
    cards: {
      list: ReturnType<typeof vi.fn>;
      getByNumber: ReturnType<typeof vi.fn>;
    };
  };
}

// Minimal mock card for list results
function mockCardSummary(data: { number: number; title: string; tags: string[] }) {
  return data;
}

// Full mock card for getByNumber results
function mockCard(data: {
  number: number;
  title: string;
  description?: string | null;
  tags: string[];
  closed: boolean;
  columnName: string;
}) {
  return {
    number: data.number,
    title: data.title,
    description: data.description ?? null,
    tags: data.tags,
    closed: data.closed,
    column: {
      id: 'col-1',
      name: data.columnName,
      created_at: '2024-01-01T00:00:00Z',
      color: { name: 'blue', value: '#3b82f6' },
    },
  };
}

describe('continuation', () => {
  let mockClient: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockClient();
  });

  describe('findNextCard', () => {
    it('returns null when no cards are found', async () => {
      mockClient.cards.list.mockResolvedValue({ ok: true, value: [] });

      const result = await findNextCard(mockClient, 'board-123');

      expect(result).toBeNull();
    });

    it('returns null when card list fails', async () => {
      mockClient.cards.list.mockResolvedValue({
        ok: false,
        error: { code: 'NETWORK_ERROR', message: 'Failed' },
      });

      const result = await findNextCard(mockClient, 'board-123');

      expect(result).toBeNull();
    });

    it('finds the next ai-code card in Accepted column', async () => {
      mockClient.cards.list.mockResolvedValue({
        ok: true,
        value: [mockCardSummary({ number: 42, title: 'Test card', tags: ['ai-code'] })],
      });

      mockClient.cards.getByNumber.mockResolvedValue({
        ok: true,
        value: mockCard({
          number: 42,
          title: 'Test card',
          description: 'Test description',
          tags: ['ai-code'],
          closed: false,
          columnName: 'Accepted',
        }),
      });

      const result = await findNextCard(mockClient, 'board-123');

      expect(result).toEqual({
        number: 42,
        title: 'Test card',
        description: 'Test description',
        tags: ['ai-code'],
        mode: 'ai-code',
      });
    });

    it('finds the next ai-plan card in To Do column', async () => {
      mockClient.cards.list.mockResolvedValue({
        ok: true,
        value: [mockCardSummary({ number: 99, title: 'Plan task', tags: ['ai-plan'] })],
      });

      mockClient.cards.getByNumber.mockResolvedValue({
        ok: true,
        value: mockCard({
          number: 99,
          title: 'Plan task',
          description: null,
          tags: ['ai-plan'],
          closed: false,
          columnName: 'To Do',
        }),
      });

      const result = await findNextCard(mockClient, 'board-123');

      expect(result).toEqual({
        number: 99,
        title: 'Plan task',
        description: null,
        tags: ['ai-plan'],
        mode: 'ai-plan',
      });
    });

    it('excludes the specified card number', async () => {
      mockClient.cards.list.mockResolvedValue({
        ok: true,
        value: [
          mockCardSummary({ number: 42, title: 'Excluded', tags: ['ai-code'] }),
          mockCardSummary({ number: 43, title: 'Included', tags: ['ai-code'] }),
        ],
      });

      mockClient.cards.getByNumber.mockResolvedValue({
        ok: true,
        value: mockCard({
          number: 43,
          title: 'Included',
          description: null,
          tags: ['ai-code'],
          closed: false,
          columnName: 'Accepted',
        }),
      });

      const result = await findNextCard(mockClient, 'board-123', 42);

      expect(result?.number).toBe(43);
      expect(mockClient.cards.getByNumber).toHaveBeenCalledWith(43);
      expect(mockClient.cards.getByNumber).not.toHaveBeenCalledWith(42);
    });

    it('skips closed cards', async () => {
      mockClient.cards.list.mockResolvedValue({
        ok: true,
        value: [
          mockCardSummary({ number: 42, title: 'Closed', tags: ['ai-code'] }),
          mockCardSummary({ number: 43, title: 'Open', tags: ['ai-code'] }),
        ],
      });

      mockClient.cards.getByNumber
        .mockResolvedValueOnce({
          ok: true,
          value: mockCard({
            number: 42,
            title: 'Closed',
            tags: ['ai-code'],
            closed: true,
            columnName: 'Accepted',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          value: mockCard({
            number: 43,
            title: 'Open',
            description: null,
            tags: ['ai-code'],
            closed: false,
            columnName: 'Accepted',
          }),
        });

      const result = await findNextCard(mockClient, 'board-123');

      expect(result?.number).toBe(43);
    });

    it('skips cards not in Accepted column', async () => {
      mockClient.cards.list.mockResolvedValue({
        ok: true,
        value: [
          mockCardSummary({ number: 42, title: 'In Progress', tags: ['ai-code'] }),
          mockCardSummary({ number: 43, title: 'Ready', tags: ['ai-code'] }),
        ],
      });

      mockClient.cards.getByNumber
        .mockResolvedValueOnce({
          ok: true,
          value: mockCard({
            number: 42,
            title: 'In Progress',
            tags: ['ai-code'],
            closed: false,
            columnName: 'In Progress',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          value: mockCard({
            number: 43,
            title: 'Ready',
            description: null,
            tags: ['ai-code'],
            closed: false,
            columnName: 'Ready',
          }),
        });

      const result = await findNextCard(mockClient, 'board-123');

      expect(result?.number).toBe(43);
    });

    it('skips cards without AI tags', async () => {
      mockClient.cards.list.mockResolvedValue({
        ok: true,
        value: [
          mockCardSummary({ number: 42, title: 'No AI tag', tags: ['bug'] }),
          mockCardSummary({ number: 43, title: 'Has AI tag', tags: ['ai-code', 'feature'] }),
        ],
      });

      mockClient.cards.getByNumber.mockResolvedValue({
        ok: true,
        value: mockCard({
          number: 43,
          title: 'Has AI tag',
          description: null,
          tags: ['ai-code', 'feature'],
          closed: false,
          columnName: 'Accepted',
        }),
      });

      const result = await findNextCard(mockClient, 'board-123');

      expect(result?.number).toBe(43);
      // Only getByNumber should be called for card with AI tag
      expect(mockClient.cards.getByNumber).toHaveBeenCalledTimes(1);
    });
  });

  describe('scanForWork', () => {
    it('returns empty result when no cards are found', async () => {
      mockClient.cards.list.mockResolvedValue({ ok: true, value: [] });

      const result = await scanForWork(mockClient, 'board-123');

      expect(result).toEqual({
        found: false,
        card: null,
        queueLength: 0,
      });
    });

    it('returns queue length for multiple eligible cards', async () => {
      mockClient.cards.list.mockResolvedValue({
        ok: true,
        value: [
          mockCardSummary({ number: 42, title: 'First', tags: ['ai-code'] }),
          mockCardSummary({ number: 43, title: 'Second', tags: ['ai-code'] }),
          mockCardSummary({ number: 44, title: 'Third', tags: ['ai-plan'] }),
        ],
      });

      mockClient.cards.getByNumber
        .mockResolvedValueOnce({
          ok: true,
          value: mockCard({
            number: 42,
            title: 'First',
            description: null,
            tags: ['ai-code'],
            closed: false,
            columnName: 'Accepted',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          value: mockCard({
            number: 43,
            title: 'Second',
            description: null,
            tags: ['ai-code'],
            closed: false,
            columnName: 'Accepted',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          value: mockCard({
            number: 44,
            title: 'Third',
            description: null,
            tags: ['ai-plan'],
            closed: false,
            columnName: 'Todo',
          }),
        });

      const result = await scanForWork(mockClient, 'board-123');

      expect(result.found).toBe(true);
      expect(result.card?.number).toBe(42);
      expect(result.queueLength).toBe(2);
    });
  });

  describe('format functions', () => {
    describe('formatCompletionSummary', () => {
      it('formats code completion without PR', () => {
        const summary = formatCompletionSummary(42, 'Fix bug', 'ai-code');
        expect(summary).toBe('Card #42 completed (Code): Fix bug');
      });

      it('formats code completion with PR', () => {
        const summary = formatCompletionSummary(
          42,
          'Fix bug',
          'ai-code',
          'https://github.com/pr/1',
        );
        expect(summary).toContain('Card #42 completed (Code): Fix bug');
        expect(summary).toContain('PR: https://github.com/pr/1');
      });

      it('formats plan completion', () => {
        const summary = formatCompletionSummary(99, 'Design feature', 'ai-plan');
        expect(summary).toBe('Card #99 completed (Plan): Design feature');
      });
    });

    describe('formatScanningStatus', () => {
      it('includes board name', () => {
        const status = formatScanningStatus('My Board');
        expect(status).toBe('Scanning for next card on "My Board"...');
      });
    });

    describe('formatStartingCard', () => {
      it('formats card info with mode', () => {
        const card: CardForWork = {
          number: 42,
          title: 'Test task',
          description: null,
          tags: ['ai-code'],
          mode: 'ai-code',
        };
        const status = formatStartingCard(card);
        expect(status).toBe('Starting card #42: Test task (ai-code)');
      });
    });

    describe('formatNoMoreCards', () => {
      it('returns waiting message', () => {
        const status = formatNoMoreCards();
        expect(status).toBe('No more cards to process. Waiting for new work...');
      });
    });

    describe('formatQueueStatus', () => {
      it('handles empty queue', () => {
        expect(formatQueueStatus(0)).toBe('Queue is empty');
      });

      it('handles single card', () => {
        expect(formatQueueStatus(1)).toBe('1 more card waiting');
      });

      it('handles multiple cards', () => {
        expect(formatQueueStatus(5)).toBe('5 more cards waiting');
      });
    });
  });
});
