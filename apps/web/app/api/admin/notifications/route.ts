import { NextResponse, type NextRequest } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/database'
import type { SendNotificationPayload } from '@/lib/types/admin/notifications/notifications.types'

type SchoolRow = { school_id: string | null }
type ScopedUserRow = { id?: string | null; user_id?: string | null; school_id: string | null }
type ScopedStudentRow = {
  id: string
  user_id: string | null
  full_name: string | null
  school_id: string | null
}
type ProfileRow = { id: string; full_name: string | null; email: string }

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing Supabase service role env vars.')
  }
  return createServiceClient<Database>(url, key, { auth: { persistSession: false } })
}

async function getLoggedInUserId() {
  const supabaseSession = await createServerClient()
  const { data: { user }, error } = await supabaseSession.auth.getUser()
  if (error || !user) {
    return null
  }
  return user.id
}

async function getUserSchoolId(
  supabase: ReturnType<typeof getServiceRoleClient>,
  userId: string,
) {
  const [adminResult, facultyResult, studentResult] = await Promise.all([
    supabase
      .from('admins')
      .select('school_id')
      .eq('user_id', userId)
      .maybeSingle()
      .overrideTypes<SchoolRow, { merge: false }>(),
    supabase
      .from('faculty')
      .select('school_id')
      .eq('user_id', userId)
      .maybeSingle()
      .overrideTypes<SchoolRow, { merge: false }>(),
    supabase
      .from('students')
      .select('school_id')
      .or(`id.eq.${userId},user_id.eq.${userId}`)
      .maybeSingle()
      .overrideTypes<SchoolRow, { merge: false }>(),
  ])

  return (
    adminResult.data?.school_id ??
    facultyResult.data?.school_id ??
    studentResult.data?.school_id ??
    null
  )
}

async function getScopedUserIds(
  supabase: ReturnType<typeof getServiceRoleClient>,
  schoolId: string,
) {
  const [studentsResult, facultyResult, adminsResult] = await Promise.all([
    supabase
      .from('students')
      .select('id,user_id,school_id')
      .eq('school_id', schoolId)
      .overrideTypes<ScopedUserRow[], { merge: false }>(),
    supabase
      .from('faculty')
      .select('user_id,school_id')
      .eq('school_id', schoolId)
      .overrideTypes<ScopedUserRow[], { merge: false }>(),
    supabase
      .from('admins')
      .select('user_id,school_id')
      .eq('school_id', schoolId)
      .overrideTypes<ScopedUserRow[], { merge: false }>(),
  ])

  const ids = new Set<string>()

  for (const row of studentsResult.data ?? []) {
    if (row.id) {
      ids.add(row.id)
    }
    if (row.user_id) {
      ids.add(row.user_id)
    }
  }

  for (const row of [...(facultyResult.data ?? []), ...(adminsResult.data ?? [])]) {
    if (row.user_id) {
      ids.add(row.user_id)
    }
  }

  return ids
}

async function getScopedStudentRecipients(
  supabase: ReturnType<typeof getServiceRoleClient>,
  schoolId: string,
) {
  const { data: students } = await supabase
    .from('students')
    .select('id,user_id,full_name,school_id')
    .eq('school_id', schoolId)
    .overrideTypes<ScopedStudentRow[], { merge: false }>()

  const profileIds = Array.from(
    new Set(
      (students ?? [])
        .flatMap((student) => [student.id, student.user_id])
        .filter((id): id is string => Boolean(id)),
    ),
  )

  const { data: profiles } = profileIds.length > 0
    ? await supabase
        .from('profiles')
        .select('id,full_name,email')
        .in('id', profileIds)
        .overrideTypes<ProfileRow[], { merge: false }>()
    : { data: [] as ProfileRow[] }

  const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]))

  return (students ?? []).map((student) => {
    const profile = profilesById.get(student.user_id ?? '') ?? profilesById.get(student.id)
    return {
      id: student.user_id ?? student.id,
      full_name: profile?.full_name ?? student.full_name,
      email: profile?.email ?? '',
      students: { id: student.id },
    }
  })
}

export async function GET() {
  try {
    const userId = await getLoggedInUserId()
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 })
    }

    const supabase = getServiceRoleClient()
    const schoolId = await getUserSchoolId(supabase, userId)
    if (!schoolId) {
      return NextResponse.json({ success: true, notifications: [], students: [] })
    }

    const scopedUserIds = await getScopedUserIds(supabase, schoolId)
    if (scopedUserIds.size === 0) {
      return NextResponse.json({ success: true, notifications: [], students: [] })
    }

    const [notificationsResult, students] = await Promise.all([
      supabase
        .from('notifications')
        .select('*')
        .in('user_id', Array.from(scopedUserIds))
        .order('created_at', { ascending: false }),
      getScopedStudentRecipients(supabase, schoolId),
    ])

    if (notificationsResult.error) {
      return NextResponse.json({ success: false, error: notificationsResult.error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, notifications: notificationsResult.data ?? [], students })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getLoggedInUserId()
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 })
    }

    const payload = (await req.json()) as SendNotificationPayload
    const title = payload.title?.trim() ?? ''
    const message = payload.message?.trim() ?? ''
    const recipientIds = Array.from(new Set(payload.recipientIds ?? []))

    if (!title || !message) {
      return NextResponse.json({ success: false, error: 'Title and message are required.' }, { status: 400 })
    }
    if (recipientIds.length === 0) {
      return NextResponse.json({ success: false, error: 'At least one recipient is required.' }, { status: 400 })
    }

    const supabase = getServiceRoleClient()
    const schoolId = await getUserSchoolId(supabase, userId)
    if (!schoolId) {
      return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 })
    }

    const scopedUserIds = await getScopedUserIds(supabase, schoolId)
    const hasOutOfScopeRecipient = recipientIds.some((id) => !scopedUserIds.has(id))
    if (hasOutOfScopeRecipient) {
      return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 })
    }

    const rows = recipientIds.map((uid) => ({
      user_id: uid,
      title,
      message,
      type: payload.type,
      is_read: false,
    }))

    const { error } = await supabase.from('notifications').insert(rows)
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
