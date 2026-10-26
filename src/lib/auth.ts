import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from './prisma'
import { emailEnabled, sendAuthEmail } from './email'

export const auth = betterAuth({
  appName: 'PulseFlow',
  trustedOrigins: process.env.NODE_ENV === 'development' ? ['http://localhost:3000', 'http://127.0.0.1:3000'] : [],
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    requireEmailVerification: emailEnabled,
    sendResetPassword: emailEnabled ? async ({ user, url }) => sendAuthEmail(user.email, 'Reset your PulseFlow password', url) : undefined,
  },
  emailVerification: emailEnabled ? {
    sendOnSignUp: true,
    sendOnSignIn: true,
    sendVerificationEmail: async ({ user, url }) => sendAuthEmail(user.email, 'Verify your PulseFlow email', url),
  } : undefined,
  socialProviders: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? {
    google: { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET },
  } : {},
  user: {
    additionalFields: {
      avatarColor: { type: 'string', required: false, defaultValue: '#8ee6ae', input: false },
      specialty: { type: 'string', required: false, defaultValue: 'General', input: false },
    },
  },
})
