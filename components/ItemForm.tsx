'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Profile = {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
}

type Props = {
  users: Profile[]
  currentUserId: string
}

export default function ItemForm({ users, currentUserId }: Props) {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [recipientId, setRecipientId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || !recipientId) return

    setSubmitting(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.from('items').insert({
      content: content.trim(),
      creator_id: currentUserId,
      recipient_id: recipientId,
    })

    if (error) {
      setError('Failed to create item. Please try again.')
    } else {
      setContent('')
      setRecipientId('')
      router.refresh()
    }

    setSubmitting(false)
  }

  if (users.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
        No other users have signed in yet. Share the app link so someone else can log in, then you can create shared items.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1.5">
          Item content
        </label>
        <textarea
          id="content"
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write something..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          required
        />
      </div>

      <div>
        <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-1.5">
          Visible to
        </label>
        <select
          id="recipient"
          value={recipientId}
          onChange={(e) => setRecipientId(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          required
        >
          <option value="">Select a user...</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.full_name ?? u.email ?? u.id}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting || !content.trim() || !recipientId}
        className="w-full bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? 'Creating...' : 'Create item'}
      </button>
    </form>
  )
}
