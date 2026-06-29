import { useEffect, useMemo, useState } from 'react'
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
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

import { authColors } from '@/constants/tokens'
import { AnimatedStepDot, AnimatedTopBar } from '@/lib/animations/authAnimations'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/types'
import styles from './signup/styles'

const logo = require('@/assets/images/veripraxislogo-title.png')

type Program = Pick<Database['public']['Tables']['programs']['Row'], 'id' | 'code' | 'full_name' | 'years'>

const totalSteps = 4

type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong'

function getPasswordStrength(value: string): PasswordStrength {
  let score = 0

  if (value.length >= 8) score += 1
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1
  if (/\d/.test(value)) score += 1
  if (/[^A-Za-z0-9]/.test(value)) score += 1

  if (score <= 1) return 'weak'
  if (score === 2) return 'fair'
  if (score === 3) return 'good'
  return 'strong'
}

export default function SignupScreen() {
  const [step, setStep] = useState(1)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [studentId, setStudentId] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [programs, setPrograms] = useState<Program[]>([])
  const [programsLoading, setProgramsLoading] = useState(true)
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null)
  const [selectedYearLevel, setSelectedYearLevel] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadPrograms() {
      setProgramsLoading(true)
      const { data, error: programsError } = await supabase
        .from('programs')
        .select('id, code, full_name, years')
        .order('code')

      if (!mounted) {
        return
      }

      if (programsError) {
        setError(programsError.message)
      } else {
        setPrograms(data ?? [])
      }

      setProgramsLoading(false)
    }

    void loadPrograms()

    return () => {
      mounted = false
    }
  }, [])

  const yearOptions = useMemo(() => {
    const years = selectedProgram?.years ?? 0
    return Array.from({ length: years }, (_, index) => index + 1)
  }, [selectedProgram])

  const heading = step === 1 ? "Let's get started" : step === 2 ? 'Create your account' : step === 3 ? 'Choose your program' : 'What year are you in?'
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password])
  const subtitle =
    step === 1
      ? 'Enter your basic account details'
      : step === 2
        ? 'Enter your school-issued Student ID and password'
        : step === 3
          ? 'Select the program you are currently enrolled in'
          : 'Select your current year level'

  function clearMessages() {
    setError(null)
    setSuccess(null)
  }

  function handleNext() {
    clearMessages()

    if (step === 1 && (!fullName.trim() || !email.trim())) {
      setError('Please enter your full name and email.')
      return
    }

    if (step === 2) {
      if (!studentId.trim() || !password || !confirmPassword) {
        setError('Please complete your student ID and password fields.')
        return
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match.')
        return
      }
    }

    if (step === 3 && !selectedProgram) {
      setError('Please select a program.')
      return
    }

    setStep((current) => Math.min(current + 1, totalSteps))
  }

  function handleBack() {
    clearMessages()
    setStep((current) => Math.max(current - 1, 1))
  }

  async function handleSubmit() {
    if (loading) {
      return
    }

    clearMessages()

    if (!selectedProgram || selectedYearLevel === null) {
      setError('Please select your program and year level.')
      return
    }

    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({ email: email.trim(), password })

    if (signUpError) {
      setLoading(false)
      setError(signUpError.message)
      return
    }

    const user = data.user
    if (!user) {
      setLoading(false)
      setError('Signup succeeded, but no user record was returned.')
      return
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: user.id,
      email: email.trim(),
      full_name: fullName.trim(),
      role: 'student',
    })

    if (profileError) {
      setLoading(false)
      setError(profileError.message)
      return
    }

    const { error: studentError } = await supabase.from('students').insert({
      id: user.id,
      student_id: studentId.trim(),
      program_id: selectedProgram.id,
      year_level: selectedYearLevel,
    })

    setLoading(false)

    if (studentError) {
      setError(studentError.message)
      return
    }

    setSuccess('Account created successfully.')
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <DotGridBackground />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
          <View style={styles.card}>
            <AnimatedTopBar />
            <TouchableOpacity accessibilityRole="button" style={styles.backToSite} onPress={() => router.replace('/')}>
              <Text style={styles.backToSiteText}>{'< Back to site'}</Text>
            </TouchableOpacity>

            <View className="items-center" style={styles.header}>
              <Image source={logo} style={styles.logo} resizeMode="contain" />
              <View className="flex-row gap-2" style={styles.progressRow}>
                {[1, 2, 3, 4].map((item) => (
                  <AnimatedStepDot
                    key={item}
                    active={item === step}
                    done={item < step}
                    style={[styles.progressDot, item === step && styles.progressDotActive, item < step && styles.progressDotDone]}
                  />
                ))}
              </View>
              <Text style={styles.heading}>{heading}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>

            <InfoBanner />

          <View className="gap-4" style={styles.form}>
            {step === 1 && (
              <View className="gap-4">
                <View className="gap-2">
                  <Text style={styles.label}>Full Name</Text>
                  <TextInput
                    autoCapitalize="words"
                    placeholder="Full name"
                    placeholderTextColor={authColors.softMutedBlue}
                    style={styles.input}
                    value={fullName}
                    onChangeText={(value) => {
                      setFullName(value)
                      clearMessages()
                    }}
                  />
                </View>

                <View className="gap-2">
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholder="you@email.com"
                    placeholderTextColor={authColors.softMutedBlue}
                    style={styles.input}
                    value={email}
                    onChangeText={(value) => {
                      setEmail(value)
                      clearMessages()
                    }}
                  />
                </View>
              </View>
            )}

            {step === 2 && (
              <View className="gap-4">
                <View className="gap-2">
                  <Text style={styles.label}>Student ID</Text>
                  <TextInput
                    autoCapitalize="characters"
                    autoCorrect={false}
                    placeholder="YY-NNNN-NNN (e.g. 23-0249-605)"
                    placeholderTextColor={authColors.softMutedBlue}
                    style={styles.input}
                    value={studentId}
                    onChangeText={(value) => {
                      setStudentId(value)
                      clearMessages()
                    }}
                  />
                  <Text style={styles.caption}>Format: YY-NNNN-NNN - issued by your school</Text>
                </View>

                <PasswordField
                  label="Password"
                  value={password}
                  visible={showPassword}
                  onChange={(value) => {
                    setPassword(value)
                    clearMessages()
                  }}
                  onToggle={() => setShowPassword((current) => !current)}
                />
                {password.length > 0 && <PasswordStrengthMeter strength={passwordStrength} />}

                <PasswordField
                  label="Confirm Password"
                  value={confirmPassword}
                  visible={showConfirmPassword}
                  onChange={(value) => {
                    setConfirmPassword(value)
                    clearMessages()
                  }}
                  onToggle={() => setShowConfirmPassword((current) => !current)}
                />
              </View>
            )}

            {step === 3 && (
              <View className="gap-4">
                <Text style={styles.subheading}>Select your program</Text>
                {programsLoading ? (
                  <ActivityIndicator color={authColors.cerulean} />
                ) : (
                  <View style={styles.programGrid}>
                    {programs.map((program) => {
                      const selected = selectedProgram?.id === program.id
                      return (
                        <TouchableOpacity
                          key={program.id}
                          accessibilityRole="button"
                          activeOpacity={0.86}
                          style={[
                            styles.programButton,
                            selected && styles.programButtonSelected,
                          ]}
                          onPress={() => {
                            setSelectedProgram(program)
                            setSelectedYearLevel(null)
                            clearMessages()
                          }}
                        >
                          <Text style={[styles.programCode, selected && styles.programTextSelected]}>{program.code}</Text>
                          <Text style={[styles.programName, selected && styles.programTextSelected]}>{program.full_name}</Text>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                )}
              </View>
            )}

            {step === 4 && (
              <View className="gap-4">
                <Text style={styles.subheading}>What year are you in?</Text>
                <View className="gap-3">
                  {yearOptions.map((year) => {
                    const selected = selectedYearLevel === year
                    return (
                      <TouchableOpacity
                        key={year}
                        accessibilityRole="button"
                        activeOpacity={0.86}
                        style={[
                          styles.yearButton,
                          selected && styles.yearButtonSelected,
                        ]}
                        onPress={() => {
                          setSelectedYearLevel(year)
                          clearMessages()
                        }}
                      >
                        <Text style={[styles.yearText, selected && styles.programTextSelected]}>{year}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>
            )}

            {error && <Text style={styles.errorText}>{error}</Text>}
            {success && <Text style={styles.successText}>{success}</Text>}

            <View className="flex-row gap-3" style={styles.actionRow}>
              {step > 1 && (
                <TouchableOpacity accessibilityRole="button" style={styles.secondaryButton} onPress={handleBack}>
                  <Text style={styles.secondaryButtonText}>Back</Text>
                </TouchableOpacity>
              )}

              {step < totalSteps ? (
                <TouchableOpacity accessibilityRole="button" style={styles.primaryButton} onPress={handleNext}>
                  <Text style={styles.primaryButtonText}>{'Continue ->'}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  accessibilityRole="button"
                  disabled={loading}
                  style={styles.primaryButton}
                  onPress={() => void handleSubmit()}
                >
                  {loading ? (
                    <ActivityIndicator color={authColors.white} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Create Account</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity accessibilityRole="button" style={styles.linkButton} onPress={() => router.push('/login')}>
              <Text style={styles.linkText}>Already have an account? <Text style={styles.linkTextStrong}>Sign in</Text></Text>
            </TouchableOpacity>
          </View>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </SafeAreaView>
  )
}

function PasswordStrengthMeter({ strength }: { strength: PasswordStrength }) {
  const filledBars = strength === 'weak' ? 1 : strength === 'fair' ? 2 : strength === 'good' ? 3 : 4
  const filledStyle =
    strength === 'weak'
      ? styles.strengthBarWeak
      : strength === 'fair'
        ? styles.strengthBarFair
        : styles.strengthBarGood
  const labelStyle =
    strength === 'weak'
      ? styles.strengthLabelWeak
      : strength === 'fair'
        ? styles.strengthLabelFair
        : styles.strengthLabelGood

  return (
    <View style={styles.strengthRow}>
      {[0, 1, 2, 3].map((item) => (
        <View key={item} style={[styles.strengthBar, item < filledBars && filledStyle]} />
      ))}
      <Text style={[styles.strengthLabel, labelStyle]}>{strength}</Text>
    </View>
  )
}

type PasswordFieldProps = {
  label: string
  value: string
  visible: boolean
  onChange: (value: string) => void
  onToggle: () => void
}

function PasswordField({ label, value, visible, onChange, onToggle }: PasswordFieldProps) {
  return (
    <View className="gap-2">
      <Text style={styles.label}>{label}</Text>
      <View style={styles.passwordRow}>
        <TextInput
          autoCapitalize="none"
          placeholder={label}
          placeholderTextColor={authColors.softMutedBlue}
          secureTextEntry={!visible}
          style={styles.passwordInput}
          value={value}
          onChangeText={onChange}
        />
        <TouchableOpacity
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
          accessibilityRole="button"
          style={styles.eyeButton}
          onPress={onToggle}
        >
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={authColors.softMutedBlue} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

function InfoBanner() {
  return (
    <View style={styles.infoBanner}>
      <Ionicons name="checkmark-circle" size={16} color={authColors.successDark} />
      <Text style={styles.infoText}>Student registration only. Faculty & admin accounts are managed by your institution.</Text>
    </View>
  )
}

function DotGridBackground() {
  return (
    <View pointerEvents="none" style={styles.dotLayer}>
      {Array.from({ length: 96 }, (_, index) => (
        <View key={index} style={styles.dot} />
      ))}
    </View>
  )
}
