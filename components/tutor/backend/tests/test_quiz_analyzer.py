"""
Offline Unit Test Suite for Deterministic Quiz Analyzer.
"""

import unittest
from src.tutor.quiz_analyzer import QuizAnalyzer


class TestQuizAnalyzer(unittest.TestCase):

    def setUp(self):
        self.analyzer = QuizAnalyzer()

    def test_score_calculation_and_topic_breakdown(self):
        """Test deterministic score calculation, percentage, and topic breakdown."""
        quiz_data = {
            "quiz_id": "quiz_01",
            "responses": [
                {"question_id": "q1", "topic": "qubits", "user_answer": "A", "correct_answer": "A"},
                {"question_id": "q2", "topic": "qubits", "user_answer": "B", "correct_answer": "B"},
                {"question_id": "q3", "topic": "superposition", "user_answer": "A", "correct_answer": "C"},
                {"question_id": "q4", "topic": "entanglement", "user_answer": "D", "correct_answer": "A"},
                {"question_id": "q5", "topic": "entanglement", "user_answer": "B", "correct_answer": "B"}
            ]
        }

        res = self.analyzer.analyze_quiz(quiz_data)
        
        self.assertEqual(res["total_questions"], 5)
        self.assertEqual(res["correct_count"], 3)
        self.assertEqual(res["score_pct"], 60.0)
        
        # Qubits: 2/2 = 100% (Strong topic)
        self.assertIn("qubits", res["strong_topics"])
        
        # Superposition: 0/1 = 0% (Weak topic)
        self.assertIn("superposition", res["weak_topics"])
        
        # Incorrect questions detail
        self.assertEqual(len(res["incorrect_questions"]), 2)
        incorrect_topics = [q["topic"] for q in res["incorrect_questions"]]
        self.assertIn("superposition", incorrect_topics)
        self.assertIn("entanglement", incorrect_topics)

    def test_empty_quiz_data(self):
        """Test handling of empty quiz submission."""
        res = self.analyzer.analyze_quiz({})
        self.assertEqual(res["total_questions"], 0)
        self.assertEqual(res["score_pct"], 0.0)
        self.assertEqual(res["weak_topics"], [])
        self.assertEqual(res["strong_topics"], [])


if __name__ == "__main__":
    unittest.main()

