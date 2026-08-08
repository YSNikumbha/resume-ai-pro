import { Link } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
import useAuth from '../hooks/useAuth'

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'AI Analysis', href: '#ai-analysis' },
  { label: 'Job Matching', href: '#job-matching' },
  { label: 'Resume Chat', href: '#resume-chat' },
]

const techBadges = [
  'Java',
  'Spring Boot',
  'React',
  'PostgreSQL',
  'Gemini',
  'Spring AI',
  'pgvector',
  'RAG',
]

const features = [
  {
    icon: 'AI',
    title: 'AI Resume Analysis',
    description:
      'Extract structured insights from your resume and turn raw experience into clear improvement areas.',
  },
  {
    icon: 'JM',
    title: 'Job Match Intelligence',
    description:
      'Compare your resume against real job descriptions and see exactly where you align or fall short.',
  },
  {
    icon: 'ATS',
    title: 'ATS Resume Score',
    description:
      'Measure resume readiness with a practical score that highlights keyword and content gaps.',
  },
  {
    icon: 'RAG',
    title: 'Resume Chat with RAG',
    description:
      'Ask questions grounded directly in indexed resume content and review compact source citations.',
  },
]

const workflowSteps = [
  {
    number: '01',
    title: 'Upload Resume',
    description: 'Add a text-based PDF and create your secure resume workspace.',
  },
  {
    number: '02',
    title: 'Analyze with AI',
    description: 'Generate ATS insights, skills, strengths, and improvements.',
  },
  {
    number: '03',
    title: 'Match to Jobs',
    description: 'Compare your resume against a target role and requirements.',
  },
  {
    number: '04',
    title: 'Ask Your Resume',
    description: 'Use RAG chat to ask questions grounded in resume sections.',
  },
]

function Landing() {
  const { isAuthenticated } = useAuth()
  const signedIn = isAuthenticated()
  const primaryTo = signedIn ? '/resumes/upload' : '/register'

  return (
    <div className="ai-page">
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#070b14]/80 backdrop-blur-xl">
        <nav className="page-shell flex min-h-16 items-center justify-between gap-4">
          <BrandLogo />

          <div className="hidden items-center gap-1 lg:flex" aria-label="Landing navigation">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-xl px-3 py-2 text-sm font-bold text-slate-400 transition hover:bg-white/5 hover:text-white focus:outline-none focus:ring-4 focus:ring-cyan-300/20"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {signedIn ? (
              <Link to="/dashboard" className="secondary-button min-h-10 px-4 py-2">
                Dashboard
              </Link>
            ) : (
              <Link to="/login" className="ghost-button min-h-10 px-4 py-2">
                Login
              </Link>
            )}
            <Link to={primaryTo} className="primary-button min-h-10 px-4 py-2">
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      <main className="ai-main">
        <section className="border-b border-slate-800/80">
          <div className="page-shell grid gap-12 py-16 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:py-20">
            <div className="page-enter">
              <span className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-cyan-100">
                AI-Powered Resume Intelligence
              </span>
              <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.08] text-white sm:text-5xl">
                Understand Your Resume.
                <br />
                Match Better Jobs.
                <br />
                <span className="gradient-text">Prepare Smarter.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                ResumeAI Pro analyzes your resume, scores it for ATS readiness,
                compares it with job descriptions, and lets you ask questions
                using retrieval-augmented generation.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to={primaryTo} className="primary-button min-h-12 px-6">
                  Analyze My Resume
                </Link>
                <a href="#how-it-works" className="secondary-button min-h-12 px-6">
                  See How It Works
                </a>
              </div>
              <p className="mt-5 text-sm font-semibold text-slate-500">
                PDF analysis • ATS insights • Job matching • RAG-powered resume chat
              </p>
            </div>

            <ProductPreview />
          </div>
        </section>

        <section className="border-b border-slate-800/80 bg-slate-950/30">
          <div className="page-shell py-8">
            <p className="text-center text-sm font-bold text-slate-500">
              Built with modern full-stack and AI technologies
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {techBadges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-slate-700/70 bg-slate-900/70 px-3 py-1.5 text-xs font-black text-slate-300"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="professional-section">
          <div className="page-shell">
            <SectionIntro
              eyebrow="Core features"
              title="Turn resume data into actionable insights."
              description="A focused product surface for the workflows that matter most: analysis, matching, scoring, and grounded resume chat."
            />
            <div className="mt-10 grid gap-5 lg:grid-cols-2">
              {features.map((feature) => (
                <article key={feature.title} className="glass-card hover-lift p-6">
                  <div className="flex items-start gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-cyan-300/20 bg-slate-950/70 text-xs font-black text-cyan-100">
                      {feature.icon}
                    </span>
                    <div>
                      <h3 className="text-lg font-black text-white">{feature.title}</h3>
                      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                        {feature.description}
                      </p>
                      <span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-cyan-100">
                        Learn more <span aria-hidden="true">-&gt;</span>
                      </span>
                    </div>
                  </div>
                  <div className="mt-5 h-1.5 rounded-full bg-slate-800">
                    <div className="h-full w-1/2 rounded-full bg-cyan-300/70" />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="professional-section border-y border-slate-800/80 bg-slate-950/40">
          <div className="page-shell">
            <SectionIntro
              eyebrow="Product workflow"
              title="A simple path from resume upload to better preparation."
              description="ResumeAI Pro keeps the flow focused so each AI result leads naturally to the next decision."
            />
            <div className="mt-10 grid gap-5 lg:grid-cols-4">
              {workflowSteps.map((step, index) => (
                <article key={step.number} className="relative rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                  {index < workflowSteps.length - 1 ? (
                    <span className="absolute left-[calc(50%+1.5rem)] top-9 hidden h-px w-[calc(100%-3rem)] bg-slate-700 lg:block" />
                  ) : null}
                  <span className="relative z-10 inline-flex rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-100">
                    {step.number}
                  </span>
                  <h3 className="mt-5 font-black text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="ai-analysis" className="professional-section">
          <div className="page-shell grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <p className="eyebrow">AI Analysis</p>
              <h2 className="mt-3 text-3xl font-black text-white">
                Understand what your resume communicates before recruiters do.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-400">
                Convert resume content into a structured report with ATS scoring,
                strengths, weaknesses, and recommendations that are easy to act on.
              </p>
            </div>
            <AnalysisShowcase />
          </div>
        </section>

        <section id="job-matching" className="professional-section border-y border-slate-800/80 bg-slate-950/40">
          <div className="page-shell grid gap-10 lg:grid-cols-[1.12fr_0.88fr] lg:items-center">
            <JobMatchShowcase />
            <div>
              <p className="eyebrow">Job Matching</p>
              <h2 className="mt-3 text-3xl font-black text-white">
                Compare your resume against real job requirements.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-400">
                Identify matched skills, missing keywords, alignment gaps, and
                targeted resume changes before applying.
              </p>
            </div>
          </div>
        </section>

        <section id="resume-chat" className="professional-section">
          <div className="page-shell grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="eyebrow">Resume Chat</p>
              <h2 className="mt-3 text-3xl font-black text-white">
                Ask questions grounded directly in your resume.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-400">
                Retrieval-augmented answers make resume review more specific,
                because each response is connected to indexed resume sections.
              </p>
            </div>
            <ChatShowcase />
          </div>
        </section>

        <section className="px-5 py-16 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-5xl rounded-2xl border border-cyan-300/20 bg-slate-900/70 p-8 text-center shadow-2xl shadow-slate-950/30 sm:p-10">
            <p className="eyebrow">Start now</p>
            <h2 className="mt-3 text-3xl font-black text-white">
              Turn your resume into actionable career intelligence.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              Upload your resume and get AI-powered insights in minutes.
            </p>
            <Link to={primaryTo} className="primary-button mt-7 min-h-12 px-6">
              Get Started Free
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

function ProductPreview() {
  return (
    <div className="glass-card page-enter p-5">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <p className="text-sm font-black text-white">Resume Analysis</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Yash_Nikumbha_Resume.pdf
          </p>
        </div>
        <span className="status-pill status-green">Complete</span>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
            ATS Score
          </p>
          <div className="score-ring mt-5 grid aspect-square place-items-center rounded-full bg-[conic-gradient(#22d3ee_0deg,#6366f1_302deg,rgba(148,163,184,0.14)_302deg)] p-2">
            <div className="grid h-full w-full place-items-center rounded-full bg-slate-950 text-center">
              <div>
                <p className="text-5xl font-black text-white">84</p>
                <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  Ready
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
              Top Skills
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {['Java', 'Spring Boot', 'React', 'PostgreSQL'].map((skill) => (
                <span key={skill} className="skill-pill cyan-pill">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                Job Match
              </p>
              <p className="text-2xl font-black text-white">78%</p>
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate-800">
              <div className="h-full w-[78%] rounded-full bg-cyan-300" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="rounded-2xl bg-indigo-500/18 px-4 py-3 text-sm font-semibold text-white">
              What backend skills are in my resume?
            </p>
            <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm leading-6 text-slate-300">
              Your resume highlights Java, Spring Boot, REST APIs...
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function SectionIntro({ description, eyebrow, title }) {
  return (
    <div className="max-w-3xl">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="section-title mt-3 text-3xl sm:text-4xl">{title}</h2>
      <p className="mt-4 text-sm leading-7 text-slate-400">{description}</p>
    </div>
  )
}

function AnalysisShowcase() {
  return (
    <article className="glass-card p-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-center">
        <div className="grid h-36 w-36 shrink-0 place-items-center rounded-full bg-[conic-gradient(#22d3ee_0deg,#6366f1_302deg,rgba(148,163,184,0.14)_302deg)] p-2">
          <div className="grid h-full w-full place-items-center rounded-full bg-slate-950 text-center">
            <div>
              <p className="text-4xl font-black text-white">84</p>
              <p className="text-xs font-black text-slate-500">ATS Score</p>
            </div>
          </div>
        </div>
        <div className="grid flex-1 gap-4 md:grid-cols-2">
          <OutputList
            title="Strengths"
            tone="green"
            items={['Strong Java backend experience', 'Good project coverage']}
          />
          <OutputList
            title="Suggestions"
            tone="cyan"
            items={['Add measurable outcomes', 'Improve summary keywords']}
          />
        </div>
      </div>
    </article>
  )
}

function JobMatchShowcase() {
  return (
    <article className="glass-card p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xl font-black text-white">Java Full Stack Developer</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">Match report</p>
        </div>
        <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-5 py-4 text-center">
          <p className="text-3xl font-black text-white">81%</p>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-200">
            Match Score
          </p>
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <PillGroup title="Matched" tone="green" items={['Java', 'Spring Boot', 'React', 'SQL']} />
        <PillGroup title="Missing" tone="amber" items={['Docker', 'AWS']} />
      </div>
      <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-100">
          Recommendation
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Add deployment experience and cloud keywords.
        </p>
      </div>
    </article>
  )
}

function ChatShowcase() {
  return (
    <article className="glass-card p-6">
      <div className="ml-auto max-w-[82%] rounded-2xl bg-indigo-500/20 px-4 py-3 text-sm font-semibold text-white">
        Which projects demonstrate Spring Boot experience?
      </div>
      <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
        <p className="text-sm leading-7 text-slate-300">
          Your ResumeAI Pro project uses Spring Boot for authentication, resume
          processing, AI analysis, and RAG APIs.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="status-pill status-cyan">Source 1 - Projects</span>
          <span className="status-pill status-slate">Source 2 - Technical Skills</span>
        </div>
      </div>
      <p className="mt-4 text-xs font-semibold text-slate-500">
        Answers are grounded in indexed resume content.
      </p>
    </article>
  )
}

function OutputList({ items, title, tone }) {
  const bulletClass = tone === 'green' ? 'bg-emerald-400' : 'bg-cyan-300'

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
      <h3 className="font-black text-white">{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-6 text-slate-300">
            <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${bulletClass}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function PillGroup({ items, title, tone }) {
  const pillClass = tone === 'green' ? 'success-pill' : 'warning-pill'

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
        {title}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className={`skill-pill ${pillClass}`}>
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function Footer() {
  return (
    <footer className="ai-main border-t border-slate-800/80 bg-slate-950/60">
      <div className="page-shell grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          <BrandLogo />
          <p className="mt-4 max-w-sm text-sm leading-6 text-slate-500">
            ResumeAI Pro — AI-powered resume intelligence.
          </p>
        </div>
        <FooterColumn title="Product" items={['Resume Analysis', 'Job Matching', 'Resume Chat']} />
        <FooterColumn title="Resources" items={['How It Works', 'Privacy', 'Documentation']} />
        <FooterColumn title="Technology" items={['Spring Boot', 'React', 'Gemini', 'pgvector']} />
      </div>
      <div className="border-t border-slate-800/80">
        <div className="page-shell py-5 text-sm font-semibold text-slate-500">
          ResumeAI Pro — AI-powered resume intelligence.
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ items, title }) {
  return (
    <div>
      <h3 className="text-sm font-black text-white">{title}</h3>
      <ul className="mt-4 space-y-3 text-sm text-slate-500">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

export default Landing
