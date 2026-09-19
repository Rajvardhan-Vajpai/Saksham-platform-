"""
SAKSHAM (सक्षम) — National Workforce Capability & Competency Platform
Unified AI Services Microservice:
1. AI Notes-to-MCQ Quiz Generator (Powered by Gemini AI)
2. Faculty & Mentor Competency Recommendation Engine (5-Factor Matching)
"""

from __future__ import annotations

import json
import os
import re
import sys
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from typing import Any, Dict, List, Optional

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

try:
    import google.generativeai as genai
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

from engine import execute_competency_mapping, load_trainers

BASE_DIR = Path(__file__).parent
PORT = int(os.getenv("PORT", 8080))
DEFAULT_GEMINI_KEY = os.getenv("GEMINI_API_KEY", "")

if HAS_GENAI and DEFAULT_GEMINI_KEY:
    try:
        genai.configure(api_key=DEFAULT_GEMINI_KEY)
    except Exception as e:
        sys.stderr.write(f"[WARNING] Failed to configure default Gemini key: {e}\n")


PRESET_DOMAINS = [
    {
        "id": "cyclone",
        "title": "🌀 Cyclone & Severe Weather Warning",
        "subject": "Tropical Cyclone Tracking & Coastal Alert Protocols",
        "skills": ["cyclone warning", "severe weather", "radar data"],
        "min_experience": 10,
        "department": "Forecasting"
    },
    {
        "id": "radar",
        "title": "📡 Doppler Weather Radar & Nowcasting",
        "subject": "DWR Reflectivity, Velocity Analysis & Urban Nowcasting",
        "skills": ["radar data", "doppler radar operations", "nowcasting"],
        "min_experience": 8,
        "department": "Radar Operations"
    },
    {
        "id": "nwp",
        "title": "💻 Numerical Weather Prediction (NWP)",
        "subject": "High Resolution Weather Models & WRF Simulation",
        "skills": ["numerical weather prediction", "wrf model", "python"],
        "min_experience": 7,
        "department": "NWP"
    },
    {
        "id": "satellite",
        "title": "🛰️ Satellite Remote Sensing",
        "subject": "INSAT-3D/3DR Multispectral Imagery & Atmospheric Sounding",
        "skills": ["satellite data", "remote sensing", "gis"],
        "min_experience": 6,
        "department": "Satellite Meteorology"
    },
    {
        "id": "agromet",
        "title": "🌾 Agrometeorology & Crop Advisories",
        "subject": "Gramin Krishi Mausam Seva & Hydrological Risk Assessment",
        "skills": ["agrometeorology", "hydromet", "crop weather calendar"],
        "min_experience": 5,
        "department": "Agrometeorology"
    },
    {
        "id": "rail_safety",
        "title": "🛡️ Rail Infrastructure & Safety Systems",
        "subject": "Automatic Train Protection, ETCS & Track Safety",
        "skills": ["signalling", "safety protocols", "risk assessment"],
        "min_experience": 10,
        "department": "Signalling & Telecom"
    }
]


def extract_json_block(text: str) -> Optional[Any]:
    """Safely extracts JSON array or dict from markdown code block or raw string."""
    text = text.strip()
    # Try finding markdown code fences
    fence_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text, re.IGNORECASE)
    if fence_match:
        text = fence_match.group(1).strip()
    try:
        return json.loads(text)
    except Exception:
        # Fallback: search between first '[' and last ']'
        start = text.find('[')
        end = text.rfind(']')
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(text[start:end + 1])
            except Exception:
                pass
    return None


def generate_mcqs_with_gemini(notes: str, num_questions: int = 5, difficulty: str = "Medium", api_key: Optional[str] = None) -> List[Dict[str, Any]]:
    """Calls Gemini Generative AI to produce structured MCQs with answer keys and explanations."""
    active_key = api_key or DEFAULT_GEMINI_KEY
    if not HAS_GENAI or not active_key:
        raise ValueError("Gemini AI library or API key not available.")

    genai.configure(api_key=active_key)
    
    prompt = f"""
You are an expert examiner for the Government of India's SAKSHAM National Training & Competency Platform.
Create {num_questions} high-quality {difficulty}-level Multiple Choice Questions (MCQs) strictly grounded in the following training notes.

Training Notes:
\"\"\"
{notes}
\"\"\"

Return your output EXCLUSIVELY as a valid JSON array containing exactly {num_questions} objects, with no additional conversational text or markdown explanation outside the JSON.
Each object MUST have the following structure:
[
  {{
    "id": 1,
    "question": "Clear, precise question text?",
    "options": [
      "A) First option",
      "B) Second option",
      "C) Third option",
      "D) Fourth option"
    ],
    "correct_index": 0,
    "correct_answer": "A) First option",
    "explanation": "Concise 1-2 sentence explanation clarifying why this answer is correct and why other options are incorrect."
  }}
]
"""
    # Try current standard models
    models_to_try = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-pro"]
    last_err = None
    for model_name in models_to_try:
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt)
            parsed = extract_json_block(response.text)
            if isinstance(parsed, list) and len(parsed) > 0:
                # Sanitize and ensure consistent fields
                clean_qs = []
                for idx, q in enumerate(parsed, 1):
                    opts = q.get("options") or []
                    c_idx = q.get("correct_index", 0)
                    if not isinstance(c_idx, int) or c_idx < 0 or c_idx >= len(opts):
                        c_idx = 0
                    clean_qs.append({
                        "id": idx,
                        "question": str(q.get("question", f"Question {idx}")).strip(),
                        "options": [str(o).strip() for o in opts],
                        "correct_index": c_idx,
                        "correct_answer": opts[c_idx] if opts else "",
                        "explanation": str(q.get("explanation", "Grounded in SAKSHAM training syllabus.")).strip()
                    })
                return clean_qs
        except Exception as err:
            last_err = err
            continue

    raise RuntimeError(f"Gemini API generation failed: {last_err}")


def generate_fallback_mcqs(notes: str, num_questions: int = 5, difficulty: str = "Medium") -> List[Dict[str, Any]]:
    """Smart fallback generator providing structured questions when offline or when API quota is unavailable."""
    lines = [ln.strip() for ln in notes.splitlines() if len(ln.strip()) > 15]
    if not lines:
        lines = [
            "Tropical cyclones in the North Indian Ocean originate during pre-monsoon and post-monsoon seasons.",
            "Doppler Weather Radar provides early detection of severe convective storms and cloud reflectivity.",
            "Numerical Weather Prediction models solve governing equations of atmospheric thermodynamics.",
            "Automatic Train Protection systems ensure braking intervention when train speeds exceed authorized limits.",
            "Standard Operating Procedures mandate red alerts when wind speeds exceed 64 knots."
        ]

    results = []
    for i in range(min(num_questions, len(lines))):
        seed_text = lines[i % len(lines)]
        snippet = seed_text[:80].rstrip(".")
        results.append({
            "id": i + 1,
            "question": f"Based on the training notes on '{snippet}...', which statement represents the validated protocol?",
            "options": [
                f"A) {seed_text}",
                f"B) An alternate procedure that bypasses standard monitoring thresholds",
                f"C) Immediate manual override without supervisory logging",
                f"D) Non-standard unverified empirical adjustment"
            ],
            "correct_index": 0,
            "correct_answer": f"A) {seed_text}",
            "explanation": f"Validated directly against standard training syllabus: '{seed_text}'."
        })

    while len(results) < num_questions:
        idx = len(results) + 1
        results.append({
            "id": idx,
            "question": f"Question {idx} ({difficulty} Level): What is the primary objective of competency-based evaluation under SAKSHAM?",
            "options": [
                "A) Standardize continuous role-based knowledge verification and practical assessment",
                "B) Restrict learning access exclusively to administrative cadre",
                "C) Eliminate on-the-job training documentation",
                "D) Rely entirely on legacy seniority without skill audits"
            ],
            "correct_index": 0,
            "correct_answer": "A) Standardize continuous role-based knowledge verification and practical assessment",
            "explanation": "Mission Karmayogi and SAKSHAM mandate shift from rule-based to role-based continuous competency validation."
        })

    return results


class SakshamAIHandler(BaseHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS for frontend integration
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def _send_json(self, data: Any, status_code: int = 200):
        body = json.dumps(data, indent=2, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_error(self, message: str, status_code: int = 400):
        self._send_json({"status": "error", "message": message}, status_code)

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # 1. Health check
        if path in ("/api/ai/health", "/api/health", "/health"):
            trainers = load_trainers()
            self._send_json({
                "status": "healthy",
                "service": "SAKSHAM AI Competency & Learning Engine",
                "version": "2.0.0",
                "total_trainers": len(trainers),
                "gemini_configured": bool(DEFAULT_GEMINI_KEY),
                "endpoints": [
                    "POST /api/ai/generate-mcq",
                    "POST /api/ai/recommend-trainers",
                    "GET /api/ai/trainers",
                    "GET /api/ai/presets"
                ]
            })
            return

        # 2. Preset domains
        if path == "/api/ai/presets":
            self._send_json({"status": "ok", "presets": PRESET_DOMAINS})
            return

        # 3. Trainer roster
        if path in ("/api/ai/trainers", "/api/trainers"):
            trainers = load_trainers()
            params = parse_qs(parsed.query)
            dept = params.get("department", [""])[0].strip().lower()
            station = params.get("station", [""])[0].strip().lower()

            filtered = trainers
            if dept:
                filtered = [t for t in filtered if dept in str(t.get("department", "")).lower()]
            if station:
                filtered = [t for t in filtered if station in str(t.get("station", "")).lower()]

            self._send_json({
                "status": "ok",
                "total_count": len(trainers),
                "filtered_count": len(filtered),
                "trainers": filtered
            })
            return

        self._send_error(f"Endpoint not found: {path}", 404)

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        content_length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"

        try:
            body = json.loads(post_data) if post_data.strip() else {}
        except Exception:
            try:
                raw_qs = parse_qs(post_data)
                body = {k: v[0] for k, v in raw_qs.items()}
            except Exception:
                body = {}

        # 1. Notes-to-MCQ Generation Endpoint
        if path in ("/api/ai/generate-mcq", "/generate-mcq"):
            notes = str(body.get("notes", "")).strip()
            if not notes:
                self._send_error("Parameter 'notes' is required.")
                return

            num_questions = int(body.get("num_questions", 5))
            num_questions = max(1, min(25, num_questions))
            difficulty = str(body.get("difficulty", "Medium")).strip().capitalize()
            custom_key = body.get("api_key") or None

            try:
                questions = generate_mcqs_with_gemini(notes, num_questions, difficulty, custom_key)
                self._send_json({
                    "status": "ok",
                    "ai_powered": True,
                    "model": "Gemini 2.0 Flash",
                    "difficulty": difficulty,
                    "count": len(questions),
                    "questions": questions
                })
            except Exception as e:
                # Fallback gracefully
                fallback_qs = generate_fallback_mcqs(notes, num_questions, difficulty)
                self._send_json({
                    "status": "ok",
                    "ai_powered": False,
                    "model": "Heuristic Rule Engine (Fallback)",
                    "note": f"Live Gemini API call had notice: {str(e)[:120]}. Served structured grounded MCQs.",
                    "difficulty": difficulty,
                    "count": len(fallback_qs),
                    "questions": fallback_qs
                })
            return

        # 2. Trainer Competency Recommendation Endpoint
        if path in ("/api/ai/recommend-trainers", "/competency-map", "/api/competency-map"):
            try:
                response_data = execute_competency_mapping(body)
                self._send_json(response_data, 200)
            except Exception as e:
                self._send_error(f"Computation error: {str(e)}", 500)
            return

        self._send_error(f"Endpoint not found: {path}", 404)

    def log_message(self, format, *args):
        sys.stderr.write(f"[SAKSHAM-AI {self.log_date_time_string()}] {format % args}\n")


def run_server(port: int = PORT):
    if sys.stdout and hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8")
            sys.stderr.reconfigure(encoding="utf-8")
        except Exception:
            pass

    server_address = ("", port)
    httpd = ThreadingHTTPServer(server_address, SakshamAIHandler)
    print("=" * 72)
    print(" SAKSHAM - National AI Competency & Learning Microservice")
    print(f" Port:             {port}")
    print(f" Health Check:     http://localhost:{port}/api/ai/health")
    print(f" MCQ Generation:   POST http://localhost:{port}/api/ai/generate-mcq")
    print(f" Faculty Matching: POST http://localhost:{port}/api/ai/recommend-trainers")
    print("=" * 72)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down SAKSHAM AI Server.")
        httpd.server_close()


if __name__ == "__main__":
    port_arg = PORT
    if len(sys.argv) > 1:
        try:
            port_arg = int(sys.argv[1])
        except ValueError:
            pass
    run_server(port_arg)
