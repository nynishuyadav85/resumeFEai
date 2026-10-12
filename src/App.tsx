/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';

// TypeScript interface for AI Response
interface AnalysisResult {
  matchScore: number;
  missingKeywords: string[];
  suggestions: string[];
  interviewQuestions: string[];
}

function App() {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resumeText.trim() || !jobDescription.trim()) {
      setError('Resume aur Job Description dono zaroori hain');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

      const response = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobDescription }),
      });

      // 🔥 YE CHECK ADD KARO: Agar response JSON nahi hai, toh HTML error page aa raha hai
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Backend server se sahi response nahi mila. Kya backend chal raha hai?");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Backend se error aaya');
      }

      setResult(data.data.analysisResult);
    } catch (err: any) {
      console.error("Fetch Error:", err);
      setError(err.message || 'Kuch galat ho gaya. Dobara try karo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-12 px-4 sm:px-6 lg:px-8 text-white">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-blue-400 mb-2">🤖 ResumeAI</h1>
          <p className="text-lg text-slate-300">Tailor your resume with AI-powered insights</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-slate-800 rounded-xl shadow-2xl p-8 mb-8 border border-slate-700">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-blue-300 mb-2">📄 Resume Text</label>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Apna resume yahan paste karo..."
                className="w-full h-64 px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-slate-200"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-blue-300 mb-2">💼 Job Description</label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Job description yahan paste karo..."
                className="w-full h-64 px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-slate-200"
                required
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg transition duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                AI Analyzing...
              </>
            ) : (
              '🚀 Analyze My Resume'
            )}
          </button>
        </form>

        {/* Results Section */}
        {result && (
          <div className="space-y-6 animate-fade-in">
            {/* Match Score */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 text-center">
              <h2 className="text-xl font-semibold text-slate-300 mb-2">Match Score</h2>
              <div className={`text-5xl font-bold ${result.matchScore >= 70 ? 'text-green-400' : result.matchScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                {result.matchScore}%
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Missing Keywords */}
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-bold text-red-300 mb-4">🔑 Missing Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {result.missingKeywords.map((kw, i) => (
                    <span key={i} className="px-3 py-1 bg-red-900/40 text-red-200 rounded-full text-sm border border-red-700">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Suggestions */}
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-bold text-blue-300 mb-4">💡 Suggestions</h3>
                <ul className="space-y-2">
                  {result.suggestions.map((sug, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                      <span className="text-blue-400 mt-1">•</span> {sug}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Interview Questions */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-bold text-purple-300 mb-4">❓ Expected Interview Questions</h3>
              <ol className="space-y-3">
                {result.interviewQuestions.map((q, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-300">
                    <span className="bg-purple-900/50 text-purple-300 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shrink-0 border border-purple-700">
                      {i + 1}
                    </span>
                    {q}
                  </li>
                ))}
              </ol>
            </div>
            {/* Reset Button */}
            <div>
              <button
                onClick={() => {
                  setResult(null);
                  setResumeText('');
                  setJobDescription('');
                  setError('');
                }}
                className="mt-6 w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 border border-slate-600"
              >
                🔄 Analyze Another Resume
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;