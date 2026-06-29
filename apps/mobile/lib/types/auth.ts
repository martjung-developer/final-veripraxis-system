// lib/types/auth.ts
// ─────────────────────────────────────────────────────────────────────────────
// Shared auth types. Keep in sync with web/lib/types/auth.ts.
// ─────────────────────────────────────────────────────────────────────────────

export type UserRole = 'student' | 'faculty' | 'admin'
export type SignupRole = UserRole

export interface Profile {
  id:         string
  email:      string
  full_name:  string | null
  role:       UserRole
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type AuthResult =
  | { success: true;  redirectTo?: string; emailConfirmationRequired?: boolean }
  | { success: false; error: string }

// ── Role metadata ─────────────────────────────────────────────────────────────

export const ROLE_LABELS: Record<UserRole, string> = {
  student: 'Student',
  faculty: 'Faculty',
  admin:   'Department Admin',
}

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  student: 'Access your exams, study materials, and academic progress.',
  faculty: 'Manage course content, exams, and student performance.',
  admin:   'Oversee programs, faculty, and institutional data.',
}

export const ROLE_ID_HINTS: Record<UserRole, string> = {
  student: 'YY-NNNN-NNN',
  faculty: 'PREFIX-NNNNN',
  admin:   'PREFIX-NNNNN',
}

// ── Routing ───────────────────────────────────────────────────────────────────

export function getDashboardByRole(role: string): string {
  switch (role) {
    case 'faculty':
    case 'admin':
      return '/(app)/admin/dashboard'
    default:
      return '/(app)/student/dashboard'
  }
}