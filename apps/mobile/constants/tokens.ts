// app/mobile/constants/tokens.ts
import type { ViewStyle } from 'react-native'

export const authColors = {
  navy: '#0f2a5e',
  cerulean: '#1c54a4',
  skyBlue: '#3085d8',
  lightBlue: '#61b0f0',
  mutedBlue: '#5a7aaa',
  softMutedBlue: '#8aaac8',
  pageBg: '#F8FAFF',
  white: '#FFFFFF',
  cardBg: 'rgba(255, 255, 255, 0.78)',
  cardBorder: 'rgba(255, 255, 255, 0.92)',
  inputBg: 'rgba(240, 247, 255, 0.80)',
  inputBgStrong: 'rgba(240, 247, 255, 0.90)',
  inputFocusBg: 'rgba(255, 255, 255, 0.96)',
  borderBlue: 'rgba(48, 133, 216, 0.22)',
  borderBlueStrong: 'rgba(48, 133, 216, 0.50)',
  dividerBlue: 'rgba(48, 133, 216, 0.16)',
  focusRingBlue: 'rgba(48, 133, 216, 0.14)',
  studentDark: '#1c54a4',
  student: '#3085d8',
  studentLight: '#61b0f0',
  studentTint: 'rgba(28, 84, 164, 0.10)',
  studentBorder: 'rgba(28, 84, 164, 0.28)',
  studentSoft: 'rgba(28, 84, 164, 0.08)',
  facultyDark: '#15803d',
  faculty: '#22c55e',
  facultyLight: '#86efac',
  facultyTint: 'rgba(21, 128, 61, 0.10)',
  facultyBorder: 'rgba(21, 128, 61, 0.28)',
  facultySoft: 'rgba(21, 128, 61, 0.08)',
  adminDark: '#a16207',
  admin: '#d97706',
  adminLight: '#fcd34d',
  adminTint: 'rgba(161, 98, 7, 0.10)',
  adminBorder: 'rgba(161, 98, 7, 0.28)',
  adminSoft: 'rgba(161, 98, 7, 0.08)',
  success: '#2ca87a',
  successDark: '#15803d',
  successBg: '#f0fdf4',
  successBorder: '#bbf7d0',
  danger: '#c0392b',
  dangerBg: '#fff2f2',
  dangerBorder: '#f5c0c0',
  warning: '#e8b84b',
  weak: '#e07070',
  strengthTrack: '#d8e8f5',
  facebook: '#1877f2',
  google: '#EA4335',
  slateLight: '#c0d8ee',
}

export const authFonts = {
  heading: 'PlusJakartaSans',
  body: 'DMSans',
  mono: 'Courier New',
}

export const authRadii = {
  card: 22,
  roleCard: 16,
  input: 12,
  icon: 11,
  badge: 20,
  error: 10,
}

export const authSpacing = {
  page: 24,
  cardX: 22,
  cardTop: 34,
  cardBottom: 24,
  fieldGap: 14,
}

export const authShadows = {
  card: {
    shadowColor: '#1e50a0',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 8,
  } satisfies ViewStyle,
  roleCard: {
    shadowColor: '#1e50a0',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 5,
  } satisfies ViewStyle,
  button: {
    shadowColor: '#1c54a4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 4,
  } satisfies ViewStyle,
  social: {
    shadowColor: '#1e50a0',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  } satisfies ViewStyle,
}

export const authGradientColors = {
  default: [
    authColors.cerulean,
    authColors.skyBlue,
    authColors.lightBlue,
    authColors.skyBlue,
    authColors.cerulean,
  ] as const,
  student: [
    authColors.studentDark,
    authColors.student,
    authColors.studentLight,
    authColors.student,
    authColors.studentDark,
  ] as const,
  faculty: [
    authColors.facultyDark,
    authColors.faculty,
    authColors.facultyLight,
    authColors.faculty,
    authColors.facultyDark,
  ] as const,
  admin: [
    authColors.adminDark,
    authColors.admin,
    authColors.adminLight,
    authColors.admin,
    authColors.adminDark,
  ] as const,
}
