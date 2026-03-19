import { describe, it, expect } from 'vite-plus/test';
import { parse as parseYaml } from 'yaml';
import {
  VibeConfigSchema,
  VIBE_COLUMNS,
  AI_WORK_MODES,
  CONFIG_CARD_TEMPLATE,
  CONFIG_CARD_TITLE,
  CONFIG_CARD_TAG,
  VibeConfigCardSchema,
  BoardVibeStatusSchema,
  VibeSessionSchema,
  type VibeColumnName,
  type AiWorkMode,
} from './vibe-config.js';

describe('VibeConfigSchema', () => {
  describe('valid configurations', () => {
    it('accepts valid config with all fields', () => {
      const config = {
        repository: 'https://github.com/owner/repo',
        default_branch: 'develop',
        branch_pattern: 'feature/card-{number}-{slug}',
        pr_template: 'detailed',
        auto_assign_pr: false,
      };

      const result = VibeConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.repository).toBe('https://github.com/owner/repo');
        expect(result.data.default_branch).toBe('develop');
        expect(result.data.branch_pattern).toBe('feature/card-{number}-{slug}');
        expect(result.data.pr_template).toBe('detailed');
        expect(result.data.auto_assign_pr).toBe(false);
      }
    });

    it('accepts valid config with only required fields and uses defaults', () => {
      const config = {
        repository: 'https://github.com/owner/repo',
      };

      const result = VibeConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.repository).toBe('https://github.com/owner/repo');
        expect(result.data.default_branch).toBe('main');
        expect(result.data.branch_pattern).toBe('ai/card-{number}-{slug}');
        expect(result.data.pr_template).toBe('default');
        expect(result.data.auto_assign_pr).toBe(true);
      }
    });

    it('accepts GitHub URLs with various path formats', () => {
      const urls = [
        'https://github.com/owner/repo',
        'https://github.com/my-org/my-repo',
        'https://github.com/user123/project-name',
        'https://github.com/a/b',
      ];

      for (const url of urls) {
        const result = VibeConfigSchema.safeParse({ repository: url });
        expect(result.success).toBe(true);
      }
    });

    it('accepts all valid pr_template values', () => {
      const templates = ['minimal', 'default', 'detailed'] as const;

      for (const template of templates) {
        const result = VibeConfigSchema.safeParse({
          repository: 'https://github.com/owner/repo',
          pr_template: template,
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.pr_template).toBe(template);
        }
      }
    });
  });

  describe('invalid configurations', () => {
    it('rejects non-GitHub repository URLs', () => {
      const config = {
        repository: 'https://gitlab.com/owner/repo',
      };

      const result = VibeConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        const firstIssue = result.error.issues[0];
        expect(firstIssue).toBeDefined();
        expect(firstIssue?.message).toBe('Repository must be a valid GitHub URL');
      }
    });

    it('rejects non-URL repository strings', () => {
      const config = {
        repository: 'not-a-url',
      };

      const result = VibeConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        const firstIssue = result.error.issues[0];
        expect(firstIssue).toBeDefined();
        expect(firstIssue?.message).toBe('Invalid url');
      }
    });

    it('rejects empty repository string', () => {
      const config = {
        repository: '',
      };

      const result = VibeConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('rejects missing repository field', () => {
      const config = {
        default_branch: 'main',
      };

      const result = VibeConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('rejects invalid pr_template value', () => {
      const config = {
        repository: 'https://github.com/owner/repo',
        pr_template: 'invalid-template',
      };

      const result = VibeConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        const firstIssue = result.error.issues[0];
        expect(firstIssue).toBeDefined();
        expect(firstIssue?.code).toBe('invalid_enum_value');
      }
    });

    it('rejects non-string default_branch', () => {
      const config = {
        repository: 'https://github.com/owner/repo',
        default_branch: 123,
      };

      const result = VibeConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('rejects non-boolean auto_assign_pr', () => {
      const config = {
        repository: 'https://github.com/owner/repo',
        auto_assign_pr: 'yes',
      };

      const result = VibeConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('rejects other hosting providers', () => {
      const providers = [
        'https://bitbucket.org/owner/repo',
        'https://gitlab.com/owner/repo',
        'https://codeberg.org/owner/repo',
        'https://gitea.com/owner/repo',
      ];

      for (const url of providers) {
        const result = VibeConfigSchema.safeParse({ repository: url });
        expect(result.success).toBe(false);
      }
    });
  });
});

describe('VIBE_COLUMNS', () => {
  it('has all 4 columns defined', () => {
    const columnNames = Object.keys(VIBE_COLUMNS);
    expect(columnNames).toHaveLength(4);
    expect(columnNames).toContain('Maybe');
    expect(columnNames).toContain('Accepted');
    expect(columnNames).toContain('InProgress');
    expect(columnNames).toContain('Blocked');
  });

  it('each column has name, color, and description', () => {
    for (const [key, column] of Object.entries(VIBE_COLUMNS)) {
      expect(column.name).toBeDefined();
      expect(typeof column.name).toBe('string');
      expect(column.name.length).toBeGreaterThan(0);

      expect(column.color).toBeDefined();
      expect(typeof column.color).toBe('string');
      expect(column.color).toMatch(/^var\(--color-card-/);

      expect(column.description).toBeDefined();
      expect(typeof column.description).toBe('string');
      expect(column.description.length).toBeGreaterThan(0);

      // Name should match the key (except InProgress which has a space)
      if (key === 'InProgress') {
        expect(column.name).toBe('In Progress');
      } else {
        expect(column.name).toBe(key);
      }
    }
  });

  it('columns have correct semantic colors', () => {
    // Gray for Maybe (cards to review)
    expect(VIBE_COLUMNS.Maybe.color).toBe('var(--color-card-1)');
    // Blue for Accepted (ready for work)
    expect(VIBE_COLUMNS.Accepted.color).toBe('var(--color-card-default)');
    // Yellow for In Progress (active work)
    expect(VIBE_COLUMNS.InProgress.color).toBe('var(--color-card-3)');
    // Pink for Blocked (needs attention)
    expect(VIBE_COLUMNS.Blocked.color).toBe('var(--color-card-8)');
  });

  it('VibeColumnName type matches object keys', () => {
    const columnNames: VibeColumnName[] = ['Maybe', 'Accepted', 'InProgress', 'Blocked'];
    expect(Object.keys(VIBE_COLUMNS)).toEqual(columnNames);
  });
});

describe('AI_WORK_MODES', () => {
  it('has ai-code and ai-plan modes defined', () => {
    const modes = Object.keys(AI_WORK_MODES);
    expect(modes).toHaveLength(2);
    expect(modes).toContain('ai-code');
    expect(modes).toContain('ai-plan');
  });

  it('each mode has tag and description', () => {
    for (const [key, mode] of Object.entries(AI_WORK_MODES)) {
      expect(mode.tag).toBeDefined();
      expect(typeof mode.tag).toBe('string');
      expect(mode.tag).toBe(key);

      expect(mode.description).toBeDefined();
      expect(typeof mode.description).toBe('string');
      expect(mode.description.length).toBeGreaterThan(0);
    }
  });

  it('ai-code mode describes code generation workflow', () => {
    expect(AI_WORK_MODES['ai-code'].description).toContain('code');
    expect(AI_WORK_MODES['ai-code'].description).toContain('PR');
  });

  it('ai-plan mode describes planning workflow', () => {
    expect(AI_WORK_MODES['ai-plan'].description).toContain('Break down');
    expect(AI_WORK_MODES['ai-plan'].description).toContain('no code');
  });

  it('AiWorkMode type matches object keys', () => {
    const modes: AiWorkMode[] = ['ai-code', 'ai-plan'];
    expect(Object.keys(AI_WORK_MODES)).toEqual(modes);
  });
});

describe('CONFIG_CARD_TEMPLATE', () => {
  it('is valid YAML', () => {
    expect(() => parseYaml(CONFIG_CARD_TEMPLATE)).not.toThrow();
  });

  it('contains repository placeholder', () => {
    expect(CONFIG_CARD_TEMPLATE).toContain('repository:');
    expect(CONFIG_CARD_TEMPLATE).toContain('your-org/your-repo');
  });

  it('contains default values matching schema defaults', () => {
    const parsed = parseYaml(CONFIG_CARD_TEMPLATE);
    expect(parsed.default_branch).toBe('main');
    expect(parsed.branch_pattern).toBe('ai/card-{number}-{slug}');
    expect(parsed.pr_template).toBe('default');
    expect(parsed.auto_assign_pr).toBe(true);
  });

  it('contains helpful comments', () => {
    expect(CONFIG_CARD_TEMPLATE).toContain('#');
    expect(CONFIG_CARD_TEMPLATE).toContain('REQUIRED');
    expect(CONFIG_CARD_TEMPLATE).toContain('Optional');
  });

  it('template parses to valid config structure (except placeholder URL)', () => {
    const parsed = parseYaml(CONFIG_CARD_TEMPLATE);
    expect(parsed).toHaveProperty('repository');
    expect(parsed).toHaveProperty('default_branch');
    expect(parsed).toHaveProperty('branch_pattern');
    expect(parsed).toHaveProperty('pr_template');
    expect(parsed).toHaveProperty('auto_assign_pr');
  });
});

describe('CONFIG_CARD_TITLE', () => {
  it('is defined and non-empty', () => {
    expect(CONFIG_CARD_TITLE).toBeDefined();
    expect(CONFIG_CARD_TITLE.length).toBeGreaterThan(0);
  });

  it('describes AI configuration', () => {
    expect(CONFIG_CARD_TITLE).toBe('AI Configuration');
  });
});

describe('CONFIG_CARD_TAG', () => {
  it('is defined and non-empty', () => {
    expect(CONFIG_CARD_TAG).toBeDefined();
    expect(CONFIG_CARD_TAG.length).toBeGreaterThan(0);
  });

  it('is the ai-config tag', () => {
    expect(CONFIG_CARD_TAG).toBe('ai-config');
  });
});

describe('VibeConfigCardSchema', () => {
  it('validates a complete config card', () => {
    const card = {
      card_number: 42,
      card_id: 'card-123',
      board_id: 'board-456',
      config: {
        repository: 'https://github.com/owner/repo',
      },
      raw_yaml: 'repository: https://github.com/owner/repo',
    };

    const result = VibeConfigCardSchema.safeParse(card);
    expect(result.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const card = {
      card_number: 42,
      // missing card_id, board_id, config, raw_yaml
    };

    const result = VibeConfigCardSchema.safeParse(card);
    expect(result.success).toBe(false);
  });

  it('validates nested config schema', () => {
    const card = {
      card_number: 42,
      card_id: 'card-123',
      board_id: 'board-456',
      config: {
        repository: 'not-a-url', // invalid
      },
      raw_yaml: 'repository: not-a-url',
    };

    const result = VibeConfigCardSchema.safeParse(card);
    expect(result.success).toBe(false);
  });
});

describe('BoardVibeStatusSchema', () => {
  it('validates a fully configured board status', () => {
    const status = {
      board_id: 'board-123',
      board_name: 'My Project',
      has_config: true,
      config: {
        repository: 'https://github.com/owner/repo',
      },
      columns: {
        existing: [
          { id: 'col-1', name: 'Maybe', is_vibe_column: true, vibe_role: 'Maybe' },
          { id: 'col-2', name: 'Accepted', is_vibe_column: true, vibe_role: 'Accepted' },
        ],
        missing: ['InProgress', 'Blocked'],
      },
      ready_cards: 5,
      is_ready: false,
    };

    const result = BoardVibeStatusSchema.safeParse(status);
    expect(result.success).toBe(true);
  });

  it('allows optional config when has_config is false', () => {
    const status = {
      board_id: 'board-123',
      board_name: 'My Project',
      has_config: false,
      columns: {
        existing: [],
        missing: ['Maybe', 'Accepted', 'InProgress', 'Blocked'],
      },
      ready_cards: 0,
      is_ready: false,
    };

    const result = BoardVibeStatusSchema.safeParse(status);
    expect(result.success).toBe(true);
  });

  it('validates vibe_role enum values', () => {
    const status = {
      board_id: 'board-123',
      board_name: 'My Project',
      has_config: false,
      columns: {
        existing: [{ id: 'col-1', name: 'Custom', is_vibe_column: true, vibe_role: 'InvalidRole' }],
        missing: [],
      },
      ready_cards: 0,
      is_ready: false,
    };

    const result = BoardVibeStatusSchema.safeParse(status);
    expect(result.success).toBe(false);
  });
});

describe('VibeSessionSchema', () => {
  it('validates a session with current card', () => {
    const session = {
      board_id: 'board-123',
      board_name: 'My Project',
      config: {
        repository: 'https://github.com/owner/repo',
      },
      repo_path: '/home/user/project',
      current_card: {
        number: 42,
        title: 'Add feature X',
        mode: 'ai-code',
        branch: 'ai/card-42-add-feature-x',
        started_at: '2024-01-15T10:30:00Z',
      },
      started_at: '2024-01-15T10:00:00Z',
      cards_completed: 3,
    };

    const result = VibeSessionSchema.safeParse(session);
    expect(result.success).toBe(true);
  });

  it('validates a session without current card', () => {
    const session = {
      board_id: 'board-123',
      board_name: 'My Project',
      config: {
        repository: 'https://github.com/owner/repo',
      },
      repo_path: '/home/user/project',
      started_at: '2024-01-15T10:00:00Z',
      cards_completed: 0,
    };

    const result = VibeSessionSchema.safeParse(session);
    expect(result.success).toBe(true);
  });

  it('validates current_card mode enum', () => {
    const session = {
      board_id: 'board-123',
      board_name: 'My Project',
      config: {
        repository: 'https://github.com/owner/repo',
      },
      repo_path: '/home/user/project',
      current_card: {
        number: 42,
        title: 'Add feature X',
        mode: 'invalid-mode',
        started_at: '2024-01-15T10:30:00Z',
      },
      started_at: '2024-01-15T10:00:00Z',
      cards_completed: 0,
    };

    const result = VibeSessionSchema.safeParse(session);
    expect(result.success).toBe(false);
  });

  it('validates datetime format for timestamps', () => {
    const session = {
      board_id: 'board-123',
      board_name: 'My Project',
      config: {
        repository: 'https://github.com/owner/repo',
      },
      repo_path: '/home/user/project',
      started_at: 'not-a-datetime',
      cards_completed: 0,
    };

    const result = VibeSessionSchema.safeParse(session);
    expect(result.success).toBe(false);
  });
});
