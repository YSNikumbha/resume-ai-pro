import { Link } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'

function NotFound() {
  return (
    <main className="ai-page grid min-h-screen place-items-center px-5 py-10">
      <section className="glass-card glow-card ai-main w-full max-w-lg p-8 text-center">
        <div className="flex justify-center">
          <BrandLogo />
        </div>
        <p className="eyebrow mt-8">404</p>
        <h1 className="mt-3 text-3xl font-black text-white">Page not found</h1>
        <p className="mt-4 text-slate-400">
          The page you are looking for does not exist.
        </p>
        <Link
          to="/"
          className="primary-button mt-8 min-h-12 px-6"
        >
          Back to Home
        </Link>
      </section>
    </main>
  )
}

export default NotFound
