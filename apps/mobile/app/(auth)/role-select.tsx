// app/mobile/app/(auth)/role-select.tsx
import { useEffect, useMemo, useRef } from 'react'
import {
  Animated,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native'

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

import { authColors } from '@/constants/tokens'
import {
  AnimatedTopBar,
  AnimatedTouchableOpacity,
  useCardPressAnimation,
  useDotGridRipple,
  useStaggerEntrance,
} from '@/lib/animations/authAnimations'
import styles from './role-select/styles'

const logo = require('@/assets/images/veripraxislogo-title.png')

type Role = 'student' | 'faculty' | 'admin'

type RoleCardProps = {
  description: string
  entranceStyle: ReturnType<ReturnType<typeof useStaggerEntrance>['getItemStyle']>
  format: string
  icon: 'school' | 'book-open-page-variant-outline' | 'shield-check-outline'
  onPress: () => void
  role: Role
  title: string
}

const roleColors: Record<Role, string> = {
  admin:   authColors.adminDark,
  faculty: authColors.facultyDark,
  student: authColors.studentDark,
}

// ── Total stagger items: 1 header block + 3 cards + 1 footer = 5 ──────────────
const STAGGER_COUNT = 5

export default function RoleSelectScreen() {
  const { getItemStyle } = useStaggerEntrance({
    count:      STAGGER_COUNT,
    staggerMs:  90,
    delayMs:    60,
    translateY: 16,
    durationMs: 400,
  })

  return (
    <SafeAreaView style={styles.safeArea}>
      <DotGridBackground />
      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.shell}>

          {/* ── Header block (logo + title + subtitle) ── */}
          <Animated.View style={[styles.header, { alignItems: 'center' }, getItemStyle(0)]}>
            <Image source={logo} style={styles.logo} resizeMode="contain" />
            <Text style={styles.heading}>What Role Are You In?</Text>
            <Text style={styles.subtitle}>Choose your role to continue</Text>
          </Animated.View>

          {/* ── Role cards — each staggered individually ── */}
          <View style={styles.cardStack}>
            <RoleCard
              description="Access mock exams, reviewers, and progress tracking."
              entranceStyle={getItemStyle(1)}
              format="YY-NNNN-NNN"
              icon="school"
              role="student"
              onPress={() => router.push('/login?role=student')}
              title="Student"
            />
            <RoleCard
              description="Create exams, review submissions, and guide your classes."
              entranceStyle={getItemStyle(2)}
              format="PREFIX-NNNNN"
              icon="book-open-page-variant-outline"
              role="faculty"
              onPress={() => router.push('/login?role=faculty')}
              title="Faculty"
            />
            <RoleCard
              description="Manage programs, students, faculty, and exam operations."
              entranceStyle={getItemStyle(3)}
              format="PREFIX-NNNNN"
              icon="shield-check-outline"
              role="admin"
              onPress={() => router.push('/login?role=admin')}
              title="Department Admin"
            />
          </View>

          {/* ── Footer ── */}
          <Animated.View style={getItemStyle(4)}>
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.footerLink}
              onPress={() => router.push('/login')}
            >
              <Text style={styles.footerText}>
                Already signed in?{' '}
                <Text style={styles.footerTextStrong}>Go to login</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>

        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

// ── Role card ─────────────────────────────────────────────────────────────────

function RoleCard({
  description,
  entranceStyle,
  format,
  icon,
  onPress,
  role,
  title,
}: RoleCardProps) {
  const { width }                        = useWindowDimensions()
  const { animatedStyle, pressIn, pressOut } = useCardPressAnimation()
  const iconColor = roleColors[role]
  const showHint  = width > 380

  return (
    // Outer Animated.View owns the entrance (fade + slide)
    // Inner AnimatedTouchableOpacity owns the press scale
    <Animated.View style={[styles.cardEntranceWrapper, entranceStyle]}>
      <AnimatedTouchableOpacity
        accessibilityRole="button"
        activeOpacity={0.92}
        style={[
          styles.roleCard,
          role === 'student' && styles.roleCardStudentActive,
          role === 'faculty' && styles.roleCardFacultyActive,
          role === 'admin'   && styles.roleCardAdminActive,
          animatedStyle,
        ]}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
      >
        <AnimatedTopBar variant={role} />

        <View
          style={[
            styles.iconWrap,
            role === 'student' && styles.iconWrapStudentActive,
            role === 'faculty' && styles.iconWrapFacultyActive,
            role === 'admin'   && styles.iconWrapAdminActive,
          ]}
        >
          <MaterialCommunityIcons name={icon} size={24} color={iconColor} />
        </View>

        <View style={styles.roleCopy}>
          <Text
            style={[
              styles.cardTitle,
              role === 'student' && styles.cardTitleStudentActive,
              role === 'faculty' && styles.cardTitleFacultyActive,
              role === 'admin'   && styles.cardTitleAdminActive,
            ]}
          >
            {title}
          </Text>
          <Text style={styles.cardText}>{description}</Text>
        </View>

        <View style={styles.cardRight}>
          {showHint && (
            <View
              style={[
                styles.formatPill,
                role === 'student' && styles.formatPillStudentActive,
                role === 'faculty' && styles.formatPillFacultyActive,
                role === 'admin'   && styles.formatPillAdminActive,
              ]}
            >
              <Text
                style={[
                  styles.formatText,
                  role === 'student' && styles.formatTextStudentActive,
                  role === 'faculty' && styles.formatTextFacultyActive,
                  role === 'admin'   && styles.formatTextAdminActive,
                ]}
              >
                {format}
              </Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={20} color={iconColor} />
        </View>
      </AnimatedTouchableOpacity>
    </Animated.View>
  )
}

// ── Animated dot grid background ──────────────────────────────────────────────
// Matches the web RoleSelectBackground: dots in a grid that ripple outward
// from the centre with a sine wave. Each dot's opacity is driven by its
// distance from centre and the shared animated tick.

const GRID_GAP     = 38   // px between dots — matches web GRID_GAP
const DOT_R        = 1.5  // dot visual radius
const DOT_BASE_A   = 0.13
const DOT_PEAK_A   = 0.38
const RIPPLE_WAVE  = 80   // spatial wavelength in px

function DotGridBackground() {
  const { width: W, height: H } = useWindowDimensions()
  const { tick }                = useDotGridRipple({ fps: 30 })

  // Pre-compute the grid positions and each dot's distance from centre.
  // We do this in useMemo so it only recalculates on resize.
  const dots = useMemo(() => {
    const cx     = W / 2
    const cy     = H / 2
    const offX   = (W % GRID_GAP) / 2
    const offY   = (H % GRID_GAP) / 2
    const result: Array<{ key: string; x: number; y: number; dist: number }> = []

    for (let gx = offX; gx < W + GRID_GAP; gx += GRID_GAP) {
      for (let gy = offY; gy < H + GRID_GAP; gy += GRID_GAP) {
        const dist = Math.sqrt((gx - cx) ** 2 + (gy - cy) ** 2)
        result.push({ key: `${gx}-${gy}`, x: gx, y: gy, dist })
      }
    }
    return result
  }, [W, H])

  return (
    <View pointerEvents="none" style={styles.dotLayer}>
      {dots.map(({ key, x, y, dist }) => (
        <AnimatedDot key={key} x={x} y={y} dist={dist} tick={tick} />
      ))}
    </View>
  )
}

// Isolated dot component so each can hold its own interpolation reference
// without re-creating it on every parent render.
type AnimatedDotProps = {
  dist: number
  tick: Animated.Value
  x: number
  y: number
}

function AnimatedDot({ dist, tick, x, y }: AnimatedDotProps) {
  // Build the sine-wave opacity interpolation for this dot's distance.
  // 60 keyframes over the tick's 0→1000 range give a smooth ripple.
  const opacity = useMemo(() => {
    const N           = 60
    const phaseOffset = dist / RIPPLE_WAVE
    const inputRange  = Array.from({ length: N + 1 }, (_, i) => (i / N) * 1000)
    const outputRange = Array.from({ length: N + 1 }, (_, i) => {
      // 4 full wave cycles over the tick duration gives a nice ripple tempo
      const wave = Math.sin(phaseOffset - (i / N) * Math.PI * 2 * 4)
      return DOT_BASE_A + (wave * 0.5 + 0.5) * (DOT_PEAK_A - DOT_BASE_A)
    })
    return tick.interpolate({ inputRange, outputRange, extrapolate: 'clamp' })
  }, [dist, tick])

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          left:    x - DOT_R,
          opacity,
          top:     y - DOT_R,
          // Slight radius pulse: dots closer to peak wave are ever-so-slightly larger
          // We keep this static at DOT_R*2 to avoid a second interpolation chain
          width:   DOT_R * 2,
          height:  DOT_R * 2,
        },
      ]}
    />
  )
}