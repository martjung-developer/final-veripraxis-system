// app/mobile/lib/animations/authAnimations.ts
import { createElement, useEffect, useMemo, useRef, useState } from 'react'
import {
  AccessibilityInfo,
  Animated,
  Easing,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native'

import { LinearGradient } from 'expo-linear-gradient'

import { authGradientColors } from '@/constants/tokens'

export type AuthBarVariant = 'student' | 'faculty' | 'admin' | 'default'

type AnimatedTopBarProps = {
  active?: boolean
  height?: number
  variant?: AuthBarVariant
}

// ── Reduced-motion detection ──────────────────────────────────────────────────

export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    let mounted = true

    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReducedMotion(enabled)
    })

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion)

    return () => {
      mounted = false
      subscription.remove()
    }
  }, [])

  return reducedMotion
}

// ── Animated gradient top bar ─────────────────────────────────────────────────

export function AnimatedTopBar({ active = true, height = 3, variant = 'default' }: AnimatedTopBarProps) {
  const reducedMotion = useReducedMotion()
  const { width } = useWindowDimensions()
  const translateX = useRef(new Animated.Value(0)).current
  const colors = authGradientColors[variant]

  useEffect(() => {
    if (reducedMotion) {
      translateX.setValue(0)
      return
    }

    const animation = Animated.loop(
      Animated.timing(translateX, {
        toValue: 1,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    )

    animation.start()

    return () => {
      animation.stop()
      translateX.setValue(0)
    }
  }, [reducedMotion, translateX])

  const shift = translateX.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, 0],
  })

  return createElement(
    View,
    {
      pointerEvents: 'none',
      style: {
        height,
        left: 0,
        opacity: active ? 1 : 0,
        overflow: 'hidden',
        position: 'absolute',
        right: 0,
        top: 0,
      },
    },
    createElement(
      Animated.View,
      { style: { height, transform: [{ translateX: shift }], width: width * 2 } },
      createElement(LinearGradient, {
        colors,
        end: { x: 1, y: 0 },
        start: { x: 0, y: 0 },
        style: { height },
      }),
    ),
  )
}

// ── Card press spring animation ───────────────────────────────────────────────

export function useCardPressAnimation() {
  const scale = useRef(new Animated.Value(1)).current

  const animatedStyle = useMemo(() => ({ transform: [{ scale }] }), [scale])

  function pressIn() {
    Animated.spring(scale, {
      toValue: 0.985,
      friction: 8,
      tension: 180,
      useNativeDriver: true,
    }).start()
  }

  function pressOut() {
    Animated.spring(scale, {
      toValue: 1,
      friction: 8,
      tension: 180,
      useNativeDriver: true,
    }).start()
  }

  return { animatedStyle, pressIn, pressOut }
}

// ── Stagger entrance animation ────────────────────────────────────────────────
// Mirrors web framer-motion staggerChildren: each item fades + slides up
// with a configurable delay between items.
//
// Usage:
//   const { getItemStyle } = useStaggerEntrance({ count: 4 })
//   <Animated.View style={getItemStyle(0)}> ... </Animated.View>
//   <Animated.View style={getItemStyle(1)}> ... </Animated.View>

type UseStaggerEntranceOptions = {
  /** Total number of items to stagger */
  count: number
  /** ms delay between each item */
  staggerMs?: number
  /** ms before the first item starts */
  delayMs?: number
  /** translateY start offset (positive = slide up from below) */
  translateY?: number
  /** animation duration per item */
  durationMs?: number
}

export function useStaggerEntrance({
  count,
  staggerMs = 90,
  delayMs = 80,
  translateY: yOffset = 16,
  durationMs = 380,
}: UseStaggerEntranceOptions) {
  const reducedMotion = useReducedMotion()

  // One pair of (opacity, translateY) per item
  const opacities = useRef(
    Array.from({ length: count }, () => new Animated.Value(0)),
  ).current
  const translates = useRef(
    Array.from({ length: count }, () => new Animated.Value(yOffset)),
  ).current

  useEffect(() => {
    if (reducedMotion) {
      opacities.forEach((v) => v.setValue(1))
      translates.forEach((v) => v.setValue(0))
      return
    }

    const animations = opacities.map((opacity, i) =>
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: durationMs,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
          delay: delayMs + i * staggerMs,
        }),
        Animated.timing(translates[i], {
          toValue: 0,
          duration: durationMs,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
          delay: delayMs + i * staggerMs,
        }),
      ]),
    )

    const master = Animated.parallel(animations)
    master.start()

    return () => master.stop()
  }, [reducedMotion]) // eslint-disable-line react-hooks/exhaustive-deps

  function getItemStyle(index: number) {
    return {
      opacity: opacities[index] ?? 1,
      transform: [{ translateY: translates[index] ?? 0 }],
    }
  }

  return { getItemStyle }
}

// ── Ripple dot grid hook ──────────────────────────────────────────────────────
// Mirrors the web RoleSelectBackground dot-grid: a sine-wave ripple radiates
// from the canvas centre. Each dot gets an opacity and radius driven by its
// distance from centre and a shared time value.
//
// Returns a `time` Animated.Value that ticks continuously.
// Consumers compute per-dot opacity as:
//   wave = sin(dist / rippleWave - time)
//   alpha = BASE + (wave * 0.5 + 0.5) * (PEAK - BASE)
//
// Because Animated can't do math inside JSX we expose raw interpolation
// helpers alongside the raw `time` value.

const DOT_BASE_ALPHA = 0.13
const DOT_PEAK_ALPHA = 0.38
const RIPPLE_WAVE    = 80   // matches web rippleWave constant

type UseDotGridRippleOptions = {
  /** Number of animation ticks per second (default 30 — light on the thread) */
  fps?: number
}

export function useDotGridRipple({ fps = 30 }: UseDotGridRippleOptions = {}) {
  const reducedMotion = useReducedMotion()
  // `tick` counts raw frames; we convert to radians in interpolation
  const tick = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (reducedMotion) return

    // Animate tick from 0 → 1000 and loop — gives us enough resolution
    const loop = Animated.loop(
      Animated.timing(tick, {
        toValue: 1000,
        duration: (1000 / fps) * 1000, // 1000 frames at target fps
        easing: Easing.linear,
        useNativeDriver: false, // opacity needs JS driver
      }),
    )
    loop.start()
    return () => loop.stop()
  }, [reducedMotion, fps, tick])

  /**
   * Returns an Animated interpolation for a dot's opacity given its
   * pixel distance from the grid centre.
   */
  function getDotOpacity(distFromCenter: number): Animated.AnimatedInterpolation<number> {
    // We approximate sin(dist/wave - t*speed) by sampling the tick.
    // The ripple speed on web is t * 0.018 where t increments by 1/frame.
    // At 30fps that's ~0.54 radians/s phase advance.
    // We map tick 0→1000 to phase 0→540 radians (≈ 86 full cycles).
    const phaseOffset = distFromCenter / RIPPLE_WAVE

    // We can't do true sin() in Animated, so we keyframe a sine approximation
    // over one full 2π cycle and use the tick modulo to select the frame.
    // 60 keyframes per cycle gives smooth-enough motion.
    const N = 60
    const inputRange  = Array.from({ length: N + 1 }, (_, i) => (i / N) * 1000)
    const outputRange = Array.from({ length: N + 1 }, (_, i) => {
      const t    = (i / N) * 1000
      // Simulate: wave = sin(dist/wave - t*speed); t advances at 1000/N steps
      // speed = 0.018 but scaled to our tick range:
      // original: speed = 0.018, tick goes 0→1000 over (1000/fps)*1000 ms
      // We want ~1 full ripple period per ~3s visible sweep,
      // so we bake phase directly from i.
      const wave = Math.sin(phaseOffset - (i / N) * Math.PI * 2 * 4)
      return DOT_BASE_ALPHA + (wave * 0.5 + 0.5) * (DOT_PEAK_ALPHA - DOT_BASE_ALPHA)
    })

    return tick.interpolate({ inputRange, outputRange, extrapolate: 'clamp' })
  }

  return { tick, getDotOpacity }
}

// ── Step indicator dot ────────────────────────────────────────────────────────

type AnimatedStepDotProps = {
  done?: boolean
  active?: boolean
  style?: object
}

export function AnimatedStepDot({ active = false, done = false, style }: AnimatedStepDotProps) {
  const width = useRef(new Animated.Value(active ? 22 : 7)).current

  useEffect(() => {
    Animated.spring(width, {
      toValue: active ? 22 : 7,
      friction: 8,
      tension: 160,
      useNativeDriver: false,
    }).start()
  }, [active, width])

  return createElement(Animated.View, { style: [style, { width }, done && { opacity: 0.95 }] })
}

// ── OTP shake animation ───────────────────────────────────────────────────────

export function useOtpShakeAnimation() {
  const translateX = useRef(new Animated.Value(0)).current

  function shake() {
    Animated.sequence([
      Animated.timing(translateX, { duration: 50, toValue: -4, useNativeDriver: true }),
      Animated.timing(translateX, { duration: 50, toValue: 4,  useNativeDriver: true }),
      Animated.timing(translateX, { duration: 50, toValue: -4, useNativeDriver: true }),
      Animated.timing(translateX, { duration: 50, toValue: 4,  useNativeDriver: true }),
      Animated.timing(translateX, { duration: 50, toValue: -4, useNativeDriver: true }),
      Animated.timing(translateX, { duration: 50, toValue: 4,  useNativeDriver: true }),
      Animated.timing(translateX, { duration: 50, toValue: 0,  useNativeDriver: true }),
    ]).start()
  }

  return {
    shake,
    shakeStyle: { transform: [{ translateX }] },
  }
}

// ── Animated TouchableOpacity ─────────────────────────────────────────────────

export const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity)