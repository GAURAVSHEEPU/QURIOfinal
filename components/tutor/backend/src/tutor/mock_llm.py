"""
Mock LLM Provider for Testing & Offline Verification.

Provides deterministic, structured JSON responses and critiques for all tutor modes
without requiring live API keys or external network connections.
"""

import json


def _generate_explain_answer(query: str, concept: str, skill_level: str) -> tuple[str, str, str]:
    q_lower = query.lower() if query else ""
    c_lower = concept.lower() if concept else ""

    # Multi-part: Quantum Computing + Applications
    if ("quantum computing" in q_lower and ("application" in q_lower or "applications" in q_lower or "used for" in q_lower)) or c_lower == "applications of quantum computing":
        answer = (
            "## What is Quantum Computing?\n"
            "Quantum computing is an advanced computing paradigm that leverages quantum mechanics principles—such as superposition, entanglement, and quantum interference—to process complex information in ways classical computers cannot.\n\n"
            "## Applications of Quantum Computing\n"
            "Key practical application areas include:\n"
            "1. Cryptography & Cyber Security: Integer factorization via Shor's algorithm and Quantum Key Distribution (QKD).\n"
            "2. Molecular Simulation & Drug Discovery: Modeling chemical reactions and molecular structures using quantum simulators.\n"
            "3. Optimization & Logistics: Solving complex combinatorial optimization problems using algorithms like VQE and QAOA.\n"
            "4. Quantum Machine Learning & Financial Modeling: Enhancing pattern recognition and portfolio risk modeling."
        )
        hint = "Remember: Quantum computers excel at specific mathematical and physical simulation problems, rather than replacing general classical tasks."
        next_step = "Explore how Grover's or Shor's algorithm demonstrates quantum advantage."
        return answer, hint, next_step

    # Multi-part or Comparison: Qubit vs Classical Bit
    if ("difference" in q_lower or "different" in q_lower or "differ" in q_lower or "vs" in q_lower or "versus" in q_lower) and ("classical" in q_lower or "bit" in q_lower):
        answer = (
            "## What is a Qubit?\n"
            "A qubit (quantum bit) is the fundamental unit of quantum information. Unlike a classical bit which is strictly either 0 or 1, a qubit state is represented as a linear combination |psi> = alpha|0> + beta|1>, where alpha and beta are complex probability amplitudes satisfying |alpha|^2 + |beta|^2 = 1.\n\n"
            "## Key Differences from Classical Bits\n"
            "1. State Representation: Classical bits are binary (0 or 1); qubits exist in a continuous state space on the Bloch sphere.\n"
            "2. Superposition: Qubits can evaluate parallel computational paths simultaneously prior to measurement.\n"
            "3. Measurement: Reading a qubit non-deterministically collapses its superposition state into a definite 0 or 1 outcome."
        )
        hint = "Think of a classical bit as a light switch (ON/OFF) and a qubit as a point on a 3D sphere."
        next_step = "Practice visualizing qubit state vectors on the Bloch sphere."
        return answer, hint, next_step

    # Bloch Sphere
    if "bloch" in q_lower or "bloch" in c_lower:
        answer = (
            "The Bloch sphere is a geometrical representation of the pure state space of a two-level quantum mechanical system (qubit). "
            "Any single-qubit state |psi> = cos(theta/2)|0> + e^(i*phi)*sin(theta/2)|1> corresponds to a unique point (x, y, z) on the unit 3D sphere, "
            "where theta (0 <= theta <= pi) is the polar angle specifying measurement probability, and phi (0 <= phi < 2*pi) is the azimuthal phase angle."
        )
        hint = "North pole represents basis state |0>, South pole represents |1>, and points on the equator represent equal superposition states like |+>."
        next_step = "Explore how single-qubit gate rotations (RX, RY, RZ, H) rotate state vectors around the Bloch sphere axes."
        return answer, hint, next_step

    # Single-Qubit Gate Transformations / Rotations on Bloch Sphere
    if ("gate" in q_lower or "gates" in q_lower or "rotation" in q_lower) and ("change" in q_lower or "affect" in q_lower or "rotate" in q_lower or "transform" in q_lower or "it" in q_lower):
        answer = (
            "## How Quantum Gates Affect Qubit States\n"
            "Single-qubit quantum logic gates correspond mathematically to unitary matrices that perform rigid rotations of the state vector on the Bloch sphere:\n\n"
            "1. Pauli-X Gate: Rotates the state vector by 180 degrees (pi radians) around the X-axis, swapping |0> and |1>.\n"
            "2. Pauli-Y Gate: Rotates by 180 degrees around the Y-axis, combining a bit-flip and complex phase shift.\n"
            "3. Pauli-Z Gate: Rotates by 180 degrees around the Z-axis, preserving |0> while negating the phase of |1>.\n"
            "4. Hadamard (H) Gate: Rotates by 180 degrees around the diagonal (X+Z)/sqrt(2) axis, mapping computational basis states into superposition.\n"
            "5. Rotation Gates (RX, RY, RZ): Apply continuous rotations by arbitrary angles theta around the respective Cartesian axes."
        )
        hint = "Applying a unitary gate moves the state vector to a new point on the surface of the Bloch sphere without changing vector length."
        next_step = "Try applying RX(pi/2) and RZ(pi/4) rotations in Qiskit to visualize vector movement."
        return answer, hint, next_step

    # Concrete Examples
    if ("example" in q_lower or "instance" in q_lower):
        answer = (
            "## Concrete Qubit Example\n"
            "Consider a qubit in an equal superposition state prepared by a Hadamard gate:\n"
            "|psi> = (1/sqrt(2))|0> + (1/sqrt(2))|1>\n\n"
            "Here, the complex probability amplitudes are alpha = 1/sqrt(2) and beta = 1/sqrt(2).\n"
            "When measured in the Z-basis:\n"
            "- Probability of observing '0' = |alpha|^2 = (1/sqrt(2))^2 = 1/2 (50%)\n"
            "- Probability of observing '1' = |beta|^2 = (1/sqrt(2))^2 = 1/2 (50%)\n\n"
            "In contrast, a classical bit can only be in state 0 (100%) or state 1 (100%) and cannot exist in intermediate superpositions."
        )
        hint = "Probability amplitudes can interfere constructively or destructively, which classical probabilities cannot do."
        next_step = "Simulate 1000 shots of a Hadamard circuit in Qiskit Aer to confirm the 50/50 probability distribution."
        return answer, hint, next_step

    # RSA Encryption / Quantum Hardness
    if "rsa" in q_lower or "rsa" in c_lower:
        answer = (
            "RSA (Rivest-Shamir-Adleman) is a widely used public-key cryptographic system whose security relies on the classical difficulty of integer factorization (finding the prime factors of a large composite number N).\n\n"
            "## How RSA Relates to Quantum Computing & Shor's Algorithm\n"
            "1. Classical Hardness: The best classical algorithm (General Number Field Sieve) takes sub-exponential time to factor N.\n"
            "2. Quantum Vulnerability: Shor's algorithm solves integer factorization in polynomial time O((log N)^3) on a quantum computer using the Quantum Fourier Transform (QFT) for period finding.\n"
            "3. Impact: A fault-tolerant quantum computer running Shor's algorithm can efficiently break RSA encryption, driving the transition to Post-Quantum Cryptography (PQC)."
        )
        hint = "RSA security is based on prime factorization hardness; Shor's algorithm turns factoring into a polynomial-time problem via period finding."
        next_step = "Learn how Shor's algorithm uses the Quantum Fourier Transform (QFT) to find function periods."
        return answer, hint, next_step

    # Quantum Fourier Transform (QFT)
    if "qft" in q_lower or "fourier" in q_lower or "qft" in c_lower:
        answer = (
            "The Quantum Fourier Transform (QFT) is the quantum analogue of the discrete Fourier transform. "
            "It transforms a quantum state vector from the computational basis into the frequency/phase basis in O(n^2) gate operations, achieving an exponential speedup over the classical FFT which takes O(n 2^n).\n\n"
            "## Applications of QFT\n"
            "QFT is a central building block in major quantum algorithms including Shor's period-finding algorithm, Quantum Phase Estimation (QPE), and solving discrete logarithm problems."
        )
        hint = "QFT maps periodic amplitudes into constructive interference peaks in the phase domain."
        next_step = "Explore the circuit implementation of QFT using Hadamard and controlled phase-rotation gates (CRk)."
        return answer, hint, next_step

    # Shor's Algorithm
    if "shor" in q_lower or "shor" in c_lower:
        answer = (
            "Shor's algorithm is a polynomial-time quantum algorithm for integer factorization, invented by Peter Shor in 1994. "
            "It factors an integer N in O((log N)^3) time, achieving an exponential speedup over the best-known classical factoring algorithm (the General Number Field Sieve). "
            "The algorithm reduces factoring to order finding in modular arithmetic, using the Quantum Fourier Transform (QFT) to find the period of a modular function. "
            "Because asymmetric encryption protocols like RSA rely on the classical hardness of factoring large composite numbers, Shor's algorithm demonstrates that fault-tolerant quantum computers can break standard public-key cryptography."
        )
        hint = "Key step: The Quantum Fourier Transform converts periodic phase information into measurable quantum state peaks."
        next_step = "Study the Quantum Fourier Transform (QFT) circuit architecture."
        return answer, hint, next_step

    # Quantum Measurement / Measurement Collapse
    if "measurement" in q_lower or "collapse" in q_lower or "measurement" in c_lower:
        answer = (
            "Quantum measurement is the physical process of probing a quantum system, forcing its state vector to collapse into one of its computational basis states (|0> or |1>). "
            "Before measurement, a qubit exists in a superposition state |psi> = alpha|0> + beta|1>. "
            "During measurement in the standard Z-basis, the continuous superposition is lost: the observer receives outcome '0' with probability |alpha|^2, or outcome '1' with probability |beta|^2. "
            "Post-measurement, the qubit remains fixed in the observed eigenstate, illustrating the non-deterministic nature of quantum collapse."
        )
        hint = "Measurement is irreversible: once measured, the original superposition amplitudes alpha and beta cannot be recovered."
        next_step = "Explore how measurement gates work in Qiskit using AerSimulator."
        return answer, hint, next_step

    # Hadamard Gate
    if "hadamard" in q_lower or "h gate" in q_lower or "hadamard" in c_lower:
        answer = (
            "The Hadamard (H) gate is a single-qubit logic gate that maps computational basis states into equal superposition states. "
            "Specifically, H|0> = (|0> + |1>)/sqrt(2) and H|1> = (|0> - |1>)/sqrt(2). "
            "On the Bloch sphere, the Hadamard operation corresponds to a 180-degree rotation around the diagonal (X+Z)/sqrt(2) axis. "
            "It serves as the fundamental building block for state preparation in almost all quantum algorithms."
        )
        hint = "Applying two consecutive Hadamard gates returns the qubit to its original state (H * H = I)."
        next_step = "Try applying an H gate followed by a measurement in Qiskit."
        return answer, hint, next_step

    # Pauli-X Gate
    if "pauli-x" in q_lower or "pauli x" in q_lower or "x gate" in q_lower:
        answer = (
            "The Pauli-X gate is the quantum equivalent of the classical NOT gate. "
            "It rotates the qubit state vector by pi radians (180 degrees) around the X-axis of the Bloch sphere, swapping basis state |0> to |1> and |1> to |0>."
        )
        hint = "In matrix representation, Pauli-X is [[0, 1], [1, 0]]."
        next_step = "Combine Pauli-X with Hadamard to explore phase flips."
        return answer, hint, next_step

    # Pauli-Y Gate
    if "pauli-y" in q_lower or "pauli y" in q_lower or "y gate" in q_lower:
        answer = (
            "The Pauli-Y gate rotates a qubit state by pi radians around the Y-axis of the Bloch sphere. "
            "It maps |0> to i|1> and |1> to -i|0>, introducing both a bit-flip and a complex phase shift of 90 degrees."
        )
        hint = "Pauli-Y combines bit-flip (X) and phase-flip (Z) operations with a complex factor i."
        next_step = "Inspect the matrix representation of Pauli-Y."
        return answer, hint, next_step

    # Pauli-Z Gate
    if "pauli-z" in q_lower or "pauli z" in q_lower or "z gate" in q_lower:
        answer = (
            "The Pauli-Z gate is a phase-flip gate that rotates a qubit by pi radians around the Z-axis of the Bloch sphere. "
            "It leaves basis state |0> unchanged (Z|0> = |0>) while negating the phase of |1> (Z|1> = -|1>)."
        )
        hint = "Pauli-Z converts the superposition state |+> = (|0>+|1>)/sqrt(2) into |-> = (|0>-|1>)/sqrt(2)."
        next_step = "Use Pauli-Z to create phase interference in quantum circuits."
        return answer, hint, next_step

    # CNOT / CX Gate
    if "cnot" in q_lower or "cx" in q_lower or "controlled-not" in q_lower:
        answer = (
            "The CNOT (Controlled-NOT or CX) gate is a fundamental 2-qubit gate. "
            "It performs a Pauli-X (NOT) flip on the target qubit if and only if the control qubit is in state |1>. "
            "The CNOT gate is essential for creating multi-qubit entanglement and implementing universal quantum logic."
        )
        hint = "If the control qubit is in superposition, CNOT creates an entangled state across control and target qubits."
        next_step = "Build a Bell state circuit using H and CNOT gates."
        return answer, hint, next_step

    # Bell States
    if "bell state" in q_lower or "bell" in q_lower or "bell" in c_lower:
        answer = (
            "Bell states are four maximally entangled 2-qubit quantum states (Phi+, Phi-, Psi+, Psi-). "
            "For example, the |Phi+> Bell state is (|00> + |11>)/sqrt(2). "
            "Measuring one qubit of a Bell state immediately determines the measurement outcome of the second qubit, demonstrating non-local quantum correlations."
        )
        hint = "To construct |Phi+>: Apply a Hadamard gate to qubit 0, then a CNOT gate with control 0 and target 1."
        next_step = "Simulate Bell state measurement on AerSimulator."
        return answer, hint, next_step

    # GHZ States
    if "ghz" in q_lower or "ghz" in c_lower:
        answer = (
            "A GHZ (Greenberger-Horne-Zeilinger) state is a maximally entangled quantum state involving three or more qubits, represented as (|00...0> + |11...1>)/sqrt(2). "
            "GHZ states demonstrate non-classical multi-particle entanglement and are fundamental to quantum error correction protocols."
        )
        hint = "Construct GHZ by extending a 2-qubit Bell state with additional CNOT gates to target qubits."
        next_step = "Build a 3-qubit GHZ circuit in Qiskit."
        return answer, hint, next_step

    # Grover's Algorithm
    if "grover" in q_lower or "grover" in c_lower:
        answer = (
            "Grover's algorithm is a quantum search algorithm that provides a quadratic speedup for searching an unstructured database of N items in O(sqrt(N)) queries, compared to classical O(N) linear search. "
            "It uses an oracle to flip the phase of the target state, followed by a diffuser operator (inversion about the mean) to amplify the amplitude of the target state."
        )
        hint = "The core mechanism is amplitude amplification: repeating oracle + diffusion iterations boosts target state probability."
        next_step = "Construct a 2-qubit Grover circuit with a phase oracle."
        return answer, hint, next_step

    # Quantum Cryptography / QKD
    if "cryptography" in q_lower or "qkd" in q_lower or "cryptography" in c_lower:
        answer = (
            "Quantum cryptography uses principles of quantum mechanics—such as the No-Cloning theorem and wavefunction collapse—to establish tamper-proof communication links. "
            "The BB84 protocol for Quantum Key Distribution (QKD) enables two parties to exchange secret encryption keys while instantly detecting any eavesdropping attempt."
        )
        hint = "Eavesdropping requires measuring qubits, which irreversibly alters their state and reveals the interceptor."
        next_step = "Study the BB84 protocol and state basis choices."
        return answer, hint, next_step

    # Qubit / Qubits
    if "qubit" in q_lower or "qubits" in q_lower or "qubit" in c_lower:
        answer = (
            "A qubit (quantum bit) is the basic unit of quantum information, analogous to a classical bit. "
            "A qubit state |psi> = alpha|0> + beta|1> is represented as a linear combination of computational basis states |0> and |1>, where complex amplitudes alpha and beta satisfy |alpha|^2 + |beta|^2 = 1. "
            "Qubits can exist in superposition and become entangled with other qubits until measurement."
        )
        hint = "A qubit's state can be geometrically visualized as a vector ending on the surface of the Bloch sphere."
        next_step = "Learn about single-qubit gate rotations on the Bloch sphere."
        return answer, hint, next_step

    # Superposition
    if "superposition" in q_lower or "superposition" in c_lower:
        answer = (
            "Quantum superposition is the physical principle allowing a quantum system to exist simultaneously in a linear combination of multiple basis states. "
            "For a single qubit, state |psi> = alpha|0> + beta|1> holds probability amplitudes alpha and beta. "
            "Superposition allows quantum algorithms to process multiple computational paths in parallel prior to measurement."
        )
        hint = "The Hadamard (H) gate is the standard tool used to put a computational basis state into superposition."
        next_step = "Practice constructing 1-qubit and 2-qubit superposition circuits."
        return answer, hint, next_step

    # Entanglement
    if "entanglement" in q_lower or "entanglement" in c_lower:
        answer = (
            "Quantum entanglement is a phenomenon where two or more qubits become intrinsically linked such that the quantum state of each qubit cannot be described independently of the others. "
            "Measuring one qubit of an entangled pair instantaneously determines the state of the paired qubit, regardless of spatial separation."
        )
        hint = "Entanglement is created by applying multi-qubit gates like CNOT to qubits in superposition."
        next_step = "Build a Bell state circuit to observe entanglement."
        return answer, hint, next_step

    # Quantum Circuits
    if "circuit" in q_lower or "circuits" in q_lower or "circuit" in c_lower:
        answer = (
            "A quantum circuit is a computational model where quantum computation is executed as a sequence of quantum logic gates operating on quantum registers (qubits), concluding with measurement operations. "
            "In Qiskit, quantum circuits are built using QuantumCircuit objects and executed on simulators or real quantum hardware."
        )
        hint = "Always structure circuits into: 1. State preparation 2. Algorithm gate operations 3. Measurement."
        next_step = "Build and draw a simple 2-qubit circuit in Qiskit."
        return answer, hint, next_step

    # Quantum Computing (General)
    if "quantum computing" in q_lower or "quantum computing" in c_lower:
        answer = (
            "Quantum computing is a field of computer science utilizing quantum mechanics principles—such as superposition, entanglement, and quantum interference—to solve computational problems beyond the reach of classical supercomputers. "
            "Instead of classical binary bits (0 or 1), quantum computers process qubits to execute specialized algorithms for optimization, cryptography, and molecular simulation."
        )
        hint = "Quantum speedup relies on designing algorithms where constructive interference amplifies correct answers."
        next_step = "Explore the basic building block of quantum computing: the qubit."
        return answer, hint, next_step

    # Default Grounded Explanation for any other topic
    answer = (
        f"Explanation of {concept} ({skill_level} level): {concept} is a fundamental concept in quantum information processing. "
        f"In quantum computing, understanding {concept} helps master state vector dynamics, gate transformations, and algorithm execution."
    )
    hint = f"Focus on how {concept} fits into quantum circuit design."
    next_step = "Try a practice problem or ask a follow-up question."
    return answer, hint, next_step


class MockLLMClient:
    """Mock LLM Client simulating generative AI tutor and critic calls."""
    
    def __init__(self, default_score: float = 90.0):
        self.default_score = default_score
        self.call_count = 0
        self.critic_count = 0
        
    def generate_response(self, system_prompt: str, user_prompt: str, context: dict) -> str:
        """
        Simulates generating candidate tutor responses based on mode and context.
        
        Returns:
            JSON string payload representing structured response.
        """
        self.call_count += 1
        mode = context.get("mode", "explain")
        query = context.get("query", user_prompt)
        concept = context.get("current_topic", "Quantum Superposition")
        skill_level = context.get("skill_level", "Intermediate")
        
        # Check if improvement loop iteration 2 is running
        iteration = context.get("iteration", 1)
        
        circuit_val = context.get("circuit_validation")
        quiz_val = context.get("quiz_analysis")

        if mode in ("circuit_assistant", "circuit_explain") and circuit_val:
            if not circuit_val.get("valid", True):
                msg = circuit_val.get("message", "Circuit structure contains invalid gate configuration.")
                err_type = circuit_val.get("error_type", "CIRCUIT_ERROR")
                corr = circuit_val.get("corrected_piece", "Review gate ordering")
                conc = circuit_val.get("concept", concept)
                answer = f"Circuit Validation Error ({err_type}): {msg} Why it is wrong: The current sequence violates {conc} rules. Correct pattern: {corr}. Please fix your circuit and try again!"
                hint = f"Correction clue: {corr}"
                next_step = "Re-run circuit validation with the corrected gate sequence."
                concept = conc
            else:
                msg = circuit_val.get("message", "Circuit is valid.")
                conc = circuit_val.get("concept", concept)
                answer = f"Circuit Verified: {msg} The gates correctly implement the intended quantum transformation."
                hint = f"Observe state evolution for concept: {conc}."
                next_step = "Try adding measurement gates or testing on simulator."
                concept = conc
        elif mode == "quiz_analysis" and quiz_val:
            score = quiz_val.get("score_pct", 0.0)
            corr_cnt = quiz_val.get("correct_count", 0)
            tot_cnt = quiz_val.get("total_questions", 0)
            weak = quiz_val.get("weak_topics", [])
            strong = quiz_val.get("strong_topics", [])
            weak_str = ", ".join(weak) if weak else "None"
            strong_str = ", ".join(strong) if strong else "None"

            answer = f"Quiz Results Summary: You scored {score}% ({corr_cnt}/{tot_cnt} correct). You demonstrated strong mastery in [{strong_str}], but showed difficulty in [{weak_str}]. Review the step-by-step explanations for your incorrect answers."
            hint = f"Focus your study session on strengthening: {weak_str}."
            next_step = f"Complete practice exercises for topic: {weak[0] if weak else concept}."
        elif mode == "chat":
            answer = f"Quantum Tutor Chat ({skill_level} level): {user_prompt}. As a {skill_level} learner, understanding {concept} will help you build stronger quantum intuition."
            hint = f"Key concept to remember: {concept}."
            next_step = "Ask follow-up questions or request a practice challenge."
        elif mode == "hint":
            answer = "Consider how applying a Hadamard gate changes a single qubit state into an equal linear combination of |0> and |1> states before measuring."
            hint = "Think about the probabilities: |alpha|^2 + |beta|^2 = 1."
            next_step = "Try writing out the matrix representation of the H gate."
        elif mode == "debug":
            answer = "The QuantumCircuit initialization missing measurement operations or CNOT target register alignment."
            hint = "Check gate application order on qubit index 1."
            next_step = "Add qc.measure_all() or check circuit draw output."
        elif mode == "code_explain":
            answer = "This Qiskit snippet initializes a 2-qubit circuit, applies a Hadamard gate to qubit 0, and a CNOT gate to create a maximally entangled Bell state."
            hint = "Follow the state vector transformation |00> -> (|00> + |11>)/sqrt(2)."
            next_step = "Run the circuit using AerSimulator."
        elif mode == "circuit_explain":
            answer = "The circuit diagram illustrates state preparation followed by phase estimation and measurement in the computational Z-basis."
            hint = "Look at the superposition state prepared by Hadamard gates."
            next_step = "Trace the state evolution step by step."
        elif mode == "practice":
            answer = "Practice Exercise: Write a 2-qubit circuit in Qiskit that creates the Bell state (|00> - |11>)/sqrt(2)."
            hint = "Start with a Hadamard gate on qubit 0, followed by a Pauli-Z gate."
            next_step = "Apply CNOT gate with control 0 and target 1."
        else:  # explain mode and general responses
            answer, hint, next_step = _generate_explain_answer(query, concept, skill_level)
            
        # Simulate lower quality on iteration 1 if specifically requested in user prompt
        if "FORCE_LOW_QUALITY" in user_prompt and iteration == 1:
            answer += " (Preliminary draft requiring refinement)."
            
        payload = {
            "answer": answer,
            "concept": concept,
            "difficulty": skill_level,
            "mode": mode,
            "hint": hint,
            "next_step": next_step,
            "confidence": 0.95,
            "suggestions": context.get("suggestions", [])
        }
        return json.dumps(payload)

    def critique_response(self, system_prompt: str, user_prompt: str, candidate_response: dict, context: dict) -> str:
        """
        Simulates AI Critic evaluating candidate responses with semantic correctness checks.
        
        Returns:
            JSON string payload representing structured critique.
        """
        self.critic_count += 1
        iteration = context.get("iteration", 1)
        user_text = user_prompt.upper()
        
        # Check for FORCE_LOW_QUALITY
        if "FORCE_LOW_QUALITY" in user_text and iteration == 1:
            critique_payload = {
                "score": 70.0,
                "accuracy": 75.0,
                "relevance": 70.0,
                "difficulty_fit": 65.0,
                "clarity": 70.0,
                "completeness": 70.0,
                "issues": ["Explanation lacks mathematical depth for intermediate learner", "Needs clearer next step recommendation"],
                "should_improve": True
            }
            return json.dumps(critique_payload)

        # Semantic verification check
        answer = candidate_response.get("answer", "")
        query = context.get("query", "").lower()
        concept = context.get("current_topic", "").lower()
        issues = []
        score = self.default_score

        # 1. Detect template substitution bug
        if "allows quantum systems to exist in linear combinations" in answer.lower():
            if not any(k in query or k in concept for k in ("superposition", "qubit", "linear combination")):
                score = 30.0
                issues.append("Response uses generic superposition template for an unrelated topic.")

        # 2. Check multi-part queries
        if "quantum computing" in query and ("application" in query or "applications" in query):
            if "application" not in answer.lower() and "applications" not in answer.lower():
                score = 50.0
                issues.append("User asked about quantum computing and applications, but applications were omitted.")

        # 3. Check topic relevance for specific keywords
        if "shor" in query and "factor" not in answer.lower() and "shor" not in answer.lower():
            score = 40.0
            issues.append("Answer fails to explain Shor's algorithm or integer factorization.")

        critique_payload = {
            "score": score,
            "accuracy": 95.0 if score > 70 else 50.0,
            "relevance": score,
            "difficulty_fit": 90.0,
            "clarity": 94.0 if score > 70 else 60.0,
            "completeness": score,
            "issues": issues,
            "should_improve": score < 85.0
        }
            
        return json.dumps(critique_payload)
