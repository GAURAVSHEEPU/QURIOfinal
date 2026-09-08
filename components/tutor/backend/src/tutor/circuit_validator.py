"""
Deterministic Quantum Circuit Validator Module for Quantum Algorithm Learning Platform.

Provides rule-based mathematical and structural validation for quantum circuits,
decoupling deterministic circuit verification from generative AI explanations.
"""

from typing import Dict, Any, List, Optional


class CircuitValidator:
    """Deterministic rule-based quantum circuit validator."""

    SUPPORTED_GATES = {"h", "x", "y", "z", "cx", "cnot", "cz", "swap", "ccx", "measure", "rx", "ry", "rz", "s", "t"}

    def validate_circuit(self, circuit_input: Any, intended_goal: str = "general") -> Dict[str, Any]:
        """
        Validates quantum circuit input deterministically.

        Args:
            circuit_input: Dictionary, string representation, or list of gate dicts.
            intended_goal: Goal identifier (e.g. "bell_state", "superposition", "ghz_state", "general").

        Returns:
            Structured dictionary containing:
            - valid: bool
            - error_type: str or None
            - message: str
            - corrected_piece: str or None
            - concept: str
            - details: dict
        """
        parsed = self._normalize_circuit_input(circuit_input)
        num_qubits = parsed.get("qubits", 2)
        gates = parsed.get("gates", [])
        goal = (parsed.get("intended_goal") or intended_goal or "general").lower()

        # 1. Structural Check: Qubit count
        if num_qubits < 1:
            return {
                "valid": False,
                "error_type": "INVALID_QUBIT_COUNT",
                "message": "Circuit must contain at least 1 qubit.",
                "corrected_piece": "qubits: 2",
                "concept": "Qubits & State Vector",
                "details": {"num_qubits": num_qubits}
            }

        # 2. Gate-level structural validation
        for idx, g in enumerate(gates):
            gate_name = str(g.get("gate", "")).lower()
            if gate_name not in self.SUPPORTED_GATES:
                return {
                    "valid": False,
                    "error_type": "UNSUPPORTED_GATE",
                    "message": f"Unsupported or unknown gate '{gate_name}' at step {idx + 1}.",
                    "corrected_piece": f"Use valid gates: {', '.join(sorted(list(self.SUPPORTED_GATES)[:6]))}",
                    "concept": "Quantum Gates",
                    "details": {"step": idx + 1, "gate": gate_name}
                }

            # Check qubit boundaries
            target = g.get("target")
            control = g.get("control")
            
            if target is not None and (target < 0 or target >= num_qubits):
                return {
                    "valid": False,
                    "error_type": "QUBIT_INDEX_OUT_OF_BOUNDS",
                    "message": f"Target qubit q{target} is out of bounds for a {num_qubits}-qubit circuit.",
                    "corrected_piece": f"Target qubit index must be between 0 and {num_qubits - 1}.",
                    "concept": "Qubit Register Alignment",
                    "details": {"gate": gate_name, "target": target, "num_qubits": num_qubits}
                }

            if control is not None and (control < 0 or control >= num_qubits):
                return {
                    "valid": False,
                    "error_type": "QUBIT_INDEX_OUT_OF_BOUNDS",
                    "message": f"Control qubit q{control} is out of bounds for a {num_qubits}-qubit circuit.",
                    "corrected_piece": f"Control qubit index must be between 0 and {num_qubits - 1}.",
                    "concept": "Controlled Gates",
                    "details": {"gate": gate_name, "control": control, "num_qubits": num_qubits}
                }

            if control is not None and target is not None and control == target:
                return {
                    "valid": False,
                    "error_type": "SELF_CONTROLLED_GATE",
                    "message": f"Gate '{gate_name}' cannot have the same control and target qubit (q{control}).",
                    "corrected_piece": f"Separate control (e.g. q{control}) and target (e.g. q{(control + 1) % num_qubits}).",
                    "concept": "Entanglement & Controlled Gates",
                    "details": {"gate": gate_name, "control": control, "target": target}
                }

        # 3. Concept-specific verification
        if goal in ("bell_state", "bell", "entanglement"):
            return self._validate_bell_state(num_qubits, gates)
        elif goal in ("superposition", "hadamard"):
            return self._validate_superposition(num_qubits, gates)
        elif goal in ("ghz_state", "ghz"):
            return self._validate_ghz_state(num_qubits, gates)

        # Default: General valid circuit if structural checks pass
        return {
            "valid": True,
            "error_type": None,
            "message": f"Quantum circuit with {num_qubits} qubits and {len(gates)} gates is structurally valid.",
            "corrected_piece": None,
            "concept": "Quantum Circuit Architecture",
            "details": {"qubits": num_qubits, "gate_count": len(gates)}
        }

    def _validate_bell_state(self, num_qubits: int, gates: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Validates Bell State (|Φ+> = (|00> + |11>)/√2) circuit pattern."""
        if num_qubits < 2:
            return {
                "valid": False,
                "error_type": "INSUFFICIENT_QUBITS",
                "message": "Bell state creation requires at least 2 qubits.",
                "corrected_piece": "qubits: 2",
                "concept": "Quantum Entanglement",
                "details": {"num_qubits": num_qubits}
            }

        has_h = False
        h_qubit = None
        has_cx = False

        for g in gates:
            gate_name = str(g.get("gate", "")).lower()
            if gate_name == "h":
                has_h = True
                h_qubit = g.get("target", 0)
            elif gate_name in ("cx", "cnot") and has_h:
                ctrl = g.get("control")
                tgt = g.get("target")
                if ctrl == h_qubit and tgt != h_qubit:
                    has_cx = True

        if not has_h:
            return {
                "valid": False,
                "error_type": "MISSING_SUPERPOSITION_GATE",
                "message": "Bell state pattern is missing a Hadamard (H) gate on the control qubit to create superposition.",
                "corrected_piece": "q0 ──[H]──●──\nq1 ───────[X]──",
                "concept": "Bell State Preparation",
                "details": {"missing": "H gate on q0"}
            }

        if not has_cx:
            return {
                "valid": False,
                "error_type": "MISSING_ENTANGLING_GATE",
                "message": "Bell state pattern requires a CNOT (CX) gate with control on the superposition qubit (q0) and target on q1.",
                "corrected_piece": "q0 ──[H]──●──\nq1 ───────[X]──",
                "concept": "Quantum Entanglement & CNOT Gate",
                "details": {"missing": "CX(control=0, target=1)"}
            }

        return {
            "valid": True,
            "error_type": None,
            "message": "Circuit correctly creates a maximally entangled Bell state (|Φ+> = (|00> + |11>)/√2).",
            "corrected_piece": None,
            "concept": "Bell State Preparation",
            "details": {"pattern": "H(0) -> CX(0, 1)"}
        }

    def _validate_superposition(self, num_qubits: int, gates: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Validates superposition state creation."""
        has_h = any(str(g.get("gate", "")).lower() == "h" for g in gates)
        if not has_h:
            return {
                "valid": False,
                "error_type": "MISSING_HADAMARD",
                "message": "Superposition requires applying a Hadamard (H) gate to transform basis states into equal linear combinations.",
                "corrected_piece": "qc.h(0)",
                "concept": "Quantum Superposition",
                "details": {"missing": "H gate"}
            }
        return {
            "valid": True,
            "error_type": None,
            "message": "Circuit successfully creates a superposition state using a Hadamard gate.",
            "corrected_piece": None,
            "concept": "Quantum Superposition",
            "details": {"pattern": "H gate applied"}
        }

    def _validate_ghz_state(self, num_qubits: int, gates: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Validates 3+ qubit GHZ state (|000> + |111>)/√2."""
        if num_qubits < 3:
            return {
                "valid": False,
                "error_type": "INSUFFICIENT_QUBITS",
                "message": "GHZ state preparation requires at least 3 qubits.",
                "corrected_piece": "qubits: 3",
                "concept": "Multi-Qubit Entanglement",
                "details": {"num_qubits": num_qubits}
            }
        has_h = any(str(g.get("gate", "")).lower() == "h" for g in gates)
        cnot_count = sum(1 for g in gates if str(g.get("gate", "")).lower() in ("cx", "cnot"))
        if not has_h or cnot_count < 2:
            return {
                "valid": False,
                "error_type": "INCOMPLETE_GHZ_CASCADE",
                "message": f"GHZ state preparation requires 1 Hadamard gate and at least {num_qubits - 1} CNOT gates in cascade.",
                "corrected_piece": "H(0) -> CX(0, 1) -> CX(1, 2)",
                "concept": "GHZ State Entanglement",
                "details": {"h_gate": has_h, "cnot_count": cnot_count}
            }
        return {
            "valid": True,
            "error_type": None,
            "message": f"Circuit correctly prepares a {num_qubits}-qubit GHZ state.",
            "corrected_piece": None,
            "concept": "Multi-Qubit Entanglement",
            "details": {"pattern": "H -> CNOT cascade"}
        }

    def _normalize_circuit_input(self, circuit_input: Any) -> Dict[str, Any]:
        """Normalizes dictionary or text representation of circuits into standard structure."""
        if isinstance(circuit_input, dict):
            return circuit_input
        elif isinstance(circuit_input, str):
            # Parse text input string to infer circuit pattern
            text = circuit_input.lower()
            gates = []
            if "h(" in text or "h gate" in text or "hadamard" in text:
                gates.append({"gate": "h", "target": 0})
            if "cx(" in text or "cnot" in text or "x" in text:
                gates.append({"gate": "cx", "control": 0, "target": 1})
            
            goal = "general"
            if "bell" in text or "entangled" in text:
                goal = "bell_state"
            elif "superposition" in text:
                goal = "superposition"
            elif "ghz" in text:
                goal = "ghz_state"

            return {
                "qubits": 3 if goal == "ghz_state" else 2,
                "gates": gates,
                "intended_goal": goal
            }
        return {"qubits": 2, "gates": []}

