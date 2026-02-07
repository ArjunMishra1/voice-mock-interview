import { useState, useRef, useEffect } from "react";
import "@/App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// State interface
interface EvaluationData {
  relevance: number;
  clarity: number;
  correctness: number;
  feedback: string;
}

interface InterviewState {
  interviewId: string;
  currentQuestion: string;
  transcript: string;
  evaluation: EvaluationData | null;
}

interface SummaryData {
  overall_feedback: string;
  strengths: string;
  improvements: string;
}

function App() {
  const [state, setState] = useState<InterviewState>({
    interviewId: "",
    currentQuestion: "",
    transcript: "",
    evaluation: null,
  });
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [currentAudio, setCurrentAudio] = useState("");
  const [role, setRole] = useState("Software Engineer");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Start interview
  const handleStartInterview = async () => {
    setIsLoading(true);
    setError("");
    setSummary(null);

    try {
      const response = await axios.post(
        `${BACKEND_URL}/interview/start?role=${encodeURIComponent(role)}`,
      );

      setState({
        interviewId: response.data.interview_id,
        currentQuestion: response.data.question,
        transcript: "",
        evaluation: null,
      });

      setCurrentAudio(response.data.audio_file);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.msg ||
        err.message ||
        "Failed to start interview";
      setError(
        typeof errorMessage === "string"
          ? errorMessage
          : JSON.stringify(errorMessage),
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Play audio when currentAudio changes
  useEffect(() => {
    if (currentAudio && audioRef.current) {
      audioRef.current.src = `${BACKEND_URL}/audio/${currentAudio}`;
      audioRef.current
        .play()
        .catch((e) => console.error("Audio play error:", e));
    }
  }, [currentAudio]);

  // Start recording
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const options = { mimeType: "audio/webm" };
      const mediaRecorder = new MediaRecorder(stream, options);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError("");
    } catch (err: any) {
      setError("Microphone permission denied or not available");
    }
  };

  // Stop recording and submit
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        await submitAnswer(audioBlob);

        mediaRecorderRef.current?.stream
          .getTracks()
          .forEach((track) => track.stop());
      };

      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Submit answer
  const submitAnswer = async (audioBlob: Blob) => {
    setIsLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "answer.webm");

      const response = await axios.post(
        `${BACKEND_URL}/interview/${state.interviewId}/answer`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      setState((prev) => ({
        ...prev,
        transcript: response.data.transcript,
        evaluation: response.data.evaluation,
      }));
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.msg ||
        err.message ||
        "Failed to submit answer";
      setError(
        typeof errorMessage === "string"
          ? errorMessage
          : JSON.stringify(errorMessage),
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Next question
  const handleNextQuestion = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await axios.get(
        `${BACKEND_URL}/interview/${state.interviewId}/next`,
      );

      setState((prev) => ({
        ...prev,
        currentQuestion: response.data.question,
        transcript: "",
        evaluation: null,
      }));

      setCurrentAudio(response.data.audio_file);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.msg ||
        err.message ||
        "Failed to get next question";
      setError(
        typeof errorMessage === "string"
          ? errorMessage
          : JSON.stringify(errorMessage),
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Get summary
  const handleGetSummary = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await axios.get(
        `${BACKEND_URL}/interview/${state.interviewId}/summary`,
      );

      setSummary(response.data);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.msg ||
        err.message ||
        "Failed to get summary";
      setError(
        typeof errorMessage === "string"
          ? errorMessage
          : JSON.stringify(errorMessage),
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get score color
  const getScoreColor = (score: number) => {
    if (score >= 8) return "score-excellent";
    if (score >= 6) return "score-good";
    if (score >= 4) return "score-fair";
    return "score-poor";
  };

  return (
    <div className="app-container">
      <div className="background-gradient"></div>
      
      <div className="interview-card">
        <div className="card-header">
          <div className="logo-section">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" opacity="0.3"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="title" data-testid="app-title">
              Voice Mock Interview
            </h1>
          </div>
          <p className="subtitle">Practice and perfect your interview skills</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-message fade-in" data-testid="error-message">
            <svg className="error-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="16" r="1" fill="currentColor"/>
            </svg>
            {error}
          </div>
        )}

        {/* Summary View */}
        {summary ? (
          <div className="summary-section fade-in" data-testid="summary-section">
            <div className="summary-header">
              <div className="success-badge">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2"/>
                  <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Interview Complete!</span>
              </div>
              <h2 className="section-title">Your Performance Summary</h2>
            </div>
            
            <div className="summary-content">
              <div className="summary-item">
                <div className="summary-item-header">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <strong>Overall Feedback</strong>
                </div>
                <p>{summary.overall_feedback}</p>
              </div>
              
              <div className="summary-item">
                <div className="summary-item-header">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
                  </svg>
                  <strong>Strengths</strong>
                </div>
                <p>{summary.strengths}</p>
              </div>
              
              <div className="summary-item">
                <div className="summary-item-header">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L12 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M17 7L12 2L7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <strong>Areas for Improvement</strong>
                </div>
                <p>{summary.improvements}</p>
              </div>
            </div>
            
            <button
              className="btn btn-primary btn-large"
              onClick={() => {
                setSummary(null);
                setState({
                  interviewId: "",
                  currentQuestion: "",
                  transcript: "",
                  evaluation: null,
                });
              }}
              data-testid="start-new-interview-btn"
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Start New Interview
            </button>
          </div>
        ) : !state.interviewId ? (
          // Start Interview Section
          <div className="start-section fade-in" data-testid="start-section">
            <div className="welcome-card">
              <div className="feature-grid">
                <div className="feature-item">
                  <div className="feature-icon">🎤</div>
                  <h3>Voice Practice</h3>
                  <p>Answer with your voice</p>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">📊</div>
                  <h3>Instant Feedback</h3>
                  <p>Get scored evaluations</p>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">🎯</div>
                  <h3>Role-Specific</h3>
                  <p>Tailored to your job</p>
                </div>
              </div>
            </div>

            <div className="input-card">
              <div className="input-group">
                <label htmlFor="role-input">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  What role are you interviewing for?
                </label>
                <input
                  id="role-input"
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g., Software Engineer, Product Manager, Data Scientist"
                  className="input-field"
                  data-testid="role-input"
                />
              </div>
              
              <button
                className="btn btn-primary btn-large"
                onClick={handleStartInterview}
                disabled={isLoading || !role.trim()}
                data-testid="start-interview-btn"
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    Starting Interview...
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 3L19 12L5 21V3Z" fill="currentColor"/>
                    </svg>
                    Begin Interview
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          // Interview In Progress
          <div className="interview-section fade-in" data-testid="interview-section">
            {/* Question Display */}
            <div className="question-section slide-in" data-testid="question-section">
              <div className="question-header">
                <div className="question-badge">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="12" cy="8" r="1" fill="currentColor"/>
                  </svg>
                  Question
                </div>
              </div>
              
              <p className="question-text" data-testid="question-text">
                {state.currentQuestion}
              </p>

              <audio
                ref={audioRef}
                controls
                className="audio-player"
                data-testid="audio-player"
              />
            </div>

            {/* Recording Controls */}
            <div className="controls-section" data-testid="controls-section">
              {!isRecording ? (
                <button
                  className="btn btn-record btn-large"
                  onClick={handleStartRecording}
                  disabled={isLoading}
                  data-testid="start-recording-btn"
                >
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 2V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M19 10C19 13.866 15.866 17 12 17C8.13401 17 5 13.866 5 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M12 17V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M8 22H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Start Recording Answer
                </button>
              ) : (
                <button
                  className="btn btn-stop btn-large recording-pulse"
                  onClick={handleStopRecording}
                  data-testid="stop-recording-btn"
                >
                  <div className="recording-dot"></div>
                  <span className="recording-text">Stop Recording</span>
                </button>
              )}
            </div>

            {/* Transcript and Evaluation */}
            {state.transcript && (
              <div className="result-section fade-in" data-testid="result-section">
                <div className="transcript-box" data-testid="transcript-box">
                  <div className="box-header">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <h3 className="subsection-title">Your Answer</h3>
                  </div>
                  <p className="transcript-text">{state.transcript}</p>
                </div>

                {state.evaluation && (
                  <div className="evaluation-box" data-testid="evaluation-box">
                    <div className="box-header">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" strokeWidth="2"/>
                        <path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V7H9V5Z" stroke="currentColor" strokeWidth="2"/>
                        <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <h3 className="subsection-title">Evaluation</h3>
                    </div>
                    
                    <div className="scores" data-testid="evaluation-scores">
                      <div className={`score-item ${getScoreColor(state.evaluation.relevance)}`}>
                        <div className="score-label">
                          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                            <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                          Relevance
                        </div>
                        <div className="score-value" data-testid="score-relevance">
                          {state.evaluation.relevance}
                          <span className="score-max">/10</span>
                        </div>
                      </div>
                      
                      <div className={`score-item ${getScoreColor(state.evaluation.clarity)}`}>
                        <div className="score-label">
                          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                            <path d="M12 1V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M12 21V23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M4.22 4.22L5.64 5.64" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M18.36 18.36L19.78 19.78" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M1 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M21 12H23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M4.22 19.78L5.64 18.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M18.36 5.64L19.78 4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                          Clarity
                        </div>
                        <div className="score-value" data-testid="score-clarity">
                          {state.evaluation.clarity}
                          <span className="score-max">/10</span>
                        </div>
                      </div>
                      
                      <div className={`score-item ${getScoreColor(state.evaluation.correctness)}`}>
                        <div className="score-label">
                          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.7088 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Correctness
                        </div>
                        <div className="score-value" data-testid="score-correctness">
                          {state.evaluation.correctness}
                          <span className="score-max">/10</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="feedback" data-testid="evaluation-feedback">
                      <div className="feedback-header">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <strong>Detailed Feedback</strong>
                      </div>
                      <p>{state.evaluation.feedback}</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="action-buttons" data-testid="action-buttons">
                  <button
                    className="btn btn-secondary btn-large"
                    onClick={handleNextQuestion}
                    disabled={isLoading}
                    data-testid="next-question-btn"
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner"></span>
                        Loading...
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M13 17L18 12L13 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M6 17L11 12L6 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Next Question
                      </>
                    )}
                  </button>
                  
                  <button
                    className="btn btn-tertiary btn-large"
                    onClick={handleGetSummary}
                    disabled={isLoading}
                    data-testid="get-summary-btn"
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner"></span>
                        Loading...
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        End Interview
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
