"""
Offline Unit Test Suite for AI Quantum Tutor 3 Core Capabilities & Loop Engineering.
"""

import unittest
from unittest.mock import patch, MagicMock

from src.tutor.quantum_tutor import tutor, build_context, QUALITY_THRESHOLD, MAX_ITERATIONS
from src.tutor.llm_client import LLMClient


class TestTutorCapabilities(unittest.TestCase):

    def test_chatbot_with_learner_context(self):
        """1. Chatbot: test query with learner profile context integration."""
        profile = {
            "skill_level": "Advanced",
            "performance_band": "High",
            "risk_status": "Low Risk",
            "topic_weaknesses": ["shor"],
            "topic_strengths": ["entanglement", "qubits"]
        }
        res = tutor("Explain Shor algorithm", mode="chat", learner_profile=profile, use_mock=True)
        
        self.assertIn("answer", res)
        self.assertEqual(res["difficulty"], "Advanced")
        self.assertEqual(res["mode"], "chat")

    def test_chatbot_missing_learner_context(self):
        """2. Chatbot: test query when learner profile is missing or None."""
        res = tutor("What is quantum superposition?", mode="chat", learner_profile=None, use_mock=True)
        
        self.assertIn("answer", res)
        self.assertEqual(res["difficulty"], "Intermediate")
        self.assertEqual(res["mode"], "chat")

    def test_circuit_assistant_valid_circuit(self):
        """3. Circuit Assistant: test valid Bell state circuit verification and explanation."""
        extra_ctx = {
            "circuit": {
                "qubits": 2,
                "gates": [
                    {"gate": "h", "target": 0},
                    {"gate": "cx", "control": 0, "target": 1}
                ],
                "intended_goal": "bell_state"
            }
        }
        res = tutor("Check my Bell state circuit", mode="circuit_assistant", extra_context=extra_ctx, use_mock=True)
        
        self.assertIn("circuit_validation", res)
        self.assertTrue(res["circuit_validation"]["valid"])
        self.assertIn("Circuit Verified", res["answer"])

    def test_circuit_assistant_invalid_circuit(self):
        """4. Circuit Assistant: test invalid circuit detection and correction explanation."""
        extra_ctx = {
            "circuit": {
                "qubits": 2,
                "gates": [
                    {"gate": "cx", "control": 0, "target": 1}
                ],
                "intended_goal": "bell_state"
            }
        }
        res = tutor("Check my Bell state circuit", mode="circuit_assistant", extra_context=extra_ctx, use_mock=True)
        
        self.assertIn("circuit_validation", res)
        self.assertFalse(res["circuit_validation"]["valid"])
        self.assertEqual(res["circuit_validation"]["error_type"], "MISSING_SUPERPOSITION_GATE")
        self.assertIn("Circuit Validation Error", res["answer"])
        self.assertIn("MISSING_SUPERPOSITION_GATE", res["answer"])

    def test_quiz_analysis_assistant(self):
        """5. Quiz Analyzer: test quiz responses score calculation and AI explanation."""
        extra_ctx = {
            "quiz": {
                "quiz_id": "q_foundations",
                "responses": [
                    {"question_id": "q1", "topic": "qubits", "user_answer": "A", "correct_answer": "A"},
                    {"question_id": "q2", "topic": "superposition", "user_answer": "B", "correct_answer": "C"}
                ]
            }
        }
        res = tutor("Analyze my quiz results", mode="quiz_analysis", extra_context=extra_ctx, use_mock=True)
        
        self.assertIn("quiz_analysis", res)
        qa = res["quiz_analysis"]
        self.assertEqual(qa["total_questions"], 2)
        self.assertEqual(qa["score_pct"], 50.0)
        self.assertIn("superposition", qa["weak_topics"])
        self.assertIn("Quiz Results Summary", res["answer"])

    def test_loop_engineering_high_quality_single_pass(self):
        """6. Loop Engineering: Quality >= 85 stops at iteration 1."""
        res = tutor("Explain qubit superposition", mode="explain", use_mock=True)
        
        self.assertGreaterEqual(res["quality_score"], QUALITY_THRESHOLD)
        self.assertEqual(res["iterations"], 1)

    def test_loop_engineering_refinement_and_max_iterations(self):
        """7. Loop Engineering: Quality < 85 triggers refinement up to max 3 iterations."""
        mock_client = LLMClient(use_mock=True)
        # Patch mock_client to force low score on iteration 1
        with patch.object(mock_client.mock_client, "critique_response", side_effect=[
            '{"score": 70.0, "issues": ["Needs deeper mathematical explanation"], "should_improve": true}',
            '{"score": 90.0, "issues": [], "should_improve": false}'
        ]):
            res = tutor("Explain Grover algorithm FORCE_LOW_QUALITY", mode="explain", llm_client=mock_client)
            
            self.assertEqual(res["iterations"], 2)
            self.assertEqual(res["quality_score"], 90.0)

    def test_loop_engineering_hard_upper_bound_3(self):
        """8. Loop Engineering: Hard upper bound MAX_ITERATIONS = 3 even if quality stays low."""
        mock_client = LLMClient(use_mock=True)
        with patch.object(mock_client.mock_client, "critique_response", return_value='{"score": 60.0, "issues": ["Low quality"], "should_improve": true}'):
            res = tutor("Explain Grover algorithm", mode="explain", llm_client=mock_client)
            
            self.assertLessEqual(res["iterations"], MAX_ITERATIONS)
            self.assertEqual(res["iterations"], 3)


if __name__ == "__main__":
    unittest.main()

