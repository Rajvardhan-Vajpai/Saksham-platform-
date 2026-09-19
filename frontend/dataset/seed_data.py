"""
Seed data generator for the Training Platform (Trainer / Trainee / Course).

Generates realistic fake records for:
  - Trainers   (with expertise areas, bio)
  - Trainees   (with qualifications, work experience, interests, skills, certificates)
  - Courses    (tagged, difficulty-leveled, linked to a trainer)
  - Enrollments (random trainee -> course links)
  - Feedback   (ratings on enrolled courses)

Output: writes JSON files to ./seed_output/ so you can either
  1) Load them directly into your frontend for UI testing, or
  2) Write a small loader script to INSERT them into Postgres.

Run:  python seed_data.py --trainers 8 --trainees 40 --courses 20
"""

import json
import random
import argparse
from pathlib import Path
from datetime import datetime, timedelta
from faker import Faker

fake = Faker()

SUBJECTS = [
    "Python Programming", "Data Structures", "Machine Learning", "Web Development",
    "Cloud Computing (AWS)", "Cybersecurity Basics", "Project Management",
    "Communication Skills", "SQL & Databases", "DevOps Fundamentals",
    "UI/UX Design", "Java Programming", "Business Analytics", "Leadership Training",
    "Digital Marketing", "Networking Essentials", "Agile & Scrum", "Excel Advanced",
]

QUALIFICATIONS = [
    "B.Tech Computer Science", "B.Tech Electronics", "BCA", "MCA", "B.Sc IT",
    "M.Tech Computer Science", "Diploma in IT", "MBA", "B.Com", "Ph.D. Computer Science",
]

SKILLS = [
    "Python", "Java", "SQL", "React", "Communication", "Leadership", "Excel",
    "Cloud (AWS/Azure)", "Machine Learning", "Networking", "Project Management",
    "Data Analysis", "Public Speaking", "Docker", "Git",
]

DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"]


def random_date(start_days_ago=365, end_days_ago=0):
    delta = random.randint(end_days_ago, start_days_ago)
    return (datetime.now() - timedelta(days=delta)).isoformat()


def make_trainer(i):
    expertise = random.sample(SUBJECTS, k=random.randint(2, 4))
    return {
        "id": f"trainer_{i:03d}",
        "role": "trainer",
        "name": fake.name(),
        "email": fake.unique.email(),
        "status": "approved",
        "age": random.randint(28, 55),
        "expertise_areas": expertise,
        "bio": fake.paragraph(nb_sentences=3),
        "years_experience": random.randint(2, 20),
        "joined_at": random_date(700, 30),
    }


def make_trainee(i):
    qualification = random.choice(QUALIFICATIONS)
    interests = random.sample(SUBJECTS, k=random.randint(2, 5))
    skills = random.sample(SKILLS, k=random.randint(3, 6))
    num_certs = random.randint(0, 3)
    return {
        "id": f"trainee_{i:03d}",
        "role": "trainee",
        "name": fake.name(),
        "email": fake.unique.email(),
        "status": random.choice(["approved", "approved", "approved", "pending"]),
        "age": random.randint(20, 45),
        "qualification": qualification,
        "work_experience": [
            {
                "company": fake.company(),
                "title": fake.job(),
                "years": random.randint(1, 8),
            }
            for _ in range(random.randint(0, 2))
        ],
        "interests": interests,
        "skills": skills,
        "certificates": [
            {"title": f"{random.choice(SUBJECTS)} Certification", "year": random.randint(2019, 2026)}
            for _ in range(num_certs)
        ],
        "joined_at": random_date(600, 5),
    }


def make_course(i, trainers):
    subject = random.choice(SUBJECTS)
    trainer = random.choice(trainers)
    return {
        "id": f"course_{i:03d}",
        "title": f"{subject}: {random.choice(['Foundations', 'Practical Guide', 'Masterclass', 'Bootcamp', 'Essentials'])}",
        "description": fake.paragraph(nb_sentences=4),
        "category": subject,
        "difficulty": random.choice(DIFFICULTIES),
        "trainer_id": trainer["id"],
        "tags": random.sample(SKILLS, k=random.randint(2, 4)) + [subject],
        "target_qualification": random.sample(QUALIFICATIONS, k=random.randint(1, 3)),
        "target_age_min": random.choice([18, 20, 22, 25]),
        "target_age_max": random.choice([35, 40, 45, 60]),
        "duration_weeks": random.choice([2, 4, 6, 8, 12]),
        "created_at": random_date(500, 10),
    }


def make_enrollments(trainees, courses, avg_per_trainee=3):
    enrollments = []
    for t in trainees:
        n = random.randint(0, avg_per_trainee + 2)
        chosen = random.sample(courses, k=min(n, len(courses)))
        for c in chosen:
            enrollments.append({
                "trainee_id": t["id"],
                "course_id": c["id"],
                "status": random.choice(["in_progress", "completed", "completed", "not_started"]),
                "progress_pct": random.choice([0, 20, 45, 60, 80, 100]),
                "enrolled_at": random_date(300, 1),
            })
    return enrollments


def make_feedback(enrollments):
    feedback = []
    for e in enrollments:
        if e["status"] == "completed" and random.random() < 0.7:
            feedback.append({
                "trainee_id": e["trainee_id"],
                "course_id": e["course_id"],
                "rating": random.randint(3, 5),
                "comment": fake.sentence(nb_words=12),
            })
    return feedback


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--trainers", type=int, default=8)
    parser.add_argument("--trainees", type=int, default=40)
    parser.add_argument("--courses", type=int, default=20)
    parser.add_argument("--out", type=str, default="seed_output")
    args = parser.parse_args()

    out_dir = Path(args.out)
    out_dir.mkdir(exist_ok=True)

    trainers = [make_trainer(i) for i in range(1, args.trainers + 1)]
    trainees = [make_trainee(i) for i in range(1, args.trainees + 1)]
    courses = [make_course(i, trainers) for i in range(1, args.courses + 1)]
    enrollments = make_enrollments(trainees, courses)
    feedback = make_feedback(enrollments)

    admin = {
        "id": "admin_001",
        "role": "admin",
        "name": "Site Admin",
        "email": "admin@platform.test",
        "status": "approved",
    }

    datasets = {
        "trainers.json": trainers,
        "trainees.json": trainees,
        "courses.json": courses,
        "enrollments.json": enrollments,
        "feedback.json": feedback,
        "admin.json": [admin],
    }

    for filename, data in datasets.items():
        with open(out_dir / filename, "w") as f:
            json.dump(data, f, indent=2)

    print(f"Generated:")
    print(f"  {len(trainers)} trainers -> {out_dir}/trainers.json")
    print(f"  {len(trainees)} trainees -> {out_dir}/trainees.json")
    print(f"  {len(courses)} courses  -> {out_dir}/courses.json")
    print(f"  {len(enrollments)} enrollments -> {out_dir}/enrollments.json")
    print(f"  {len(feedback)} feedback entries -> {out_dir}/feedback.json")
    print(f"  1 admin -> {out_dir}/admin.json")


if __name__ == "__main__":
    main()
