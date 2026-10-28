'use client'

import Link from 'next/link'
import { Check,ArrowRight } from 'lucide-react'

export function SetupGuide({owner,hasProjects,hasPeople,hasTasks,planningHref,onInvite,onTask}:{owner:boolean;hasProjects:boolean;hasPeople:boolean;hasTasks:boolean;planningHref:string;onInvite:()=>void;onTask:()=>void}){
 if(hasProjects&&hasPeople&&hasTasks)return null
 return <section className="setup-guide" aria-label="Getting started"><div><h2>Start here</h2><p>{owner?'Set up your project, invite people, then add work.':'Invite your teammates, then add your first task.'}</p></div><div className="setup-guide-steps">
  {owner&&<Link href={planningHref+'#projects'} className={hasProjects?'complete':''}><span>{hasProjects?<Check size={15}/>:1}</span><strong>Create a project</strong><ArrowRight size={16}/></Link>}
  <button onClick={onInvite} disabled={!hasProjects} className={hasPeople?'complete':''}><span>{hasPeople?<Check size={15}/>:owner?2:1}</span><strong>Invite teammates</strong><ArrowRight size={16}/></button>
  <button onClick={onTask} disabled={!hasProjects} className={hasTasks?'complete':''}><span>{hasTasks?<Check size={15}/>:owner?3:2}</span><strong>Add a task</strong><ArrowRight size={16}/></button>
 </div></section>
}
