'use client'

import Link from 'next/link'
import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

export function ProjectAccessNeeded({workspaceName,email}:{workspaceName:string;email:string}){
 const router=useRouter(),[notice,setNotice]=useState(''),[pending,start]=useTransition()
 useEffect(()=>{const timer=setInterval(()=>router.refresh(),5000);return()=>clearInterval(timer)},[router])
 async function copyEmail(){try{await navigator.clipboard.writeText(email);setNotice('Your email was copied.')}catch{setNotice('Copy your email shown above and share it with your admin.')}}
 function switchAccount(){start(async()=>{try{const result=await authClient.signOut();if(result.error){setNotice('Could not switch accounts. Please try again.');return}router.push('/login');router.refresh()}catch{setNotice('Could not switch accounts. Please try again.')}})}
 return <main className="access-needed-page"><section>
  <Link href="/onboarding" className="access-needed-brand">⌁ pulseflow</Link>
  <span className="access-needed-kicker">{workspaceName}</span>
  <h1>You’re in the workspace.<br/><em>Next, join a project.</em></h1>
  <p>Your account <strong>{email}</strong> hasn’t been added to a project yet. Ask the workspace owner or a project admin to add this email, or send you a project invitation link.</p>
  <div className="access-needed-help"><strong>For your admin</strong><p>Open the workspace → select a project at the top → <b>Manage project access</b> → choose <b>Member</b> next to your name, or enter your email in <b>Add member</b>.</p></div>
  <div className="access-needed-actions"><button onClick={copyEmail}>Copy my email</button><button onClick={()=>start(()=>router.refresh())} disabled={pending}>{pending?'Checking…':'Check access again'}</button></div>
  <p className="access-needed-note" role="status">{notice||'This page checks automatically every five seconds.'}</p>
  <div className="access-needed-links"><Link href="/onboarding">Create or switch workspace</Link><button disabled={pending} onClick={switchAccount}>Sign in with another account</button></div>
 </section></main>
}
