"""
Offline Unit Test Suite for Deterministic Quantum Circuit Validator.
"""

import unittest
from src.tutor.circuit_validator import CircuitValidator


class TestCircuitValidator(unittest.TestCase):

    def setUp(self):
        self.validator = CircuitValidator()

    def test_valid_bell_state_circuit(self):
        """Test validation of correct Bell state circuit pattern (H -> CX)."""
        circuit = {
            "qubits": 2,
            "gates": [
                {"gate": "h", "target": 0},
                {"gate": "cx", "control": 0, "target": 1}
            ],
            "intended_goal": "bell_state"
        }
        res = self.validator.validate_circuit(circuit)
        self.assertTrue(res["valid"])
        self.assertIsNone(res["error_type"])
        self.assertIn("Bell state", res["message"])

    def test_missing_hadamard_in_bell_state(self):
        """Test detection of missing Hadamard gate in Bell state circuit."""
        circuit = {
            "qubits": 2,
            "gates": [
                {"gate": "cx", "control": 0, "target": 1}
            ],
            "intended_goal": "bell_state"
        }
        res = self.validator.validate_circuit(circuit)
        self.assertFalse(res["valid"])
        self.assertEqual(res["error_type"], "MISSING_SUPERPOSITION_GATE")
        self.assertIsNotNone(res["corrected_piece"])

    def test_qubit_index_out_of_bounds(self):
        """Test qubit index out of bounds error."""
        circuit = {
            "qubits": 2,
            "gates": [
                {"gate": "h", "target": 5}
            ]
        }
        res = self.validator.validate_circuit(circuit)
        self.assertFalse(res["valid"])
        self.assertEqual(res["error_type"], "QUBIT_INDEX_OUT_OF_BOUNDS")

    def test_self_controlled_gate(self):
        """Test control qubit equal to target qubit error."""
        circuit = {
            "qubits": 2,
            "gates": [
                {"gate": "cx", "control": 0, "target": 0}
            ]
        }
        res = self.validator.validate_circuit(circuit)
        self.assertFalse(res["valid"])
        self.assertEqual(res["error_type"], "SELF_CONTROLLED_GATE")

    def test_unsupported_gate(self):
        """Test detection of unsupported gate type."""
        circuit = {
            "qubits": 2,
            "gates": [
                {"gate": "invalid_magic_gate", "target": 0}
            ]
        }
        res = self.validator.validate_circuit(circuit)
        self.assertFalse(res["valid"])
        self.assertEqual(res["error_type"], "UNSUPPORTED_GATE")

    def test_valid_ghz_state(self):
        """Test validation of 3-qubit GHZ state."""
        circuit = {
            "qubits": 3,
            "gates": [
                {"gate": "h", "target": 0},
                {"gate": "cx", "control": 0, "target": 1},
                {"gate": "cx", "control": 1, "target": 2}
            ],
            "intended_goal": "ghz_state"
        }
        res = self.validator.validate_circuit(circuit)
        self.assertTrue(res["valid"])
        self.assertIn("GHZ state", res["message"])


if __name__ == "__main__":
    unittest.main()

