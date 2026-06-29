import { Stack } from 'expo-router'
import { useFonts } from 'expo-font'

export default function AuthLayout() {
  const [fontsLoaded, fontError] = useFonts({
    DMSans: {
      uri: 'https://cdn.jsdelivr.net/fontsource/fonts/dm-sans:vf@latest/latin-wght-normal.woff2',
    },
    PlusJakartaSans: {
      uri: 'https://cdn.jsdelivr.net/fontsource/fonts/plus-jakarta-sans:vf@latest/latin-wght-normal.woff2',
    },
  })

  if (!fontsLoaded && !fontError) {
    return null
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="role-select" options={{ gestureEnabled: false }} />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  )
}
