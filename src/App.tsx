/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { extractTextFromPDF } from './utils/pdfParser';



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
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);


  const handleFileChange = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Sirf PDF files allowed hain');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size 5MB se kam honi chahiye');
      return;
    }

    setPdfLoading(true);
    setError('');

    try {
      console.log('📄 PDF parsing started:', file.name, 'Size:', file.size);

      const extractedText = await extractTextFromPDF(file);

      console.log('✅ Extracted text length:', extractedText.length);
      console.log('📝 First 200 chars:', extractedText.substring(0, 200));

      if (extractedText.length < 50) {
        throw new Error('PDF se text extract nahi ho paya. Kya ye scanned image wali PDF hai?');
      }

      setResumeFile(file);
      setResumeText(extractedText);
      console.log('✅ PDF successfully processed!');
    } catch (err: any) {
      console.error('❌ PDF Error:', err);
      setError(err.message || 'PDF processing mein error aaya');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

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
      // 1. URL lo
      const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

      // 2. 🔥 SAFETY CHECK: Agar end mein '/' hai toh hata do
      const cleanApiUrl = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl;

      console.log("🚀 Fetching from:", `${cleanApiUrl}/api/analyze`);

      // 3. Sahi URL pe request bhejo
      const response = await fetch(`${cleanApiUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobDescription }),
      });

      // 4. HTML error check
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Backend se sahi response nahi mila. Status: ${response.status}. Check karo backend chal raha hai ya nahi.`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Backend se error aaya');
      }

      setResult(data.data.analysisResult);
    } catch (err: any) {
      console.error("❌ Fetch Error:", err);
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
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-blue-300 mb-2">
                  📄 Resume (PDF ya Text)
                </label>

                {/* PDF Upload Box with Drag & Drop */}
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer mb-3 ${isDragActive
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500'
                    }`}
                  onClick={() => document.getElementById('pdf-upload')?.click()}
                >
                  <input
                    id="pdf-upload"
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileChange(file);
                    }}
                  />

                  {pdfLoading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="text-sm text-gray-600 dark:text-slate-300">PDF parse ho rahi hai...</p>
                    </div>
                  ) : resumeFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-4xl">✅</div>
                      <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                        {resumeFile.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        {(resumeFile.size / 1024).toFixed(1)} KB • Click to change
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-4xl">📁</div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                        Drag & drop PDF yahan
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        ya click karke select karo (Max 5MB)
                      </p>
                    </div>
                  )}
                </div>

                {/* Text Area (Optional - agar user directly paste karna chahe) */}
                <details className="group">
                  <summary className="cursor-pointer text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                    ✍️ Ya manually text paste karo
                  </summary>
                  <textarea
                    value={resumeText}
                    onChange={(e) => {
                      setResumeText(e.target.value);
                      setResumeFile(null); // Agar text paste kiya toh file state clear karo
                    }}
                    placeholder="Apna resume yahan paste karo..."
                    className="mt-3 w-full h-40 px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-200 transition-colors"
                  />
                </details>
              </div>
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