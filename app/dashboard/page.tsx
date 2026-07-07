import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ItemForm from '@/components/ItemForm'
import CreateVideoChatForm from '@/components/CreateVideoChatForm'
import DashboardFeed from '@/components/DashboardFeed'
import SignOutButton from '@/components/SignOutButton'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const [{ data: items }, { data: profiles }, { data: videoChats }] = await Promise.all([
    supabase
      .from('items')
      .select('*, creator:profiles!items_creator_id_fkey(full_name, email, avatar_url), recipient:profiles!items_recipient_id_fkey(full_name, email, avatar_url)')
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .neq('id', user.id)
      .order('full_name'),
    supabase
      .from('video_chats')
      .select('id, title, creator_id, created_at')
      .order('created_at', { ascending: false }),
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user.user_metadata?.avatar_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.user_metadata.avatar_url}
                alt="avatar"
                className="w-8 h-8 rounded-full"
              />
            )}
            <div>
              <p className="font-semibold text-gray-900 leading-tight">
                {user.user_metadata?.full_name ?? user.email}
              </p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        <div className="grid sm:grid-cols-2 gap-4">
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">Create an item</h2>
            <ItemForm users={profiles ?? []} currentUserId={user.id} />
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">Start a video chat</h2>
            <CreateVideoChatForm currentUserId={user.id} />
          </section>
        </div>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Your feed</h2>
          <DashboardFeed
            items={items ?? []}
            videoChats={videoChats ?? []}
            currentUserId={user.id}
          />
        </section>
      </main>
    </div>
  )
}
