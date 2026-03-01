/**
 * @module utils/sequences
 * @description Pure business logic for email sequence management
 *
 * PURPOSE:
 * - Provide constants, validation, payload builders, and state updaters for email sequences
 * - Keep all sequence logic testable and independent of React/Supabase
 *
 * DEPENDENCIES:
 * - None (pure functions, no external deps)
 *
 * EXPORTS:
 * - TRIGGER_TYPES - Valid trigger type values
 * - TRIGGER_LABELS - Human-readable trigger labels
 * - STATUS_TRIGGER_VALUES - Valid status_change trigger values
 * - MILESTONE_TRIGGER_VALUES - Valid milestone trigger values
 * - DEFAULT_NEW_SEQUENCE - Default empty sequence form state
 * - DEFAULT_STEP_BODY - Default HTML body for new steps
 * - TEMPLATE_TOKENS - Available template tokens for email bodies
 * - validateSequenceName - Check if a sequence name is valid
 * - validateSequence - Full sequence validation
 * - validateStepFields - Validate step delay/subject fields
 * - buildSequencePayload - Build Supabase insert payload from form data
 * - buildStepPayload - Build default step insert payload
 * - addSequenceToList - Immutably prepend a new sequence
 * - removeSequenceFromList - Immutably remove a sequence by ID
 * - toggleSequenceInList - Immutably toggle is_active for a sequence
 * - addStepToSequence - Immutably add a step to a sequence's steps
 * - removeStepFromSequence - Immutably remove a step from a sequence
 * - updateStepInSequences - Immutably update step fields across sequences
 * - sortSteps - Sort steps by step_number ascending
 * - getNextStepNumber - Calculate the next step number for a sequence
 * - formatStepDelay - Human-readable delay string for a step
 *
 * PATTERNS:
 * - All state updater functions are pure: (currentState, ...args) => newState
 * - Payload builders return plain objects ready for Supabase .insert()
 * - Validation functions return { valid, error } objects
 *
 * CLAUDE NOTES:
 * - Trigger types: 'manual', 'status_change', 'milestone'
 * - First step always has delay_days=0, delay_hours=0 (immediate)
 * - Steps are sorted by step_number ascending
 * - Template tokens use double curly brace syntax: {{firstName}}
 */

// ==================== CONSTANTS ====================

export const TRIGGER_TYPES = ['manual', 'status_change', 'milestone'];

export const TRIGGER_LABELS = {
  manual: 'Manual enrollment',
  status_change: 'When status changes to',
  milestone: 'When milestone reached'
};

export const STATUS_TRIGGER_VALUES = ['Qualified', 'Follow Up', 'Deck Sent'];

export const MILESTONE_TRIGGER_VALUES = ['deckSent', 'discoveryCall', 'ceoMeetingHeld', 'proposalSent'];

export const DEFAULT_NEW_SEQUENCE = {
  name: '',
  description: '',
  triggerType: 'manual',
  triggerValue: '',
  fromName: '',
  replyTo: '',
  isActive: true,
  steps: []
};

export const DEFAULT_STEP_BODY = '<p>Hi {{firstName}},</p><p>Just following up on my previous email...</p><p>Best,<br>{{companyName}} Team</p>';

export const TEMPLATE_TOKENS = ['{{contact}}', '{{firstName}}', '{{company}}', '{{companyName}}', '{{ceoName}}'];

// ==================== VALIDATION ====================

/**
 * Validate a sequence name
 * @param {string} name - Sequence name to validate
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateSequenceName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Sequence name is required' };
  }
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Sequence name cannot be empty' };
  }
  if (trimmed.length > 200) {
    return { valid: false, error: 'Sequence name must be 200 characters or fewer' };
  }
  return { valid: true, error: null };
}

/**
 * Validate a full sequence form object
 * @param {Object} sequence - Sequence form data
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateSequence(sequence) {
  const errors = [];

  if (!sequence || typeof sequence !== 'object') {
    return { valid: false, errors: ['Invalid sequence data'] };
  }

  const nameResult = validateSequenceName(sequence.name);
  if (!nameResult.valid) {
    errors.push(nameResult.error);
  }

  if (!TRIGGER_TYPES.includes(sequence.triggerType)) {
    errors.push(`Invalid trigger type: ${sequence.triggerType}`);
  }

  if (sequence.triggerType === 'status_change' && sequence.triggerValue) {
    if (!STATUS_TRIGGER_VALUES.includes(sequence.triggerValue)) {
      errors.push(`Invalid status trigger value: ${sequence.triggerValue}`);
    }
  }

  if (sequence.triggerType === 'milestone' && sequence.triggerValue) {
    if (!MILESTONE_TRIGGER_VALUES.includes(sequence.triggerValue)) {
      errors.push(`Invalid milestone trigger value: ${sequence.triggerValue}`);
    }
  }

  if (sequence.replyTo && sequence.replyTo.trim()) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(sequence.replyTo.trim())) {
      errors.push('Reply-to must be a valid email address');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate step fields
 * @param {Object} step - Step fields to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateStepFields(step) {
  const errors = [];

  if (!step || typeof step !== 'object') {
    return { valid: false, errors: ['Invalid step data'] };
  }

  if (step.delay_days !== undefined) {
    if (typeof step.delay_days !== 'number' || step.delay_days < 0) {
      errors.push('Delay days must be a non-negative number');
    }
  }

  if (step.delay_hours !== undefined) {
    if (typeof step.delay_hours !== 'number' || step.delay_hours < 0 || step.delay_hours > 23) {
      errors.push('Delay hours must be between 0 and 23');
    }
  }

  if (step.subject !== undefined) {
    if (typeof step.subject !== 'string' || step.subject.trim().length === 0) {
      errors.push('Subject is required');
    }
  }

  return { valid: errors.length === 0, errors };
}

// ==================== PAYLOAD BUILDERS ====================

/**
 * Build a Supabase-ready sequence insert payload from form data
 * @param {Object} formData - Sequence form data (camelCase)
 * @param {string} organizationId - Organization UUID
 * @param {string} userId - User UUID
 * @returns {Object} Supabase insert payload (snake_case)
 */
export function buildSequencePayload(formData, organizationId, userId) {
  return {
    organization_id: organizationId,
    name: formData.name,
    description: formData.description || '',
    trigger_type: formData.triggerType || 'manual',
    trigger_value: formData.triggerValue || null,
    from_name: formData.fromName || null,
    reply_to: formData.replyTo || null,
    is_active: formData.isActive !== undefined ? formData.isActive : true,
    created_by: userId
  };
}

/**
 * Build a Supabase-ready step insert payload
 * @param {string} sequenceId - Parent sequence UUID
 * @param {number} stepNumber - Step position (1-based)
 * @returns {Object} Supabase insert payload
 */
export function buildStepPayload(sequenceId, stepNumber) {
  return {
    sequence_id: sequenceId,
    step_number: stepNumber,
    delay_days: stepNumber === 1 ? 0 : 2,
    delay_hours: 0,
    subject: `Step ${stepNumber}: Follow-up`,
    body_html: DEFAULT_STEP_BODY,
    skip_conditions: { if_replied: true }
  };
}

// ==================== STATE UPDATERS ====================

/**
 * Sort steps by step_number ascending
 * @param {Array} steps - Array of step objects
 * @returns {Array} Sorted copy
 */
export function sortSteps(steps) {
  if (!Array.isArray(steps)) return [];
  return [...steps].sort((a, b) => a.step_number - b.step_number);
}

/**
 * Get the next step number for a sequence
 * @param {Object} sequence - Sequence with email_sequence_steps
 * @returns {number} Next step number
 */
export function getNextStepNumber(sequence) {
  const steps = sequence?.email_sequence_steps;
  if (!Array.isArray(steps) || steps.length === 0) return 1;
  return steps.length + 1;
}

/**
 * Format a human-readable delay string for a step
 * @param {Object} step - Step object
 * @param {number} index - Step index (0-based)
 * @returns {string} Delay description
 */
export function formatStepDelay(step, index) {
  if (index === 0) return 'Immediate';
  const days = step.delay_days || 0;
  const hours = step.delay_hours || 0;
  return `${days}d ${hours}h delay`;
}

/**
 * Immutably prepend a new sequence to the list
 * @param {Array} sequences - Current sequence list
 * @param {Object} newSequence - Sequence from Supabase (with id)
 * @returns {Array} Updated list with new sequence prepended
 */
export function addSequenceToList(sequences, newSequence) {
  return [{ ...newSequence, email_sequence_steps: newSequence.email_sequence_steps || [] }, ...sequences];
}

/**
 * Immutably remove a sequence from the list
 * @param {Array} sequences - Current sequence list
 * @param {string} sequenceId - ID to remove
 * @returns {Array} Updated list without the sequence
 */
export function removeSequenceFromList(sequences, sequenceId) {
  return sequences.filter(s => s.id !== sequenceId);
}

/**
 * Immutably toggle is_active for a sequence
 * @param {Array} sequences - Current sequence list
 * @param {string} sequenceId - ID to toggle
 * @returns {Array} Updated list with toggled sequence
 */
export function toggleSequenceInList(sequences, sequenceId) {
  return sequences.map(s =>
    s.id === sequenceId ? { ...s, is_active: !s.is_active } : s
  );
}

/**
 * Immutably add a step to a sequence's steps (sorted)
 * @param {Array} sequences - Current sequence list
 * @param {string} sequenceId - Parent sequence ID
 * @param {Object} newStep - Step object from Supabase
 * @returns {Array} Updated list with new step added and sorted
 */
export function addStepToSequence(sequences, sequenceId, newStep) {
  return sequences.map(s => {
    if (s.id !== sequenceId) return s;
    const steps = [...(s.email_sequence_steps || []), newStep];
    return { ...s, email_sequence_steps: sortSteps(steps) };
  });
}

/**
 * Immutably remove a step from a sequence
 * @param {Array} sequences - Current sequence list
 * @param {string} sequenceId - Parent sequence ID
 * @param {string} stepId - Step ID to remove
 * @returns {Array} Updated list without the step
 */
export function removeStepFromSequence(sequences, sequenceId, stepId) {
  return sequences.map(s => {
    if (s.id !== sequenceId) return s;
    return {
      ...s,
      email_sequence_steps: (s.email_sequence_steps || []).filter(st => st.id !== stepId)
    };
  });
}

/**
 * Immutably update step fields across all sequences
 * @param {Array} sequences - Current sequence list
 * @param {string} stepId - Step ID to update
 * @param {Object} updates - Fields to merge into the step
 * @returns {Array} Updated list with modified step
 */
export function updateStepInSequences(sequences, stepId, updates) {
  return sequences.map(s => ({
    ...s,
    email_sequence_steps: (s.email_sequence_steps || []).map(st =>
      st.id === stepId ? { ...st, ...updates } : st
    )
  }));
}
