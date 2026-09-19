"""
CAPACITY CONNECT — Competency Mapping AI Engine
Implements the multi-factor scoring algorithm, candidate ranking,
and AI explanation generation layer.
"""

from __future__ import annotations

import json
import os
import math
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional


PROF_WEIGHT = {
    "expert": 1.0,
    "intermediate": 0.66,
    "beginner": 0.33,
}

DATA_FILE = Path(__file__).parent / "data" / "trainers.json"


def normalize_string(val: Any) -> str:
    """Normalize string to lowercase and strip whitespace."""
    if val is None:
        return ""
    return str(val).strip().lower()


def to_skill_list(val: Any) -> List[str]:
    """Normalize required skills input into clean list of strings."""
    if isinstance(val, list):
        return [str(s).strip() for s in val if str(s).strip()]
    if isinstance(val, str):
        return [s.strip() for s in val.split(",") if s.strip()]
    return []


def normalize_request(body: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize input payload matching n8n workflow logic."""
    skills_raw = body.get("required_skills")
    if skills_raw is None:
        skills_raw = body.get("skills")
    required_skills = to_skill_list(skills_raw)

    subject = str(
        body.get("subject")
        or body.get("course")
        or body.get("course_name")
        or ""
    ).strip()

    min_exp_raw = body.get("min_experience_years")
    if min_exp_raw is None:
        min_exp_raw = body.get("min_experience", 0)
    try:
        min_experience_years = float(min_exp_raw)
    except (ValueError, TypeError):
        min_experience_years = 0.0

    try:
        top_n = int(body.get("top_n", 3))
        if top_n <= 0:
            top_n = 3
    except (ValueError, TypeError):
        top_n = 3

    return {
        "subject": subject,
        "required_skills": required_skills,
        "min_experience_years": min_experience_years,
        "top_n": top_n,
    }


def load_trainers(filepath: Optional[Path] = None) -> List[Dict[str, Any]]:
    """Load trainer profiles from JSON store."""
    target = filepath or DATA_FILE
    if not target.exists():
        return []
    with open(target, "r", encoding="utf-8") as f:
        return json.load(f)


def save_trainers(trainers: List[Dict[str, Any]], filepath: Optional[Path] = None) -> None:
    """Save trainer profiles to JSON store."""
    target = filepath or DATA_FILE
    target.parent.mkdir(parents=True, exist_ok=True)
    with open(target, "w", encoding="utf-8") as f:
        json.dump(trainers, f, indent=2)


def score_trainers(query: Dict[str, Any], trainers: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Score trainers based on the exact n8n CAPACITY CONNECT formula:
    S = 0.40 * K + 0.25 * E + 0.15 * R + 0.10 * A + 0.10 * T
    """
    required = [s.lower() for s in query.get("required_skills", [])]
    min_exp = float(query.get("min_experience_years", 0))
    top_n = int(query.get("top_n", 3))

    scored = []
    for r in trainers:
        if not r or not r.get("trainer_id"):
            continue

        # Parse competencies
        comp_raw = r.get("competencies") or "[]"
        if isinstance(comp_raw, str):
            try:
                comps = json.loads(comp_raw)
            except Exception:
                comps = []
        elif isinstance(comp_raw, list):
            comps = comp_raw
        else:
            comps = []

        comp_map = {}
        for c in comps:
            if isinstance(c, dict) and c.get("name"):
                comp_map[normalize_string(c.get("name"))] = normalize_string(c.get("proficiency"))

        domains = normalize_string(r.get("domains"))
        subjects = normalize_string(r.get("subjects_taught"))

        matched = []
        k_sum = 0.0

        if required:
            for sk in required:
                w = 0.0
                prof = "none"
                if sk in comp_map:
                    prof = comp_map[sk]
                    w = PROF_WEIGHT.get(prof, 0.33)
                elif sk in domains or sk in subjects:
                    prof = "familiar"
                    w = 0.40

                if w > 0:
                    matched.append({"skill": sk, "proficiency": prof})
                k_sum += w

            k = (k_sum / len(required)) * 100.0
        else:
            k = 0.0

        years = float(r.get("years_of_service") or 0)
        if min_exp <= 0:
            e = min(100.0, years * 6.25)
        else:
            e = min(100.0, (years / min_exp) * 100.0)

        feedback = float(r.get("avg_feedback_score") or 0)
        rating_val = (feedback / 5.0) * 100.0

        load = float(r.get("teaching_load_hours") or 0)
        is_available = bool(r.get("available"))
        if is_available:
            avail_val = max(0.0, 100.0 - (load * 3.0))
        else:
            avail_val = 0.0

        sessions = float(r.get("sessions_delivered") or 0)
        teach_val = min(100.0, (sessions / 50.0) * 100.0)

        total = (0.40 * k) + (0.25 * e) + (0.15 * rating_val) + (0.10 * avail_val) + (0.10 * teach_val)
        round_1 = lambda n: round(float(n), 1)

        scored.append({
            "trainer_id": r.get("trainer_id"),
            "name": r.get("name"),
            "designation": r.get("designation"),
            "department": r.get("department"),
            "station": r.get("station"),
            "email": r.get("email"),
            "years_of_service": years,
            "avg_feedback_score": feedback,
            "pass_rate_percent": float(r.get("pass_rate_percent") or 0),
            "available": is_available,
            "subjects_taught": r.get("subjects_taught", ""),
            "match_score": round_1(total),
            "breakdown": {
                "skill_match_K": round_1(k),
                "experience_match_E": round_1(e),
                "rating_R": round_1(rating_val),
                "availability_A": round_1(avail_val),
                "teaching_experience_T": round_1(teach_val),
            },
            "matched_skills": matched,
        })

    # Sort descending by match_score
    scored.sort(key=lambda x: x["match_score"], reverse=True)
    candidates = scored[:top_n]

    return {
        "query": query,
        "evaluated_count": len(scored),
        "candidates": candidates,
        "all_scored": scored,
    }


def generate_explanation_rule_based(candidate: Dict[str, Any], subject: str = "") -> str:
    """
    Generate a high-quality concise English justification (max 30 words)
    highlighting matched skills, experience, and feedback score.
    """
    name = candidate.get("name", "Candidate")
    score = candidate.get("match_score", 0)
    years = candidate.get("years_of_service", 0)
    rating = candidate.get("avg_feedback_score", 0)
    matched = candidate.get("matched_skills", [])

    if matched:
        top_skills = [f"{m['skill'].title()} ({m['proficiency']})" for m in matched[:2]]
        skills_str = " and ".join(top_skills)
        reason = (
            f"{name} matches with a {score}/100 score, offering {int(years)} years experience, "
            f"demonstrated {skills_str} competencies, and a strong {rating}/5 participant rating."
        )
    else:
        dept = candidate.get("department", "Domain")
        reason = (
            f"{name} achieves a {score}/100 score with {int(years)} years in {dept}, "
            f"high availability, and an exceptional {rating}/5 participant satisfaction rating."
        )

    # Ensure max 30 words
    words = reason.split()
    if len(words) > 30:
        reason = " ".join(words[:29]) + "."
    return reason


def generate_explanations_llm(candidates: List[Dict[str, Any]], query: Dict[str, Any]) -> Dict[str, str]:
    """
    Optionally call OpenAI / Gemini LLM if API keys are set, otherwise
    gracefully fall back to rule-based English explanations.
    """
    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key and candidates:
        try:
            import urllib.request
            prompt = (
                "You are a competency-mapping assistant for the CAPACITY CONNECT training platform.\n"
                f"Course subject: {query.get('subject', '')}\n"
                f"Required skills: {json.dumps(query.get('required_skills', []))}\n"
                f"Minimum experience (years): {query.get('min_experience_years', 0)}\n\n"
                f"Candidate trainers with computed match scores (0-100) and factor breakdown:\n"
                f"{json.dumps(candidates)}\n\n"
                "For each candidate, write ONE concise sentence (max 30 words) in English explaining why they match, "
                "referencing their matched skills, experience and rating. "
                "Return ONLY a valid JSON object mapping each trainer_id to its explanation string. No markdown, no code fences."
            )
            req_data = json.dumps({
                "model": "gpt-4o-mini",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.2,
            }).encode("utf-8")
            req = urllib.request.Request(
                "https://api.openai.com/v1/chat/completions",
                data=req_data,
                headers={"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=8) as resp:
                result = json.loads(resp.read().decode("utf-8"))
                content = result["choices"][0]["message"]["content"].strip()
                if content.startswith("```"):
                    content = content.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
                return json.loads(content)
        except Exception:
            pass

    # High-quality fallback rule-based English generator
    explanations = {}
    for c in candidates:
        explanations[c["trainer_id"]] = generate_explanation_rule_based(c, query.get("subject", ""))
    return explanations


def build_response(scored_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Format output matching n8n 'Build Response' node structure exactly.
    """
    query = scored_data.get("query", {})
    candidates = scored_data.get("candidates", [])
    explanations = generate_explanations_llm(candidates, query)

    enriched = []
    for idx, c in enumerate(candidates):
        trainer_id = c.get("trainer_id")
        why = explanations.get(trainer_id) or generate_explanation_rule_based(c, query.get("subject", ""))
        item = dict(c)
        item["rank"] = idx + 1
        item["why_match"] = why
        enriched.append(item)

    return {
        "status": "ok",
        "course_subject": query.get("subject", ""),
        "required_skills": query.get("required_skills", []),
        "min_experience_years": query.get("min_experience_years", 0),
        "evaluated_trainers": scored_data.get("evaluated_count", 0),
        "recommended_trainers": enriched,
        "scoring_formula": "S = 0.40*Skill + 0.25*Experience + 0.15*Rating + 0.10*Availability + 0.10*TeachingExperience",
        "note": "AI recommendation for human review. Do not reject a trainer solely on score.",
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


def execute_competency_mapping(body: Dict[str, Any], trainers: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    """Main pipeline execution entry point."""
    if trainers is None:
        trainers = load_trainers()
    query = normalize_request(body)
    scored_data = score_trainers(query, trainers)
    return build_response(scored_data)
