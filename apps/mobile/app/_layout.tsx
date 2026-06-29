// mobile/app/_layout.tsx
import { Stack } from 'expo-router'
// @ts-ignore
import '../global.css';
import { AuthProvider } from '@/lib/context'

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  )
}
