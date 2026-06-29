import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

import { authColors, authGradientColors } from '@/constants/tokens'
import { AnimatedTopBar } from '@/lib/animations/authAnimations'
import { supabase } from '@/lib/supabase'
import styles from './login/styles'

const logo = require('@/assets/images/veripraxislogo-title.png')
const emailDomain = '@veripraxis.edu.ph'

type LoginRole = 'student' | 'faculty' | 'admin'

function normalizeRole(value: unknown): LoginRole {
  if (value === 'admin' || value === 'faculty') {
    return value
  }

  return 'student'
}

function detectRoleFromId(idNumber: string): LoginRole | null {
  const value = idNumber.trim()
  if (!value) {
    return null
  }

  if (/^\d{4}-\d{5}$/.test(value) || /^\d{2}-\d{4}-\d{3}$/.test(value)) {
    return 'student'
  }

  if (/^[A-Za-z]+-\d+/.test(value)) {
    return 'admin'
  }

  return null
}

export default function LoginScreen() {
  const params = useLocalSearchParams<{ role?: string }>()
  const role = normalizeRole(params.role)
  const [idNumber, setIdNumber] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const detectedRole = useMemo(() => detectRoleFromId(idNumber), [idNumber])
  const roleLabel = role === 'student' ? 'Student' : role === 'faculty' ? 'Faculty' : 'Department Admin'
  const placeholder = role === 'student' ? 'Student ID (e.g. 2021-00001)' : 'Faculty ID (e.g. FAC-0001)'

  function handleIdChange(value: string) {
    setIdNumber(value)
    setError(null)
  }

  async function handleLogin() {
    if (loading) {
      return
    }

    const cleanId = idNumber.trim()
    if (!cleanId || !password) {
      setError('Please enter your ID number and password.')
      return
    }

    setLoading(true)
    setError(null)

    const email = `${cleanId}${emailDomain}`.toLowerCase()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (signInError) {
      setError(signInError.message)
    }
  }

  return (
    <LinearGradient colors={authGradientColors.default} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
            <View style={styles.card}>
              <AnimatedTopBar />
              <TouchableOpacity accessibilityRole="button" style={styles.backLink} onPress={() => router.back()}>
                <Text style={styles.backLinkText}>{'< Back'}</Text>
              </TouchableOpacity>

              <View className="items-center" style={styles.header}>
                <Image source={logo} style={styles.logo} resizeMode="contain" />
                <Text style={styles.brandText}>VERIPRAXIS</Text>
              </View>

              <View style={styles.roleHintRow}>
                <Text style={styles.roleHintText}>Signing in as</Text>
                <View style={styles.rolePill}>
                  <Text style={styles.rolePillText}>{roleLabel}</Text>
                </View>
                <TouchableOpacity accessibilityRole="button" onPress={() => router.push('/role-select')}>
                  <Text style={styles.changeText}>Change</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.heading}>Welcome back</Text>
              <Text style={styles.subtitle}>Enter your credentials to access your account</Text>

              <View className="gap-4" style={styles.form}>
                <View className="gap-2">
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>ID NUMBER</Text>
                    {detectedRole && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                          Detected: {detectedRole === 'student' ? 'Student' : 'Faculty/Admin'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <TextInput
                    autoCapitalize="characters"
                    autoCorrect={false}
                    placeholder={placeholder}
                    placeholderTextColor={authColors.softMutedBlue}
                    style={styles.input}
                    value={idNumber}
                    onChangeText={handleIdChange}
                  />
                </View>

                <View className="gap-2">
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>PASSWORD</Text>
                    <TouchableOpacity accessibilityRole="button">
                      <Text style={styles.forgotText}>Forgot password?</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.passwordRow}>
                    <TextInput
                      autoCapitalize="none"
                      placeholder="Password"
                      placeholderTextColor={authColors.softMutedBlue}
                      secureTextEntry={!showPassword}
                      style={styles.passwordInput}
                      value={password}
                      onChangeText={(value) => {
                        setPassword(value)
                        setError(null)
                      }}
                    />
                    <TouchableOpacity
                      accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                      accessibilityRole="button"
                      style={styles.eyeButton}
                      onPress={() => setShowPassword((current) => !current)}
                    >
                      <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={authColors.softMutedBlue} />
                    </TouchableOpacity>
                  </View>
                </View>

                {error && <Text style={styles.errorText}>{error}</Text>}

                <TouchableOpacity
                  accessibilityRole="button"
                  disabled={loading}
                  activeOpacity={0.88}
                  style={styles.primaryButton}
                  onPress={() => void handleLogin()}
                >
                  {loading ? <ActivityIndicator color={authColors.white} /> : <Text style={styles.primaryButtonText}>{'Log in ->'}</Text>}
                </TouchableOpacity>

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>Or continue with</Text>
                  <View style={styles.dividerLine} />
                </View>

                <View className="gap-3">
                  <TouchableOpacity accessibilityRole="button" activeOpacity={0.86} style={styles.socialButton}>
                    <Text style={styles.googleMark}>G</Text>
                    <Text style={styles.socialText}>Continue with Google</Text>
                  </TouchableOpacity>
                  <TouchableOpacity accessibilityRole="button" activeOpacity={0.86} style={styles.socialButton}>
                    <Text style={styles.facebookMark}>f</Text>
                    <Text style={styles.socialText}>Continue with Facebook</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity accessibilityRole="button" style={styles.linkButton} onPress={() => router.push('/signup')}>
                  <Text style={styles.linkText}>
                    Don't have an account? <Text style={styles.linkTextStrong}>Sign up</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  )
}
