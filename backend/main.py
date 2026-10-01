import os
import json
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

app = FastAPI(title="ScamShield API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Indicator(BaseModel):
    category: str
    severity: str
    detail: str

class ScamAnalysisResult(BaseModel):
    risk_score: int
    risk_level: str
    detected_indicators: List[Indicator]
    why_flagged_summary: str
    extracted_text: Optional[str] = None

SYSTEM_PROMPT = """You are a scam detector. Analyze text for fraud indicators (urgency, fake URLs, financial demands, phishing).
Return ONLY valid JSON matching this exact structure:
{
  "risk_score": 85,
  "risk_level": "HIGH",
  "detected_indicators": [
    {"category": "Urgency manipulation", "severity": "HIGH", "detail": "Immediate action threat language used."}
  ],
  "why_flagged_summary": "Technical analysis explanation.",
  "extracted_text": "input text"
}"""

@app.post("/api/analyze", response_model=ScamAnalysisResult)
async def analyze_content(
    text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    if not text:
        raise HTTPException(status_code=400, detail="Please provide text content to analyze.")

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is missing in backend/.env file.")

    try:
        client = Groq(api_key=api_key.strip())

        # Dynamic model listing directly from your Groq API key
        fetched_models = []
        try:
            models_data = client.models.list().data
            fetched_models = [m.id for m in models_data]
            print(f"\n--- ACCESSIBLE GROQ MODELS: {fetched_models} ---\n")
        except Exception as err:
            print(f"\n--- MODEL LIST FETCH ERROR: {err} ---\n")

        # Exclude safety/guard/whisper/vision models
        usable_models = [
            m for m in fetched_models
            if "guard" not in m.lower() and "whisper" not in m.lower() and "safetensors" not in m.lower()
        ]

        # Backup candidates list
        fallback_candidates = [
            "llama-3.3-70b-versatile",
            "llama3-8b-8192",
            "mixtral-8x7b-32768",
            "gemma2-9b-it",
            "llama-3.1-8b-instant"
        ]

        candidate_queue = usable_models + [c for c in fallback_candidates if c not in usable_models]

        last_error = None
        completion = None

        # Auto-try available models until success
        for model_name in candidate_queue:
            try:
                print(f"Trying Groq model: {model_name}")
                full_user_prompt = f"{SYSTEM_PROMPT}\n\nContent to analyze:\n{text}"

                completion = client.chat.completions.create(
                    model=model_name,
                    messages=[
                        {"role": "user", "content": full_user_prompt}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.1
                )
                if completion and completion.choices:
                    print(f"--> SUCCESS WITH MODEL: {model_name}")
                    break
            except Exception as e:
                print(f"Failed with {model_name}: {e}")
                last_error = e

        if not completion or not completion.choices:
            raise HTTPException(
                status_code=500, 
                detail=f"All Groq model attempts failed. Last error: {str(last_error)}"
            )

        raw_text = completion.choices[0].message.content
        return json.loads(raw_text)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq Engine Error: {str(e)}")