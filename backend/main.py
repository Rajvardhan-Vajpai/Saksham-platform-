from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer, util
from pymongo import MongoClient
import os
from dotenv import load_dotenv

# Load environment variables (like our database URL) from the backend folder
load_dotenv('sih-imd-backend/.env')

# Initialize the AI model that will help us match courses to trainers based on text
model = SentenceTransformer('all-MiniLM-L6-v2')

app = FastAPI()

# Add CORS Middleware so our frontend can talk to this backend without browser security errors
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Note: In production, we should restrict this to specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CourseRequest(BaseModel):
    """The data we expect to receive when someone asks for trainer recommendations."""
    description: str

def get_db():
    """
    Connects to MongoDB and returns the default database.
    If the connection string isn't set, it warns us and returns None.
    """
    uri = os.getenv("MONGODB_URI")
    if not uri:
        print("Warning: MONGODB_URI is not set in sih-imd-backend/.env!")
        return None
        
    client = MongoClient(uri)
    return client.get_default_database()

def get_trainers_from_db():
    """
    Fetches all approved trainers from the database and formats their data.
    If the database isn't connected, it returns an empty list.
    """
    db = get_db()
    if db is None:
        return []
    
    # We only want to match with trainers who have been approved by an admin
    users_collection = db["users"]
    trainers_cursor = users_collection.find({"role": "trainer", "status": "APPROVED"})
    
    trainers = []
    for trainer in trainers_cursor:
        # Use fallback values in case some trainers have incomplete profiles
        name = trainer.get("name", "Unknown Trainer")
        
        # Combine their competencies and skills into a single text string for the AI to analyze
        competencies = trainer.get("competencies", [])
        skills = trainer.get("skills", [])
        combined_skills = ", ".join(competencies + skills)
        
        if not combined_skills:
            combined_skills = "General Trainer"
            
        rating = trainer.get("rating", 4.0)
        experience = trainer.get("experience", 2)
        available = True # We assume they are available by default
        
        trainers.append({
            "name": name,
            "skills": combined_skills,
            "rating": rating,
            "experience": experience,
            "available": available
        })
        
    return trainers

def normalize(trainer):
    """
    Converts a trainer's rating, experience, and availability into a score between 0 and 1.
    This makes it easier to combine these different metrics into a single final score.
    """
    rating_normalized = trainer["rating"] / 5
    experience_normalized = min(trainer["experience"] / 10, 1.0)
    availability_normalized = 1.0 if trainer["available"] else 0.3
    
    return rating_normalized, experience_normalized, availability_normalized

@app.get("/")
def health_check():
    """A simple endpoint to check if the server is up and running."""
    return {"status": "ok", "message": "AI Recommendation Server is running"}

@app.get("/trainers")
def get_all_trainers():
    """Returns a list of all approved trainers in the system."""
    teachers = get_trainers_from_db()
    if not teachers:
        return {"trainers": []}
    return {"trainers": teachers}

@app.post("/match-trainers")
def match_trainers(course_request: CourseRequest):
    """
    The core AI endpoint. It takes a course description and finds the best trainers for it
    by comparing the description to the trainers' skills using our AI model.
    """
    # Convert the course description into a vector (a list of numbers) that the AI understands
    course_vector = model.encode(course_request.description)
    
    # Get the real trainers from our database
    teachers = get_trainers_from_db()
    
    # If the database is empty or we can't connect, use some dummy data so the app doesn't break
    if not teachers:
        teachers = [
            {"name": "Dr. Sharma (Dummy)", "skills": "Python, Pandas, NumPy, Data Visualization", "rating": 4.5, "experience": 8, "available": True},
            {"name": "Prof. Verma (Dummy)", "skills": "Java, Web Development, HTML CSS", "rating": 5.0, "experience": 4, "available": True},
        ]
        
    results = []
    
    for trainer in teachers:
        # Convert this trainer's skills into a vector
        trainer_vector = model.encode(trainer["skills"])
        
        # Calculate how similar the trainer's skills are to the course description
        skill_match = util.cos_sim(trainer_vector, course_vector).item()
        
        # Get normalized scores for their rating, experience, and availability
        rating_norm, exp_norm, avail_norm = normalize(trainer)
        
        # Calculate the final score. Notice how much weight we give to the skill match (50%)
        final_score = (0.5 * skill_match) + (0.2 * rating_norm) + (0.2 * exp_norm) + (0.1 * avail_norm)
        
        results.append({
            "name": trainer["name"], 
            "score": round(final_score * 100, 1),
            "skill_match": round(skill_match * 100, 1)
        })
    
    # Sort the results so the highest scores are at the top, and return the top 3
    results.sort(key=lambda result: result["score"], reverse=True)
    return {"top_trainers": results[:3]}
