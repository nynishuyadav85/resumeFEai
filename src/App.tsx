import { useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  FileText,
  FileUp,
  Lightbulb,
  LoaderCircle,
  MessageSquareText,
  Moon,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  TriangleAlert,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { extractTextFromPDF } from '@/utils/pdfParser';

interface AnalysisResult {
  matchScore: number;
  missingKeywords: string[];
  suggestions: string[];
  interviewQuestions: string[];
}

function ScoreRing({ score }: { score: number }) {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score, 0), 100);

  return (
    <div
      className="relative grid size-40 place-items-center"
      role="img"
      aria-label={`Resume match score: ${score}%`}
    >
      <svg className="size-full -rotate-90" viewBox="0 0 112 112" aria-hidden="true">
        <circle
          className="stroke-muted"
          cx="56"
          cy="56"
          r={radius}
          fill="none"
          strokeWidth="8"
        />
        <circle
          className="stroke-primary transition-[stroke-dashoffset] duration-700 ease-out"
          cx="56"
          cy="56"
          r={radius}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress / 100)}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-4xl font-bold tracking-tight">{score}%</p>
        <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Match score
        </p>
      </div>
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  );
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    setTheme(nextTheme);
  };

  const handleFileChange = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Please choose a PDF file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('The PDF must be smaller than 5 MB.');
      return;
    }

    setPdfLoading(true);
    setError('');

    try {
      const extractedText = await extractTextFromPDF(file);
      if (extractedText.length < 50) {
        throw new Error('We could not find readable text in this PDF. It may be a scanned image.');
      }
      setResumeFile(file);
      setResumeText(extractedText);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'There was a problem processing the PDF.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!resumeText.trim() || !jobDescription.trim()) {
      setError('Add your resume and the job description to continue.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const cleanApiUrl = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl;

      const response = await fetch(`${cleanApiUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobDescription }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`The server returned an unexpected response (status ${response.status}).`);
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Analysis failed. Please try again.');

      setResult(data.data.analysisResult);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetAnalysis = () => {
    setResult(null);
    setResumeText('');
    setJobDescription('');
    setResumeFile(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isReady = Boolean(resumeText.trim() && jobDescription.trim());

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[34rem] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"
        aria-hidden="true"
      />

      <main className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between">
          <a href="#" className="group inline-flex items-center gap-3" aria-label="ResumeAI home">
            <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
              <Sparkles className="size-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-bold tracking-tight">ResumeAI</span>
              <span className="block text-xs text-muted-foreground">Career studio</span>
            </span>
          </a>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full bg-background/80"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <Moon className="size-4" aria-hidden="true" />
            ) : (
              <Sun className="size-4" aria-hidden="true" />
            )}
          </Button>
        </header>

        <section className="mx-auto max-w-3xl pb-9 pt-16 text-center sm:pt-20">
          <Badge variant="secondary" className="mb-5 gap-1.5 rounded-full px-3 py-1">
            <Sparkles className="size-3.5" aria-hidden="true" />
            YOUR NEXT ROLE STARTS HERE
          </Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Make your resume
            <span className="block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              work for you.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
            See how well your experience fits the role, uncover missing keywords, and get
            practical ways to stand out.
          </p>
        </section>

        <div className="mx-auto mb-8 grid max-w-3xl grid-cols-3 gap-2 sm:gap-4">
          {[
            { number: '01', title: 'Add your resume', done: Boolean(resumeText) },
            { number: '02', title: 'Add the job', done: Boolean(jobDescription.trim()) },
            { number: '03', title: 'Get your insights', done: Boolean(result) },
          ].map((step, index) => (
            <div className="relative flex items-center gap-2 sm:gap-3" key={step.number}>
              {index > 0 && (
                <span
                  className="absolute -left-2 top-1/2 hidden w-2 border-t border-dashed border-border sm:block"
                  aria-hidden="true"
                />
              )}
              <span
                className={`grid size-8 shrink-0 place-items-center rounded-full border text-xs font-semibold transition-colors ${
                  step.done
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground'
                }`}
              >
                {step.done ? <Check className="size-4" aria-hidden="true" /> : step.number}
              </span>
              <span
                className={`text-left text-[11px] font-medium sm:text-sm ${
                  step.done ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {step.title}
              </span>
            </div>
          ))}
        </div>

        <Card className="mx-auto max-w-5xl overflow-hidden border-border/70 shadow-xl shadow-primary/[0.04]">
          <CardHeader className="border-b bg-muted/20 px-5 py-5 sm:px-8 sm:py-6">
            <div className="flex items-start gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Target className="size-5" aria-hidden="true" />
              </span>
              <div className="space-y-1">
                <CardTitle className="text-lg sm:text-xl">Build your match report</CardTitle>
                <CardDescription>
                  Add a resume and the role you have in mind. We’ll take it from there.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-7">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor="pdf-upload" className="text-sm font-semibold">
                      <span className="inline-flex items-center gap-2">
                        <FileText className="size-4 text-primary" aria-hidden="true" />
                        Your resume
                      </span>
                    </label>
                    <Badge variant="outline" className="text-[11px] font-medium">
                      PDF · up to 5 MB
                    </Badge>
                  </div>

                  <label
                    htmlFor="pdf-upload"
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragActive(true);
                    }}
                    onDragLeave={() => setIsDragActive(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragActive(false);
                      const file = e.dataTransfer.files[0];
                      if (file) void handleFileChange(file);
                    }}
                    className={`flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${
                      isDragActive
                        ? 'border-primary bg-primary/5'
                        : resumeFile
                          ? 'border-primary/40 bg-primary/[0.03]'
                          : 'border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      id="pdf-upload"
                      type="file"
                      accept="application/pdf"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleFileChange(file);
                      }}
                    />
                    {pdfLoading ? (
                      <>
                        <span className="mb-3 grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
                          <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
                        </span>
                        <span className="text-sm font-semibold">Reading your resume…</span>
                        <span className="mt-1 text-xs text-muted-foreground">
                          Extracting text from your PDF
                        </span>
                      </>
                    ) : resumeFile ? (
                      <>
                        <span className="mb-3 grid size-12 place-items-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <Check className="size-5" aria-hidden="true" />
                        </span>
                        <span className="max-w-full truncate text-sm font-semibold">
                          {resumeFile.name}
                        </span>
                        <span className="mt-1 text-xs text-muted-foreground">
                          {(resumeFile.size / 1024).toFixed(1)} KB · Click to replace
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="mb-3 grid size-12 place-items-center rounded-full bg-background text-primary shadow-sm">
                          <FileUp className="size-5" aria-hidden="true" />
                        </span>
                        <span className="text-sm font-semibold">Drop your resume here</span>
                        <span className="mt-1 text-xs text-muted-foreground">
                          or <span className="font-medium text-primary">browse files</span>
                        </span>
                      </>
                    )}
                  </label>
                  <p className="text-xs leading-5 text-muted-foreground">
                    Upload a text-based PDF so we can accurately review your experience.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor="job-description" className="text-sm font-semibold">
                      <span className="inline-flex items-center gap-2">
                        <FileText className="size-4 text-primary" aria-hidden="true" />
                        Job description
                      </span>
                    </label>
                    <Badge variant="outline" className="text-[11px] font-medium">
                      Required
                    </Badge>
                  </div>
                  <Textarea
                    id="job-description"
                    placeholder="Paste the job description here… Include the responsibilities and qualifications for the best results."
                    className="min-h-52 resize-none rounded-xl bg-muted/20 p-4 leading-6 placeholder:text-muted-foreground/70 focus-visible:bg-background"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    required
                  />
                  <p className="text-xs leading-5 text-muted-foreground">
                    Tip: Include the full listing to get a more useful match report.
                  </p>
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="rounded-xl">
                  <TriangleAlert className="size-4" aria-hidden="true" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Separator />

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  <span>Your files are used to create this analysis.</span>
                </div>
                <Button
                  type="submit"
                  disabled={loading || pdfLoading || !isReady}
                  className="h-12 w-full gap-2 rounded-xl px-6 text-sm font-semibold shadow-md shadow-primary/15 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:translate-y-0 sm:w-auto"
                >
                  {loading ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                      Analyzing your fit…
                    </>
                  ) : (
                    <>
                      Analyze my resume
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {result && (
          <section className="mx-auto mt-14 max-w-5xl space-y-6" aria-labelledby="results-heading">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div className="space-y-2">
                <Badge variant="secondary" className="gap-1.5 rounded-full">
                  <Sparkles className="size-3.5" aria-hidden="true" />
                  YOUR PERSONALIZED REPORT
                </Badge>
                <h2 id="results-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Your role match
                </h2>
                <p className="text-sm text-muted-foreground">
                  A clear snapshot of where you stand and what to improve next.
                </p>
              </div>
              <Button variant="outline" onClick={resetAnalysis} className="gap-2 self-start sm:self-auto">
                <RotateCcw className="size-4" aria-hidden="true" />
                Start a new analysis
              </Button>
            </div>

            <Card className="overflow-hidden border-primary/15 shadow-lg shadow-primary/[0.04]">
              <div className="grid items-center gap-6 bg-gradient-to-br from-primary/[0.07] via-background to-background p-6 sm:grid-cols-[auto_1fr] sm:gap-9 sm:p-8">
                <div className="flex justify-center">
                  <ScoreRing score={result.matchScore} />
                </div>
                <div className="space-y-3 text-center sm:text-left">
                  <Badge variant="outline" className="rounded-full bg-background/80 px-3 py-1">
                    {result.matchScore >= 80
                      ? 'Strong match'
                      : result.matchScore >= 60
                        ? 'Good foundation'
                        : 'Room to improve'}
                  </Badge>
                  <h3 className="text-xl font-bold tracking-tight sm:text-2xl">
                    {result.matchScore >= 80
                      ? 'You look well aligned for this role.'
                      : result.matchScore >= 60
                        ? 'You have a solid starting point.'
                        : 'A few targeted edits can strengthen your fit.'}
                  </h3>
                  <p className="mx-auto max-w-xl text-sm leading-6 text-muted-foreground sm:mx-0">
                    Use the insights below to focus your resume on the experience and skills
                    this role is asking for.
                  </p>
                </div>
              </div>
            </Card>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  label: 'Keywords to add',
                  count: result.missingKeywords.length,
                  icon: Target,
                  description: 'Skills worth highlighting',
                },
                {
                  label: 'Ways to improve',
                  count: result.suggestions.length,
                  icon: Lightbulb,
                  description: 'Practical resume edits',
                },
                {
                  label: 'Interview prompts',
                  count: result.interviewQuestions.length,
                  icon: MessageSquareText,
                  description: 'Questions to prepare for',
                },
              ].map(({ label, count, icon: Icon, description }) => (
                <Card key={label} className="border-border/70 shadow-sm">
                  <CardContent className="flex items-center gap-4 p-5">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-2xl font-bold tracking-tight">{count}</p>
                      <p className="truncate text-sm font-medium">{label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <Card className="border-border/70 shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Target className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <CardTitle className="text-base">Keywords to highlight</CardTitle>
                      <CardDescription>Relevant terms that may be missing from your resume.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {result.missingKeywords.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {result.missingKeywords.map((keyword) => (
                        <Badge
                          key={keyword}
                          variant="secondary"
                          className="rounded-full border border-border/70 px-3 py-1 text-xs"
                        >
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="size-4 text-emerald-600" aria-hidden="true" />
                      No missing keywords found.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/70 shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <Lightbulb className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <CardTitle className="text-base">Make your resume stronger</CardTitle>
                      <CardDescription>Small, focused changes can make a big difference.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {result.suggestions.length > 0 ? (
                    <ul className="space-y-3">
                      {result.suggestions.map((suggestion, index) => (
                        <li key={`${index}-${suggestion}`} className="flex items-start gap-3 text-sm leading-6">
                          <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                            {index + 1}
                          </span>
                          <span className="text-muted-foreground">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No suggestions are available yet.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/70 shadow-sm lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                      <MessageSquareText className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <CardTitle className="text-base">Get interview-ready</CardTitle>
                      <CardDescription>Practice answering questions this role may bring up.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {result.interviewQuestions.length > 0 ? (
                    <ol className="grid gap-3 md:grid-cols-2">
                      {result.interviewQuestions.map((question, index) => (
                        <li
                          key={`${index}-${question}`}
                          className="flex items-start gap-3 rounded-xl border bg-muted/20 p-4 text-sm leading-6"
                        >
                          <Badge variant="outline" className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full p-0">
                            {index + 1}
                          </Badge>
                          <span>{question}</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-sm text-muted-foreground">No interview questions are available yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        <footer className="mx-auto mt-12 flex max-w-5xl items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          <span>Thoughtful feedback to help you take the next step in your career.</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
