'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Eye, KeyRound, Radio, X as XIcon } from 'lucide-react';

import Stickman from '../../roadmap/Stickman';
import { HintPanel, Ket, Prompt, Stage, Verdict, type GameApi } from '../GameShell';

/* ══════════════════════════════════════════════════════════════
   RELAY STATION  ·  module b6 — Teleportation & BB84

   Two protocols, one idea: quantum states are useless on their
   own until a classical message arrives. Rounds 1–4 are Bob
   reading Alice's two bits off her semaphore flags and applying
   the right correction. Rounds 5–7 are BB84 — sift the key, read
   the error rate, and work out why Eve cannot simply copy.

   Corrections follow the standard circuit: X^b then Z^a, where a
   is Alice's first measured bit and b her second.
   ══════════════════════════════════════════════════════════════ */

type Basis = 'Z' | 'X';

interface Teleport {
  kind: 'teleport';
  a: number;
  b: number;
  hint: string;
  note: string;
}

interface Sift {
  kind: 'sift';
  alice: Basis[];
  bob: Basis[];
  hint: string;
  note: string;
}

interface Choice {
  kind: 'choice';
  icon: typeof KeyRound;
  question: string;
  data?: { alice: number[]; bob: number[] };
  options: { label: string; detail: string }[];
  correct: number;
  hint: string;
  note: string;
}

type RelayRound = Teleport | Sift | Choice;

/** X^b then Z^a — the whole teleportation correction table. */
const CORRECTIONS = [
  { label: 'I', detail: 'do nothing' },
  { label: 'X', detail: 'flip the bit' },
  { label: 'Z', detail: 'flip the phase' },
  { label: 'ZX', detail: 'flip both' },
];

function correctionFor(a: number, b: number): number {
  if (a === 0 && b === 0) return 0;
  if (a === 0 && b === 1) return 1;
  if (a === 1 && b === 0) return 2;
  return 3;
}

const ROUNDS: RelayRound[] = [
  {
    kind: 'teleport',
    a: 0,
    b: 0,
    hint: 'Both flags are down. How much work is left for Bob?',
    note: 'The one case where Bob does nothing — and it happens a quarter of the time. Note he still had to wait for the message to know that.',
  },
  {
    kind: 'teleport',
    a: 0,
    b: 1,
    hint: 'The second bit is the one that controls the bit-flip.',
    note: 'b = 1 means Bob\'s qubit is bit-flipped, so X puts it right. a = 0 leaves the phase alone.',
  },
  {
    kind: 'teleport',
    a: 1,
    b: 0,
    hint: 'The first bit is the one that controls the phase-flip.',
    note: 'a = 1 is a phase error, and Z is the phase-flip. A phase error is invisible to a measurement in the Z basis, which is exactly why the classical message is not optional.',
  },
  {
    kind: 'teleport',
    a: 1,
    b: 1,
    hint: 'Two errors, so two corrections — and the order is X first.',
    note: 'Both flags up means both errors: X then Z. Alice\'s original state is now sitting on Bob\'s qubit, and hers is gone — teleportation moves a state, it never copies one.',
  },
  {
    kind: 'sift',
    alice: ['Z', 'Z', 'X', 'Z', 'X', 'X', 'Z', 'X'],
    bob: ['Z', 'X', 'X', 'X', 'X', 'Z', 'Z', 'Z'],
    hint: 'A slot is only usable when both of them happened to pick the same basis.',
    note: 'Four of eight survive, which is what you expect — they choose independently, so they agree half the time. Everything else is thrown away, publicly and without hesitation.',
  },
  {
    kind: 'choice',
    icon: Eye,
    question: 'They publish eight sifted bits to check the channel. What do they do?',
    data: {
      alice: [1, 0, 1, 1, 0, 0, 1, 0],
      bob: [1, 0, 0, 1, 0, 1, 1, 0],
    },
    options: [
      { label: 'Keep it — 25% is normal', detail: 'Hardware is noisy; a quarter of the bits flipping is expected.' },
      { label: 'Abort — 2% errors', detail: 'Two bits out of eight is a two percent error rate.' },
      { label: 'Abort — 25% errors', detail: 'That is far too high to be noise. Someone measured on the way.' },
      { label: 'Keep it — the channel is clean', detail: 'Their bits agree, so nobody interfered.' },
    ],
    correct: 2,
    hint: 'Count the disagreements, then divide by eight before you decide.',
    note: 'Two of eight is 25% — and 25% is Eve\'s fingerprint. She guesses the basis right half the time; when she guesses wrong she forces the qubit into her basis and Bob then reads a coin flip, wrong half of the time. ½ × ½ = ¼.',
  },
  {
    kind: 'choice',
    icon: KeyRound,
    question: 'Why can Eve not simply copy each qubit and forward the original?',
    options: [
      { label: 'The copy decoheres', detail: 'She could copy it, but the duplicate falls apart before she can use it.' },
      { label: 'No-cloning', detail: 'No unitary can copy an unknown quantum state. The machine she needs cannot exist.' },
      { label: 'She lacks the basis', detail: 'She could copy it, she just would not know which basis to measure the copy in.' },
      { label: 'She needs entanglement', detail: 'Cloning works, but only with a shared Bell pair she does not have.' },
    ],
    correct: 1,
    hint: 'This is a theorem, not an engineering limitation.',
    note: 'No-cloning is the reason BB84 works at all. Eve cannot keep a copy and pass the original on untouched, so her only option is to measure — and measuring in the wrong basis is what leaves the 25% trail you just caught.',
  },
];

export default function RelayStation({ api }: { api: GameApi }) {
  const round = ROUNDS[api.round];

  const [picked, setPicked] = useState<number | null>(null);
  const [keep, setKeep] = useState<boolean[]>(() => Array<boolean>(8).fill(false));
  const [sifted, setSifted] = useState(false);

  /* ── Teleportation and multiple choice share one handler ── */
  const answer = (i: number, correct: number) => {
    if (api.resolved) return;
    setPicked(i);
    api.resolveRound(i === correct ? 1 : 0);
  };

  const sift = () => {
    if (api.resolved || round.kind !== 'sift') return;
    const ok = round.alice.every((b, i) => keep[i] === (b === round.bob[i]));
    setSifted(true);
    api.resolveRound(ok ? 1 : 0);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {round.kind === 'teleport' && (
        <TeleportRound round={round} api={api} picked={picked} onAnswer={answer} />
      )}

      {round.kind === 'sift' && (
        <SiftRound
          round={round}
          api={api}
          keep={keep}
          setKeep={setKeep}
          sifted={sifted}
          onSift={sift}
        />
      )}

      {round.kind === 'choice' && (
        <ChoiceRound round={round} api={api} picked={picked} onAnswer={answer} />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ROUNDS 1–4 — Alice signals, Bob corrects.
   ══════════════════════════════════════════════════════════════ */

function TeleportRound({
  round,
  api,
  picked,
  onAnswer,
}: {
  round: Teleport;
  api: GameApi;
  picked: number | null;
  onAnswer: (i: number, correct: number) => void;
}) {
  const correct = correctionFor(round.a, round.b);

  return (
    <>
      <Prompt>
        Alice measured <Ket color="#00607D">a = {round.a}</Ket>,{' '}
        <Ket color="#00607D">b = {round.b}</Ket> and signalled them across. Which correction does Bob
        apply?
      </Prompt>

      {api.hintShown && <HintPanel>{round.hint}</HintPanel>}

      <Stage style={{ padding: '20px 20px 16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          {/* Alice, flags up */}
          <div style={{ textAlign: 'center' }}>
            <Stickman pose="signal" size={104} accent="#00607D" label="Alice signalling her two bits" />
            <div style={{ fontSize: 13, fontWeight: 700, color: '#22252A', marginTop: 2 }}>Alice</div>
            <div style={{ fontSize: 11, color: '#5A6578' }}>her qubit is gone</div>
          </div>

          {/* The classical channel — slower than light, and required */}
          <div style={{ flex: 1, minWidth: 140, textAlign: 'center' }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#5A6578',
                marginBottom: 8,
              }}
            >
              <Radio size={11} style={{ verticalAlign: -1, marginRight: 4 }} />
              classical channel
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <div style={{ flex: 1, height: 2, background: 'repeating-linear-gradient(90deg, #9BC1BC 0 6px, transparent 6px 12px)' }} />
              {[round.a, round.b].map((bit, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.32, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#FFFFFF',
                    background: bit === 1 ? '#ED6A5A' : '#00607D',
                    borderRadius: 7,
                    padding: '3px 11px',
                  }}
                >
                  {bit}
                </motion.span>
              ))}
              <div style={{ flex: 1, height: 2, background: 'repeating-linear-gradient(90deg, #9BC1BC 0 6px, transparent 6px 12px)' }} />
              <ArrowRight size={16} color="#5A6578" />
            </div>
            <div style={{ fontSize: 11, color: '#5A6578', marginTop: 8 }}>
              a = {round.a} · b = {round.b}
            </div>
          </div>

          {/* Bob, waiting */}
          <div style={{ textAlign: 'center' }}>
            <Stickman
              pose={api.resolved && picked === correct ? 'celebrate' : 'think'}
              size={104}
              accent={api.resolved && picked === correct ? '#76A09B' : '#0081A7'}
              label="Bob waiting for the message"
            />
            <div style={{ fontSize: 13, fontWeight: 700, color: '#22252A', marginTop: 2 }}>Bob</div>
            <div style={{ fontSize: 11, color: '#5A6578' }}>
              {api.resolved && picked === correct ? 'state recovered' : 'holds the qubit'}
            </div>
          </div>
        </div>
      </Stage>

      <div className="roadmap-grid-4">
        {CORRECTIONS.map((c, i) => {
          const isPicked = picked === i;
          const reveal = api.resolved && i === correct;
          return (
            <motion.button
              key={c.label}
              type="button"
              className="qubit-choice"
              disabled={api.resolved}
              onClick={() => onAnswer(i, correct)}
              whileTap={api.resolved ? undefined : { scale: 0.96 }}
              style={{
                padding: '15px 12px',
                textAlign: 'center',
                borderColor: reveal ? '#76A09B' : isPicked ? '#ED6A5A' : undefined,
                background: reveal ? '#EBF1ED' : isPicked && i !== correct ? '#FDECE9' : '#FFFFFF',
                opacity: api.resolved && !isPicked && i !== correct ? 0.45 : 1,
              }}
            >
              <Ket size={20} color="#00607D">
                {c.label}
              </Ket>
              <div style={{ fontSize: 11, color: '#5A6578', marginTop: 5 }}>{c.detail}</div>
            </motion.button>
          );
        })}
      </div>

      {api.resolved && (
        <Verdict ok={picked === correct}>
          <strong>
            {picked === correct
              ? `${CORRECTIONS[correct].label} is right.`
              : `It was ${CORRECTIONS[correct].label}.`}
          </strong>{' '}
          {round.note}
        </Verdict>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   ROUND 5 — basis sifting.
   ══════════════════════════════════════════════════════════════ */

function SiftRound({
  round,
  api,
  keep,
  setKeep,
  sifted,
  onSift,
}: {
  round: Sift;
  api: GameApi;
  keep: boolean[];
  setKeep: (fn: (k: boolean[]) => boolean[]) => void;
  sifted: boolean;
  onSift: () => void;
}) {
  const kept = keep.filter(Boolean).length;
  const allRight = round.alice.every((b, i) => keep[i] === (b === round.bob[i]));

  const toggle = (i: number) => {
    if (api.resolved) return;
    setKeep((k) => k.map((v, j) => (j === i ? !v : v)));
  };

  return (
    <>
      <Prompt>
        Alice sent eight qubits and Bob measured each one. Tap every slot they should <strong>keep</strong>.
      </Prompt>

      {api.hintShown && <HintPanel>{round.hint}</HintPanel>}

      <Stage style={{ padding: '18px 16px' }}>
        <div style={{ overflowX: 'auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(8, minmax(46px, 1fr))',
              gap: 7,
              minWidth: 400,
            }}
          >
            {/* Alice's bases */}
            {round.alice.map((b, i) => (
              <BasisCell key={`a${i}`} basis={b} tone="#00607D" />
            ))}
            {/* Bob's bases */}
            {round.bob.map((b, i) => (
              <BasisCell key={`b${i}`} basis={b} tone="#0081A7" />
            ))}
            {/* The learner's call */}
            {round.alice.map((b, i) => {
              const match = b === round.bob[i];
              const chosen = keep[i];
              const wrong = sifted && chosen !== match;
              return (
                <motion.button
                  key={`k${i}`}
                  type="button"
                  onClick={() => toggle(i)}
                  disabled={api.resolved}
                  whileTap={api.resolved ? undefined : { scale: 0.92 }}
                  aria-pressed={chosen}
                  aria-label={`Slot ${i + 1}: ${chosen ? 'keep' : 'discard'}`}
                  style={{
                    height: 40,
                    borderRadius: 9,
                    cursor: api.resolved ? 'default' : 'pointer',
                    display: 'grid',
                    placeItems: 'center',
                    border: `2px solid ${
                      wrong ? '#ED6A5A' : sifted && match ? '#76A09B' : chosen ? '#00607D' : '#E2E6DF'
                    }`,
                    background: wrong
                      ? '#FDECE9'
                      : chosen
                        ? sifted && match
                          ? '#EBF1ED'
                          : '#E6F4F8'
                        : '#FFFFFF',
                    color: chosen ? '#00607D' : '#B4BCC6',
                  }}
                >
                  {chosen ? <Check size={16} /> : <XIcon size={14} />}
                </motion.button>
              );
            })}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, auto)',
            justifyContent: 'start',
            gap: '4px 18px',
            fontSize: 11,
            color: '#5A6578',
            marginTop: 12,
          }}
        >
          <span>Row 1 — Alice&apos;s basis</span>
          <span>Row 2 — Bob&apos;s basis</span>
          <span>Row 3 — your call</span>
        </div>

        {!api.resolved && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, marginTop: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: '#5A6578' }}>
              Keeping <strong style={{ color: '#22252A' }}>{kept}</strong> of 8
            </span>
            <button type="button" onClick={onSift} className="btn-atlas-coral" style={{ fontSize: 14 }}>
              <KeyRound size={14} /> Sift the key
            </button>
          </div>
        )}

        {api.resolved && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
            <Stickman
              pose={allRight ? 'celebrate' : 'think'}
              size={86}
              accent={allRight ? '#76A09B' : '#0081A7'}
              label={allRight ? 'The key is sifted' : 'Not quite sifted'}
            />
          </div>
        )}
      </Stage>

      {api.resolved && (
        <Verdict ok={allRight}>
          <strong>{allRight ? 'Sifted correctly.' : 'Some slots were mis-called.'}</strong> {round.note}
        </Verdict>
      )}
    </>
  );
}

function BasisCell({ basis, tone }: { basis: Basis; tone: string }) {
  return (
    <div
      style={{
        height: 40,
        borderRadius: 9,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        background: '#FFFFFF',
        border: `1.5px solid ${tone}33`,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 15,
        fontWeight: 700,
        color: tone,
      }}
    >
      {basis}
      {/* The rectilinear / diagonal glyph the protocol is usually drawn with. */}
      <span aria-hidden style={{ fontSize: 11, opacity: 0.55 }}>{basis === 'Z' ? '+' : '×'}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ROUNDS 6–7 — read the error rate, then the theorem behind it.
   ══════════════════════════════════════════════════════════════ */

function ChoiceRound({
  round,
  api,
  picked,
  onAnswer,
}: {
  round: Choice;
  api: GameApi;
  picked: number | null;
  onAnswer: (i: number, correct: number) => void;
}) {
  const Icon = round.icon;

  return (
    <>
      <Prompt>{round.question}</Prompt>

      {api.hintShown && <HintPanel>{round.hint}</HintPanel>}

      <Stage style={{ padding: '18px 18px' }}>
        {round.data ? (
          <div style={{ overflowX: 'auto' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(8, minmax(38px, 1fr))',
                gap: 7,
                minWidth: 340,
              }}
            >
              {round.data.alice.map((bit, i) => (
                <BitCell key={`a${i}`} bit={bit} tone="#00607D" />
              ))}
              {round.data.bob.map((bit, i) => {
                const clash = round.data!.alice[i] !== bit;
                return <BitCell key={`b${i}`} bit={bit} tone={clash ? '#ED6A5A' : '#0081A7'} clash={clash} />;
              })}
            </div>
            <div style={{ display: 'flex', gap: 18, fontSize: 11, color: '#5A6578', marginTop: 10, flexWrap: 'wrap' }}>
              <span>Row 1 — Alice&apos;s bits</span>
              <span>Row 2 — Bob&apos;s bits</span>
              <span style={{ color: '#D95342', fontWeight: 700 }}>coral = they disagree</span>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, flexWrap: 'wrap' }}>
            <Stickman pose="think" size={92} accent="#ED6A5A" label="Eve, thinking about it" />
            <div style={{ maxWidth: 300 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#D95342',
                  marginBottom: 6,
                }}
              >
                <Icon size={13} /> Eve, on the wire
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.65, color: '#3A3F47' }}>
                She can hold each qubit for as long as she likes and she has every gate ever built. The
                one thing she wants is a second copy.
              </p>
            </div>
          </div>
        )}
      </Stage>

      <div className="roadmap-grid-2">
        {round.options.map((opt, i) => {
          const isPicked = picked === i;
          const reveal = api.resolved && i === round.correct;
          return (
            <motion.button
              key={opt.label}
              type="button"
              className="qubit-choice"
              disabled={api.resolved}
              onClick={() => onAnswer(i, round.correct)}
              whileTap={api.resolved ? undefined : { scale: 0.98 }}
              style={{
                padding: '15px 15px',
                textAlign: 'left',
                borderColor: reveal ? '#76A09B' : isPicked ? '#ED6A5A' : undefined,
                background: reveal ? '#EBF1ED' : isPicked && i !== round.correct ? '#FDECE9' : '#FFFFFF',
                opacity: api.resolved && !isPicked && i !== round.correct ? 0.45 : 1,
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 700, color: '#22252A', marginBottom: 5 }}>
                {opt.label}
              </div>
              <div style={{ fontSize: 12.5, color: '#5A6578', lineHeight: 1.55 }}>{opt.detail}</div>
            </motion.button>
          );
        })}
      </div>

      {api.resolved && (
        <Verdict ok={picked === round.correct}>
          <strong>
            {picked === round.correct
              ? 'That is the one.'
              : `The answer was "${round.options[round.correct].label}".`}
          </strong>{' '}
          {round.note}
        </Verdict>
      )}
    </>
  );
}

function BitCell({ bit, tone, clash }: { bit: number; tone: string; clash?: boolean }) {
  return (
    <div
      style={{
        height: 38,
        borderRadius: 9,
        display: 'grid',
        placeItems: 'center',
        background: clash ? '#FDECE9' : '#FFFFFF',
        border: `1.5px solid ${clash ? '#ED6A5A' : `${tone}33`}`,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 15,
        fontWeight: 700,
        color: tone,
      }}
    >
      {bit}
    </div>
  );
}
