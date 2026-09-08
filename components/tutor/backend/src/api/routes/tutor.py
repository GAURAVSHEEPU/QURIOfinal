"""
Generative AI Quantum Tutor API Endpoints.
"""

import os
from fastapi import APIRouter, Depends, HTTPException, status
from src.api.schemas import TutorRequest, TutorResponse
from src.api.dependencies import get_artifact_store, ArtifactStore
from src.tutor.quantum_tutor import tutor, SUPPORTED_MODES

router = APIRouter(prefix="/api/tutor", tags=["AI Tutor"])


@router.post("", response_model=TutorResponse)
def ask_quantum_tutor(
    payload: TutorRequest,
    store: ArtifactStore = Depends(get_artifact_store)
):
    """
    Executes the Phase 5 Generative AI Quantum Tutor & Loop Engineering engine.
    
    Args:
        payload: TutorRequest containing optional learner_id, tutor mode, and user question.
        
    Returns:
        TutorResponse object containing structured explanation, concept, difficulty, hint, next step, and quality score.
        
    Raises:
        HTTPException 400: If tutor mode is unsupported.
    """
    # 1. Validate Mode
    if payload.mode not in SUPPORTED_MODES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid tutor mode '{payload.mode}'. Supported modes: {', '.join(SUPPORTED_MODES)}"
        )
        
    # 2. Retrieve Learner Profile & Recommendation context if learner_id provided
    profile = None
    recs = None
    if payload.learner_id:
        profile = store.get_profile(payload.learner_id)
        recs = store.get_recommendation(payload.learner_id)
        
    # 3. Determine if Mock mode is forced via environment or default
    use_mock = os.getenv("LLM_PROVIDER", "mock").lower() == "mock" or not (os.getenv("GROQ_API_KEY") or os.getenv("LLM_API_KEY"))
    
    try:
        # 4. Invoke Phase 5 Quantum Tutor Engine
        result = tutor(
            query=payload.question,
            mode=payload.mode,
            learner_profile=profile,
            recommendation_context=recs,
            curriculum=store.curriculum,
            use_mock=use_mock,
            extra_context=payload.context
        )
        
        return TutorResponse(
            answer=result["answer"],
            concept=result.get("concept", "Quantum Computing"),
            difficulty=result.get("difficulty", "Intermediate"),
            mode=result.get("mode", payload.mode),
            hint=result.get("hint", "Focus on fundamental principles."),
            next_step=result.get("next_step", "Try a practice problem."),
            confidence=float(result.get("confidence", 0.95)),
            quality_score=float(result.get("quality_score", 90.0)),
            iterations=int(result.get("iterations", 1)),
            circuit_validation=result.get("circuit_validation"),
            quiz_analysis=result.get("quiz_analysis"),
            suggestions=result.get("suggestions", [])
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Tutor execution failed: {str(e)}"
        )

