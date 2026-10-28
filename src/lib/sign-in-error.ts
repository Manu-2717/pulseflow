const messages: Record<string,string> = {
  access_denied:'Sign-in was declined or your account is not allowed to use this provider.',
  email_not_verified:'Verify the email on your identity-provider account before signing in.',
  oauth_provider_not_found:'This sign-in provider is temporarily unavailable. Please try another option.',
  state_mismatch:'Your sign-in attempt expired. Please start again.',
  invalid_code:'Your sign-in attempt expired. Please start again.',
  invalid_state:'Your sign-in attempt expired. Please start again.',
  unable_to_get_user_info:'The provider could not confirm your identity. Please try again.',
}
export function signInError(code?:string){return code ? messages[code] || 'Sign-in could not be completed. Please try again.' : ''}
