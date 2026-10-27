import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from './prisma'
import { emailEnabled, passwordEnabled, sendAuthEmail } from './email'
import { importPKCS8, SignJWT } from 'jose'

const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
const githubEnabled = Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET)
const appleEnabled = Boolean(process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY)

async function appleClientSecret() {
  const privateKey = process.env.APPLE_PRIVATE_KEY!.replace(/\\n/g, '\n')
  const key = await importPKCS8(privateKey, 'ES256')
  const now = Math.floor(Date.now() / 1000)
  return new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: process.env.APPLE_KEY_ID! })
    .setIssuer(process.env.APPLE_TEAM_ID!)
    .setSubject(process.env.APPLE_CLIENT_ID!)
    .setAudience('https://appleid.apple.com')
    .setIssuedAt(now)
    .setExpirationTime(now + 180 * 24 * 60 * 60)
    .sign(key)
}

export const auth = betterAuth({
  appName: 'PulseFlow',
  trustedOrigins: [
    ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000', 'http://127.0.0.1:3000'] : []),
    ...(appleEnabled ? ['https://appleid.apple.com'] : []),
  ],
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: {
    enabled: passwordEnabled,
    minPasswordLength: 10,
    requireEmailVerification: emailEnabled,
    sendResetPassword: emailEnabled ? async ({ user, url }) => sendAuthEmail(user.email, 'Reset your PulseFlow password', url) : undefined,
  },
  emailVerification: emailEnabled ? {
    sendOnSignUp: true,
    sendOnSignIn: true,
    sendVerificationEmail: async ({ user, url }) => sendAuthEmail(user.email, 'Verify your PulseFlow email', url),
  } : undefined,
  socialProviders: {
    ...(googleEnabled ? { google: { clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET! } } : {}),
    ...(githubEnabled ? { github: { clientId: process.env.GITHUB_CLIENT_ID!, clientSecret: process.env.GITHUB_CLIENT_SECRET! } } : {}),
    ...(appleEnabled ? { apple: async () => ({ clientId: process.env.APPLE_CLIENT_ID!, clientSecret: await appleClientSecret() }) } : {}),
  },
  user: {
    additionalFields: {
      avatarColor: { type: 'string', required: false, defaultValue: '#8ee6ae', input: false },
      specialty: { type: 'string', required: false, defaultValue: 'General', input: false },
    },
  },
})
