# AI Quantum Tutor - Conversation Context Audit

## Executive Summary

**Root Cause Identified**: Conversation history is ALWAYS included in the system prompt, regardless of whether the current question is a follow-up or a new topic.

**Model Migration Context**: After migration from `llama-3.3-70b-versatile` to `openai/gpt-oss-120b`, the larger context window of GPT-OSS-120B is aggressively using all available context, including irrelevant conversation history.

## Current Flow Analysis

### 1. History Collection (`quantum_tutor.py` line 578)

```python
history = get_conversation_history(s_key)  # Retrieves last 10 turns
```

### 2. Topic Resolution (`quantum_tutor.py` lines 580-585)

```python
resolved = resolve_topic(...)
# Returns: is_follow_up (bool), previous_topic, relationship
# ✓ CORRECTLY detects follow-ups vs new topics
```

### 3. System Prompt Generation (`quantum_tutor.py` lines 709-712)

**PROBLEM**: History is included UNCONDITIONALLY:

```python
if history:  # ← ALWAYS includes if history exists
    history_formatted = []
    for turn in history[-5:]:  # Last 5 turns
        ans_snippet = turn['answer'][:250].replace('\n', ' ')
        history_formatted.append(f"User: {turn['query']}\nTutor ({turn['concept']}): {ans_snippet}...")
    prompt += f"\nRECENT CONVERSATION HISTORY:\n" + "\n".join(history_formatted) + "\n"
```

### 4. Context Passed to LLM

- **System Prompt**: Contains history (when exists)
- **User Prompt**: Only the current question
- **Context Dict**: Contains `is_follow_up` flag but NOT used to gate history inclusion

## Issue Timeline

### Scenario 1: Topic Switching (REPRODUCES BUG)

```
Q1: "What is a qubit?"
   → LLM answers about qubits ✓

Q2: "Explain Shor's algorithm."
   → System prompt INCLUDES: "User: What is a qubit? Tutor: [250 chars of qubit answer]..."
   → GPT-OSS-120B's large context window reads this history
   → LLM conflates topic, starts answer with qubit explanation even though Q2 is about Shor
   → BUG: Same topic contamination ✗
```

### Scenario 2: Follow-up Questions (WORKS CORRECTLY)

```
Q1: "What is a qubit?"
   → Answer: qubit explanation ✓

Q2: "Why does it need superposition?"
   → is_follow_up = TRUE (correctly detected)
   → System prompt includes history ✓ (DESIRED - relates to Q1)
   → LLM uses context appropriately ✓
```

### Scenario 3: Very Short Follow-ups (FAILS)

```
Q1: "What is Grover's algorithm?"
   → Answer: Grover explanation ✓

Q2: "Why?"
   → Short 1-word query
   → resolve_topic() detects is_follow_up = True (short query in conversation)
   → History is included ✓ (DESIRED)
   → But: history includes unrelated topics from earlier turns
   → LLM confused by extra context ✗
```

## Root Cause: Conditional Logic Missing

The code correctly DETECTS follow-ups in `resolve_topic()`:

- `context["is_follow_up"]` is TRUE/FALSE based on query analysis
- BUT this field is NOT used to gate history inclusion in system prompt

### Fix Strategy: Guard History Inclusion

**Change**: Only include history when explicitly appropriate:

```python
# NEW: Conditional history inclusion
is_follow_up = context.get("is_follow_up", False)
relationship = context.get("relationship")

if history and is_follow_up:  # ← GATE: Only include on follow-ups
    # Include last 2-3 most relevant turns (not 5)
```

**Additional**: Add explicit LLM instruction:

```
If this is a new quantum topic (not a follow-up), ignore all previous conversation history
and focus exclusively on answering the current question accurately.
```

## Files Involved

1. **`src/tutor/quantum_tutor.py`** (PRIMARY FIX)
   - `build_system_prompt()` lines 709-712
   - Where history is unconditionally included

2. **`src/tutor/llm_client.py`** (NO CHANGE NEEDED)
   - Correctly sends only system + user prompt
   - Does NOT force history into messages

3. **`src/tutor/mock_llm.py`** (NO CHANGE NEEDED)
   - Mock responses are deterministic
   - Not affected by context overflow

4. **`src/api/routes/tutor.py`** (NO CHANGE NEEDED)
   - Just passes through to tutor()
   - Correct API contract

## Proposed Fix (Minimal, Safe)

### Change 1: Gate History by `is_follow_up`

In `build_system_prompt()`, replace:

```python
if history:
```

With:

```python
is_follow_up = context.get("is_follow_up", False)
if history and is_follow_up:
```

### Change 2: Limit History to 2 Most Recent Turns

Replace:

```python
for turn in history[-5:]:
```

With:

```python
for turn in history[-2:]:  # Only last 2 turns to reduce noise
```

### Change 3: Add Explicit Instruction

Add to system prompt:

```
CRITICAL CONTEXT HANDLING:
- If the current question is about a NEW quantum topic (not explicitly a follow-up),
  disregard all previous conversation history and answer ONLY based on the current question.
- Only use previous history if the current question directly references, compares to,
  or asks about something from the previous exchange.
```

## Expected Outcomes After Fix

### Test 1: Topic Switch (Shor after Qubit)

```
Q1: "What is a qubit?"
   → Qubit explanation ✓

Q2: "Explain Shor's algorithm."
   → is_follow_up = FALSE (new explicit topic)
   → History NOT included in system prompt
   → LLM receives only: "Explain Shor's algorithm"
   → Result: Pure Shor explanation, NO qubit contamination ✓
```

### Test 2: Follow-up "Why?"

```
Q1: "What is superposition?"
   → Superposition explanation ✓

Q2: "Why is it important?"
   → is_follow_up = TRUE (referential pronoun + short query)
   → History included (last 2 turns): "...superposition explanation"
   → LLM correctly contextualizes ✓
```

### Test 3: Follow-up Comparison

```
Q1: "What is a qubit?"
   → Qubit explanation ✓

Q2: "How is it different from a classical bit?"
   → is_follow_up = TRUE (explicit topic + comparison intent)
   → History included
   → Result: Direct comparison, contextual ✓
```

## Testing Requirements

### Regression Tests to Add

```python
test_topic_switch_qubit_to_shor()
test_topic_switch_grover_to_entanglement()
test_follow_up_why_after_qubit()
test_follow_up_example_after_superposition()
test_follow_up_comparison_qubit_vs_bit()
test_five_consecutive_new_topics()
test_pronoun_followup_it_that_this()
test_short_query_followup_with_new_history()
```

## Model Configuration

- **Current Model**: `openai/gpt-oss-120b` (from llama-3.3-70b-versatile)
- **Configuration File**: `components/tutor/backend/.env`
- **Provider**: OpenAI-compatible API
- **Change Required**: NONE - Fix is context-handling only

## Files to Modify

1. `src/tutor/quantum_tutor.py` - `build_system_prompt()` function

## Files to Test

1. `src/tutor/quantum_tutor.py` - Core logic
2. `src/tutor/llm_client.py` - Integration (verify no changes needed)
3. `src/api/routes/tutor.py` - API contract
4. All test files in `tests/`

---

**Status**: Ready for implementation
**Priority**: Critical (affects all follow-up behavior)
**Risk Level**: Low (additive guard clauses only)
**Backwards Compatibility**: Full (existing behavior preserved for true follow-ups)
