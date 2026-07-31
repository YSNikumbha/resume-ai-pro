import { Link } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'

function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-blue-50 px-5 py-10 text-slate-950">
      <section className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-8 text-center shadow-xl shadow-blue-900/10">
        <div className="flex justify-center">
          <BrandLogo />
        </div>
        <p className="mt-8 text-sm font-semibold text-blue-700">404</p>
        <h1 className="mt-3 text-3xl font-bold">Page not found</h1>
        <p className="mt-4 text-slate-600">
          The page you are looking for does not exist.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex min-h-12 items-center justify-center rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm shadow-blue-900/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
        >
          Back to home
        </Link>
      </section>
    </main>
  )
}

export default NotFound
