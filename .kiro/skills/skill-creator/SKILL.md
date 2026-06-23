---
name: skill-creator
description: >-
  Guide for creating effective skills and iteratively improving them with
  evaluation loops. Use when users want to create a new skill (or update an
  existing skill) that extends agent capabilities with specialized knowledge,
  workflows, or tool integrations. Also use when users want to run evals to
  test a skill, benchmark skill performance, or optimize a skill through
  iterative feedback.
---

# Skill Creator

A skill for creating new skills and iteratively improving them within Kiro.

## High-Level Process

1. Decide what the skill should do and how it should do it
2. Write a draft of the skill
3. Create test prompts and run the skill on them via subagents
4. Evaluate results qualitatively (user review) and quantitatively (grading)
5. Rewrite the skill based on feedback
6. Repeat until satisfied
7. Package the final skill

Figure out where the user is in this process and help them progress. If they already have a draft, jump straight to eval/iterate. If they say "just vibe with me", skip the formal eval loop.

## Communicating with the User

Pay attention to context cues about technical familiarity. Terms like "evaluation", "benchmark", and "assertion" are fine for technical users. Briefly explain terms if you're unsure if the user will understand them.

---

## Creating a Skill

### Capture Intent

1. What should this skill enable the agent to do?
2. When should this skill trigger? (what user phrases/contexts)
3. What's the expected output format?
4. Should we set up test cases? Skills with objectively verifiable outputs benefit from test cases. Skills with subjective outputs (writing style, art) often don't. Suggest the appropriate default but let the user decide.

If the current conversation already contains a workflow the user wants to capture (e.g., "turn this into a skill"), extract answers from conversation history first.

### Interview and Research

Ask about edge cases, input/output formats, example files, success criteria, and dependencies. Wait to write test prompts until this is ironed out.

### Write the SKILL.md

Based on the interview, fill in:

- **name**: Kebab-case skill identifier
- **description**: Primary triggering mechanism. Include what the skill does AND specific contexts for when to use it. Make it slightly "pushy" to combat undertriggering.
- **Body**: Instructions and guidance

### Skill Writing Guide

#### Anatomy of a Skill

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter (name, description required)
│   └── Markdown instructions
└── Bundled Resources (optional)
    ├── scripts/    - Executable code for deterministic/repetitive tasks
    ├── references/ - Docs loaded into context as needed
    └── assets/     - Files used in output (templates, icons, fonts)
```

#### Kiro Skill Locations

- **Global skills**: `~/.kiro/skills/` — available across all workspaces
- **Workspace skills**: `.kiro/skills/` in the project root — project-specific

#### Activation in Kiro

Skills activate in two ways:
1. **Automatically**: Kiro matches user requests against skill descriptions
2. **As slash commands**: Type `/` followed by the skill name (e.g., `/pr-review`)

Only the name + description metadata loads at startup. The full SKILL.md body loads on-demand when the skill triggers.

#### Progressive Disclosure

Three-level loading system:
1. **Metadata** (name + description) — Always in context (~100 words)
2. **SKILL.md body** — When skill triggers (<500 lines ideal)
3. **Bundled resources** — As needed (unlimited, scripts can execute without loading)

Keep SKILL.md under 500 lines. If approaching this limit, split content into reference files with clear pointers about when to read them.

#### Writing Patterns

- Use imperative form in instructions
- Explain the **why** behind instructions — LLMs respond better to reasoning than rigid MUSTs
- Prefer concise examples over verbose explanations
- Only include context the agent doesn't already have

**Defining output formats:**
```markdown
## Report structure
ALWAYS use this exact template:
# [Title]
## Executive summary
## Key findings
## Recommendations
```

**Examples pattern:**
```markdown
## Commit message format
**Example 1:**
Input: Added user authentication with JWT tokens
Output: feat(auth): implement JWT-based authentication
```

#### What NOT to Include

- README.md, INSTALLATION_GUIDE.md, CHANGELOG.md, etc.
- User-facing documentation
- Setup/testing procedures unrelated to the skill's function

### Test Cases

After writing the draft, create 2-3 realistic test prompts. Share them with the user for validation. Save test cases to `evals/evals.json`:

```json
{
  "skill_name": "example-skill",
  "evals": [
    {
      "id": 1,
      "prompt": "User's task prompt",
      "expected_output": "Description of expected result",
      "files": []
    }
  ]
}
```

See `references/schemas.md` for the full schema including the `expectations` field.

---

## Running and Evaluating Test Cases

This section is one continuous sequence. Put results in `<skill-name>-workspace/` as a sibling to the skill directory. Within the workspace, organize by iteration (`iteration-1/`, `iteration-2/`, etc.) and each test case gets a directory (`eval-0/`, `eval-1/`, etc.).

### Step 1: Spawn All Runs Using Kiro Subagents

For each test case, dispatch two parallel subagents — one with the skill, one without (baseline). Launch everything at once using Kiro's `orchestrate_subagent` tool.

**With-skill run** — dispatch a `general-task-execution` stage:
```
Execute this task using the skill at <path-to-skill>:
- Read the skill's SKILL.md and follow its instructions
- Task: <eval prompt>
- Input files: <eval files if any>
- Save outputs to: <workspace>/iteration-<N>/eval-<ID>/with_skill/outputs/
```

**Baseline run** — dispatch another `general-task-execution` stage (no dependency):
```
Execute this task WITHOUT any skill guidance:
- Task: <eval prompt>
- Input files: <eval files if any>
- Save outputs to: <workspace>/iteration-<N>/eval-<ID>/without_skill/outputs/
```

For improving an existing skill, the baseline should use the old version (snapshot it first: copy the skill directory to `<workspace>/skill-snapshot/`).

Write an `eval_metadata.json` for each test case:
```json
{
  "eval_id": 0,
  "eval_name": "descriptive-name-here",
  "prompt": "The user's task prompt",
  "assertions": []
}
```

### Step 2: Draft Assertions While Runs Execute

Don't wait for runs to finish. Draft quantitative assertions for each test case. Good assertions are objectively verifiable and have descriptive names. Subjective skills (writing style, design quality) are better evaluated qualitatively.

Update `eval_metadata.json` and `evals/evals.json` with the assertions.

### Step 3: Grade Results

Once runs complete, grade each run. Dispatch a `general-task-execution` subagent that follows the instructions in `agents/grader.md`:

```
You are a Grader agent. Read the grading instructions at <skill-creator-path>/agents/grader.md.
Evaluate these expectations against the outputs:
- Expectations: <list>
- Outputs directory: <path>/outputs/
- Save grading results to: <path>/grading.json
```

For assertions that can be checked programmatically, write and run a script instead.

### Step 4: Aggregate and Analyze

After grading all runs:

1. **Aggregate into benchmark** — run the aggregation script:
   ```
   python <skill-creator-path>/scripts/aggregate_benchmark.py <workspace>/iteration-N --skill-name <name>
   ```
   This produces `benchmark.json` and `benchmark.md`.

2. **Analyst pass** — dispatch a `general-task-execution` subagent following `agents/analyzer.md` to surface patterns the aggregate stats might hide.

3. **Present results to user** — show the benchmark summary and per-eval breakdown directly in the terminal. Include:
   - Pass rates for with-skill vs baseline
   - Time/token comparison
   - Analyst observations
   - Per-eval details with grading evidence

### Step 5: User Review

Present the outputs from each test case to the user for qualitative review:
- Show the prompt, key output snippets, and grading results
- Ask for feedback on each test case
- Empty feedback = user thinks it's fine

Collect feedback as:
```json
{
  "reviews": [
    {"eval_id": "eval-0-with_skill", "feedback": "the chart is missing axis labels"},
    {"eval_id": "eval-1-with_skill", "feedback": ""}
  ]
}
```

---

## Improving the Skill

### How to Think About Improvements

1. **Generalize from feedback.** The skill will be used across many different prompts. Don't overfit to the test examples. Rather than fiddly changes, try different metaphors or recommend different patterns.

2. **Keep the prompt lean.** Remove things that aren't pulling their weight. Read transcripts — if the skill makes the agent waste time unproductively, remove those instructions.

3. **Explain the why.** Explain reasoning behind instructions rather than using heavy-handed MUSTs. Reframe rigid structures as reasoning the model can understand.

4. **Look for repeated work.** If all test cases independently wrote similar helper scripts, bundle that script in `scripts/` and tell the skill to use it.

### The Iteration Loop

After improving the skill:

1. Apply improvements to the skill
2. Rerun all test cases into `iteration-<N+1>/`, including baseline runs
3. Present results to user with comparison to previous iteration
4. Collect feedback, improve again, repeat

Keep going until:
- The user says they're happy
- All feedback is empty
- No meaningful progress is being made

---

## Advanced: Blind Comparison

For rigorous comparison between two skill versions, use the blind comparison system. Dispatch a `general-task-execution` subagent following `agents/comparator.md`:

```
You are a Blind Comparator. Read instructions at <path>/agents/comparator.md.
Compare these two outputs WITHOUT knowing which skill produced them:
- Output A: <path-to-output-a>
- Output B: <path-to-output-b>
- Eval prompt: <the task>
- Expectations: <list>
- Save comparison to: <path>/comparison.json
```

Then dispatch an analyzer subagent following `agents/analyzer.md` to understand WHY the winner won.

This is optional and most users won't need it. The human review loop is usually sufficient.

---

## Skill Creation Process (Quick Reference)

### Step 1: Understand with Concrete Examples

Ask questions to understand usage patterns:
- "What functionality should this skill support?"
- "Can you give examples of how it would be used?"
- "What would a user say that should trigger this skill?"

### Step 2: Plan Reusable Contents

Analyze each example to identify what scripts, references, and assets would be helpful.

### Step 3: Initialize the Skill

For new skills, run:
```bash
python <skill-creator-path>/scripts/init_skill.py <skill-name> --path <output-directory>
```

Skip if the skill already exists.

### Step 4: Edit the Skill

Consult these guides based on the skill's needs:
- **Multi-step processes**: See `references/workflows.md`
- **Output formats or quality standards**: See `references/output-patterns.md`

Start with reusable resources (`scripts/`, `references/`, `assets/`), then update SKILL.md.

**Frontmatter rules:**
- Only `name` and `description` are required
- Allowed properties: `name`, `description`, `license`, `allowed-tools`, `metadata`, `compatibility`
- Description max 1024 chars, name max 64 chars, kebab-case

### Step 5: Package the Skill

```bash
python <skill-creator-path>/scripts/package_skill.py <path/to/skill-folder> [output-directory]
```

This validates and creates a `.skill` file (zip format) for distribution.

### Step 6: Iterate Based on Real Usage

Use the eval loop described above, or iterate informally based on real usage feedback.

---

## Updating an Existing Skill

When updating rather than creating:
- **Preserve the original name.** Use the existing directory name and frontmatter `name` unchanged.
- **Copy to a writeable location if needed.** The installed skill path may be read-only. Copy to a temp location, edit there, and package from the copy.

---

## Kiro Ecosystem Integration

Skills exist alongside other Kiro features:
- **Steering** (`.kiro/steering/*.md`): Persistent workspace knowledge. Skills are for specialized workflows; steering is for conventions and standards.
- **Hooks** (`.kiro/hooks/`): Automated actions on triggers. Skills can reference hooks for automation.
- **Specs** (`.kiro/specs/`): Structured feature development. Skills can guide spec-driven workflows.
- **Custom Agents** (`.kiro/agents/`): Specialized agent configurations. Skills extend any agent's capabilities.

When creating skills, consider whether the user's need is better served by a skill, steering file, hook, or custom agent — or a combination.

---

## Reference Files

The `agents/` directory contains instructions for specialized subagents:
- `agents/grader.md` — Evaluate assertions against outputs
- `agents/comparator.md` — Blind A/B comparison between two outputs
- `agents/analyzer.md` — Analyze why one version beat another

The `references/` directory has additional documentation:
- `references/schemas.md` — JSON structures for evals, grading, benchmark, etc.
- `references/workflows.md` — Workflow patterns for skills
- `references/output-patterns.md` — Output format patterns

---

## Core Loop Summary

1. Figure out what the skill is about
2. Draft or edit the skill
3. Run the skill on test prompts via Kiro subagents
4. Evaluate outputs with the user (present results in terminal, collect feedback)
5. Run quantitative evals (grading, benchmarking)
6. Repeat until satisfied
7. Package the final skill
