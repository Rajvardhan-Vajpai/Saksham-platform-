# Saksham — National Training & Competency Platform

A Digital India initiative for organizational training, competency development, and knowledge sharing.

This repository contains the frontend codebase for the Saksham Platform. It is built with vanilla HTML, CSS, and JavaScript.

## Features

The platform is built around three distinct roles:

*   **Trainee:** Build a professional profile, enroll in courses, attempt assessments, and track progress.
*   **Trainer:** Create MCQ questionnaires, upload learning materials (recorded lectures, slides, reading material), monitor trainee performance, and maintain a shared library.
*   **Admin:** Oversee the programme, approve accounts, manage roles, monitor enrollments/certifications, and publish homepage notices.

## Project Structure

The project uses a flat structure for simplicity. Key files and directories:

*   `index.html`: The main landing page.
*   `login.html` / `signup.html`: Authentication pages (integrated with Clerk).
*   `support.html`: Support and contact page with FAQs.
*   `trainee/`: Dashboard and pages specific to the Trainee role.
*   `trainer/`: Dashboard and pages specific to the Trainer role.
*   `admin/`: Dashboard and pages specific to the Admin role.
*   `assets/`: Contains `css/` for styles and `js/` for mock data, API integration, and layout logic.

## Running Locally

This frontend is plain HTML/CSS/JS and does not require a build step. However, it must be served over HTTP (not opened directly via `file://`) to avoid CORS issues and to work correctly with Clerk authentication.

1.  **Serve the frontend:**
    Open a terminal in the root directory of this project and run a local static server. Using `npx serve` on port 3000 is recommended:
    ```bash
    npx serve -l 3000
    ```
    *(If prompted, install the `serve` package by pressing `y`)*
    Alternatively, you can use Python's built-in server:
    ```bash
    python -m http.server 3000
    ```

2.  **Access the application:**
    Open your browser and navigate to `http://localhost:3000`.

## Backend Integration

By default, if the backend is not reachable, the frontend will gracefully fall back to using mock data (defined in `assets/js/mock-data.js`).

If you are running the backend locally:
1. Ensure your backend's `.env` file has `FRONTEND_URL=http://localhost:3000`.
2. Start the backend server (typically `npm run dev` in the backend directory).
3. The frontend will automatically detect the active backend and use real data.

## Authentication

Authentication is handled via [Clerk](https://clerk.com/). The publishable key is located in `assets/js/clerk-auth.js`.

---
*Best viewed in modern browsers.*
