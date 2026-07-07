'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Props = {
  currentUserId: string
}

export default function CreateVideoChatForm({ currentUserId }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error } = await supabase
      .from('video_chats')
      .insert({ title: title.trim() || 'Video Chat', creator_id: currentUserId })
      .select('id')
      .single()

    if (error || !data) {
      setError('Failed to create video chat. Please try again.')
      setLoading(false)
      return
    }

    router.push(`/video/${data.id}`)
  }

  return (
    <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <div>
        <label htmlFor="chat-title" className="block text-sm font-medium text-gray-700 mb-1.5">
          Room name <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          id="chat-title"
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Video Chat"
          maxLength={80}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
        </svg>
        {loading ? 'Starting…' : 'Start Video Chat'}
      </button>
    </form>
  )
}
