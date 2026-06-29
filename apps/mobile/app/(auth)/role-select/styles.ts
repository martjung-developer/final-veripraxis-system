// app/mobile/app/(auth)/role-select/styles.ts
import { StyleSheet } from 'react-native'

import { authColors, authFonts, authRadii, authShadows, authSpacing } from '@/constants/tokens'

export default StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: authColors.pageBg,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: authSpacing.page,
  },

  dotLayer: {
    bottom: 0,
    left: 0,
    opacity: 0.50,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  dot: {
    backgroundColor: authColors.cerulean,
    borderRadius: 2,
    height: 3,
    position: 'absolute',
    width: 3,
  },

  // ── Page shell ───────────────────────────────────────────────────────────────
  shell: {
    alignSelf: 'center',
    maxWidth: 760,
    width: '100%',
  },

  // ── Header ───────────────────────────────────────────────────────────────────
  header: {
    alignItems: 'center',
    paddingBottom: 26,
  },
  logo: {
    height: 64,
    width: 190,
  },
  heading: {
    color: authColors.navy,
    fontFamily: authFonts.heading,
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 35,
    paddingTop: 10,
    textAlign: 'center',
  },
  subtitle: {
    color: authColors.mutedBlue,
    fontFamily: authFonts.body,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22,
    paddingTop: 8,
    textAlign: 'center',
  },

  // ── Card stack ───────────────────────────────────────────────────────────────
  cardStack: {
    gap: 12,
    width: '100%',
  },

  // Wrapper that carries the entrance animation (opacity + translateY).
  // Kept separate from the card itself so the press scale doesn't fight
  // the entrance interpolation.
  cardEntranceWrapper: {
    width: '100%',
  },

  // ── Role card ────────────────────────────────────────────────────────────────
  roleCard: {
    ...authShadows.roleCard,
    alignItems: 'center',
    backgroundColor: authColors.cardBg,
    borderColor: authColors.cardBorder,
    borderRadius: authRadii.roleCard,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 16,
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingVertical: 18,
    width: '100%',
  },
  roleCardStudentActive: {
    borderColor: authColors.borderBlueStrong,
  },
  roleCardFacultyActive: {
    borderColor: authColors.facultyBorder,
  },
  roleCardAdminActive: {
    borderColor: authColors.adminBorder,
  },

  // ── Icon wrap ────────────────────────────────────────────────────────────────
  iconWrap: {
    alignItems: 'center',
    backgroundColor: authColors.inputBgStrong,
    borderColor: authColors.borderBlue,
    borderRadius: authRadii.icon,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  iconWrapStudentActive: {
    backgroundColor: authColors.studentTint,
    borderColor: authColors.studentBorder,
  },
  iconWrapFacultyActive: {
    backgroundColor: authColors.facultyTint,
    borderColor: authColors.facultyBorder,
  },
  iconWrapAdminActive: {
    backgroundColor: authColors.adminTint,
    borderColor: authColors.adminBorder,
  },

  // ── Card copy ────────────────────────────────────────────────────────────────
  roleCopy: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    color: authColors.navy,
    fontFamily: authFonts.heading,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 19,
  },
  cardTitleStudentActive: {
    color: authColors.studentDark,
  },
  cardTitleFacultyActive: {
    color: authColors.facultyDark,
  },
  cardTitleAdminActive: {
    color: authColors.adminDark,
  },
  cardText: {
    color: authColors.mutedBlue,
    fontFamily: authFonts.body,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
  },

  // ── Card right (pill + chevron) ───────────────────────────────────────────────
  cardRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  formatPill: {
    backgroundColor: authColors.inputBgStrong,
    borderColor: authColors.borderBlue,
    borderRadius: authRadii.badge,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  formatPillStudentActive: {
    backgroundColor: authColors.studentSoft,
    borderColor: authColors.studentBorder,
  },
  formatPillFacultyActive: {
    backgroundColor: authColors.facultySoft,
    borderColor: authColors.facultyBorder,
  },
  formatPillAdminActive: {
    backgroundColor: authColors.adminSoft,
    borderColor: authColors.adminBorder,
  },
  formatText: {
    color: authColors.softMutedBlue,
    fontFamily: authFonts.mono,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  formatTextStudentActive: {
    color: authColors.studentDark,
  },
  formatTextFacultyActive: {
    color: authColors.facultyDark,
  },
  formatTextAdminActive: {
    color: authColors.adminDark,
  },

  // ── Footer ───────────────────────────────────────────────────────────────────
  footerLink: {
    alignItems: 'center',
    paddingTop: 22,
  },
  footerText: {
    color: authColors.softMutedBlue,
    fontFamily: authFonts.body,
    fontSize: 14,
  },
  footerTextStrong: {
    color: authColors.skyBlue,
    fontWeight: '700',
  },

  // ── Kept for backwards compat (no longer used by DotGridBackground) ───────────
  backLink: {
    alignSelf: 'flex-start',
    paddingBottom: 18,
  },
  backLinkText: {
    color: authColors.mutedBlue,
    fontFamily: authFonts.body,
    fontSize: 13,
    fontWeight: '600',
  },
})