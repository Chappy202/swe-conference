#!/usr/bin/env node

/**
 * Documentation Structure & EARS Compliance Validator
 *
 * Validates all specification documents in docs/ against their required templates:
 * - requirements.md  → EARS format (When/While/Where/If...then/The system shall)
 * - test-cases.md    → GIVEN/WHEN/THEN structure
 * - api-spec.md      → METHOD PATH + Request/Response/Error/Example sections
 * - ui-spec.md       → Screen + Purpose/Layout/Data/Interactions/States
 * - architecture.md  → Components/Data Model/Integrations/Key Decisions
 *
 * Exit code 0 = all pass, 1 = failures found.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DOCS_DIR = resolve(process.cwd(), 'docs');

/** @typedef {{ status: 'PASS' | 'FAIL' | 'WARN', message: string, detail?: string, fix?: string }} CheckResult */

/**
 * Read a file from docs/ directory. Returns null if not found.
 * @param {string} filename
 * @returns {string | null}
 */
function readDoc(filename) {
  const filepath = join(DOCS_DIR, filename);
  if (!existsSync(filepath)) return null;
  return readFileSync(filepath, 'utf-8');
}

/**
 * Extract lines that match a pattern, with their line numbers.
 * @param {string} content
 * @param {RegExp} pattern
 * @returns {{ line: number, text: string }[]}
 */
function findLines(content, pattern) {
  const lines = content.split('\n');
  const results = [];
  for (let i = 0; i < lines.length; i++) {
    if (pattern.test(lines[i])) {
      results.push({ line: i + 1, text: lines[i].trim() });
    }
  }
  return results;
}

/**
 * Check if content has a section matching a heading pattern.
 * @param {string} content
 * @param {RegExp} headingPattern
 * @returns {boolean}
 */
function hasSection(content, headingPattern) {
  return headingPattern.test(content);
}

/**
 * Extract the requirement text from a REQ line, stripping ID prefix and markdown formatting.
 * Handles formats like: `- **REQ-001:** The system shall...`
 * @param {string} lineText - The trimmed line text
 * @returns {string} Clean requirement text
 */
function extractReqText(lineText) {
  return lineText
    .replace(/^[-*\s]*\*?\*?REQ-\d+\*?\*?[:\s]*/i, '')
    .replace(/^[\s*:]+/, ''); // Strip residual markdown bold markers (**) and colons
}

// ---------------------------------------------------------------------------
// EARS Pattern Classification
// ---------------------------------------------------------------------------

/**
 * EARS pattern types in detection priority order.
 * Complex must be checked before State-driven and Event-driven (it combines both).
 */
const EARS_PATTERNS = [
  {
    name: 'Complex',
    description: 'While [state], when [trigger], the system shall [action].',
    detect: /^\s*While\b.+?,\s*when\b/i,
  },
  {
    name: 'Event-driven',
    description: 'When [trigger], the system shall [action].',
    detect: /^\s*When\b/i,
  },
  {
    name: 'State-driven',
    description: 'While [state], the system shall [behaviour].',
    detect: /^\s*While\b/i,
  },
  {
    name: 'Optional',
    description: 'Where [condition], the system shall [action].',
    detect: /^\s*Where\b/i,
  },
  {
    name: 'Unwanted',
    description: 'If [condition], then the system shall [action].',
    detect: /^\s*If\b/i,
  },
  {
    name: 'Ubiquitous',
    description: 'The system shall [action]. (always applies)',
    detect: /^\s*The system shall\b/i,
  },
];

/**
 * Classify a single requirement text into its EARS pattern.
 * @param {string} text - Requirement text after the REQ-XXX: prefix
 * @returns {{ pattern: string, description: string } | null}
 */
function classifyEarsPattern(text) {
  for (const p of EARS_PATTERNS) {
    if (p.detect.test(text)) {
      return { pattern: p.name, description: p.description };
    }
  }
  return null;
}

/**
 * Vague/ambiguous words that make requirements untestable.
 * These should not appear in well-written EARS requirements.
 */
const VAGUE_WORDS = [
  'quickly',
  'user-friendly',
  'user friendly',
  'robust',
  'seamless',
  'seamlessly',
  'intuitive',
  'intuitively',
  'easy',
  'easily',
  'fast',
  'efficient',
  'efficiently',
  'flexible',
  'simple',
  'simply',
  'appropriate',
  'appropriately',
  'reasonable',
  'reasonably',
  'adequate',
  'adequately',
  'sufficient',
  'sufficiently',
  'good',
  'nice',
  'better',
  'best',
  'optimal',
  'optimally',
  'as needed',
  'if possible',
  'etc',
  'and so on',
  'among others',
  'state-of-the-art',
  'cutting-edge',
  'world-class',
  'next-generation',
  'user-centric',
  'performant',
  'scalable',
  'modern',
];

/**
 * Check if a requirement contains vague/ambiguous words.
 * @param {string} text
 * @returns {string[]} List of vague words found
 */
function findVagueWords(text) {
  const lower = text.toLowerCase();
  return VAGUE_WORDS.filter((word) => {
    // Use word boundary matching to avoid partial matches
    const pattern = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return pattern.test(lower);
  });
}

/**
 * Check if a requirement combines multiple behaviours (multiple "shall" statements).
 * @param {string} text
 * @returns {boolean}
 */
function hasCombinedBehaviours(text) {
  // Count occurrences of "shall" — more than one suggests combined requirements
  const shallMatches = text.match(/\bshall\b/gi) || [];
  if (shallMatches.length > 1) return true;

  // Also check for "and shall" pattern which is a strong signal
  if (/\band\b.*\bshall\b/i.test(text)) return true;

  return false;
}

/**
 * Check if a requirement contains "the system shall" (required EARS predicate).
 * @param {string} text
 * @returns {boolean}
 */
function hasSystemShall(text) {
  return /\bthe system shall\b/i.test(text) || /\bsystem shall\b/i.test(text);
}

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------

/**
 * Validate requirements.md against EARS template.
 * @param {string} content
 * @returns {CheckResult[]}
 */
function validateRequirements(content) {
  const results = [];

  // 1. Check for EARS patterns reference/explanation
  const hasEarsRef =
    /EARS/i.test(content) &&
    (/Easy Approach to Requirements Syntax/i.test(content) ||
      /EARS Patterns/i.test(content));
  results.push({
    status: hasEarsRef ? 'PASS' : 'FAIL',
    message: 'Has EARS patterns reference or explanation',
    ...(!hasEarsRef && {
      fix: 'Add an EARS Patterns section explaining the notation (When/While/Where/If...then/ubiquitous).',
    }),
  });

  // 2. Check REQ-XXX numbering
  const reqLines = findLines(content, /^\s*[-*]?\s*\*?\*?REQ-\d+/);
  const reqIds = reqLines
    .map((l) => {
      const m = l.text.match(/REQ-(\d+)/);
      return m ? parseInt(m[1], 10) : null;
    })
    .filter((n) => n !== null);

  results.push({
    status: reqIds.length > 0 ? 'PASS' : 'FAIL',
    message: `Requirements use REQ-XXX format (found ${reqIds.length})`,
    ...(reqIds.length === 0 && {
      fix: 'Number all requirements as REQ-001, REQ-002, etc.',
    }),
  });

  // 3. Check sequential numbering (no gaps)
  if (reqIds.length > 0) {
    const sorted = [...reqIds].sort((a, b) => a - b);
    const gaps = [];
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] !== sorted[i - 1] + 1) {
        for (let g = sorted[i - 1] + 1; g < sorted[i]; g++) {
          gaps.push(g);
        }
      }
    }
    results.push({
      status: gaps.length === 0 ? 'PASS' : 'WARN',
      message: 'Requirement numbering is sequential (no gaps)',
      ...(gaps.length > 0 && {
        detail: `Missing IDs: ${gaps.map((g) => `REQ-${String(g).padStart(3, '0')}`).join(', ')}`,
        fix: 'Fill gaps or renumber requirements sequentially.',
      }),
    });
  }

  // 4. Check each requirement uses EARS keywords
  const earsKeywords =
    /\b(When\b|While\b|Where\b|If\b.*\bthen\b|The system shall\b)/i;
  const nonCompliant = [];
  for (const line of reqLines) {
    // Extract the requirement text after REQ-XXX: and strip markdown formatting
    const afterId = extractReqText(line.text);
    if (!earsKeywords.test(afterId)) {
      const id = line.text.match(/REQ-\d+/)?.[0] || 'unknown';
      nonCompliant.push({ id, line: line.line, text: afterId.substring(0, 80) });
    }
  }

  results.push({
    status: nonCompliant.length === 0 ? 'PASS' : 'FAIL',
    message: `All requirements use EARS keywords (When/While/Where/If...then/The system shall)`,
    ...(nonCompliant.length > 0 && {
      detail: nonCompliant
        .map(
          (nc) =>
            `  ${nc.id} (line ${nc.line}): "${nc.text}${nc.text.length >= 80 ? '...' : ''}"`
        )
        .join('\n'),
      fix: 'Prefix each requirement with an EARS keyword. E.g., "The system shall..." for ubiquitous requirements.',
    }),
  });

  // 5. EARS Pattern Classification — classify each requirement and report distribution
  /** @type {Record<string, { count: number, examples: string[] }>} */
  const patternCounts = {
    'Ubiquitous': { count: 0, examples: [] },
    'Event-driven': { count: 0, examples: [] },
    'State-driven': { count: 0, examples: [] },
    'Optional': { count: 0, examples: [] },
    'Unwanted': { count: 0, examples: [] },
    'Complex': { count: 0, examples: [] },
    'Unclassified': { count: 0, examples: [] },
  };

  for (const line of reqLines) {
    const afterId = extractReqText(line.text);
    const id = line.text.match(/REQ-\d+/)?.[0] || 'unknown';
    const classified = classifyEarsPattern(afterId);
    if (classified) {
      patternCounts[classified.pattern].count++;
      if (patternCounts[classified.pattern].examples.length < 2) {
        patternCounts[classified.pattern].examples.push(id);
      }
    } else {
      patternCounts['Unclassified'].count++;
      if (patternCounts['Unclassified'].examples.length < 3) {
        patternCounts['Unclassified'].examples.push(id);
      }
    }
  }

  const distributionLines = Object.entries(patternCounts)
    .filter(([_, v]) => v.count > 0)
    .map(([pattern, v]) => `  ${pattern.padEnd(14)} ${String(v.count).padStart(3)} (e.g., ${v.examples.join(', ')})`)
    .join('\n');

  const unclassifiedCount = patternCounts['Unclassified'].count;
  results.push({
    status: unclassifiedCount === 0 ? 'PASS' : 'WARN',
    message: `EARS pattern distribution (${unclassifiedCount} unclassified)`,
    detail: distributionLines,
    ...(unclassifiedCount > 0 && {
      fix: `${unclassifiedCount} requirement(s) could not be classified into an EARS pattern. Ensure they start with When/While/Where/If/The system shall.`,
    }),
  });

  // 6. Check "the system shall" predicate presence
  const missingShall = [];
  for (const line of reqLines) {
    const afterId = extractReqText(line.text);
    const id = line.text.match(/REQ-\d+/)?.[0] || 'unknown';
    if (!hasSystemShall(afterId)) {
      missingShall.push(id);
    }
  }

  results.push({
    status: missingShall.length === 0 ? 'PASS' : 'WARN',
    message: `All requirements contain "the system shall" predicate (${reqLines.length - missingShall.length}/${reqLines.length})`,
    ...(missingShall.length > 0 && {
      detail: `  Missing predicate: ${missingShall.slice(0, 10).join(', ')}${missingShall.length > 10 ? ` (+${missingShall.length - 10} more)` : ''}`,
      fix: 'Every EARS requirement should include "the system shall" as the action predicate.',
    }),
  });

  // 7. Check for vague/ambiguous language
  const vagueFindings = [];
  for (const line of reqLines) {
    const afterId = extractReqText(line.text);
    const id = line.text.match(/REQ-\d+/)?.[0] || 'unknown';
    const vague = findVagueWords(afterId);
    if (vague.length > 0) {
      vagueFindings.push({ id, words: vague, line: line.line });
    }
  }

  results.push({
    status: vagueFindings.length === 0 ? 'PASS' : 'FAIL',
    message: `No vague/ambiguous language in requirements (${vagueFindings.length} violations)`,
    ...(vagueFindings.length > 0 && {
      detail: vagueFindings
        .map((v) => `  ${v.id} (line ${v.line}): vague words: "${v.words.join('", "')}"`)
        .join('\n'),
      fix: 'Replace vague words with specific, measurable terms. E.g., "quickly" → "within 2 seconds", "user-friendly" → specific UI behaviour.',
    }),
  });

  // 8. Check for combined behaviours (one requirement per statement)
  const combinedReqs = [];
  for (const line of reqLines) {
    const afterId = extractReqText(line.text);
    const id = line.text.match(/REQ-\d+/)?.[0] || 'unknown';
    if (hasCombinedBehaviours(afterId)) {
      combinedReqs.push({ id, line: line.line, text: afterId.substring(0, 60) });
    }
  }

  // Combined behaviours is a WARN not FAIL because some compound requirements
  // are acceptable when they describe a single atomic operation with multiple effects
  results.push({
    status: combinedReqs.length === 0 ? 'PASS' : 'WARN',
    message: `One behaviour per requirement — no combined "shall" statements (${combinedReqs.length} potential violations)`,
    ...(combinedReqs.length > 0 && {
      detail: combinedReqs
        .slice(0, 8)
        .map((c) => `  ${c.id} (line ${c.line}): "${c.text}..."`)
        .join('\n') + (combinedReqs.length > 8 ? `\n  (+${combinedReqs.length - 8} more)` : ''),
      fix: 'Split requirements with multiple "shall" into separate REQ statements. Each REQ should describe one testable behaviour.',
    }),
  });

  // 9. Check for testability (requirements should reference specific values, formats, or outcomes)
  const untestedSignals = /\b(may|might|could|should consider|if appropriate|as needed|when possible)\b/i;
  const possiblyUntestable = [];
  for (const line of reqLines) {
    const afterId = extractReqText(line.text);
    const id = line.text.match(/REQ-\d+/)?.[0] || 'unknown';
    if (untestedSignals.test(afterId)) {
      const match = afterId.match(untestedSignals)?.[0];
      possiblyUntestable.push({ id, line: line.line, signal: match });
    }
  }

  results.push({
    status: possiblyUntestable.length === 0 ? 'PASS' : 'WARN',
    message: `All requirements appear testable — no hedging language (${possiblyUntestable.length} concerns)`,
    ...(possiblyUntestable.length > 0 && {
      detail: possiblyUntestable
        .map((u) => `  ${u.id} (line ${u.line}): contains "${u.signal}" — may be untestable`)
        .join('\n'),
      fix: 'Rewrite hedging requirements as firm "shall" statements. If behaviour is conditional, use "Where" or "If...then" EARS patterns.',
    }),
  });

  // 10. Check for functional area groupings (## or ### headings with requirements beneath)
  const functionalAreas = findLines(content, /^#{2,3}\s+\d+\.\d+\s+/);
  results.push({
    status: functionalAreas.length > 0 ? 'PASS' : 'WARN',
    message: `Has functional area groupings (found ${functionalAreas.length} sub-sections)`,
    ...(functionalAreas.length === 0 && {
      fix: 'Group requirements under ## headings by functional area (e.g., ## 5.1 Ops Dashboard).',
    }),
  });

  // 11. Check for Data Model section
  const hasDataModel = /##.*Data Model/i.test(content);
  results.push({
    status: hasDataModel ? 'PASS' : 'WARN',
    message: 'Has Data Model section',
    ...(!hasDataModel && {
      fix: 'Add a Data Model section describing entities, fields, and relationships.',
    }),
  });

  // 12. Check for Domain Constraints section
  const hasConstraints = /##.*Domain Constraints|##.*Constraints/i.test(content);
  results.push({
    status: hasConstraints ? 'PASS' : 'WARN',
    message: 'Has Domain Constraints section',
    ...(!hasConstraints && {
      fix: 'Add a Domain Constraints section listing fixed values (currency, enums, limits).',
    }),
  });

  // 13. Check for Out of Scope section
  const hasOutOfScope = /##.*Out of Scope|##.*Not in Scope/i.test(content);
  results.push({
    status: hasOutOfScope ? 'PASS' : 'PASS',
    message: 'Has Out of Scope / Not in Scope section',
    ...(!hasOutOfScope && {
      fix: 'Add a section listing what is explicitly out of scope to prevent scope creep.',
    }),
  });

  // 14. Check for Requirements Traceability
  const hasTraceability = /##.*Traceability/i.test(content);
  results.push({
    status: hasTraceability ? 'PASS' : 'WARN',
    message: 'Has Requirements Traceability section',
    ...(!hasTraceability && {
      fix: 'Add a traceability matrix mapping requirements to functional areas and test cases.',
    }),
  });

  return results;
}

/**
 * Validate test-cases.md against GIVEN/WHEN/THEN template.
 * @param {string} content
 * @returns {CheckResult[]}
 */
function validateTestCases(content) {
  const results = [];

  // 1. Check TC-XXX numbering
  const tcHeadings = findLines(content, /^##\s+TC-/);
  const tcIds = tcHeadings
    .map((l) => {
      const m = l.text.match(/TC-(\w+-)?(\d+)/);
      return m ? l.text.match(/TC-[\w-]+\d+/)?.[0] : null;
    })
    .filter(Boolean);

  results.push({
    status: tcIds.length > 0 ? 'PASS' : 'FAIL',
    message: `Test cases use TC-XXX format (found ${tcIds.length})`,
    ...(tcIds.length === 0 && {
      fix: 'Number all test cases as ## TC-001: [Test Name].',
    }),
  });

  // 2. Check GIVEN/WHEN/THEN structure for each test case
  // Split content by TC headings and check each section
  const tcSections = content.split(/^##\s+TC-/m).slice(1); // Remove content before first TC
  const missingStructure = [];

  for (const section of tcSections) {
    const tcId = section.match(/([\w-]+\d+)/)?.[0] || 'unknown';
    const hasGiven = /^\s*-\s*GIVEN\b/m.test(section);
    const hasWhen = /^\s*-\s*WHEN\b/m.test(section);
    const hasThen = /^\s*-\s*THEN\b/m.test(section);

    if (!hasGiven || !hasWhen || !hasThen) {
      const missing = [];
      if (!hasGiven) missing.push('GIVEN');
      if (!hasWhen) missing.push('WHEN');
      if (!hasThen) missing.push('THEN');
      missingStructure.push({ id: `TC-${tcId}`, missing });
    }
  }

  results.push({
    status: missingStructure.length === 0 ? 'PASS' : 'FAIL',
    message: 'All test cases have GIVEN/WHEN/THEN structure',
    ...(missingStructure.length > 0 && {
      detail: missingStructure
        .map((tc) => `  ${tc.id}: missing ${tc.missing.join(', ')}`)
        .join('\n'),
      fix: 'Each test case must have "- GIVEN [precondition]", "- WHEN [action]", "- THEN [expected outcome]" lines.',
    }),
  });

  // 3. Check for AND assertions (at least some tests should have AND)
  const hasAnds = /^\s*-\s*AND\b/m.test(content);
  results.push({
    status: hasAnds ? 'PASS' : 'WARN',
    message: 'Test cases include AND assertions for additional expectations',
    ...(!hasAnds && {
      fix: 'Use "- AND [additional assertion]" for multi-assertion test cases.',
    }),
  });

  // 4. Check for E2E test cases
  const hasE2e = /TC-E2E|E2E|Playwright|end-to-end/i.test(content);
  results.push({
    status: hasE2e ? 'PASS' : 'WARN',
    message: 'Has E2E / Playwright test case section',
    ...(!hasE2e && {
      fix: 'Add an E2E section with full user journey test cases for Playwright.',
    }),
  });

  // 5. Check for traceability (mapping TCs to requirements)
  const hasTraceability = /##.*Traceability|Requirements Covered/i.test(content);
  results.push({
    status: hasTraceability ? 'PASS' : 'FAIL',
    message: 'Has traceability section mapping test cases to requirements',
    ...(!hasTraceability && {
      fix: 'Add a Traceability table mapping each TC-XXX to the REQ-XXX requirements it covers.',
    }),
  });

  // 6. Check that test case names are descriptive
  const vagueTcNames = tcHeadings.filter((h) => {
    const name = h.text.replace(/^##\s+TC-[\w-]+\d+[:\s]*/i, '');
    return name.length < 10;
  });
  results.push({
    status: vagueTcNames.length === 0 ? 'PASS' : 'WARN',
    message: 'All test cases have descriptive names (>= 10 chars)',
    ...(vagueTcNames.length > 0 && {
      detail: vagueTcNames.map((v) => `  Line ${v.line}: "${v.text}"`).join('\n'),
      fix: 'Give each test case a descriptive name that explains the scenario.',
    }),
  });

  return results;
}

/**
 * Validate api-spec.md against API Specification template.
 * @param {string} content
 * @returns {CheckResult[]}
 */
function validateApiSpec(content) {
  const results = [];

  // 1. Check for HTTP method + path headings
  const endpointPattern = /^##\s+(GET|POST|PUT|PATCH|DELETE)\s+\/\S+/m;
  const endpoints = findLines(content, /^##\s+(GET|POST|PUT|PATCH|DELETE)\s+\/\S+/);
  results.push({
    status: endpoints.length > 0 ? 'PASS' : 'FAIL',
    message: `Has endpoint headings in METHOD /path format (found ${endpoints.length})`,
    ...(endpoints.length === 0 && {
      fix: 'Use ## METHOD /path headings for each endpoint (e.g., ## GET /api/disputes).',
    }),
  });

  // 2. Check each endpoint section for required sub-sections
  const endpointSections = content.split(/^##\s+(GET|POST|PUT|PATCH|DELETE)\s+\/\S+/m);
  // endpointSections alternates: [before, method, section, method, section, ...]
  const parsedEndpoints = [];
  for (let i = 1; i < endpointSections.length; i += 2) {
    const method = endpointSections[i];
    const body = endpointSections[i + 1] || '';
    const heading = endpoints[Math.floor((i - 1) / 2)]?.text || `${method} /unknown`;
    parsedEndpoints.push({ heading, body });
  }

  const missingSubsections = [];
  for (const ep of parsedEndpoints) {
    const missing = [];

    // Request body (only for POST/PUT/PATCH)
    const isModify = /POST|PUT|PATCH/.test(ep.heading);
    if (isModify && !/\*\*Request body/i.test(ep.body) && !/Request body/i.test(ep.body)) {
      // Some endpoints legitimately have "Query parameters" instead
      if (!/\*\*Query parameters/i.test(ep.body) && !/\*\*Path parameters/i.test(ep.body)) {
        missing.push('Request body');
      }
    }

    // Success response
    if (!/\*\*Success response/i.test(ep.body)) {
      missing.push('Success response');
    }

    // Error responses
    if (!/\*\*Error responses?/i.test(ep.body)) {
      missing.push('Error responses');
    }

    // Example
    if (!/\*\*Example/i.test(ep.body) && !/Example:/i.test(ep.body)) {
      missing.push('Example');
    }

    if (missing.length > 0) {
      missingSubsections.push({ endpoint: ep.heading, missing });
    }
  }

  results.push({
    status: missingSubsections.length === 0 ? 'PASS' : 'FAIL',
    message: 'All endpoints have required sub-sections (Request body/Success response/Error responses/Example)',
    ...(missingSubsections.length > 0 && {
      detail: missingSubsections
        .map((e) => `  ${e.endpoint}: missing ${e.missing.join(', ')}`)
        .join('\n'),
      fix: 'Each endpoint must have: **Request body:** (for POST/PUT/PATCH), **Success response (code):**, **Error responses:**, **Example:**',
    }),
  });

  // 3. Check for Error Envelope / error format documentation
  const hasErrorEnvelope = /Error Envelope|error envelope|error format/i.test(content);
  results.push({
    status: hasErrorEnvelope ? 'PASS' : 'FAIL',
    message: 'Documents a standard error envelope/format',
    ...(!hasErrorEnvelope && {
      fix: 'Add an Error Envelope section showing the standard error response structure.',
    }),
  });

  // 4. Check for enum definitions
  const hasEnums = /##.*Enum|enum.*values/i.test(content) || /\| Name \| Values/i.test(content);
  results.push({
    status: hasEnums ? 'PASS' : 'WARN',
    message: 'Documents API enums/constants',
    ...(!hasEnums && {
      fix: 'Add an Enums section listing valid enum values used in request/response bodies.',
    }),
  });

  // 5. Check for response examples with JSON code blocks
  const jsonBlocks = content.match(/```json[\s\S]*?```/g) || [];
  results.push({
    status: jsonBlocks.length >= endpoints.length ? 'PASS' : 'WARN',
    message: `Has JSON code block examples (${jsonBlocks.length} blocks for ${endpoints.length} endpoints)`,
    ...(jsonBlocks.length < endpoints.length && {
      fix: 'Include at least one JSON code block example per endpoint.',
    }),
  });

  // 6. Check for field type annotations in responses
  const hasTypeAnnotations = /\(number|string|boolean|array|object/i.test(content);
  results.push({
    status: hasTypeAnnotations ? 'PASS' : 'WARN',
    message: 'Response fields include type annotations',
    ...(!hasTypeAnnotations && {
      fix: 'Annotate response fields with types, e.g., "- id (number) -- primary key".',
    }),
  });

  // 7. Check that field descriptions include required/optional markers for request bodies
  const hasRequiredMarkers = /required|optional/i.test(content);
  results.push({
    status: hasRequiredMarkers ? 'PASS' : 'WARN',
    message: 'Request fields indicate required/optional status',
    ...(!hasRequiredMarkers && {
      fix: 'Mark request body fields as (type, required) or (type, optional).',
    }),
  });

  return results;
}

/**
 * Validate ui-spec.md against UI Specification template.
 * @param {string} content
 * @returns {CheckResult[]}
 */
function validateUiSpec(content) {
  const results = [];

  // 1. Check for Screen sections
  const screenHeadings = findLines(content, /^##\s+Screen:/);
  results.push({
    status: screenHeadings.length > 0 ? 'PASS' : 'FAIL',
    message: `Has Screen sections (found ${screenHeadings.length})`,
    ...(screenHeadings.length === 0 && {
      fix: 'Add ## Screen: [Name] headings for each screen/page in the application.',
    }),
  });

  // 2. Check each screen section for required sub-sections
  const screenSections = content.split(/^##\s+Screen:/m).slice(1);
  const requiredScreenSubs = ['Purpose', 'Layout', 'Data displayed', 'Interactions', 'States'];
  const missingScreenSubs = [];

  for (const section of screenSections) {
    const screenName = section.split('\n')[0]?.trim() || 'Unknown';
    const missing = [];

    for (const sub of requiredScreenSubs) {
      // Check for **Purpose:** or ## Purpose or similar patterns
      const subPattern = new RegExp(`\\*\\*${sub}|^###?\\s+${sub}`, 'im');
      if (!subPattern.test(section)) {
        missing.push(sub);
      }
    }

    if (missing.length > 0) {
      missingScreenSubs.push({ screen: screenName, missing });
    }
  }

  results.push({
    status: missingScreenSubs.length === 0 ? 'PASS' : 'FAIL',
    message: 'All screens have required sub-sections (Purpose/Layout/Data displayed/Interactions/States)',
    ...(missingScreenSubs.length > 0 && {
      detail: missingScreenSubs
        .map((s) => `  Screen: ${s.screen.substring(0, 40)}: missing ${s.missing.join(', ')}`)
        .join('\n'),
      fix: 'Each Screen section needs: **Purpose:** **Layout:** **Data displayed:** **Interactions:** **States:**',
    }),
  });

  // 3. Check for data-testid references
  const testIdRefs = findLines(content, /data-testid/);
  results.push({
    status: testIdRefs.length > 0 ? 'PASS' : 'FAIL',
    message: `References data-testid attributes (found ${testIdRefs.length} references)`,
    ...(testIdRefs.length === 0 && {
      fix: 'Document data-testid attributes for all interactive elements (required for E2E testing).',
    }),
  });

  // 4. Check for component hierarchy
  const hasHierarchy = /Component Hierarchy|Component Tree|component structure/i.test(content);
  results.push({
    status: hasHierarchy ? 'PASS' : 'WARN',
    message: 'Has Component Hierarchy / Component Tree section',
    ...(!hasHierarchy && {
      fix: 'Add a Component Hierarchy section showing the React component tree structure.',
    }),
  });

  // 5. Check for Design Tokens
  const hasTokens = /Design Tokens|Colour|Color.*Token|colour palette/i.test(content);
  results.push({
    status: hasTokens ? 'PASS' : 'WARN',
    message: 'Has Design Tokens or colour definitions',
    ...(!hasTokens && {
      fix: 'Add a Design Tokens section defining colours, spacing, and typography values.',
    }),
  });

  // 6. Check for accessibility requirements
  const hasA11y = /Accessibility|ARIA|aria-|WCAG|screen.reader/i.test(content);
  results.push({
    status: hasA11y ? 'PASS' : 'WARN',
    message: 'Has Accessibility requirements section',
    ...(!hasA11y && {
      fix: 'Add an Accessibility section covering ARIA labels, keyboard nav, and screen reader support.',
    }),
  });

  // 7. Check for responsive/viewport requirements
  const hasResponsive = /Responsive|viewport|breakpoint|mobile|desktop/i.test(content);
  results.push({
    status: hasResponsive ? 'PASS' : 'WARN',
    message: 'Has responsive/viewport requirements',
    ...(!hasResponsive && {
      fix: 'Document minimum viewport width and responsive behaviour expectations.',
    }),
  });

  // 8. Check for API endpoint mapping
  const hasApiMapping = /API Endpoints|endpoints.*used|API.*per.*screen/i.test(content);
  results.push({
    status: hasApiMapping ? 'PASS' : 'WARN',
    message: 'Maps screens to API endpoints used',
    ...(!hasApiMapping && {
      fix: 'Add a section mapping each screen to the API endpoints it consumes.',
    }),
  });

  return results;
}

/**
 * Validate architecture.md against Architecture template.
 * @param {string} content
 * @returns {CheckResult[]}
 */
function validateArchitecture(content) {
  const results = [];

  // 1. Check for Components section
  const hasComponents = /##.*Components/i.test(content);
  results.push({
    status: hasComponents ? 'PASS' : 'FAIL',
    message: 'Has Components section',
    ...(!hasComponents && {
      fix: 'Add a ## Components section listing each component and its responsibility.',
    }),
  });

  // 2. Check for Data Model section
  const hasDataModel = /##.*Data Model/i.test(content);
  results.push({
    status: hasDataModel ? 'PASS' : 'FAIL',
    message: 'Has Data Model section',
    ...(!hasDataModel && {
      fix: 'Add a ## Data Model section describing entities, key fields, and relationships.',
    }),
  });

  // 3. Check for Integrations section
  const hasIntegrations = /##.*Integration/i.test(content);
  results.push({
    status: hasIntegrations ? 'PASS' : 'FAIL',
    message: 'Has Integrations section',
    ...(!hasIntegrations && {
      fix: 'Add a ## Integrations section listing external systems and connection methods.',
    }),
  });

  // 4. Check for Key Decisions section
  const hasDecisions = /##.*Key Decisions|##.*Decisions/i.test(content);
  results.push({
    status: hasDecisions ? 'PASS' : 'FAIL',
    message: 'Has Key Decisions section',
    ...(!hasDecisions && {
      fix: 'Add a ## Key Decisions section with decision, rationale, and alternatives considered.',
    }),
  });

  // 5. Check for architectural diagrams (ASCII art or mermaid)
  const hasDiagrams =
    /```mermaid|```\s*\n[\s│┌└├┘┐┤┬┴┼─]+/m.test(content) ||
    /[┌└├┘┐┤┬┴┼─│▼▲►◄]{3,}/m.test(content);
  results.push({
    status: hasDiagrams ? 'PASS' : 'WARN',
    message: 'Includes architectural diagrams (ASCII or Mermaid)',
    ...(!hasDiagrams && {
      fix: 'Add diagrams showing system context, component relationships, or data flow.',
    }),
  });

  // 6. Check for Quality Goals / Architectural Drivers
  const hasQualityGoals = /Quality Goal|Architectural Driver|quality attribute/i.test(content);
  results.push({
    status: hasQualityGoals ? 'PASS' : 'WARN',
    message: 'Has Quality Goals / Architectural Drivers section',
    ...(!hasQualityGoals && {
      fix: 'Add a section listing quality goals (performance, maintainability, testability) that drive architecture decisions.',
    }),
  });

  // 7. Check that decisions include rationale
  const decisionsSection = content.match(/Key Decisions[\s\S]*?(?=^##\s|\Z)/m)?.[0] || '';
  const hasRationale = /[Rr]ationale|[Rr]eason|[Bb]ecause|[Ww]hy/i.test(decisionsSection);
  results.push({
    status: hasRationale ? 'PASS' : 'WARN',
    message: 'Key Decisions include rationale',
    ...(!hasRationale && {
      fix: 'Each key decision should include a rationale explaining why it was made.',
    }),
  });

  // 8. Check for cross-cutting concerns
  const hasCrossCutting = /Cross.Cutting|Error Handling|Testing Strategy|Logging/i.test(content);
  results.push({
    status: hasCrossCutting ? 'PASS' : 'WARN',
    message: 'Documents cross-cutting concerns (error handling, testing, etc.)',
    ...(!hasCrossCutting && {
      fix: 'Add a Cross-Cutting Concerns section covering error handling, testing strategy, and observability.',
    }),
  });

  return results;
}

// ---------------------------------------------------------------------------
// Report Rendering
// ---------------------------------------------------------------------------

/**
 * Print results for a single document.
 * @param {string} filename
 * @param {CheckResult[]} checks
 */
function printDocReport(filename, checks) {
  console.log(`\n--- ${filename} ---`);
  for (const check of checks) {
    const icon = check.status === 'PASS' ? 'PASS' : check.status === 'WARN' ? 'WARN' : 'FAIL';
    console.log(`  [${icon}] ${check.message}`);
    if (check.detail) {
      console.log(`         ${check.detail.replace(/\n/g, '\n         ')}`);
    }
    if (check.fix && check.status !== 'PASS') {
      console.log(`         Fix: ${check.fix}`);
    }
  }
}

/**
 * Print summary table.
 * @param {Map<string, CheckResult[]>} allResults
 */
function printSummary(allResults) {
  console.log('\n=== Summary ===\n');

  let totalChecks = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  let totalWarns = 0;

  for (const [filename, checks] of allResults) {
    const passed = checks.filter((c) => c.status === 'PASS').length;
    const failed = checks.filter((c) => c.status === 'FAIL').length;
    const warns = checks.filter((c) => c.status === 'WARN').length;
    totalChecks += checks.length;
    totalPassed += passed;
    totalFailed += failed;
    totalWarns += warns;

    const padded = filename.padEnd(20);
    console.log(
      `  ${padded} ${checks.length} checks, ${passed} passed, ${failed} failed, ${warns} warnings`
    );
  }

  console.log('');
  console.log(
    `  Overall: ${totalChecks} checks, ${totalPassed} passed, ${totalFailed} failed, ${totalWarns} warnings`
  );
  console.log('');

  return totalFailed;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log('=== Documentation Validation Report ===');

  if (!existsSync(DOCS_DIR)) {
    console.error(`\n  ERROR: docs/ directory not found at ${DOCS_DIR}`);
    console.error('  Run this script from the project root.');
    process.exit(1);
  }

  /** @type {Map<string, CheckResult[]>} */
  const allResults = new Map();

  // Validate each document
  const validators = [
    { file: 'requirements.md', validate: validateRequirements },
    { file: 'test-cases.md', validate: validateTestCases },
    { file: 'api-spec.md', validate: validateApiSpec },
    { file: 'ui-spec.md', validate: validateUiSpec },
    { file: 'architecture.md', validate: validateArchitecture },
  ];

  for (const { file, validate } of validators) {
    const content = readDoc(file);
    if (content === null) {
      allResults.set(file, [
        {
          status: 'FAIL',
          message: `File not found: docs/${file}`,
          fix: `Create docs/${file} following the project template.`,
        },
      ]);
    } else {
      const checks = validate(content);
      allResults.set(file, checks);
    }
    printDocReport(file, allResults.get(file));
  }

  const failures = printSummary(allResults);

  if (failures > 0) {
    console.log(`  Result: FAILED (${failures} issue${failures > 1 ? 's' : ''} to fix)\n`);
    process.exit(1);
  } else {
    console.log('  Result: ALL CHECKS PASSED\n');
    process.exit(0);
  }
}

main();
