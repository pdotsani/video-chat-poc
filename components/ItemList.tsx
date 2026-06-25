type Profile = {
  full_name: string | null
  email: string | null
  avatar_url: string | null
}

type Item = {
  id: string
  content: string
  created_at: string
  creator_id: string
  recipient_id: string
  creator: Profile | null
  recipient: Profile | null
}

type Props = {
  items: Item[]
  currentUserId: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function displayName(profile: Profile | null) {
  return profile?.full_name ?? profile?.email ?? 'Unknown'
}

export default function ItemList({ items, currentUserId }: Props) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-8">
        No items yet. Create one above to get started.
      </p>
    )
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const isMine = item.creator_id === currentUserId
        return (
          <li
            key={item.id}
            className="bg-white border border-gray-200 rounded-xl p-5"
          >
            <p className="text-gray-900 text-sm leading-relaxed mb-3">{item.content}</p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-3">
                {isMine ? (
                  <span>
                    Shared with <span className="font-medium text-gray-700">{displayName(item.recipient)}</span>
                  </span>
                ) : (
                  <span>
                    From <span className="font-medium text-gray-700">{displayName(item.creator)}</span>
                  </span>
                )}
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    isMine
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {isMine ? 'Created by you' : 'Shared with you'}
                </span>
              </div>
              <time className="text-gray-400">{formatDate(item.created_at)}</time>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
