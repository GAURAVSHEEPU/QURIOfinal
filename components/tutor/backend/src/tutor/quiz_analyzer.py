"""
Deterministic Quiz Analysis Engine for Quantum Algorithm Learning Platform.

Executes deterministic score calculations, topic-wise mastery breakdowns,
and weak/strong topic identifications, decoupling score calculation from LLM generation.
"""

from typing import Dict, Any, List


class QuizAnalyzer:
    """Deterministic Quiz Result Analyzer."""

    def analyze_quiz(self, quiz_data: Any) -> Dict[str, Any]:
        """
        Deterministically evaluates quiz results.

        Args:
            quiz_data: Quiz submission dict or list of question responses.
                       Expected format:
                       {
                           "quiz_id": "quiz_01",
                           "responses": [
                               {
                                   "question_id": "q1",
                                   "topic": "qubits",
                                   "user_answer": "A",
                                   "correct_answer": "A"
                               }, ...
                           ]
                       }

        Returns:
            Structured dictionary containing:
            - total_questions: int
            - correct_count: int
            - score_pct: float
            - topic_performance: Dict[str, Dict[str, Any]]
            - weak_topics: List[str]
            - strong_topics: List[str]
            - incorrect_questions: List[Dict[str, Any]]
        """
        responses = []
        if isinstance(quiz_data, dict):
            responses = quiz_data.get("responses", [])
        elif isinstance(quiz_data, list):
            responses = quiz_data

        if not responses:
            return {
                "total_questions": 0,
                "correct_count": 0,
                "score_pct": 0.0,
                "topic_performance": {},
                "weak_topics": [],
                "strong_topics": [],
                "incorrect_questions": []
            }

        total_questions = len(responses)
        correct_count = 0
        topic_stats: Dict[str, Dict[str, int]] = {}
        incorrect_questions = []

        for q in responses:
            topic = q.get("topic", "Quantum Computing").lower()
            user_ans = str(q.get("user_answer", "")).strip().upper()
            corr_ans = str(q.get("correct_answer", "")).strip().upper()
            is_correct = (user_ans == corr_ans) and len(user_ans) > 0

            if is_correct:
                correct_count += 1
            else:
                incorrect_questions.append({
                    "question_id": q.get("question_id", "Unknown Question"),
                    "question_text": q.get("question_text", f"Question on {topic}"),
                    "topic": topic,
                    "user_answer": q.get("user_answer"),
                    "correct_answer": q.get("correct_answer"),
                    "explanation": q.get("explanation", "Review core concept.")
                })

            if topic not in topic_stats:
                topic_stats[topic] = {"correct": 0, "total": 0}
            topic_stats[topic]["total"] += 1
            if is_correct:
                topic_stats[topic]["correct"] += 1

        score_pct = round((correct_count / total_questions) * 100.0, 2)

        topic_performance: Dict[str, Dict[str, Any]] = {}
        weak_topics: List[str] = []
        strong_topics: List[str] = []

        for topic, stat in topic_stats.items():
            tot = stat["total"]
            corr = stat["correct"]
            pct = round((corr / tot) * 100.0, 2) if tot > 0 else 0.0
            
            topic_performance[topic] = {
                "correct": corr,
                "total": tot,
                "score_pct": pct
            }

            if pct < 60.0:
                weak_topics.append(topic)
            elif pct >= 80.0:
                strong_topics.append(topic)

        return {
            "total_questions": total_questions,
            "correct_count": correct_count,
            "score_pct": score_pct,
            "topic_performance": topic_performance,
            "weak_topics": weak_topics,
            "strong_topics": strong_topics,
            "incorrect_questions": incorrect_questions
        }

