import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import VideoRoom from '@/components/VideoRoom'

type Props = {
  params: Promise<{ roomId: string }>
}

export default async function VideoPage({ params }: Props) {
  const { roomId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: room } = await supabase
    .from('video_chats')
    .select('id, title')
    .eq('id', roomId)
    .single()

  if (!room) redirect('/dashboard')

  return <VideoRoom roomId={room.id} userId={user.id} title={room.title} />
}
