"""
Regression Tests for Conversation Context Handling

Tests for context mixing bug fix after migration to openai/gpt-oss-120b.
Verifies that:
1. New topics don't get contaminated by previous context
2. True follow-ups still use conversation history appropriately
3. Pronoun resolution works correctly
4. Multi-turn conversations maintain coherence
"""

import unittest
from src.tutor.quantum_tutor import (
    resolve_topic,
    build_context,
    build_system_prompt,
    get_conversation_history,
    add_conversation_turn,
    clear_conversation_store,
)


class TestTopicSwitching(unittest.TestCase):
    """Tests that topic switching doesn't contaminate answers"""

    def test_topic_switch_qubit_to_shor(self):
        """Q1: Qubit → Q2: Shor's algorithm should NOT mix contexts"""
        session_key = "test_session_001"
        clear_conversation_store(session_key)
        
        # Add first exchange: Qubit
        add_conversation_turn(
            session_key=session_key,
            query="What is a qubit?",
            concept="Qubits",
            answer="A qubit is a quantum bit that exists in superposition..."
        )
        
        # Resolve second query: Shor's algorithm (new topic)
        resolved = resolve_topic(
            query="Explain Shor's algorithm.",
            history=get_conversation_history(session_key),
            session_key=session_key
        )
        
        # Assertion: Should NOT be a follow-up
        self.assertFalse(resolved["is_follow_up"], "Shor's algorithm should NOT be marked as follow-up to qubit")
        self.assertEqual(resolved["topic"], "Shor's Algorithm")
        self.assertEqual(resolved["previous_topic"], "Qubits")

    def test_topic_switch_grover_to_entanglement(self):
        """Q1: Grover's → Q2: Entanglement (new topic, no contamination)"""
        session_key = "test_session_002"
        clear_conversation_store(session_key)
        
        add_conversation_turn(
            session_key=session_key,
            query="How does Grover's algorithm work?",
            concept="Grover's Algorithm",
            answer="Grover's search algorithm uses an oracle and diffuser..."
        )
        
        resolved = resolve_topic(
            query="What is quantum entanglement?",
            history=get_conversation_history(session_key),
            session_key=session_key
        )
        
        self.assertFalse(resolved["is_follow_up"])
        self.assertEqual(resolved["topic"], "Quantum Entanglement")

    def test_five_consecutive_new_topics(self):
        """Five consecutive new topics should never mix"""
        session_key = "test_session_003"
        clear_conversation_store(session_key)
        
        queries = [
            ("What is a qubit?", "Qubits"),
            ("Explain superposition.", "Quantum Superposition"),
            ("What is entanglement?", "Quantum Entanglement"),
            ("Explain Shor's algorithm.", "Shor's Algorithm"),
            ("What is the Bloch sphere?", "Bloch Sphere"),
        ]
        
        for query, expected_topic in queries:
            resolved = resolve_topic(
                query=query,
                history=get_conversation_history(session_key),
                session_key=session_key
            )
            
            # Each new topic query should be detected correctly
            self.assertEqual(resolved["topic"], expected_topic, f"Expected {expected_topic}, got {resolved['topic']}")
            
            add_conversation_turn(
                session_key=session_key,
                query=query,
                concept=expected_topic,
                answer=f"Answer about {expected_topic}..."
            )


class TestFollowUpDetection(unittest.TestCase):
    """Tests that genuine follow-ups are correctly detected"""

    def test_followup_why_after_qubit(self):
        """Q1: What is qubit? → Q2: Why? (should be follow-up)"""
        session_key = "test_session_004"
        clear_conversation_store(session_key)
        
        add_conversation_turn(
            session_key=session_key,
            query="What is a qubit?",
            concept="Qubits",
            answer="A qubit is a quantum bit..."
        )
        
        resolved = resolve_topic(
            query="Why?",
            history=get_conversation_history(session_key),
            session_key=session_key
        )
        
        # Short query with "why" should be marked as follow-up
        self.assertTrue(resolved["is_follow_up"], "Short 'Why?' should be marked as follow-up")
        self.assertEqual(resolved["topic"], "Qubits", "Should maintain previous topic")

    def test_followup_how_after_superposition(self):
        """Q1: Superposition → Q2: How does it work? (follow-up)"""
        session_key = "test_session_005"
        clear_conversation_store(session_key)
        
        add_conversation_turn(
            session_key=session_key,
            query="What is quantum superposition?",
            concept="Quantum Superposition",
            answer="Superposition is when a qubit exists in a linear combination..."
        )
        
        resolved = resolve_topic(
            query="How does it work?",
            history=get_conversation_history(session_key),
            session_key=session_key
        )
        
        self.assertTrue(resolved["is_follow_up"])
        self.assertIn("superposition", resolved["topic"].lower())

    def test_followup_give_example_after_measurement(self):
        """Q1: Measurement → Q2: Give me an example (follow-up)"""
        session_key = "test_session_006"
        clear_conversation_store(session_key)
        
        add_conversation_turn(
            session_key=session_key,
            query="What is quantum measurement?",
            concept="Quantum Measurement",
            answer="Measurement collapses a superposition state..."
        )
        
        resolved = resolve_topic(
            query="Give me a concrete example.",
            history=get_conversation_history(session_key),
            session_key=session_key
        )
        
        # "example" after previous topic should be follow-up
        self.assertTrue(resolved["is_follow_up"])

    def test_followup_comparison_qubit_vs_bit(self):
        """Q1: Qubit → Q2: How is it different from classical bit? (comparison follow-up)"""
        session_key = "test_session_008"
        clear_conversation_store(session_key)
        
        add_conversation_turn(
            session_key=session_key,
            query="What is a qubit?",
            concept="Qubits",
            answer="A qubit is a quantum bit..."
        )
        
        resolved = resolve_topic(
            query="How is it different from a classical bit?",
            history=get_conversation_history(session_key),
            session_key=session_key
        )
        
        self.assertTrue(resolved["is_follow_up"])
        self.assertIn(resolved["intent"], ["comparison", "follow_up"])


class TestContextGating(unittest.TestCase):
    """Tests that system prompt correctly gates history inclusion"""

    def test_history_not_included_for_new_topics(self):
        """New topics should NOT include history in system prompt"""
        session_key = "test_session_009"
        clear_conversation_store(session_key)
        
        add_conversation_turn(
            session_key=session_key,
            query="What is a qubit?",
            concept="Qubits",
            answer="A qubit is a quantum bit..."
        )
        
        context = build_context(
            query="Explain Shor's algorithm.",
            mode="explain",
            extra_context={"session_id": session_key}
        )
        
        system_prompt = build_system_prompt(context)
        
        # For new topic, is_follow_up should be False
        self.assertFalse(context["is_follow_up"])
        
        # System prompt should include NOTE about new topic if history exists
        history = get_conversation_history(session_key)
        if history:
            self.assertIn("NEW topic", system_prompt, 
                "System prompt should remind model about new topic")

    def test_history_included_for_followups(self):
        """Follow-up questions SHOULD include history in system prompt"""
        session_key = "test_session_010"
        clear_conversation_store(session_key)
        
        add_conversation_turn(
            session_key=session_key,
            query="What is superposition?",
            concept="Quantum Superposition",
            answer="Superposition allows qubits to exist in linear combinations..."
        )
        
        context = build_context(
            query="Why is it important?",
            mode="explain",
            extra_context={"session_id": session_key}
        )
        
        system_prompt = build_system_prompt(context)
        
        # For follow-up, is_follow_up should be True
        self.assertTrue(context["is_follow_up"])
        
        # System prompt SHOULD include history for follow-ups
        if get_conversation_history(session_key):
            self.assertIn("RECENT CONVERSATION CONTEXT", system_prompt,
                "System prompt should include conversation context for follow-ups")


class TestSystemPromptInstructions(unittest.TestCase):
    """Tests that system prompt has proper context handling instructions"""

    def test_critical_context_handling_instruction_present(self):
        """System prompt should have CRITICAL CONTEXT HANDLING section"""
        session_key = "test_session_012"
        clear_conversation_store(session_key)
        
        context = build_context(query="What is a qubit?", mode="explain")
        system_prompt = build_system_prompt(context)
        
        self.assertIn("CRITICAL CONTEXT HANDLING", system_prompt,
            "System prompt must include CRITICAL CONTEXT HANDLING instructions")

    def test_antihallucination_rules_unchanged(self):
        """Anti-hallucination rules should remain in system prompt"""
        context = build_context(query="What is a qubit?", mode="explain")
        system_prompt = build_system_prompt(context)
        
        # These should still be present
        self.assertIn("ACCURACY & ANTI-HALLUCINATION RULES", system_prompt)
        self.assertIn("Never invent", system_prompt)


if __name__ == "__main__":
    unittest.main(verbosity=2)
