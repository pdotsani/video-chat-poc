import { Suspense } from 'react'
import LoginPage from '@/components/LoginPage'

export default function Home() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Shared Lists</h1>
            <p className="mt-3 text-lg text-gray-600">
              Create list items and share each one privately with a specific person.
            </p>
          </div>
          <div className="w-full h-12 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </main>
    }>
      <LoginPage />
    </Suspense>
  )
}
