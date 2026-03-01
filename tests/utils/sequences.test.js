/**
 * @module tests/utils/sequences.test
 * @description Comprehensive tests for email sequence utilities
 *
 * COVERS:
 * - Constants and defaults
 * - Sequence validation (name, trigger types, email)
 * - Step validation (delays, subject)
 * - Payload builders (sequence + step)
 * - State updaters (add, remove, toggle, sort)
 * - Edge cases and error handling
 */

import { describe, it, expect } from 'vitest';
import {
  TRIGGER_TYPES,
  TRIGGER_LABELS,
  STATUS_TRIGGER_VALUES,
  MILESTONE_TRIGGER_VALUES,
  DEFAULT_NEW_SEQUENCE,
  DEFAULT_STEP_BODY,
  TEMPLATE_TOKENS,
  validateSequenceName,
  validateSequence,
  validateStepFields,
  buildSequencePayload,
  buildStepPayload,
  sortSteps,
  getNextStepNumber,
  formatStepDelay,
  addSequenceToList,
  removeSequenceFromList,
  toggleSequenceInList,
  addStepToSequence,
  removeStepFromSequence,
  updateStepInSequences
} from '../../src/utils/sequences.js';

// ==================== TEST DATA ====================

const makeSequence = (overrides = {}) => ({
  id: 'seq-1',
  name: 'Post-Qualified Nurture',
  description: 'Follow-up after qualification',
  trigger_type: 'manual',
  trigger_value: null,
  is_active: true,
  email_sequence_steps: [],
  enrollments_count: 0,
  ...overrides
});

const makeStep = (overrides = {}) => ({
  id: 'step-1',
  sequence_id: 'seq-1',
  step_number: 1,
  delay_days: 0,
  delay_hours: 0,
  subject: 'Step 1: Follow-up',
  body_html: DEFAULT_STEP_BODY,
  skip_conditions: { if_replied: true },
  ...overrides
});

// ==================== CONSTANTS ====================

describe('Constants', () => {
  describe('TRIGGER_TYPES', () => {
    it('contains all three trigger types', () => {
      expect(TRIGGER_TYPES).toEqual(['manual', 'status_change', 'milestone']);
    });

    it('has exactly 3 types', () => {
      expect(TRIGGER_TYPES).toHaveLength(3);
    });
  });

  describe('TRIGGER_LABELS', () => {
    it('has a label for each trigger type', () => {
      TRIGGER_TYPES.forEach(type => {
        expect(TRIGGER_LABELS[type]).toBeDefined();
        expect(typeof TRIGGER_LABELS[type]).toBe('string');
      });
    });

    it('has correct label text', () => {
      expect(TRIGGER_LABELS.manual).toBe('Manual enrollment');
      expect(TRIGGER_LABELS.status_change).toBe('When status changes to');
      expect(TRIGGER_LABELS.milestone).toBe('When milestone reached');
    });
  });

  describe('STATUS_TRIGGER_VALUES', () => {
    it('contains expected status values', () => {
      expect(STATUS_TRIGGER_VALUES).toContain('Qualified');
      expect(STATUS_TRIGGER_VALUES).toContain('Follow Up');
      expect(STATUS_TRIGGER_VALUES).toContain('Deck Sent');
    });
  });

  describe('MILESTONE_TRIGGER_VALUES', () => {
    it('contains expected milestone values', () => {
      expect(MILESTONE_TRIGGER_VALUES).toContain('deckSent');
      expect(MILESTONE_TRIGGER_VALUES).toContain('discoveryCall');
      expect(MILESTONE_TRIGGER_VALUES).toContain('ceoMeetingHeld');
      expect(MILESTONE_TRIGGER_VALUES).toContain('proposalSent');
    });
  });

  describe('DEFAULT_NEW_SEQUENCE', () => {
    it('starts with empty name', () => {
      expect(DEFAULT_NEW_SEQUENCE.name).toBe('');
    });

    it('defaults to manual trigger', () => {
      expect(DEFAULT_NEW_SEQUENCE.triggerType).toBe('manual');
    });

    it('defaults to active', () => {
      expect(DEFAULT_NEW_SEQUENCE.isActive).toBe(true);
    });

    it('starts with empty steps', () => {
      expect(DEFAULT_NEW_SEQUENCE.steps).toEqual([]);
    });
  });

  describe('DEFAULT_STEP_BODY', () => {
    it('contains template tokens', () => {
      expect(DEFAULT_STEP_BODY).toContain('{{firstName}}');
      expect(DEFAULT_STEP_BODY).toContain('{{companyName}}');
    });

    it('is valid HTML', () => {
      expect(DEFAULT_STEP_BODY).toContain('<p>');
      expect(DEFAULT_STEP_BODY).toContain('</p>');
    });
  });

  describe('TEMPLATE_TOKENS', () => {
    it('contains expected tokens', () => {
      expect(TEMPLATE_TOKENS).toContain('{{contact}}');
      expect(TEMPLATE_TOKENS).toContain('{{firstName}}');
      expect(TEMPLATE_TOKENS).toContain('{{company}}');
      expect(TEMPLATE_TOKENS).toContain('{{companyName}}');
      expect(TEMPLATE_TOKENS).toContain('{{ceoName}}');
    });

    it('has at least 5 tokens', () => {
      expect(TEMPLATE_TOKENS.length).toBeGreaterThanOrEqual(5);
    });
  });
});

// ==================== VALIDATION ====================

describe('validateSequenceName', () => {
  describe('Valid Names', () => {
    it('accepts a simple name', () => {
      expect(validateSequenceName('My Sequence')).toEqual({ valid: true, error: null });
    });

    it('accepts a single character', () => {
      expect(validateSequenceName('A')).toEqual({ valid: true, error: null });
    });

    it('accepts a name at 200 chars', () => {
      const name = 'A'.repeat(200);
      expect(validateSequenceName(name)).toEqual({ valid: true, error: null });
    });

    it('accepts names with special characters', () => {
      expect(validateSequenceName("Post-Qualified: Nurture (v2)")).toEqual({ valid: true, error: null });
    });
  });

  describe('Invalid Names', () => {
    it('rejects null', () => {
      const result = validateSequenceName(null);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('rejects undefined', () => {
      const result = validateSequenceName(undefined);
      expect(result.valid).toBe(false);
    });

    it('rejects empty string', () => {
      const result = validateSequenceName('');
      expect(result.valid).toBe(false);
    });

    it('rejects whitespace-only string', () => {
      const result = validateSequenceName('   ');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('rejects names over 200 chars', () => {
      const name = 'A'.repeat(201);
      const result = validateSequenceName(name);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('200');
    });

    it('rejects non-string types', () => {
      expect(validateSequenceName(123).valid).toBe(false);
      expect(validateSequenceName({}).valid).toBe(false);
      expect(validateSequenceName([]).valid).toBe(false);
    });
  });
});

describe('validateSequence', () => {
  describe('Valid Sequences', () => {
    it('accepts a minimal valid sequence', () => {
      const seq = { name: 'Test', triggerType: 'manual' };
      const result = validateSequence(seq);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('accepts a full sequence with status_change trigger', () => {
      const seq = {
        name: 'Qualified Follow-up',
        triggerType: 'status_change',
        triggerValue: 'Qualified',
        fromName: 'Sales Team',
        replyTo: 'sales@example.com'
      };
      expect(validateSequence(seq).valid).toBe(true);
    });

    it('accepts a milestone trigger sequence', () => {
      const seq = {
        name: 'Post-Meeting Nurture',
        triggerType: 'milestone',
        triggerValue: 'ceoMeetingHeld'
      };
      expect(validateSequence(seq).valid).toBe(true);
    });

    it('accepts manual trigger without triggerValue', () => {
      const seq = { name: 'Manual', triggerType: 'manual', triggerValue: '' };
      expect(validateSequence(seq).valid).toBe(true);
    });

    it('accepts empty replyTo', () => {
      const seq = { name: 'Test', triggerType: 'manual', replyTo: '' };
      expect(validateSequence(seq).valid).toBe(true);
    });
  });

  describe('Invalid Sequences', () => {
    it('rejects null', () => {
      const result = validateSequence(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid sequence data');
    });

    it('rejects missing name', () => {
      const result = validateSequence({ triggerType: 'manual' });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('rejects invalid trigger type', () => {
      const result = validateSequence({ name: 'Test', triggerType: 'invalid_type' });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('trigger type'))).toBe(true);
    });

    it('rejects invalid status trigger value', () => {
      const result = validateSequence({
        name: 'Test',
        triggerType: 'status_change',
        triggerValue: 'InvalidStatus'
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('status trigger'))).toBe(true);
    });

    it('rejects invalid milestone trigger value', () => {
      const result = validateSequence({
        name: 'Test',
        triggerType: 'milestone',
        triggerValue: 'invalidMilestone'
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('milestone trigger'))).toBe(true);
    });

    it('rejects invalid replyTo email', () => {
      const result = validateSequence({
        name: 'Test',
        triggerType: 'manual',
        replyTo: 'not-an-email'
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('email'))).toBe(true);
    });

    it('collects multiple errors', () => {
      const result = validateSequence({
        triggerType: 'bogus',
        replyTo: 'bad-email'
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });
  });
});

describe('validateStepFields', () => {
  describe('Valid Steps', () => {
    it('accepts valid delay_days', () => {
      expect(validateStepFields({ delay_days: 0 }).valid).toBe(true);
      expect(validateStepFields({ delay_days: 5 }).valid).toBe(true);
      expect(validateStepFields({ delay_days: 30 }).valid).toBe(true);
    });

    it('accepts valid delay_hours', () => {
      expect(validateStepFields({ delay_hours: 0 }).valid).toBe(true);
      expect(validateStepFields({ delay_hours: 12 }).valid).toBe(true);
      expect(validateStepFields({ delay_hours: 23 }).valid).toBe(true);
    });

    it('accepts valid subject', () => {
      expect(validateStepFields({ subject: 'Follow-up' }).valid).toBe(true);
    });

    it('accepts empty object (no fields to validate)', () => {
      expect(validateStepFields({}).valid).toBe(true);
    });
  });

  describe('Invalid Steps', () => {
    it('rejects null', () => {
      expect(validateStepFields(null).valid).toBe(false);
    });

    it('rejects negative delay_days', () => {
      const result = validateStepFields({ delay_days: -1 });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('days'))).toBe(true);
    });

    it('rejects non-numeric delay_days', () => {
      expect(validateStepFields({ delay_days: 'two' }).valid).toBe(false);
    });

    it('rejects delay_hours over 23', () => {
      const result = validateStepFields({ delay_hours: 24 });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('hours'))).toBe(true);
    });

    it('rejects negative delay_hours', () => {
      expect(validateStepFields({ delay_hours: -1 }).valid).toBe(false);
    });

    it('rejects empty subject', () => {
      const result = validateStepFields({ subject: '' });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Subject'))).toBe(true);
    });

    it('rejects whitespace-only subject', () => {
      expect(validateStepFields({ subject: '   ' }).valid).toBe(false);
    });
  });
});

// ==================== PAYLOAD BUILDERS ====================

describe('buildSequencePayload', () => {
  const orgId = 'org-123';
  const userId = 'user-456';

  it('builds a complete payload from form data', () => {
    const form = {
      name: 'Post-Qualified Nurture',
      description: 'Auto follow-up',
      triggerType: 'status_change',
      triggerValue: 'Qualified',
      fromName: 'Sales Team',
      replyTo: 'sales@acme.com',
      isActive: true
    };

    const payload = buildSequencePayload(form, orgId, userId);

    expect(payload.organization_id).toBe(orgId);
    expect(payload.name).toBe('Post-Qualified Nurture');
    expect(payload.description).toBe('Auto follow-up');
    expect(payload.trigger_type).toBe('status_change');
    expect(payload.trigger_value).toBe('Qualified');
    expect(payload.from_name).toBe('Sales Team');
    expect(payload.reply_to).toBe('sales@acme.com');
    expect(payload.is_active).toBe(true);
    expect(payload.created_by).toBe(userId);
  });

  it('converts camelCase to snake_case for trigger fields', () => {
    const form = { name: 'Test', triggerType: 'manual', triggerValue: '' };
    const payload = buildSequencePayload(form, orgId, userId);
    expect(payload).toHaveProperty('trigger_type', 'manual');
    expect(payload).toHaveProperty('trigger_value', null);
    expect(payload).toHaveProperty('is_active', true);
    expect(payload).toHaveProperty('organization_id');
    expect(payload).toHaveProperty('created_by');
  });

  it('defaults empty triggerValue to null', () => {
    const form = { name: 'Test', triggerType: 'manual', triggerValue: '' };
    const payload = buildSequencePayload(form, orgId, userId);
    expect(payload.trigger_value).toBeNull();
  });

  it('defaults empty fromName and replyTo to null', () => {
    const form = { name: 'Test', triggerType: 'manual', fromName: '', replyTo: '' };
    const payload = buildSequencePayload(form, orgId, userId);
    expect(payload.from_name).toBeNull();
    expect(payload.reply_to).toBeNull();
  });

  it('defaults isActive to true when not provided', () => {
    const form = { name: 'Test', triggerType: 'manual' };
    const payload = buildSequencePayload(form, orgId, userId);
    expect(payload.is_active).toBe(true);
  });

  it('respects isActive = false', () => {
    const form = { name: 'Test', triggerType: 'manual', isActive: false };
    const payload = buildSequencePayload(form, orgId, userId);
    expect(payload.is_active).toBe(false);
  });

  it('defaults description to empty string', () => {
    const form = { name: 'Test', triggerType: 'manual' };
    const payload = buildSequencePayload(form, orgId, userId);
    expect(payload.description).toBe('');
  });
});

describe('buildStepPayload', () => {
  it('builds first step with zero delay', () => {
    const payload = buildStepPayload('seq-1', 1);
    expect(payload.sequence_id).toBe('seq-1');
    expect(payload.step_number).toBe(1);
    expect(payload.delay_days).toBe(0);
    expect(payload.delay_hours).toBe(0);
    expect(payload.subject).toBe('Step 1: Follow-up');
    expect(payload.body_html).toBe(DEFAULT_STEP_BODY);
    expect(payload.skip_conditions).toEqual({ if_replied: true });
  });

  it('builds second step with 2-day delay', () => {
    const payload = buildStepPayload('seq-1', 2);
    expect(payload.delay_days).toBe(2);
    expect(payload.delay_hours).toBe(0);
    expect(payload.subject).toBe('Step 2: Follow-up');
  });

  it('builds third step with 2-day delay', () => {
    const payload = buildStepPayload('seq-1', 3);
    expect(payload.delay_days).toBe(2);
    expect(payload.subject).toBe('Step 3: Follow-up');
  });

  it('includes sequence_id', () => {
    const payload = buildStepPayload('abc-xyz', 1);
    expect(payload.sequence_id).toBe('abc-xyz');
  });

  it('always includes skip_conditions', () => {
    const payload = buildStepPayload('seq-1', 5);
    expect(payload.skip_conditions).toEqual({ if_replied: true });
  });
});

// ==================== STATE UPDATERS ====================

describe('sortSteps', () => {
  it('sorts steps by step_number ascending', () => {
    const steps = [
      makeStep({ id: 's3', step_number: 3 }),
      makeStep({ id: 's1', step_number: 1 }),
      makeStep({ id: 's2', step_number: 2 })
    ];
    const sorted = sortSteps(steps);
    expect(sorted.map(s => s.step_number)).toEqual([1, 2, 3]);
  });

  it('returns empty array for null input', () => {
    expect(sortSteps(null)).toEqual([]);
  });

  it('returns empty array for undefined input', () => {
    expect(sortSteps(undefined)).toEqual([]);
  });

  it('returns empty array for non-array input', () => {
    expect(sortSteps('not an array')).toEqual([]);
  });

  it('does not mutate the original array', () => {
    const steps = [
      makeStep({ id: 's2', step_number: 2 }),
      makeStep({ id: 's1', step_number: 1 })
    ];
    const original = [...steps];
    sortSteps(steps);
    expect(steps[0].step_number).toBe(original[0].step_number);
  });

  it('handles single step', () => {
    const steps = [makeStep({ step_number: 1 })];
    expect(sortSteps(steps)).toHaveLength(1);
  });

  it('handles already sorted steps', () => {
    const steps = [
      makeStep({ id: 's1', step_number: 1 }),
      makeStep({ id: 's2', step_number: 2 })
    ];
    const sorted = sortSteps(steps);
    expect(sorted.map(s => s.step_number)).toEqual([1, 2]);
  });
});

describe('getNextStepNumber', () => {
  it('returns 1 for a sequence with no steps', () => {
    const seq = makeSequence({ email_sequence_steps: [] });
    expect(getNextStepNumber(seq)).toBe(1);
  });

  it('returns 2 when there is 1 step', () => {
    const seq = makeSequence({ email_sequence_steps: [makeStep()] });
    expect(getNextStepNumber(seq)).toBe(2);
  });

  it('returns 4 when there are 3 steps', () => {
    const seq = makeSequence({
      email_sequence_steps: [
        makeStep({ step_number: 1 }),
        makeStep({ step_number: 2 }),
        makeStep({ step_number: 3 })
      ]
    });
    expect(getNextStepNumber(seq)).toBe(4);
  });

  it('returns 1 for null sequence', () => {
    expect(getNextStepNumber(null)).toBe(1);
  });

  it('returns 1 when email_sequence_steps is undefined', () => {
    expect(getNextStepNumber({})).toBe(1);
  });

  it('returns 1 when email_sequence_steps is null', () => {
    expect(getNextStepNumber({ email_sequence_steps: null })).toBe(1);
  });
});

describe('formatStepDelay', () => {
  it('returns "Immediate" for first step (index 0)', () => {
    const step = makeStep({ delay_days: 0, delay_hours: 0 });
    expect(formatStepDelay(step, 0)).toBe('Immediate');
  });

  it('returns "Immediate" for first step even with non-zero delays', () => {
    const step = makeStep({ delay_days: 5, delay_hours: 3 });
    expect(formatStepDelay(step, 0)).toBe('Immediate');
  });

  it('formats delay for subsequent steps', () => {
    const step = makeStep({ delay_days: 2, delay_hours: 4 });
    expect(formatStepDelay(step, 1)).toBe('2d 4h delay');
  });

  it('formats zero delays for non-first steps', () => {
    const step = makeStep({ delay_days: 0, delay_hours: 0 });
    expect(formatStepDelay(step, 2)).toBe('0d 0h delay');
  });

  it('handles missing delay fields', () => {
    expect(formatStepDelay({}, 1)).toBe('0d 0h delay');
  });
});

describe('addSequenceToList', () => {
  it('prepends a new sequence to empty list', () => {
    const newSeq = makeSequence({ id: 'new-1' });
    const result = addSequenceToList([], newSeq);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('new-1');
  });

  it('prepends to existing list', () => {
    const existing = [makeSequence({ id: 'old-1' })];
    const newSeq = makeSequence({ id: 'new-1' });
    const result = addSequenceToList(existing, newSeq);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('new-1');
    expect(result[1].id).toBe('old-1');
  });

  it('initializes email_sequence_steps if missing', () => {
    const newSeq = { id: 'new-1', name: 'Test' };
    const result = addSequenceToList([], newSeq);
    expect(result[0].email_sequence_steps).toEqual([]);
  });

  it('preserves existing email_sequence_steps', () => {
    const steps = [makeStep()];
    const newSeq = makeSequence({ id: 'new-1', email_sequence_steps: steps });
    const result = addSequenceToList([], newSeq);
    expect(result[0].email_sequence_steps).toHaveLength(1);
  });

  it('does not mutate the original list', () => {
    const existing = [makeSequence({ id: 'old-1' })];
    addSequenceToList(existing, makeSequence({ id: 'new-1' }));
    expect(existing).toHaveLength(1);
  });
});

describe('removeSequenceFromList', () => {
  it('removes a sequence by ID', () => {
    const sequences = [
      makeSequence({ id: 'seq-1' }),
      makeSequence({ id: 'seq-2' }),
      makeSequence({ id: 'seq-3' })
    ];
    const result = removeSequenceFromList(sequences, 'seq-2');
    expect(result).toHaveLength(2);
    expect(result.map(s => s.id)).toEqual(['seq-1', 'seq-3']);
  });

  it('returns same-length list if ID not found', () => {
    const sequences = [makeSequence({ id: 'seq-1' })];
    const result = removeSequenceFromList(sequences, 'nonexistent');
    expect(result).toHaveLength(1);
  });

  it('returns empty array when removing last sequence', () => {
    const sequences = [makeSequence({ id: 'seq-1' })];
    const result = removeSequenceFromList(sequences, 'seq-1');
    expect(result).toHaveLength(0);
  });

  it('does not mutate the original list', () => {
    const sequences = [makeSequence({ id: 'seq-1' }), makeSequence({ id: 'seq-2' })];
    removeSequenceFromList(sequences, 'seq-1');
    expect(sequences).toHaveLength(2);
  });
});

describe('toggleSequenceInList', () => {
  it('toggles active to paused', () => {
    const sequences = [makeSequence({ id: 'seq-1', is_active: true })];
    const result = toggleSequenceInList(sequences, 'seq-1');
    expect(result[0].is_active).toBe(false);
  });

  it('toggles paused to active', () => {
    const sequences = [makeSequence({ id: 'seq-1', is_active: false })];
    const result = toggleSequenceInList(sequences, 'seq-1');
    expect(result[0].is_active).toBe(true);
  });

  it('only toggles the targeted sequence', () => {
    const sequences = [
      makeSequence({ id: 'seq-1', is_active: true }),
      makeSequence({ id: 'seq-2', is_active: true })
    ];
    const result = toggleSequenceInList(sequences, 'seq-1');
    expect(result[0].is_active).toBe(false);
    expect(result[1].is_active).toBe(true);
  });

  it('does not mutate the original list', () => {
    const sequences = [makeSequence({ id: 'seq-1', is_active: true })];
    toggleSequenceInList(sequences, 'seq-1');
    expect(sequences[0].is_active).toBe(true);
  });

  it('leaves list unchanged if ID not found', () => {
    const sequences = [makeSequence({ id: 'seq-1', is_active: true })];
    const result = toggleSequenceInList(sequences, 'nonexistent');
    expect(result[0].is_active).toBe(true);
  });
});

describe('addStepToSequence', () => {
  it('adds a step to an empty sequence', () => {
    const sequences = [makeSequence({ id: 'seq-1', email_sequence_steps: [] })];
    const newStep = makeStep({ id: 'step-1', step_number: 1 });
    const result = addStepToSequence(sequences, 'seq-1', newStep);
    expect(result[0].email_sequence_steps).toHaveLength(1);
    expect(result[0].email_sequence_steps[0].id).toBe('step-1');
  });

  it('adds and sorts steps correctly', () => {
    const existing = [makeStep({ id: 'step-1', step_number: 1 })];
    const sequences = [makeSequence({ id: 'seq-1', email_sequence_steps: existing })];
    const newStep = makeStep({ id: 'step-2', step_number: 2 });
    const result = addStepToSequence(sequences, 'seq-1', newStep);
    expect(result[0].email_sequence_steps).toHaveLength(2);
    expect(result[0].email_sequence_steps[0].step_number).toBe(1);
    expect(result[0].email_sequence_steps[1].step_number).toBe(2);
  });

  it('inserts step in correct sorted position', () => {
    const existing = [
      makeStep({ id: 'step-1', step_number: 1 }),
      makeStep({ id: 'step-3', step_number: 3 })
    ];
    const sequences = [makeSequence({ id: 'seq-1', email_sequence_steps: existing })];
    const newStep = makeStep({ id: 'step-2', step_number: 2 });
    const result = addStepToSequence(sequences, 'seq-1', newStep);
    expect(result[0].email_sequence_steps.map(s => s.step_number)).toEqual([1, 2, 3]);
  });

  it('does not affect other sequences', () => {
    const sequences = [
      makeSequence({ id: 'seq-1', email_sequence_steps: [] }),
      makeSequence({ id: 'seq-2', email_sequence_steps: [makeStep({ id: 'other' })] })
    ];
    const result = addStepToSequence(sequences, 'seq-1', makeStep());
    expect(result[1].email_sequence_steps).toHaveLength(1);
  });

  it('handles null email_sequence_steps gracefully', () => {
    const sequences = [makeSequence({ id: 'seq-1', email_sequence_steps: null })];
    const result = addStepToSequence(sequences, 'seq-1', makeStep());
    expect(result[0].email_sequence_steps).toHaveLength(1);
  });

  it('does not mutate the original', () => {
    const sequences = [makeSequence({ id: 'seq-1', email_sequence_steps: [] })];
    addStepToSequence(sequences, 'seq-1', makeStep());
    expect(sequences[0].email_sequence_steps).toHaveLength(0);
  });
});

describe('removeStepFromSequence', () => {
  it('removes a step by ID', () => {
    const steps = [
      makeStep({ id: 'step-1', step_number: 1 }),
      makeStep({ id: 'step-2', step_number: 2 })
    ];
    const sequences = [makeSequence({ id: 'seq-1', email_sequence_steps: steps })];
    const result = removeStepFromSequence(sequences, 'seq-1', 'step-1');
    expect(result[0].email_sequence_steps).toHaveLength(1);
    expect(result[0].email_sequence_steps[0].id).toBe('step-2');
  });

  it('handles removing from single-step sequence', () => {
    const steps = [makeStep({ id: 'step-1' })];
    const sequences = [makeSequence({ id: 'seq-1', email_sequence_steps: steps })];
    const result = removeStepFromSequence(sequences, 'seq-1', 'step-1');
    expect(result[0].email_sequence_steps).toHaveLength(0);
  });

  it('does not affect other sequences', () => {
    const sequences = [
      makeSequence({ id: 'seq-1', email_sequence_steps: [makeStep({ id: 'step-1' })] }),
      makeSequence({ id: 'seq-2', email_sequence_steps: [makeStep({ id: 'step-2' })] })
    ];
    const result = removeStepFromSequence(sequences, 'seq-1', 'step-1');
    expect(result[1].email_sequence_steps).toHaveLength(1);
  });

  it('is a no-op if step ID not found', () => {
    const steps = [makeStep({ id: 'step-1' })];
    const sequences = [makeSequence({ id: 'seq-1', email_sequence_steps: steps })];
    const result = removeStepFromSequence(sequences, 'seq-1', 'nonexistent');
    expect(result[0].email_sequence_steps).toHaveLength(1);
  });

  it('handles null email_sequence_steps', () => {
    const sequences = [makeSequence({ id: 'seq-1', email_sequence_steps: null })];
    const result = removeStepFromSequence(sequences, 'seq-1', 'step-1');
    expect(result[0].email_sequence_steps).toHaveLength(0);
  });

  it('does not mutate the original', () => {
    const steps = [makeStep({ id: 'step-1' }), makeStep({ id: 'step-2' })];
    const sequences = [makeSequence({ id: 'seq-1', email_sequence_steps: steps })];
    removeStepFromSequence(sequences, 'seq-1', 'step-1');
    expect(sequences[0].email_sequence_steps).toHaveLength(2);
  });
});

describe('updateStepInSequences', () => {
  it('updates step subject', () => {
    const steps = [makeStep({ id: 'step-1', subject: 'Old Subject' })];
    const sequences = [makeSequence({ id: 'seq-1', email_sequence_steps: steps })];
    const result = updateStepInSequences(sequences, 'step-1', { subject: 'New Subject' });
    expect(result[0].email_sequence_steps[0].subject).toBe('New Subject');
  });

  it('updates step delay fields', () => {
    const steps = [makeStep({ id: 'step-1', delay_days: 0, delay_hours: 0 })];
    const sequences = [makeSequence({ id: 'seq-1', email_sequence_steps: steps })];
    const result = updateStepInSequences(sequences, 'step-1', { delay_days: 3, delay_hours: 12 });
    expect(result[0].email_sequence_steps[0].delay_days).toBe(3);
    expect(result[0].email_sequence_steps[0].delay_hours).toBe(12);
  });

  it('updates step body_html', () => {
    const steps = [makeStep({ id: 'step-1' })];
    const sequences = [makeSequence({ id: 'seq-1', email_sequence_steps: steps })];
    const newBody = '<p>Custom email body</p>';
    const result = updateStepInSequences(sequences, 'step-1', { body_html: newBody });
    expect(result[0].email_sequence_steps[0].body_html).toBe(newBody);
  });

  it('preserves unmodified fields', () => {
    const step = makeStep({ id: 'step-1', subject: 'Keep Me', delay_days: 5 });
    const sequences = [makeSequence({ id: 'seq-1', email_sequence_steps: [step] })];
    const result = updateStepInSequences(sequences, 'step-1', { subject: 'Changed' });
    expect(result[0].email_sequence_steps[0].delay_days).toBe(5);
  });

  it('only updates matching step ID', () => {
    const steps = [
      makeStep({ id: 'step-1', subject: 'First' }),
      makeStep({ id: 'step-2', subject: 'Second', step_number: 2 })
    ];
    const sequences = [makeSequence({ id: 'seq-1', email_sequence_steps: steps })];
    const result = updateStepInSequences(sequences, 'step-1', { subject: 'Updated First' });
    expect(result[0].email_sequence_steps[0].subject).toBe('Updated First');
    expect(result[0].email_sequence_steps[1].subject).toBe('Second');
  });

  it('searches across all sequences', () => {
    const sequences = [
      makeSequence({ id: 'seq-1', email_sequence_steps: [makeStep({ id: 'step-A', subject: 'A' })] }),
      makeSequence({ id: 'seq-2', email_sequence_steps: [makeStep({ id: 'step-B', subject: 'B' })] })
    ];
    const result = updateStepInSequences(sequences, 'step-B', { subject: 'Updated B' });
    expect(result[0].email_sequence_steps[0].subject).toBe('A');
    expect(result[1].email_sequence_steps[0].subject).toBe('Updated B');
  });

  it('handles null email_sequence_steps gracefully', () => {
    const sequences = [makeSequence({ id: 'seq-1', email_sequence_steps: null })];
    const result = updateStepInSequences(sequences, 'step-1', { subject: 'X' });
    expect(result[0].email_sequence_steps).toEqual([]);
  });

  it('does not mutate the original', () => {
    const steps = [makeStep({ id: 'step-1', subject: 'Original' })];
    const sequences = [makeSequence({ id: 'seq-1', email_sequence_steps: steps })];
    updateStepInSequences(sequences, 'step-1', { subject: 'Changed' });
    expect(sequences[0].email_sequence_steps[0].subject).toBe('Original');
  });
});

// ==================== INTEGRATION SCENARIOS ====================

describe('End-to-End Sequence Workflows', () => {
  describe('Create → Add Steps → Modify → Delete Flow', () => {
    it('simulates full sequence lifecycle', () => {
      let sequences = [];

      // 1. Create a sequence (simulating what comes back from Supabase)
      const dbSequence = {
        id: 'seq-new',
        name: 'Post-Demo Follow-up',
        description: 'Automated nurture after demo',
        trigger_type: 'milestone',
        trigger_value: 'ceoMeetingHeld',
        is_active: true,
        from_name: 'Sales',
        reply_to: 'sales@acme.com',
        email_sequence_steps: []
      };
      sequences = addSequenceToList(sequences, dbSequence);
      expect(sequences).toHaveLength(1);
      expect(sequences[0].name).toBe('Post-Demo Follow-up');

      // 2. Add step 1 (immediate)
      const step1 = { id: 'step-1', sequence_id: 'seq-new', step_number: 1, delay_days: 0, delay_hours: 0, subject: 'Thanks for the meeting!', body_html: '<p>Hi!</p>' };
      sequences = addStepToSequence(sequences, 'seq-new', step1);
      expect(sequences[0].email_sequence_steps).toHaveLength(1);

      // 3. Add step 2 (2 day delay)
      const step2 = { id: 'step-2', sequence_id: 'seq-new', step_number: 2, delay_days: 2, delay_hours: 0, subject: 'Quick follow-up', body_html: '<p>Just checking in</p>' };
      sequences = addStepToSequence(sequences, 'seq-new', step2);
      expect(sequences[0].email_sequence_steps).toHaveLength(2);
      expect(sequences[0].email_sequence_steps[0].step_number).toBe(1);
      expect(sequences[0].email_sequence_steps[1].step_number).toBe(2);

      // 4. Update step 2 delay
      sequences = updateStepInSequences(sequences, 'step-2', { delay_days: 3, delay_hours: 6 });
      expect(sequences[0].email_sequence_steps[1].delay_days).toBe(3);
      expect(sequences[0].email_sequence_steps[1].delay_hours).toBe(6);

      // 5. Update step 2 subject
      sequences = updateStepInSequences(sequences, 'step-2', { subject: 'Checking in about our meeting' });
      expect(sequences[0].email_sequence_steps[1].subject).toBe('Checking in about our meeting');

      // 6. Pause sequence
      sequences = toggleSequenceInList(sequences, 'seq-new');
      expect(sequences[0].is_active).toBe(false);

      // 7. Re-activate
      sequences = toggleSequenceInList(sequences, 'seq-new');
      expect(sequences[0].is_active).toBe(true);

      // 8. Remove step 1
      sequences = removeStepFromSequence(sequences, 'seq-new', 'step-1');
      expect(sequences[0].email_sequence_steps).toHaveLength(1);
      expect(sequences[0].email_sequence_steps[0].id).toBe('step-2');

      // 9. Delete sequence
      sequences = removeSequenceFromList(sequences, 'seq-new');
      expect(sequences).toHaveLength(0);
    });
  });

  describe('Multi-Sequence Management', () => {
    it('manages multiple sequences independently', () => {
      let sequences = [];

      // Add 3 sequences
      sequences = addSequenceToList(sequences, makeSequence({ id: 'seq-A', name: 'Seq A', is_active: true }));
      sequences = addSequenceToList(sequences, makeSequence({ id: 'seq-B', name: 'Seq B', is_active: true }));
      sequences = addSequenceToList(sequences, makeSequence({ id: 'seq-C', name: 'Seq C', is_active: false }));
      expect(sequences).toHaveLength(3);

      // Add steps to different sequences
      sequences = addStepToSequence(sequences, 'seq-A', makeStep({ id: 'sA-1', step_number: 1 }));
      sequences = addStepToSequence(sequences, 'seq-B', makeStep({ id: 'sB-1', step_number: 1 }));
      sequences = addStepToSequence(sequences, 'seq-B', makeStep({ id: 'sB-2', step_number: 2 }));

      // Verify step counts per sequence
      const seqA = sequences.find(s => s.id === 'seq-A');
      const seqB = sequences.find(s => s.id === 'seq-B');
      const seqC = sequences.find(s => s.id === 'seq-C');
      expect(seqA.email_sequence_steps).toHaveLength(1);
      expect(seqB.email_sequence_steps).toHaveLength(2);
      expect(seqC.email_sequence_steps).toHaveLength(0);

      // Toggle one, others unchanged
      sequences = toggleSequenceInList(sequences, 'seq-A');
      expect(sequences.find(s => s.id === 'seq-A').is_active).toBe(false);
      expect(sequences.find(s => s.id === 'seq-B').is_active).toBe(true);

      // Delete middle sequence, verify others intact
      sequences = removeSequenceFromList(sequences, 'seq-B');
      expect(sequences).toHaveLength(2);
      expect(sequences.find(s => s.id === 'seq-A')).toBeDefined();
      expect(sequences.find(s => s.id === 'seq-C')).toBeDefined();
    });
  });

  describe('Payload Validation → Build Pipeline', () => {
    it('validates then builds a manual sequence payload', () => {
      const form = { name: 'Welcome Drip', triggerType: 'manual', triggerValue: '', fromName: 'Team', replyTo: '' };
      const validation = validateSequence(form);
      expect(validation.valid).toBe(true);

      const payload = buildSequencePayload(form, 'org-1', 'user-1');
      expect(payload.name).toBe('Welcome Drip');
      expect(payload.trigger_type).toBe('manual');
      expect(payload.trigger_value).toBeNull();
    });

    it('validates then builds a status_change sequence payload', () => {
      const form = { name: 'Qualified Nurture', triggerType: 'status_change', triggerValue: 'Qualified', replyTo: 'team@co.com' };
      const validation = validateSequence(form);
      expect(validation.valid).toBe(true);

      const payload = buildSequencePayload(form, 'org-1', 'user-1');
      expect(payload.trigger_type).toBe('status_change');
      expect(payload.trigger_value).toBe('Qualified');
    });

    it('validates then builds a milestone sequence payload', () => {
      const form = { name: 'Post-Discovery', triggerType: 'milestone', triggerValue: 'discoveryCall' };
      const validation = validateSequence(form);
      expect(validation.valid).toBe(true);

      const payload = buildSequencePayload(form, 'org-1', 'user-1');
      expect(payload.trigger_type).toBe('milestone');
      expect(payload.trigger_value).toBe('discoveryCall');
    });

    it('rejects invalid form before building payload', () => {
      const form = { name: '', triggerType: 'bogus' };
      const validation = validateSequence(form);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Step Payload → Add → Update Pipeline', () => {
    it('builds step payload and adds to sequence', () => {
      const seq = makeSequence({ id: 'seq-1', email_sequence_steps: [] });
      const nextNum = getNextStepNumber(seq);
      expect(nextNum).toBe(1);

      const stepPayload = buildStepPayload('seq-1', nextNum);
      expect(stepPayload.delay_days).toBe(0);
      expect(stepPayload.step_number).toBe(1);

      // Simulate Supabase returning the step with an ID
      const savedStep = { ...stepPayload, id: 'step-new-1' };
      let sequences = [seq];
      sequences = addStepToSequence(sequences, 'seq-1', savedStep);
      expect(sequences[0].email_sequence_steps).toHaveLength(1);

      // Add second step
      const nextNum2 = getNextStepNumber(sequences[0]);
      expect(nextNum2).toBe(2);

      const stepPayload2 = buildStepPayload('seq-1', nextNum2);
      expect(stepPayload2.delay_days).toBe(2);

      const savedStep2 = { ...stepPayload2, id: 'step-new-2' };
      sequences = addStepToSequence(sequences, 'seq-1', savedStep2);
      expect(sequences[0].email_sequence_steps).toHaveLength(2);

      // Update the second step
      sequences = updateStepInSequences(sequences, 'step-new-2', {
        subject: 'Custom follow-up',
        delay_days: 5,
        body_html: '<p>Custom body</p>'
      });

      const updatedStep = sequences[0].email_sequence_steps[1];
      expect(updatedStep.subject).toBe('Custom follow-up');
      expect(updatedStep.delay_days).toBe(5);
      expect(updatedStep.body_html).toBe('<p>Custom body</p>');

      // Verify delay formatting
      expect(formatStepDelay(sequences[0].email_sequence_steps[0], 0)).toBe('Immediate');
      expect(formatStepDelay(updatedStep, 1)).toBe('5d 0h delay');
    });
  });
});
