# Qurio Atlas User Workflow

## Presentation purpose

Show how a learner moves from first discovery to measurable quantum-computing progress through a connected learning loop:

```text
Discover -> Sign in -> Choose a path -> Study -> Practice -> Get guidance -> Review progress -> Repeat
```

The live browser experience is centered on the Next.js application. The Python AI/ML subsystem is shown separately as the intelligence layer that can personalize recommendations and tutor responses.

---

## Slide 1: The learner journey at a glance

**Title:** Qurio Atlas: From curiosity to quantum confidence

**Main workflow:**

```text
Landing page
    |
    v
Create account / Sign in
    |
    v
Choose a learning path
    |
    v
Study a concept
    |
    +----------------------+----------------------+
    |                      |                      |
    v                      v                      v
Qurio Qubit          Circuit Studio           AI Tutor
Practice game        Build and run           Guided help
    |                      |                      |
    +----------------------+----------------------+
                           |
                           v
                 XP, badges, completion
                           |
                           v
                    My Progress -> repeat
```

**Speaker message:** Qurio Atlas turns abstract quantum concepts into a repeatable cycle of learning, experimentation, feedback, and progress.

**Visual direction:** Use one horizontal path with three colored practice branches. Keep `My Progress` as the destination and feedback loop.

---

## Slide 2: Entry and account setup

**Title:** A learner enters through exploration, then creates a learning identity

**Workflow:**

```text
Discover Atlas entries and interactives
                |
                v
Select Roadmap, Qurio Qubit, Circuit Studio, or AI Tutor
                |
                v
Authentication check
        /                    \
 Not signed in             Signed in
        |                      |
        v                      v
 Sign in / sign up       Continue to destination
        |
        v
Account + avatar + local progress state
```

**User actions:**

- Explore the landing page.
- Choose a learning surface.
- Sign in or create an account when a protected route requires it.
- Return to the originally selected destination after authentication.

**Current implementation note:** Authentication and progress are stored in the browser through the frontend stores. Present this as the current MVP behavior.

**Supporting routes:** `/`, `/login`, `/roadmap`, `/qubit`, `/circuit`, `/ai-tutor`, `/profile`.

---

## Slide 3: Select a learning direction

**Title:** The roadmap turns a broad subject into an actionable next step

**Workflow:**

```text
Choose level
(Beginner / Intermediate / Pro)
                |
                v
Browse milestones and learning resources
                |
                v
Open a concept or supporting resource
                |
                v
Mark the milestone as studied
                |
                v
Practice becomes available
```

**Decision point:** Which level and milestone best match the learner's current knowledge?

**Resource types:** Books, courses, videos, tools, papers, communities, and practice material.

**Speaker message:** The roadmap provides the curriculum structure; completion of a studied milestone is the bridge from theory into practice.

**Supporting files:** `components/roadmap/RoadmapPage.tsx`, `components/roadmap/roadmapData.ts`, `components/roadmap/ResourceLibrary.tsx`.

---

## Slide 4: Convert study into practice

**Title:** Every concept can become an experiment

**Two practice branches:**

### Qurio Qubit

```text
Milestone marked studied
        |
        v
Game unlocked
        |
        v
Play rounds -> use hints if needed -> submit answer
        |
        v
Score and tier
(Bronze / Silver / Gold)
        |
        v
XP + badge + best score
```

### Circuit Studio

```text
Choose gates: H, X, Y, Z, CNOT
        |
        v
Place gates on the circuit board
        |
        v
Run 1,024 shots
        |
        v
Inspect histogram, statevector, Bloch spheres, and code
        |
        v
Clear a challenge or revise the circuit
```

**Decision points:**

- Replay, use a hint, or move forward.
- Change one gate and compare results.
- Advance after clearing a challenge or revisit the underlying concept.

**Speaker message:** Qurio Qubit reinforces intuition through short challenges; Circuit Studio reinforces it through visible cause and effect.

---

## Slide 5: Guided AI Tutor loop

**Title:** The tutor keeps the learner moving one useful action at a time

**Live frontend workflow:**

```text
Choose a goal
        |
        v
See the current step
        |
        v
Open the linked learning surface
        |
        v
Ask for a hint or explanation
        |
        v
Mark the step complete
        |
        v
Move to the next step
```

**Available goals:**

- Understand the basics.
- Build a first circuit.
- Understand entanglement.

**Current implementation note:** The browser tutor is a guided, deterministic workflow. Its replies are grounded in the selected goal and step.

**Supporting file:** `components/tutor/TutorWorkflow.tsx`.

---

## Slide 6: Intelligence layer behind personalization

**Title:** Telemetry can turn activity into a next-best action

**Documented AI/ML architecture:**

```text
Learner activity
(scores, attempts, errors, time, circuit or quiz context)
        |
        v
Learner profile
(performance, risk, skill, topic strengths)
        |
        v
Weak-concept detection
        |
        v
Recommendation engine
        |
        v
Grounded AI tutor response
        |
        v
Critic evaluates quality
     /              \
 Pass              Needs improvement
  deliver          refine, up to 3 iterations
```

**Quality guardrails:**

- Recommendations are constrained by curriculum and mastery rules.
- Tutor responses use grounded learner and activity context.
- The critic loop stops at a quality threshold or after three iterations.

**Important labeling:** This is the documented Python/FastAPI intelligence architecture. Do not imply that it currently powers every interaction in the Next.js browser tutor.

**Supporting docs:** `Ai/quantum/docs/FLOW.md`, `Ai/quantum/docs/PRD.md`, `Ai/quantum/docs/ARCHITECTURE.md`.

---

## Slide 7: Feedback and progress loop

**Title:** Progress makes the next learning decision visible

**Workflow:**

```text
Study state + game results + circuit challenge flags
                         |
                         v
                 XP and badges
                         |
                         v
                    My Progress
   modules studied | games cleared | best scores | climb
                         |
              +----------+----------+
              |                     |
              v                     v
        Advance to next step    Revisit weak concept
```

**What the learner can review:**

- Modules studied.
- Games cleared.
- XP and badges.
- Per-game best results.
- Learning climb and completion state.

**Speaker message:** Progress is not only a score; it is the control point for deciding whether to advance, repeat, or ask for help.

**Supporting files:** `components/profile/ProfilePage.tsx`, `components/profile/ClimbTracker.tsx`, `components/qubit/progressStore.ts`.

---

## Slide 8: End-to-end story and product value

**Title:** The complete loop closes the gap between knowing and doing

**One-line workflow:**

```text
Discover -> Personalize -> Learn -> Experiment -> Receive feedback -> Demonstrate mastery -> Continue
```

**Outcome for the learner:**

- A clear starting point.
- A structured path through difficult concepts.
- Immediate visual and interactive feedback.
- Practice that follows study instead of sitting apart from it.
- A visible record of progress and next actions.

**Outcome for the platform:**

- Learner activity can feed explainable profiles and recommendations.
- The tutor can provide contextual, bounded support.
- Progress data supports a repeatable learning loop rather than a one-time lesson.

---

## Presenter notes and accuracy guardrails

- Use the route names that exist today: `/roadmap`, `/qubit`, `/circuit`, `/ai-tutor`, and `/profile`.
- Do not include `/learn` or `/simulate` as live destinations; those references are not backed by current app routes.
- Distinguish the current local/browser state from the documented backend intelligence services.
- Describe the current tutor as guided and deterministic; describe the Python service as the planned or separately implemented intelligence layer unless the integration is demonstrated.
- The strongest live demo sequence is: roadmap milestone -> Qurio Qubit practice -> Circuit Studio experiment -> profile review.
