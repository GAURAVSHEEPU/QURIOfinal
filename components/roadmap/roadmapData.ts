import type { StickmanPose } from './Stickman';

/* ══════════════════════════════════════════════════════════════
   THE QUANTUM LEARNING ROADMAP — CONTENT LAYER
   Three tracks (beginner → intermediate → pro), 20 milestones,
   and a library of real, linkable resources.
   ══════════════════════════════════════════════════════════════ */

export type LevelId = 'beginner' | 'intermediate' | 'pro';

export type ResourceKind =
  | 'book'
  | 'course'
  | 'video'
  | 'tool'
  | 'paper'
  | 'community'
  | 'practice';

export interface Resource {
  id: string;
  kind: ResourceKind;
  title: string;
  author?: string;
  level: LevelId;
  url: string;
  free: boolean;
  /** One line: why this one, and when to reach for it. */
  note: string;
  tags: string[];
}

export interface Milestone {
  id: string;
  title: string;
  /** Dirac-notation or shorthand glyph shown on the path node. */
  symbol: string;
  span: string;
  summary: string;
  topics: string[];
  /** Phrased as "You can …" — the checkable exit criterion. */
  outcome: string;
  resourceIds: string[];
}

export interface Track {
  id: LevelId;
  label: string;
  subtitle: string;
  tagline: string;
  duration: string;
  commitment: string;
  accent: string;
  accentSoft: string;
  accentInk: string;
  prerequisites: string[];
  outcomes: string[];
  mascotPose: StickmanPose;
  milestones: Milestone[];
}

/* ──────────────────────────────────────────────
   RESOURCE LIBRARY
   ────────────────────────────────────────────── */

export const RESOURCES: Resource[] = [
  /* ─── Books: beginner ─── */
  {
    id: 'bk-bernhardt',
    kind: 'book',
    title: 'Quantum Computing for Everyone',
    author: 'Chris Bernhardt',
    level: 'beginner',
    url: 'https://mitpress.mit.edu/9780262539531/quantum-computing-for-everyone/',
    free: false,
    note: 'The single best first book. Builds the real linear algebra from scratch — no physics degree assumed.',
    tags: ['first read', 'linear algebra', 'gentle'],
  },
  {
    id: 'bk-rudolph',
    kind: 'book',
    title: 'Q is for Quantum',
    author: 'Terry Rudolph',
    level: 'beginner',
    url: 'https://www.qisforquantum.org/',
    free: false,
    note: 'Teaches genuine quantum reasoning using nothing but arithmetic and a clever box diagram.',
    tags: ['no maths', 'intuition', 'short'],
  },
  {
    id: 'bk-sutor',
    kind: 'book',
    title: 'Dancing with Qubits',
    author: 'Robert S. Sutor',
    level: 'beginner',
    url: 'https://www.packtpub.com/en-us/product/dancing-with-qubits-9781837636754',
    free: false,
    note: 'Long maths refresher up front, then quantum. Ideal if your algebra is rusty.',
    tags: ['maths refresher', 'thorough'],
  },
  {
    id: 'bk-rieffel',
    kind: 'book',
    title: 'Quantum Computing: A Gentle Introduction',
    author: 'Eleanor Rieffel & Wolfgang Polak',
    level: 'beginner',
    url: 'https://mitpress.mit.edu/9780262526678/quantum-computing/',
    free: false,
    note: 'The bridge book — gentler than Nielsen & Chuang but rigorous enough to prepare you for it.',
    tags: ['bridge', 'cs-oriented'],
  },
  {
    id: 'bk-programming',
    kind: 'book',
    title: 'Programming Quantum Computers',
    author: 'Johnston, Harrigan & Gimeno-Segovia',
    level: 'beginner',
    url: 'https://www.oreilly.com/library/view/programming-quantum-computers/9781492039686/',
    free: false,
    note: 'Hands-on and circuit-first. Every concept arrives as runnable code you can poke at.',
    tags: ['hands-on', 'code', 'circuits'],
  },
  {
    id: 'bk-qcvc',
    kind: 'book',
    title: 'Quantum Computing for the Very Curious',
    author: 'Andy Matuschak & Michael Nielsen',
    level: 'beginner',
    url: 'https://quantum.country/qcvc',
    free: true,
    note: 'A "mnemonic medium" essay with built-in spaced repetition — you actually retain it.',
    tags: ['free', 'spaced repetition', 'essay'],
  },

  /* ─── Books: intermediate ─── */
  {
    id: 'bk-nielsen-chuang',
    kind: 'book',
    title: 'Quantum Computation and Quantum Information',
    author: 'Michael Nielsen & Isaac Chuang',
    level: 'intermediate',
    url: 'https://www.cambridge.org/9781107002173',
    free: false,
    note: 'Known as "Mike & Ike" — the field\'s standard reference for two decades. Own a copy.',
    tags: ['canonical', 'reference', 'must-read'],
  },
  {
    id: 'bk-mermin',
    kind: 'book',
    title: 'Quantum Computer Science: An Introduction',
    author: 'N. David Mermin',
    level: 'intermediate',
    url: 'https://www.cambridge.org/9780521876582',
    free: false,
    note: 'Short, sharp and unusually honest about which bits of the usual story are hand-waving.',
    tags: ['concise', 'rigorous'],
  },
  {
    id: 'bk-kaye',
    kind: 'book',
    title: 'An Introduction to Quantum Computing',
    author: 'Kaye, Laflamme & Mosca',
    level: 'intermediate',
    url: 'https://global.oup.com/academic/product/an-introduction-to-quantum-computing-9780198570004',
    free: false,
    note: 'Tighter algorithmic focus than Nielsen & Chuang, with excellent worked exercises.',
    tags: ['algorithms', 'exercises'],
  },
  {
    id: 'bk-dewolf',
    kind: 'book',
    title: 'Quantum Computing: Lecture Notes',
    author: 'Ronald de Wolf',
    level: 'intermediate',
    url: 'https://arxiv.org/abs/1907.09415',
    free: true,
    note: 'Free, ~200 pages, complete with exercises. Many people prefer these to any textbook.',
    tags: ['free', 'lecture notes', 'exercises'],
  },
  {
    id: 'bk-hidary',
    kind: 'book',
    title: 'Quantum Computing: An Applied Approach',
    author: 'Jack D. Hidary',
    level: 'intermediate',
    url: 'https://link.springer.com/book/10.1007/978-3-030-83274-2',
    free: false,
    note: 'Theory plus a genuinely useful toolkit chapter and maths appendices.',
    tags: ['applied', 'toolkit'],
  },
  {
    id: 'bk-democritus',
    kind: 'book',
    title: 'Quantum Computing Since Democritus',
    author: 'Scott Aaronson',
    level: 'intermediate',
    url: 'https://www.scottaaronson.com/democritus/',
    free: true,
    note: 'Complexity, philosophy and quantum, very funny. Read it for taste and perspective.',
    tags: ['free', 'complexity', 'perspective'],
  },

  /* ─── Books: pro ─── */
  {
    id: 'bk-watrous',
    kind: 'book',
    title: 'The Theory of Quantum Information',
    author: 'John Watrous',
    level: 'pro',
    url: 'https://cs.uwaterloo.ca/~watrous/TQI/',
    free: true,
    note: 'The rigorous mathematical foundation: channels, norms, semidefinite programming. Free PDF.',
    tags: ['free', 'mathematical', 'reference'],
  },
  {
    id: 'bk-wilde',
    kind: 'book',
    title: 'Quantum Information Theory',
    author: 'Mark M. Wilde',
    level: 'pro',
    url: 'https://arxiv.org/abs/1106.1445',
    free: true,
    note: 'Definitive on entropies and channel capacities. The arXiv edition is free and complete.',
    tags: ['free', 'entropy', 'capacities'],
  },
  {
    id: 'bk-lidar-brun',
    kind: 'book',
    title: 'Quantum Error Correction',
    author: 'Daniel Lidar & Todd Brun (eds.)',
    level: 'pro',
    url: 'https://www.cambridge.org/9780521897877',
    free: false,
    note: 'The edited QEC reference — each chapter by the people who built the subject.',
    tags: ['QEC', 'reference'],
  },
  {
    id: 'bk-kitaev',
    kind: 'book',
    title: 'Classical and Quantum Computation',
    author: 'Kitaev, Shen & Vyalyi',
    level: 'pro',
    url: 'https://bookstore.ams.org/gsm-47',
    free: false,
    note: 'Terse and deep. The original source for much of the fault-tolerance and QMA material.',
    tags: ['terse', 'fault tolerance', 'QMA'],
  },
  {
    id: 'bk-preskill-notes',
    kind: 'book',
    title: 'Ph219 Lecture Notes on Quantum Computation',
    author: 'John Preskill',
    level: 'pro',
    url: 'https://www.preskill.caltech.edu/ph219/',
    free: true,
    note: 'Caltech\'s legendary notes. Chapter 7 on QEC is the clearest treatment anywhere.',
    tags: ['free', 'lecture notes', 'QEC'],
  },

  /* ─── Courses ─── */
  {
    id: 'co-ibm-learning',
    kind: 'course',
    title: 'IBM Quantum Learning',
    author: 'IBM Quantum',
    level: 'beginner',
    url: 'https://learning.quantum.ibm.com/',
    free: true,
    note: 'The official Qiskit curriculum: interactive lessons that run on real hardware for free.',
    tags: ['free', 'qiskit', 'interactive', 'official'],
  },
  {
    id: 'co-ibm-catalog',
    kind: 'course',
    title: 'IBM Quantum Courses Catalog',
    author: 'IBM Quantum',
    level: 'intermediate',
    url: 'https://learning.quantum.ibm.com/catalog/courses',
    free: true,
    note: 'Full course list including the Global Summer School archives and QEC material.',
    tags: ['free', 'summer school', 'catalog'],
  },
  {
    id: 'co-codebook',
    kind: 'course',
    title: 'Xanadu Quantum Codebook',
    author: 'Xanadu / PennyLane',
    level: 'beginner',
    url: 'https://pennylane.ai/codebook/',
    free: true,
    note: 'Learn by solving. Every concept is a small coding puzzle checked in the browser.',
    tags: ['free', 'exercises', 'pennylane'],
  },
  {
    id: 'co-katas',
    kind: 'course',
    title: 'Quantum Katas',
    author: 'Microsoft',
    level: 'beginner',
    url: 'https://quantum.microsoft.com/en-us/tools/quantum-katas',
    free: true,
    note: 'Self-paced Q# programming exercises with automatic verification. Superb for gate practice.',
    tags: ['free', 'Q#', 'exercises'],
  },
  {
    id: 'co-mit-qis',
    kind: 'course',
    title: 'Quantum Information Science I',
    author: 'Isaac Chuang & Peter Shor (MIT, edX)',
    level: 'intermediate',
    url: 'https://openlearninglibrary.mit.edu/courses/course-v1:MITx+8.370.1x+1T2018/about',
    free: true,
    note: 'Taught by the people the algorithms are named after. Free and self-paced on MIT Open Learning.',
    tags: ['free', 'university', 'MITx'],
  },
  {
    id: 'co-berkeley-cs191',
    kind: 'course',
    title: 'CS191: Qubits, Quantum Mechanics and Computers',
    author: 'Umesh Vazirani (UC Berkeley)',
    level: 'intermediate',
    url: 'https://inst.eecs.berkeley.edu/~cs191/',
    free: true,
    note: 'Full lecture notes and problem sets from the course that trained a generation.',
    tags: ['free', 'university', 'problem sets'],
  },
  {
    id: 'co-delft',
    kind: 'course',
    title: 'Quantum 101',
    author: 'QuTech Academy, TU Delft',
    level: 'beginner',
    url: 'https://www.qutube.nl/quantum-101',
    free: true,
    note: 'An entry-level primer on superposition, entanglement and measurement, written by hardware people.',
    tags: ['free', 'primer', 'hardware'],
  },
  {
    id: 'co-qutube',
    kind: 'course',
    title: 'QuTube — QuTech Academy Lectures',
    author: 'QuTech, TU Delft',
    level: 'intermediate',
    url: 'https://www.qutube.nl/',
    free: true,
    note: 'Free video lecture series on quantum hardware, error correction and the quantum internet.',
    tags: ['free', 'video', 'hardware'],
  },
  {
    id: 'co-quantum-country',
    kind: 'course',
    title: 'Quantum Country',
    author: 'Andy Matuschak & Michael Nielsen',
    level: 'beginner',
    url: 'https://quantum.country/',
    free: true,
    note: 'Essays that schedule their own review questions so the material actually sticks.',
    tags: ['free', 'memory', 'essay'],
  },
  {
    id: 'co-3b1b-linalg',
    kind: 'course',
    title: 'Essence of Linear Algebra',
    author: '3Blue1Brown',
    level: 'beginner',
    url: 'https://www.3blue1brown.com/topics/linear-algebra',
    free: true,
    note: 'Prerequisite, not optional. Quantum states *are* vectors; gates *are* matrices.',
    tags: ['free', 'prerequisite', 'linear algebra'],
  },
  {
    id: 'co-mit-1806',
    kind: 'course',
    title: 'MIT 18.06 Linear Algebra',
    author: 'Gilbert Strang',
    level: 'intermediate',
    url: 'https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/',
    free: true,
    note: 'When intuition is not enough: eigenvectors, spectral theorem, unitary matrices, properly.',
    tags: ['free', 'prerequisite', 'rigorous'],
  },

  /* ─── Videos ─── */
  {
    id: 'vid-qiskit',
    kind: 'video',
    title: 'Qiskit YouTube Channel',
    author: 'IBM Quantum',
    level: 'beginner',
    url: 'https://www.youtube.com/@qiskit',
    free: true,
    note: '"Coding with Qiskit" plus seminars. Watch the coding series alongside your first circuits.',
    tags: ['free', 'code-along', 'series'],
  },
  {
    id: 'vid-determined',
    kind: 'video',
    title: 'Quantum Computing for the Determined',
    author: 'Michael Nielsen',
    level: 'beginner',
    url: 'https://www.youtube.com/playlist?list=PL1826E60FD05B44E4',
    free: true,
    note: '22 short blackboard videos covering the core formalism. Still unmatched for clarity.',
    tags: ['free', 'formalism', 'short videos'],
  },
  {
    id: 'vid-lgu',
    kind: 'video',
    title: 'Looking Glass Universe',
    author: 'Mithuna Yoganathan',
    level: 'beginner',
    url: 'https://www.youtube.com/@LookingGlassUniverse',
    free: true,
    note: 'Honest, careful explanations of quantum foundations — and of what nobody understands yet.',
    tags: ['free', 'foundations', 'intuition'],
  },
  {
    id: 'vid-spacetime',
    kind: 'video',
    title: 'PBS Space Time — Quantum Playlist',
    author: 'PBS',
    level: 'beginner',
    url: 'https://www.youtube.com/@pbsspacetime',
    free: true,
    note: 'Good for the physics context around the computing: interpretations, measurement, decoherence.',
    tags: ['free', 'physics context'],
  },
  {
    id: 'vid-elliot',
    kind: 'video',
    title: 'Physics with Elliot',
    author: 'Elliot Schneider',
    level: 'intermediate',
    url: 'https://www.physicswithelliot.com/',
    free: true,
    note: 'Clean lessons and notes on the quantum mechanics underneath the computing formalism.',
    tags: ['free', 'quantum mechanics', 'notes'],
  },
  {
    id: 'vid-veritasium',
    kind: 'video',
    title: 'Veritasium — Quantum Videos',
    author: 'Derek Muller',
    level: 'beginner',
    url: 'https://www.youtube.com/@veritasium',
    free: true,
    note: 'Best-in-class motivation. Watch first to care about the subject, then go read the maths.',
    tags: ['free', 'motivation'],
  },

  /* ─── Tools ─── */
  {
    id: 'tl-qiskit',
    kind: 'tool',
    title: 'Qiskit',
    author: 'IBM',
    level: 'beginner',
    url: 'https://www.ibm.com/quantum/qiskit',
    free: true,
    note: 'The most widely used quantum SDK. Python, huge ecosystem, best learning material.',
    tags: ['free', 'python', 'SDK', 'start here'],
  },
  {
    id: 'tl-ibm-platform',
    kind: 'tool',
    title: 'IBM Quantum Platform',
    author: 'IBM',
    level: 'beginner',
    url: 'https://quantum.ibm.com/',
    free: true,
    note: 'Run your circuits on real superconducting hardware, free. Includes the visual Composer.',
    tags: ['free', 'real hardware', 'cloud'],
  },
  {
    id: 'tl-quirk',
    kind: 'tool',
    title: 'Quirk',
    author: 'Craig Gidney',
    level: 'beginner',
    url: 'https://algassert.com/quirk',
    free: true,
    note: 'Drag-and-drop simulator in the browser, instant state display. Unbeatable for building intuition.',
    tags: ['free', 'browser', 'drag-and-drop', 'intuition'],
  },
  {
    id: 'tl-pennylane',
    kind: 'tool',
    title: 'PennyLane',
    author: 'Xanadu',
    level: 'intermediate',
    url: 'https://pennylane.ai/',
    free: true,
    note: 'Autodiff for quantum circuits — the tool of choice for variational algorithms and QML.',
    tags: ['free', 'differentiable', 'QML', 'variational'],
  },
  {
    id: 'tl-cirq',
    kind: 'tool',
    title: 'Cirq',
    author: 'Google Quantum AI',
    level: 'intermediate',
    url: 'https://quantumai.google/cirq',
    free: true,
    note: 'Lower-level than Qiskit and explicit about hardware topology. Good for NISQ experiments.',
    tags: ['free', 'python', 'NISQ'],
  },
  {
    id: 'tl-qdk',
    kind: 'tool',
    title: 'Azure Quantum Development Kit (Q#)',
    author: 'Microsoft',
    level: 'intermediate',
    url: 'https://learn.microsoft.com/azure/quantum/',
    free: true,
    note: 'A real quantum programming language rather than a circuit library. Worth learning for contrast.',
    tags: ['free', 'Q#', 'language'],
  },
  {
    id: 'tl-qutip',
    kind: 'tool',
    title: 'QuTiP',
    author: 'QuTiP developers',
    level: 'intermediate',
    url: 'https://qutip.org/',
    free: true,
    note: 'Open quantum systems: Lindblad dynamics, noise channels, Bloch visualisation.',
    tags: ['free', 'open systems', 'noise'],
  },
  {
    id: 'tl-braket',
    kind: 'tool',
    title: 'Amazon Braket',
    author: 'AWS',
    level: 'intermediate',
    url: 'https://aws.amazon.com/braket/',
    free: false,
    note: 'One API across ion-trap, neutral-atom and superconducting hardware. Compare architectures.',
    tags: ['cloud', 'multi-vendor', 'paid'],
  },
  {
    id: 'tl-stim',
    kind: 'tool',
    title: 'Stim',
    author: 'Craig Gidney / Google',
    level: 'pro',
    url: 'https://github.com/quantumlib/Stim',
    free: true,
    note: 'Blisteringly fast stabilizer simulator. The standard tool for surface-code research.',
    tags: ['free', 'QEC', 'stabilizer', 'research'],
  },
  {
    id: 'tl-qurio-circuit',
    kind: 'tool',
    title: 'Qurio Circuit Studio',
    author: 'The Qurio Atlas',
    level: 'beginner',
    url: '/circuit',
    free: true,
    note: 'Build circuits here, watch the statevector update, and export straight to Qiskit.',
    tags: ['free', 'in-house', 'circuits'],
  },
  {
    id: 'tl-qurio-simulate',
    kind: 'tool',
    title: 'Qurio 3D Bloch Simulator',
    author: 'The Qurio Atlas',
    level: 'beginner',
    url: '/simulate',
    free: true,
    note: 'Rotate a live Bloch vector and see exactly what each gate does to it.',
    tags: ['free', 'in-house', 'bloch sphere'],
  },

  /* ─── Papers ─── */
  {
    id: 'pp-shor',
    kind: 'paper',
    title: 'Polynomial-Time Algorithms for Prime Factorization',
    author: 'Peter Shor (1997)',
    level: 'intermediate',
    url: 'https://arxiv.org/abs/quant-ph/9508027',
    free: true,
    note: 'The paper that made governments care. Read it once you know the QFT.',
    tags: ['free', 'landmark', 'shor'],
  },
  {
    id: 'pp-grover',
    kind: 'paper',
    title: 'A Fast Quantum Mechanical Algorithm for Database Search',
    author: 'Lov Grover (1996)',
    level: 'intermediate',
    url: 'https://arxiv.org/abs/quant-ph/9605043',
    free: true,
    note: 'Six pages. Genuinely readable once you have amplitude amplification in hand.',
    tags: ['free', 'landmark', 'grover', 'short'],
  },
  {
    id: 'pp-bb84',
    kind: 'paper',
    title: 'Quantum Cryptography: Public Key Distribution and Coin Tossing',
    author: 'Bennett & Brassard (1984)',
    level: 'intermediate',
    url: 'https://doi.org/10.1016/j.tcs.2014.05.025',
    free: true,
    note: 'BB84 — the origin of quantum key distribution, and still deployed today.',
    tags: ['free', 'landmark', 'cryptography'],
  },
  {
    id: 'pp-nisq',
    kind: 'paper',
    title: 'Quantum Computing in the NISQ Era and Beyond',
    author: 'John Preskill (2018)',
    level: 'intermediate',
    url: 'https://arxiv.org/abs/1801.00862',
    free: true,
    note: 'The essay that named the era we are in. Essential for calibrating your expectations.',
    tags: ['free', 'perspective', 'NISQ'],
  },
  {
    id: 'pp-surface-codes',
    kind: 'paper',
    title: 'Surface Codes: Towards Practical Large-Scale Quantum Computation',
    author: 'Fowler, Mariantoni, Martinis & Cleland (2012)',
    level: 'pro',
    url: 'https://arxiv.org/abs/1208.0928',
    free: true,
    note: 'The standard entry point to surface codes. Long, but the pictures carry you.',
    tags: ['free', 'QEC', 'surface code'],
  },
  {
    id: 'pp-willow',
    kind: 'paper',
    title: 'Quantum Error Correction Below the Surface Code Threshold',
    author: 'Google Quantum AI (2024)',
    level: 'pro',
    url: 'https://arxiv.org/abs/2408.13687',
    free: true,
    note: 'The Willow result: scaling the code distance finally *reduced* the logical error rate.',
    tags: ['free', 'QEC', 'milestone', 'recent'],
  },
  {
    id: 'pp-rsa-8h',
    kind: 'paper',
    title: 'How to Factor 2048-Bit RSA Integers in 8 Hours',
    author: 'Gidney & Ekerå (2019)',
    level: 'pro',
    url: 'https://arxiv.org/abs/1905.09749',
    free: true,
    note: 'Concrete resource estimation. This is what it actually costs to break RSA — 20M qubits.',
    tags: ['free', 'resource estimation', 'cryptography'],
  },
  {
    id: 'pp-supremacy',
    kind: 'paper',
    title: 'Quantum Supremacy Using a Programmable Superconducting Processor',
    author: 'Arute et al. (2019)',
    level: 'pro',
    url: 'https://www.nature.com/articles/s41586-019-1666-5',
    free: true,
    note: 'The Sycamore experiment, plus the long argument about what it did and did not show.',
    tags: ['free', 'hardware', 'landmark'],
  },
  {
    id: 'pp-qubitization',
    kind: 'paper',
    title: 'Hamiltonian Simulation by Qubitization',
    author: 'Guang Hao Low & Isaac Chuang (2016)',
    level: 'pro',
    url: 'https://arxiv.org/abs/1610.06546',
    free: true,
    note: 'The modern optimal approach to simulation, and the gateway to QSVT.',
    tags: ['free', 'simulation', 'advanced'],
  },
  {
    id: 'pp-qsvt',
    kind: 'paper',
    title: 'Quantum Singular Value Transformation',
    author: 'Gilyén, Su, Low & Wiebe (2018)',
    level: 'pro',
    url: 'https://arxiv.org/abs/1806.01838',
    free: true,
    note: 'The grand unification: Grover, phase estimation and simulation as one framework.',
    tags: ['free', 'unifying', 'advanced'],
  },
  {
    id: 'pp-error-mitigation',
    kind: 'paper',
    title: 'Quantum Error Mitigation',
    author: 'Cai et al. (2022)',
    level: 'pro',
    url: 'https://arxiv.org/abs/2210.00921',
    free: true,
    note: 'Review of what you do about noise *before* you can afford full error correction.',
    tags: ['free', 'noise', 'review'],
  },
  {
    id: 'pp-algo-zoo',
    kind: 'paper',
    title: 'Quantum Algorithm Zoo',
    author: 'Stephen Jordan',
    level: 'pro',
    url: 'https://quantumalgorithmzoo.org/',
    free: true,
    note: 'A living, categorised index of every known quantum algorithm with speedups and citations.',
    tags: ['free', 'index', 'algorithms', 'reference'],
  },

  /* ─── Communities ─── */
  {
    id: 'cm-qosf',
    kind: 'community',
    title: 'Quantum Open Source Foundation',
    level: 'beginner',
    url: 'https://qosf.org/',
    free: true,
    note: 'The hub for open-source quantum. Slack, project list, and the mentorship programme.',
    tags: ['free', 'open source', 'slack'],
  },
  {
    id: 'cm-qosf-mentorship',
    kind: 'community',
    title: 'QOSF Quantum Computing Mentorship',
    level: 'intermediate',
    url: 'https://qosf.org/qc_mentorship/',
    free: true,
    note: 'Free, competitive, twice yearly. Ship a real project with a researcher mentoring you.',
    tags: ['free', 'mentorship', 'project'],
  },
  {
    id: 'cm-stackexchange',
    kind: 'community',
    title: 'Quantum Computing Stack Exchange',
    level: 'beginner',
    url: 'https://quantumcomputing.stackexchange.com/',
    free: true,
    note: 'Where your specific confusion has probably already been answered by an expert.',
    tags: ['free', 'Q&A'],
  },
  {
    id: 'cm-qiskit-slack',
    kind: 'community',
    title: 'Qiskit Slack',
    level: 'beginner',
    url: 'https://qisk.it/join-slack',
    free: true,
    note: 'Thousands of practitioners, very newcomer-friendly, and the Qiskit devs are in there.',
    tags: ['free', 'slack', 'help'],
  },
  {
    id: 'cm-unitary',
    kind: 'community',
    title: 'Unitary Foundation',
    level: 'intermediate',
    url: 'https://unitary.foundation/',
    free: true,
    note: 'Microgrants for open-source quantum work, plus a lively research-adjacent Discord.',
    tags: ['free', 'grants', 'open source'],
  },
  {
    id: 'cm-reddit',
    kind: 'community',
    title: 'r/QuantumComputing',
    level: 'beginner',
    url: 'https://www.reddit.com/r/QuantumComputing/',
    free: true,
    note: 'News, career questions, and reliable debunking of overheated press releases.',
    tags: ['free', 'news', 'careers'],
  },
  {
    id: 'cm-quantum-journal',
    kind: 'community',
    title: 'Quantum (the journal)',
    level: 'pro',
    url: 'https://quantum-journal.org/',
    free: true,
    note: 'Open-access, community-run, high quality. The best single feed for current results.',
    tags: ['free', 'journal', 'open access'],
  },
  {
    id: 'cm-arxiv',
    kind: 'community',
    title: 'arXiv quant-ph',
    level: 'pro',
    url: 'https://arxiv.org/list/quant-ph/recent',
    free: true,
    note: 'Where the field actually publishes. Skim daily titles; read one paper a week properly.',
    tags: ['free', 'preprints', 'habit'],
  },

  /* ─── Practice ─── */
  {
    id: 'pr-ibm-challenges',
    kind: 'practice',
    title: 'IBM Quantum Challenge notebooks',
    level: 'intermediate',
    url: 'https://github.com/qiskit-community/ibm-quantum-challenge-2024',
    free: true,
    note: 'Graded problem sets that run on real hardware. The best pressure-test of your Qiskit.',
    tags: ['free', 'challenge', 'qiskit'],
  },
  {
    id: 'pr-qhack',
    kind: 'practice',
    title: 'QHack',
    author: 'Xanadu',
    level: 'intermediate',
    url: 'https://qhack.ai/',
    free: true,
    note: 'Annual coding challenge plus open hackathon. A genuinely good line on a CV.',
    tags: ['free', 'hackathon', 'annual'],
  },
  {
    id: 'pr-qosf-tasks',
    kind: 'practice',
    title: 'QOSF Monthly Challenges & Screening Tasks',
    level: 'intermediate',
    url: 'https://github.com/qosf/monthly-challenges',
    free: true,
    note: 'Past mentorship screening tasks. Solve two and you have a portfolio.',
    tags: ['free', 'portfolio', 'tasks'],
  },
  {
    id: 'pr-build-bell',
    kind: 'practice',
    title: 'Build It: Bell State from Scratch',
    level: 'beginner',
    url: '/circuit',
    free: true,
    note: 'H then CNOT, by hand, then predict the histogram before you run it. Do this on paper first.',
    tags: ['free', 'project', 'entanglement'],
  },
  {
    id: 'pr-build-grover',
    kind: 'practice',
    title: 'Build It: Grover Search on 3 Qubits',
    level: 'intermediate',
    url: '/circuit',
    free: true,
    note: 'Write your own oracle and diffuser, then verify the √N scaling empirically.',
    tags: ['free', 'project', 'grover'],
  },
  {
    id: 'pr-build-vqe',
    kind: 'practice',
    title: 'Build It: VQE for the H₂ Ground State',
    level: 'intermediate',
    url: 'https://pennylane.ai/qml/demos/tutorial_vqe/',
    free: true,
    note: 'The canonical variational project. Match the known bond-dissociation curve.',
    tags: ['free', 'project', 'VQE', 'chemistry'],
  },
  {
    id: 'pr-build-decoder',
    kind: 'practice',
    title: 'Build It: A Surface-Code Decoder',
    level: 'pro',
    url: 'https://github.com/quantumlib/Stim',
    free: true,
    note: 'Simulate with Stim, decode with minimum-weight matching, and plot your threshold.',
    tags: ['free', 'project', 'QEC', 'hard'],
  },
];

/** Fast id → Resource lookup for milestone resource resolution. */
export const RESOURCE_BY_ID: Record<string, Resource> = RESOURCES.reduce(
  (acc, r) => {
    acc[r.id] = r;
    return acc;
  },
  {} as Record<string, Resource>
);

export function resolveResources(ids: string[]): Resource[] {
  return ids.map((id) => RESOURCE_BY_ID[id]).filter(Boolean);
}

/* ──────────────────────────────────────────────
   TRACKS
   ────────────────────────────────────────────── */

export const TRACKS: Track[] = [
  {
    id: 'beginner',
    label: 'Beginner',
    subtitle: 'Base Camp',
    tagline:
      'You have never seen a ket before. By the end you will have entangled two qubits on real hardware.',
    duration: '≈ 8 weeks',
    commitment: '4–6 hrs / week',
    accent: '#0081A7',
    accentSoft: '#E6F4F8',
    accentInk: '#00607D',
    mascotPose: 'read',
    prerequisites: [
      'High-school algebra — you can multiply matrices, or are willing to learn this week',
      'Curiosity, and tolerance for being confused for a few days',
      'Basic Python is helpful but not required to start',
    ],
    outcomes: [
      'Read and write Dirac notation without flinching',
      'Predict what H, X, Z and CNOT do to any small state',
      'Explain superposition and entanglement without saying "both at once"',
      'Run your own circuit on IBM hardware and interpret the histogram',
    ],
    milestones: [
      {
        id: 'b1',
        title: 'Math & Code Warm-Up',
        symbol: 'ℂ²',
        span: 'Week 1',
        summary:
          'Quantum computing is applied linear algebra over complex numbers. Get the prerequisites in place first and everything afterwards is far easier.',
        topics: [
          'Vectors, matrices, matrix multiplication',
          'Complex numbers, modulus, phase, Euler\'s formula',
          'Probability: distributions, expectation',
          'Python + NumPy basics',
        ],
        outcome:
          'You can multiply a 2×2 complex matrix by a vector by hand and get it right.',
        resourceIds: ['co-3b1b-linalg', 'bk-sutor', 'co-mit-1806', 'tl-qiskit'],
      },
      {
        id: 'b2',
        title: 'What Is a Qubit?',
        symbol: '|ψ⟩ = α|0⟩ + β|1⟩',
        span: 'Week 2',
        summary:
          'A qubit is a unit vector in a two-dimensional complex space. Superposition is not "both at once" — it is a specific linear combination with amplitudes that interfere.',
        topics: [
          'Dirac (bra-ket) notation',
          'Amplitudes vs probabilities, |α|² + |β|² = 1',
          'Measurement and collapse',
          'The Bloch sphere as a picture',
        ],
        outcome:
          'You can write down any qubit state and say what measuring it will yield, statistically.',
        resourceIds: ['bk-bernhardt', 'bk-qcvc', 'vid-determined', 'tl-qurio-simulate', 'co-quantum-country'],
      },
      {
        id: 'b3',
        title: 'Your First Gates',
        symbol: 'X · Z · H · S',
        span: 'Week 3',
        summary:
          'Gates are unitary matrices — rotations of the state vector. Unitarity is why quantum computation is reversible, and why there is no quantum "erase".',
        topics: [
          'Pauli X, Y, Z',
          'Hadamard and the ± basis',
          'Phase gates S and T, global vs relative phase',
          'Unitarity and reversibility',
        ],
        outcome:
          'Given a circuit of single-qubit gates, you can compute the output state on paper.',
        resourceIds: ['tl-quirk', 'co-ibm-learning', 'bk-programming', 'co-katas', 'tl-qurio-simulate'],
      },
      {
        id: 'b4',
        title: 'Two Qubits & Entanglement',
        symbol: '|Φ⁺⟩ = (|00⟩+|11⟩)/√2',
        span: 'Week 4–5',
        summary:
          'The state space grows as 2ⁿ. Some two-qubit states cannot be written as a product of single-qubit states at all — those are the entangled ones, and they are where the power lives.',
        topics: [
          'Tensor products and the 4-dimensional state space',
          'CNOT and controlled gates',
          'The four Bell states',
          'Why entanglement does not let you signal faster than light',
        ],
        outcome:
          'You can build a Bell state, and prove it is not a product state.',
        resourceIds: ['bk-bernhardt', 'tl-quirk', 'co-codebook', 'pr-build-bell', 'bk-rudolph'],
      },
      {
        id: 'b5',
        title: 'First Circuits in Code',
        symbol: 'qc.h(0)',
        span: 'Week 6–7',
        summary:
          'Move from paper to a real device. Simulators are exact; hardware is noisy — and seeing that gap for yourself is the fastest way to understand why error correction matters.',
        topics: [
          'Qiskit: circuits, transpilation, primitives',
          'Simulator vs real backend',
          'Reading histograms and shot noise',
          'Where your results diverge from theory, and why',
        ],
        outcome:
          'You have run a circuit on real IBM hardware and can explain why the counts are not exactly 50/50.',
        resourceIds: ['tl-qiskit', 'tl-ibm-platform', 'co-ibm-learning', 'vid-qiskit', 'tl-qurio-circuit'],
      },
      {
        id: 'b6',
        title: 'Teleportation & BB84',
        symbol: '⟨protocol⟩',
        span: 'Week 8',
        summary:
          'Your first two genuinely useful protocols. Both are simple enough to fully understand now, and both do something classically impossible.',
        topics: [
          'Quantum teleportation, and why it needs a classical channel',
          'Superdense coding',
          'BB84 key distribution',
          'The no-cloning theorem',
        ],
        outcome:
          'You can implement teleportation from memory and explain why it does not violate relativity.',
        resourceIds: ['pp-bb84', 'co-ibm-learning', 'bk-rieffel', 'cm-qiskit-slack', 'cm-stackexchange'],
      },
    ],
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    subtitle: 'The Ascent',
    tagline:
      'You know what a qubit is. Now derive the famous algorithms yourself and confront real noise.',
    duration: '≈ 12 weeks',
    commitment: '6–10 hrs / week',
    accent: '#ED6A5A',
    accentSoft: '#FDECE9',
    accentInk: '#C4402F',
    mascotPose: 'juggle',
    prerequisites: [
      'The Beginner track, or equivalent comfort with gates and Bell states',
      'Linear algebra: eigenvectors, unitary and Hermitian matrices, tensor products',
      'Python you can debug — you will be writing real programs',
    ],
    outcomes: [
      'Derive Grover and Shor rather than just quoting their speedups',
      'Work fluently with density matrices, partial traces and noise channels',
      'Build and train a variational algorithm, and diagnose why it stalls',
      'Say precisely what BQP is and is not known to contain',
    ],
    milestones: [
      {
        id: 'i1',
        title: 'Linear Algebra, Properly',
        symbol: 'U†U = I',
        span: 'Week 1–2',
        summary:
          'Everything from here on is stated in the language of Hilbert spaces and operators. Intuition alone will stop working around this point.',
        topics: [
          'Hilbert spaces, inner products, orthonormal bases',
          'Hermitian vs unitary operators',
          'Eigendecomposition and the spectral theorem',
          'Tensor product algebra, and operators on subsystems',
        ],
        outcome:
          'You can diagonalise an observable and compute expectation values ⟨ψ|A|ψ⟩ comfortably.',
        resourceIds: ['co-mit-1806', 'bk-nielsen-chuang', 'bk-dewolf', 'bk-mermin'],
      },
      {
        id: 'i2',
        title: 'Density Matrices & Mixed States',
        symbol: 'ρ = Σ pᵢ|ψᵢ⟩⟨ψᵢ|',
        span: 'Week 3',
        summary:
          'Pure states are a special case. The density matrix is the honest description of any subsystem, and the only way to talk about noise or partial information.',
        topics: [
          'Density operators, trace, purity',
          'Partial trace and reduced states',
          'The Bloch ball vs the Bloch sphere',
          'POVMs and generalised measurement',
        ],
        outcome:
          'You can trace out one half of a Bell pair and explain why the result is maximally mixed.',
        resourceIds: ['bk-nielsen-chuang', 'tl-qutip', 'bk-watrous', 'co-berkeley-cs191'],
      },
      {
        id: 'i3',
        title: 'Oracles & Phase Kickback',
        symbol: '(-1)^f(x)',
        span: 'Week 4',
        summary:
          'Deutsch–Jozsa and Bernstein–Vazirani are the two algorithms simple enough to understand completely — and they contain the trick every later algorithm reuses.',
        topics: [
          'Query / oracle model and query complexity',
          'Phase kickback',
          'Deutsch–Jozsa',
          'Bernstein–Vazirani',
        ],
        outcome:
          'You can explain phase kickback in one sentence and show where it appears in Grover and Shor.',
        resourceIds: ['bk-dewolf', 'co-codebook', 'bk-kaye', 'co-mit-qis'],
      },
      {
        id: 'i4',
        title: "Grover's Search",
        symbol: 'O(√N)',
        span: 'Week 5–6',
        summary:
          'Amplitude amplification, seen geometrically: each iteration is a rotation in a two-dimensional plane. This also shows you why the speedup is only quadratic, and why that is provably optimal.',
        topics: [
          'Oracle construction',
          'The diffusion operator',
          'Geometric picture of the rotation',
          'Optimality, and the danger of over-iterating',
        ],
        outcome:
          'You have implemented Grover on 3 qubits and measured the √N scaling yourself.',
        resourceIds: ['pp-grover', 'pr-build-grover', 'tl-quirk', 'bk-nielsen-chuang', 'co-ibm-learning'],
      },
      {
        id: 'i5',
        title: 'QFT, Phase Estimation & Shor',
        symbol: 'QFT|x⟩',
        span: 'Week 7–8',
        summary:
          'The deepest result in the beginner-accessible canon. Factoring reduces to period finding, period finding reduces to phase estimation, and phase estimation is the QFT.',
        topics: [
          'Quantum Fourier Transform and its circuit',
          'Quantum phase estimation',
          'Order finding and the reduction from factoring',
          'Modular exponentiation cost, and post-quantum cryptography',
        ],
        outcome:
          'You can explain the full chain from "factor N" to "measure this register" without hand-waving.',
        resourceIds: ['pp-shor', 'bk-nielsen-chuang', 'bk-dewolf', 'co-mit-qis', 'pp-rsa-8h'],
      },
      {
        id: 'i6',
        title: 'Noise, Decoherence & NISQ',
        symbol: 'T₁, T₂',
        span: 'Week 9',
        summary:
          'Real devices lose coherence. Understanding how is what separates people who can quote algorithms from people who can get results out of current hardware.',
        topics: [
          'T₁ relaxation and T₂ dephasing',
          'Quantum channels and Kraus operators',
          'Depolarising and amplitude-damping noise',
          'Error mitigation: ZNE, readout correction',
        ],
        outcome:
          'You can model a noisy circuit in QuTiP or Qiskit and predict how fidelity degrades with depth.',
        resourceIds: ['pp-nisq', 'tl-qutip', 'pp-error-mitigation', 'co-qutube', 'tl-ibm-platform'],
      },
      {
        id: 'i7',
        title: 'Variational Algorithms',
        symbol: 'min ⟨ψ(θ)|H|ψ(θ)⟩',
        span: 'Week 10–11',
        summary:
          'The dominant paradigm for near-term hardware: a shallow parameterised circuit with a classical optimiser in the loop. Also where most of the current hype and most of the current disappointment lives.',
        topics: [
          'VQE and the variational principle',
          'QAOA for combinatorial optimisation',
          'Ansatz design and expressibility',
          'Barren plateaus, and why your gradients vanish',
        ],
        outcome:
          'You have reproduced the H₂ dissociation curve with VQE and hit a barren plateau on purpose.',
        resourceIds: ['tl-pennylane', 'pr-build-vqe', 'co-codebook', 'tl-cirq', 'pr-qhack'],
      },
      {
        id: 'i8',
        title: 'BQP & Complexity',
        symbol: 'BQP ⊆ PSPACE',
        span: 'Week 12',
        summary:
          'What is a quantum computer actually believed to be good for? The honest answer is a complexity-theoretic one, and it is narrower than the press suggests.',
        topics: [
          'BQP, its relation to P, NP and PSPACE',
          'Why quantum computers are not believed to solve NP-complete problems fast',
          'Oracle separations and query lower bounds',
          'QMA and local Hamiltonian problems',
        ],
        outcome:
          'You can correct someone who claims quantum computers "try all answers at once".',
        resourceIds: ['bk-democritus', 'bk-dewolf', 'pp-algo-zoo', 'co-berkeley-cs191', 'cm-reddit'],
      },
    ],
  },
  {
    id: 'pro',
    label: 'Pro',
    subtitle: 'The Summit',
    tagline:
      'Fault tolerance, information theory, hardware and live research. This track does not end.',
    duration: 'Ongoing',
    commitment: '10+ hrs / week',
    accent: '#3F5185',
    accentSoft: '#EAEDF6',
    accentInk: '#2C3A63',
    mascotPose: 'teach',
    prerequisites: [
      'The Intermediate track, comfortably',
      'Ability to read a quant-ph paper and extract the claim, method and gap',
      'Some numerical computing maturity — you will write simulations that must be right',
    ],
    outcomes: [
      'Reason fluently in the stabilizer formalism and about code distance',
      'Explain what a fault-tolerant architecture costs, in qubits and in time',
      'Compare hardware modalities on coherence, connectivity and gate fidelity',
      'Reproduce a recent result, and contribute something back',
    ],
    milestones: [
      {
        id: 'p1',
        title: 'Quantum Error Correction',
        symbol: '⟦n, k, d⟧',
        span: 'Stage 1',
        summary:
          'You cannot copy a qubit, so classical repetition is unavailable. QEC works by measuring only the syndrome — extracting information about the error while learning nothing about the data.',
        topics: [
          'The stabilizer formalism',
          'Shor, Steane and CSS codes',
          'Surface codes and code distance',
          'The threshold theorem',
        ],
        outcome:
          'You can write down the stabilizers of the surface code and decode a single-qubit error by hand.',
        resourceIds: ['bk-preskill-notes', 'pp-surface-codes', 'bk-lidar-brun', 'tl-stim', 'pp-willow'],
      },
      {
        id: 'p2',
        title: 'Fault Tolerance & Magic States',
        symbol: '|T⟩ distillation',
        span: 'Stage 2',
        summary:
          'Error correction is not enough — the gates themselves must not spread errors. Eastin–Knill says no code has a universal transversal gate set, which is why magic state distillation dominates the resource cost of every real machine.',
        topics: [
          'Transversal gates and the Eastin–Knill theorem',
          'Magic state distillation and injection',
          'Lattice surgery and braiding',
          'Space-time resource estimation',
        ],
        outcome:
          'You can estimate the physical qubit count for a logical algorithm and say where it all goes.',
        resourceIds: ['pp-rsa-8h', 'bk-kitaev', 'bk-preskill-notes', 'tl-stim', 'pr-build-decoder'],
      },
      {
        id: 'p3',
        title: 'Quantum Information Theory',
        symbol: 'S(ρ) = −Tr ρ log ρ',
        span: 'Stage 3',
        summary:
          'The information-theoretic layer: how much can a quantum channel carry, what entanglement is as a resource, and what can and cannot be done with local operations.',
        topics: [
          'von Neumann entropy, relative entropy, mutual information',
          'Channel capacities, Holevo bound, coherent information',
          'LOCC, entanglement measures, distillation',
          'Resource theories',
        ],
        outcome:
          'You can compute the entanglement entropy of a bipartite state and interpret what it means operationally.',
        resourceIds: ['bk-wilde', 'bk-watrous', 'cm-quantum-journal', 'bk-preskill-notes'],
      },
      {
        id: 'p4',
        title: 'Hardware Deep Dive',
        symbol: 'ω₀₁ / 2π',
        span: 'Stage 4',
        summary:
          'Algorithms do not run in a vacuum. Each modality makes a different bargain between coherence time, gate speed, connectivity and manufacturability — and those bargains determine what is worth compiling.',
        topics: [
          'Superconducting transmons, dispersive readout, cQED',
          'Trapped ions: all-to-all connectivity, slower gates',
          'Photonics, neutral atoms, spin qubits',
          'The control stack: pulses, calibration, crosstalk',
        ],
        outcome:
          'You can argue, with numbers, which platform suits a given algorithm and why.',
        resourceIds: ['co-qutube', 'co-delft', 'pp-supremacy', 'tl-braket', 'tl-qutip'],
      },
      {
        id: 'p5',
        title: 'Simulation, Qubitization & QSVT',
        symbol: 'e^{-iHt}',
        span: 'Stage 5',
        summary:
          'Hamiltonian simulation is the application with the clearest quantum advantage. The modern toolkit — LCU, qubitization, QSVT — also turns out to unify almost every known algorithm.',
        topics: [
          'Trotter–Suzuki and its error bounds',
          'Linear combination of unitaries, block encodings',
          'Qubitization and optimal query scaling',
          'Quantum singular value transformation',
        ],
        outcome:
          'You can express Grover and phase estimation as instances of QSVT.',
        resourceIds: ['pp-qubitization', 'pp-qsvt', 'pp-algo-zoo', 'bk-nielsen-chuang'],
      },
      {
        id: 'p6',
        title: 'Research & Contribution',
        symbol: 'arXiv:____',
        span: 'Ongoing',
        summary:
          'The transition from consuming the field to participating in it. Reproduce before you extend: implementing someone else\'s result is how you find the questions worth asking.',
        topics: [
          'Reading quant-ph efficiently — claim, method, gap',
          'Reproducing a published numerical result',
          'Contributing to Qiskit, Cirq, PennyLane or Stim',
          'QOSF mentorship, workshops, and writing it up',
        ],
        outcome:
          'You have reproduced a recent paper and opened a pull request or written up your findings.',
        resourceIds: ['cm-arxiv', 'cm-qosf-mentorship', 'cm-unitary', 'cm-quantum-journal', 'pr-qosf-tasks', 'pr-build-decoder'],
      },
    ],
  },
];

export const TRACK_BY_ID: Record<LevelId, Track> = TRACKS.reduce(
  (acc, t) => {
    acc[t.id] = t;
    return acc;
  },
  {} as Record<LevelId, Track>
);

export const KIND_LABELS: Record<ResourceKind, string> = {
  book: 'Books',
  course: 'Courses',
  video: 'Videos',
  tool: 'Tools',
  paper: 'Papers',
  community: 'Communities',
  practice: 'Practice',
};

export const LEVEL_LABELS: Record<LevelId, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  pro: 'Pro',
};

export const LEVEL_ACCENTS: Record<LevelId, { accent: string; soft: string }> = {
  beginner: { accent: '#0081A7', soft: '#E6F4F8' },
  intermediate: { accent: '#ED6A5A', soft: '#FDECE9' },
  pro: { accent: '#3F5185', soft: '#EAEDF6' },
};

export const TOTAL_MILESTONES = TRACKS.reduce((n, t) => n + t.milestones.length, 0);
export const TOTAL_RESOURCES = RESOURCES.length;
export const TOTAL_FREE_RESOURCES = RESOURCES.filter((r) => r.free).length;
