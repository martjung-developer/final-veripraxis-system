// lib/utils/auth.ts
// ─────────────────────────────────────────────────────────────────────────────
// Pure functions — no React, no side-effects.
// Mirrors the web detectRoleFromId / validateLoginId utilities.
// ─────────────────────────────────────────────────────────────────────────────
import type { UserRole } from '@/lib/types/auth'

// ── ID patterns ───────────────────────────────────────────────────────────────

const STUDENT_ID_RE = /^\d{2}-\d{4}-\d{3}$/
const STAFF_ID_RE   = /^[A-Z]+-\d+$/

// ── normaliseId ───────────────────────────────────────────────────────────────
// Strips extra spaces; upper-cases letter segments for staff IDs.

export function normaliseId(raw: string): string {
  return raw.trim().replace(/\s+/g, '')
}

// ── detectRoleFromId ──────────────────────────────────────────────────────────

export function detectRoleFromId(raw: string): UserRole | null {
  const id = normaliseId(raw)
  if (!id) { return null }
  if (STUDENT_ID_RE.test(id)) { return 'student' }
  if (STAFF_ID_RE.test(id.toUpperCase())) { return 'faculty' } // staff prefix unknown client-side
  return null
}

// ── getStaffPrefix ────────────────────────────────────────────────────────────

export function getStaffPrefix(raw: string): string | null {
  const id = normaliseId(raw).toUpperCase()
  const match = id.match(/^([A-Z]+)-/)
  return match ? match[1] : null
}

// ── validateLoginId ───────────────────────────────────────────────────────────
// Returns an error string or null.

export function validateLoginId(raw: string): string | null {
  const id = normaliseId(raw)
  if (!id) { return 'ID is required.' }
  const role = detectRoleFromId(id)
  if (!role) { return 'Enter a valid ID (e.g. 23-0249-605 or SBIT-16113).' }
  return null
}

// ── Pre-resolve badge label ───────────────────────────────────────────────────

export function getPreResolveBadgeLabel(userId: string): string | null {
  const role = detectRoleFromId(userId)
  if (!role) { return null }
  if (role === 'student') { return 'Student' }
  const prefix = getStaffPrefix(userId)
  return prefix ? `Staff (${prefix})` : 'Staff'
}

// ── isValidRole ───────────────────────────────────────────────────────────────

export function isValidRole(v: string | null | undefined): v is UserRole {
  return v === 'student' || v === 'faculty' || v === 'admin'
}

// ── extractErrorMessage ───────────────────────────────────────────────────────

export function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) { return err.message }
  if (typeof err === 'string') { return err }
  return 'An unexpected error occurred.'
}

// ── getPasswordStrength ───────────────────────────────────────────────────────

export type PasswordStrength = 'weak' | 'fair' | 'strong' | 'very-strong'

export function getPasswordStrength(password: string): {
  score:    number          
  label:    PasswordStrength
  color:    string
} {
  if (!password) { return { score: 0, label: 'weak',        color: '#ef4444' } }
  let score = 0
  if (password.length >= 8)                         { score++ }
  if (password.length >= 12)                        { score++ }
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) { score++ }
  if (/\d/.test(password))                          { score++ }
  if (/[^A-Za-z0-9]/.test(password))               { score++ }
  score = Math.min(score, 4)

  const map: Array<{ label: PasswordStrength; color: string }> = [
    { label: 'weak',        color: '#ef4444' },
    { label: 'weak',        color: '#ef4444' },
    { label: 'fair',        color: '#f59e0b' },
    { label: 'strong',      color: '#22c55e' },
    { label: 'very-strong', color: '#16a34a' },
  ]
  return { score, ...map[score] }
}