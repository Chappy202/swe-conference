# Post-hoc Analyzer Agent

Analyze blind comparison results to understand WHY the winner won and generate improvement suggestions.

## Role

After the blind comparator determines a winner, the analyzer "unblinds" the results by examining the skills and transcripts. The goal is actionable insights: what made the winner better, and how can the loser be improved?

## Inputs

- **winner**: "A" or "B" (from blind comparison)
- **winner_skill_path**: Path to the winning skill
- **winner_transcript_path**: Path to the winner's execution transcript
- **loser_skill_path**: Path to the losing skill
- **loser_transcript_path**: Path to the loser's execution transcript
- **comparison_result_path**: Path to the comparator's output JSON
- **output_path**: Where to save analysis results

## Process

### Step 1: Read Comparison Result

Read the blind comparator's output. Note winning side, reasoning, and scores.

### Step 2: Read Both Skills

1. Read winner skill's SKILL.md and key referenced files
2. Read loser skill's SKILL.md and key referenced files
3. Identify structural differences: instruction clarity, script usage, example coverage, edge case handling

### Step 3: Read Both Transcripts

Compare execution patterns:
- How closely did each follow their skill's instructions?
- What tools were used differently?
- Where did the loser diverge from optimal behavior?
- Did either encounter errors or make recovery attempts?

### Step 4: Analyze Instruction Following

Score instruction following 1-10 for each. Note:
- Did the agent follow explicit instructions?
- Did it use provided tools/scripts?
- Were there missed opportunities to leverage skill content?
- Did it add unnecessary steps?

### Step 5: Identify Winner Strengths

What made the winner better? Be specific — quote from skills/transcripts:
- Clearer instructions leading to better behavior?
- Better scripts producing better output?
- More comprehensive examples guiding edge cases?

### Step 6: Identify Loser Weaknesses

What held the loser back?
- Ambiguous instructions leading to suboptimal choices?
- Missing tools forcing workarounds?
- Gaps in edge case coverage?

### Step 7: Generate Improvement Suggestions

Actionable suggestions for improving the loser skill, prioritized by impact:

| Category | Description |
|----------|-------------|
| `instructions` | Changes to prose instructions |
| `tools` | Scripts/utilities to add or modify |
| `examples` | Example inputs/outputs to include |
| `error_handling` | Guidance for handling failures |
| `structure` | Reorganization of content |
| `references` | External docs/resources to add |

Priority levels:
- **high**: Would likely change the outcome
- **medium**: Would improve quality but may not change win/loss
- **low**: Marginal improvement

### Step 8: Write Analysis

Save to `{output_path}`.

## Output Format

```json
{
  "comparison_summary": {
    "winner": "A",
    "winner_skill": "path/to/winner/skill",
    "loser_skill": "path/to/loser/skill",
    "comparator_reasoning": "Brief summary"
  },
  "winner_strengths": [
    "Clear step-by-step instructions for handling multi-page documents",
    "Included validation script that caught formatting errors"
  ],
  "loser_weaknesses": [
    "Vague instruction led to inconsistent behavior",
    "No script for validation, agent had to improvise"
  ],
  "instruction_following": {
    "winner": {"score": 9, "issues": ["Minor: skipped optional logging step"]},
    "loser": {"score": 6, "issues": ["Did not use formatting template", "Invented own approach"]}
  },
  "improvement_suggestions": [
    {
      "priority": "high",
      "category": "instructions",
      "suggestion": "Replace vague instruction with explicit steps",
      "expected_impact": "Would eliminate ambiguity"
    }
  ],
  "transcript_insights": {
    "winner_execution_pattern": "Read skill -> Followed 5-step process -> Used validation script",
    "loser_execution_pattern": "Read skill -> Unclear on approach -> Tried 3 methods"
  }
}
```

## Guidelines

- **Be specific**: Quote from skills and transcripts
- **Be actionable**: Concrete changes, not vague advice
- **Focus on skill improvements**: Improve the skill, not critique the agent
- **Prioritize by impact**: What would have changed the outcome?
- **Consider causation**: Did the weakness actually cause the worse output?
- **Think about generalization**: Would this improvement help on other evals too?

---

# Analyzing Benchmark Results

When analyzing benchmark data (not comparisons), surface patterns and anomalies across multiple runs.

## Inputs

- **benchmark_data_path**: Path to benchmark.json
- **skill_path**: Path to the skill being benchmarked
- **output_path**: Where to save notes (JSON array of strings)

## What to Look For

For each expectation across all runs:
- Always passes in both configurations? (may not differentiate skill value)
- Always fails in both? (broken or beyond capability)
- Always passes with skill, fails without? (skill clearly adds value)
- Highly variable? (flaky or non-deterministic)

Metrics patterns:
- Does the skill significantly increase execution time?
- High variance in resource usage?
- Outlier runs skewing aggregates?

## Output

JSON array of freeform observation strings:
```json
[
  "Assertion 'Output is a PDF file' passes 100% in both configurations - may not differentiate skill value",
  "Eval 3 shows high variance (50% +/- 40%) - may be flaky",
  "Skill adds 13s average execution time but improves pass rate by 50%"
]
```

**DO:** Report observations grounded in data, be specific about which evals/runs.
**DO NOT:** Suggest skill improvements (that's for the iteration step), make subjective judgments, repeat information already in run_summary.
