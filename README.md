Voice Mock Interview Agent

An AI-powered voice interview platform that conducts realistic mock interviews with real-time speech recognition, intelligent evaluation, and text-to-speech feedback.

🎯 Features

Voice-Based Interviews: Conduct interviews using natural voice interaction

Real-Time Transcription: Automatic speech-to-text conversion using OpenAI Whisper

AI-Powered Evaluation: Get instant feedback on relevance, clarity, and correctness

Text-to-Speech: Questions are read aloud using Microsoft Edge TTS

Role-Specific Questions: Customize interviews for different job roles

Interview Summary: Comprehensive feedback with strengths and improvement areas

🏗️ Architecture
Microsoft/
├── backend/          # FastAPI backend server
│   ├── app/
│   │   ├── api/      # API endpoints
│   │   ├── core/     # Core configuration
│   │   ├── models/   # Database models
│   │   ├── schemas/  # Pydantic schemas
│   │   ├── services/ # Business logic
│   │   └── utils/    # Utility functions
│   └── audio/        # Generated audio files
└── frontend/         # React frontend application
    └── src/
        ├── components/
        └── App.tsx   # Main application

🚀 Getting Started
Prerequisites

Python 3.8+ (for backend)

Node.js 16+ and Yarn (for frontend)

PostgreSQL (for database)

FFmpeg (for audio processing)

OpenAI API Key (for LLM and Whisper)

🔧 Backend Setup

Navigate to the backend directory:

cd backend


Create a virtual environment:

python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux


Install dependencies:

pip install -r requirements.txt


Configure environment variables:

cp .env.example .env


Edit .env and add your credentials:

DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/interview_db
OPENAI_API_KEY=your_openai_api_key_here
TTS_PROVIDER=edge


Start the backend server:

uvicorn app.main:app --reload


The API will be available at http://localhost:8000

🎨 Frontend Setup

Navigate to the frontend directory:

cd frontend


Install dependencies:

npm install


Configure environment variables:

# Create .env file
echo REACT_APP_BACKEND_URL=http://localhost:8000 > .env


Start the development server:

npm start


The application will open at http://localhost:3000

📖 Usage

Start Interview: Enter a job role (e.g., "Software Engineer") and click Start Interview

Answer Questions: Click Answer to start recording your response

Get Feedback: Receive instant evaluation with scores and detailed feedback

Continue: Click Next Question to proceed or End Interview for a summary

Review Summary: View overall performance, strengths, and areas for improvement

🛠️ Tech Stack
Backend

FastAPI – Modern Python web framework

SQLAlchemy – ORM for database operations

OpenAI GPT – Question generation and answer evaluation

Whisper – Speech-to-text transcription

Microsoft Edge TTS – Text-to-speech synthesis

PostgreSQL – Database

Frontend

React 19 – UI framework

TypeScript – Type safety

Axios – HTTP client

Radix UI – Accessible component primitives

Tailwind CSS – Styling

React Hook Form – Form management

🔧 Configuration
Text-to-Speech Provider

The application uses Microsoft Edge Text-to-Speech:

Free and fast

No API key required

Works offline-compatible via Edge runtime

Configured via .env:

TTS_PROVIDER=edge

📝 API Endpoints

POST /interview/start?role={role} – Start a new interview

POST /interview/{id}/answer – Submit audio answer

GET /interview/{id}/next – Get next question

GET /interview/{id}/summary – Get interview summary

🤝 Contributing

Contributions are welcome!
Please feel free to submit a Pull Request.

📄 License

This project is licensed under the MIT License.

🙏 Acknowledgments

OpenAI for Whisper and GPT models

Microsoft for Edge Text-to-Speech
