import type { GenericOAuthConfig } from 'better-auth/plugins/generic-oauth'

export function fossclubProfile(profile: Record<string,unknown>) {
  if (typeof profile.sub !== 'string' || !profile.sub.trim()) throw new Error('OIDC subject is missing.')
  if (typeof profile.email !== 'string' || !profile.email.includes('@')) throw new Error('A verified email is required for PulseFlow.')
  const name = typeof profile.name === 'string' && profile.name.trim() ? profile.name.trim() : typeof profile.preferred_username === 'string' ? profile.preferred_username : 'FOSS Club member'
  let image: string | undefined
  if (typeof profile.picture === 'string') { try { const url = new URL(profile.picture); if (url.protocol === 'https:') image = url.toString() } catch {} }
  // Club membership/roles are not PulseFlow workspace or project permissions.
  return {name:name.slice(0,80),email:profile.email.trim().toLowerCase(),emailVerified:profile.email_verified === true,image}
}

export function getFossclubProvider(env: Record<string,string|undefined> = process.env): GenericOAuthConfig<'fossclub'> | null {
  if (env.OIDC_ENABLED !== 'true') return null
  const issuer = new URL(env.OIDC_ISSUER || 'https://oidc.fossclub.tech')
  const loopback = ['localhost','127.0.0.1','[::1]'].includes(issuer.hostname)
  if (issuer.username || issuer.password || issuer.search || issuer.hash || (issuer.pathname !== '/' && issuer.pathname !== '') || (issuer.protocol !== 'https:' && !(env.NODE_ENV !== 'production' && loopback && issuer.protocol === 'http:'))) throw new Error('OIDC issuer must be an HTTPS origin (HTTP loopback is allowed for local tests).')
  if (!env.OIDC_CLIENT_ID || !/^[a-z0-9][a-z0-9-]{1,39}$/.test(env.OIDC_CLIENT_ID)) throw new Error('OIDC client ID is invalid.')
  if (!env.OIDC_CLIENT_SECRET || env.OIDC_CLIENT_SECRET.length < 32) throw new Error('OIDC client secret must contain at least 32 characters.')
  return {
    providerId:'fossclub',name:'USAR FOSS Club',
    clientId:env.OIDC_CLIENT_ID,clientSecret:env.OIDC_CLIENT_SECRET,
    discoveryUrl:`${issuer.origin}/.well-known/openid-configuration`,
    scopes:['openid','profile','email'],pkce:true,
    tokenEndpointAuth:{method:'client_secret_basic'},
    requireIdTokenVerification:true,requireEmailVerification:true,
    accountSubject:({profile})=>{if(typeof profile.sub!=='string'||!profile.sub.trim())throw new Error('OIDC subject is missing.');return profile.sub},
    mapProfileToUser:fossclubProfile,
    disableProviderLogout:true,
  }
}

export const fossclubProvider = getFossclubProvider()
