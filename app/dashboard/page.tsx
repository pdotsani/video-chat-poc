import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ItemForm from '@/components/ItemForm'
import ItemList from '@/components/ItemList'
import SignOutButton from '@/components/SignOutButton'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const [{ data: items }, { data: profiles }] = await Promise.all([
    supabase
      .from('items')
      .select('*, creator:profiles!items_creator_id_fkey(full_name, email, avatar_url), recipient:profiles!items_recipient_id_fkey(full_name, email, avatar_url)')
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .neq('id', user.id)
      .order('full_name'),
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
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create a new item</h2>
          <ItemForm users={profiles ?? []} currentUserId={user.id} />
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your items</h2>
          <ItemList items={items ?? []} currentUserId={user.id} />
        </section>
      </main>
    </div>
  )
}
