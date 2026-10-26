'use client'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'

export function PasswordRecovery({token}:{token?:string}){
  const [pending,start]=useTransition()
  const [message,setMessage]=useState('')
  function submit(data:FormData){start(async()=>{
    if(token){
      const result=await authClient.resetPassword({newPassword:String(data.get('password')||''),token})
      setMessage(result.error?.message||'Password updated. You can sign in now.')
    }else{
      await authClient.requestPasswordReset({email:String(data.get('email')||''),redirectTo:'/reset-password'})
      setMessage('If this address has an account, a reset link is on its way.')
    }
  })}
  return <main className="auth-wrap"><div className="auth-card"><div className="auth-stamp">✳ PULSEFLOW / ACCOUNT RECOVERY</div><h1>{token?'Choose a new password.':'Get back into flow.'}</h1><p className="auth-intro">{token?'Use at least 10 characters for your new password.':'Enter your account email and we will send a recovery link.'}</p><form action={submit} className="auth-form">{token?<label>NEW PASSWORD<input name="password" type="password" autoComplete="new-password" required minLength={10}/></label>:<label>EMAIL ADDRESS<input name="email" type="email" autoComplete="email" required/></label>}{message&&<p className="auth-error" role="status">{message}</p>}<button className="auth-submit" type="submit" disabled={pending}>{pending?'Working…':token?'Reset password':'Send reset link'}</button></form><p className="auth-switch"><Link href="/login">Back to sign in</Link></p></div></main>
}
