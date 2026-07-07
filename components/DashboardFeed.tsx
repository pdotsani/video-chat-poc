import Link from 'next/link'
import DeleteVideoChatButton from './DeleteVideoChatButton'

type Profile = {
  full_name: string | null
  email: string | null
  avatar_url: string | null
}

type Item = {
  id: string
  content: string
  creator_id: string
  recipient_id: string
  creator: Profile | null
  recipient: Profile | null
  created_at: string
}

type VideoChat = {
  id: string
  title: string
  creator_id: string
  created_at: string
}

type Props = {
  items: Item[]
  videoChats: VideoChat[]
  currentUserId: string
}

type FeedEntry =
  | { kind: 'item' } & Item
  | { kind: 'video_chat' } & VideoChat

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function displayName(profile: Profile | null) {
  return profile?.full_name ?? profile?.email ?? 'Unknown'
}

export default function DashboardFeed({ items, videoChats, currentUserId }: Props) {
  const feed: FeedEntry[] = [
    ...items.map(i => ({ kind: 'item' as const, ...i })),
    ...videoChats.map(v => ({ kind: 'video_chat' as const, ...v })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  if (feed.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-8">
        Nothing here yet. Create an item or start a video chat above.
      </p>
    )
  }

  return (
    <ul className="space-y-3">
      {feed.map(entry => {
        if (entry.kind === 'video_chat') {
          const isMine = entry.creator_id === currentUserId
          return (
            <li key={`vc-${entry.id}`} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex-shrink-0 w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{entry.title}</p>
                    <time className="text-xs text-gray-400">{formatDate(entry.created_at)}</time>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                    Video chat
                  </span>
                  <Link
                    href={`/video/${entry.id}`}
                    className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Join
                  </Link>
                  {isMine && <DeleteVideoChatButton id={entry.id} />}
                </div>
              </div>
            </li>
          )
        }

        // item
        const isMine = entry.creator_id === currentUserId
        return (
          <li key={`item-${entry.id}`} className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-gray-900 text-sm leading-relaxed mb-3">{entry.content}</p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-3">
                {isMine ? (
                  <span>
                    Shared with{' '}
                    <span className="font-medium text-gray-700">{displayName(entry.recipient)}</span>
                  </span>
                ) : (
                  <span>
                    From{' '}
                    <span className="font-medium text-gray-700">{displayName(entry.creator)}</span>
                  </span>
                )}
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  isMine ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                }`}>
                  {isMine ? 'Created by you' : 'Shared with you'}
                </span>
              </div>
              <time className="text-gray-400">{formatDate(entry.created_at)}</time>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
