// mobile/app/index.tsx
import { useEffect } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

import { router } from 'expo-router'

import { useAuth } from '@/lib/context'

export default function Index() {
  const { authLoading, role, session } = useAuth()

  useEffect(() => {
    if (authLoading) {
      return
    }

    if (!session) {
      router.replace('/(auth)/role-select')
      return
    }

    if (role === 'student') {
      router.replace('/(student)/dashboard')
      return
    }

    if (role === 'admin' || role === 'faculty') {
      router.replace('/(admin)/dashboard')
    }
  }, [authLoading, role, session])

  return (
    <View style={styles.container}>
      <ActivityIndicator color="#1D2951" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
})
