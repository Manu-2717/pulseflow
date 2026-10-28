'use client'

import { useEffect,useRef,useState } from 'react'
import { MoreHorizontal } from 'lucide-react'

export function MemberActions({name,onView,onAssign,onManage}:{name:string;onView:()=>void;onAssign?:()=>void;onManage?:()=>void}){
 const [open,setOpen]=useState(false),container=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null),menu=useRef<HTMLDivElement>(null)
 useEffect(()=>{
  if(!open)return
  menu.current?.querySelector<HTMLButtonElement>('button')?.focus()
  const outside=(event:PointerEvent)=>{if(!container.current?.contains(event.target as Node))setOpen(false)}
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.stopPropagation();setOpen(false);trigger.current?.focus()}}
  document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape,true)
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape,true)}
 },[open])
 function choose(action:()=>void){setOpen(false);trigger.current?.focus();action()}
 return <div className="member-actions" ref={container}>
  <button ref={trigger} type="button" className="member-actions-trigger" aria-label={`Actions for ${name}`} aria-haspopup="menu" aria-expanded={open} onClick={()=>setOpen(!open)} onKeyDown={event=>{if(event.key==='ArrowDown'){event.preventDefault();setOpen(true)}}}><MoreHorizontal size={18}/></button>
  {open&&<div ref={menu} className="member-actions-menu" role="menu" aria-label={`${name} actions`} onKeyDown={event=>{
   const buttons=Array.from(menu.current?.querySelectorAll<HTMLButtonElement>('button')??[]),index=buttons.indexOf(document.activeElement as HTMLButtonElement)
   if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length;buttons[next]?.focus()}
   if(event.key==='Tab')setOpen(false)
  }}>
   <button type="button" role="menuitem" onClick={()=>choose(onView)}>View tasks</button>
   {onAssign&&<button type="button" role="menuitem" onClick={()=>choose(onAssign)}>Assign a new task</button>}
   {onManage&&<button type="button" role="menuitem" onClick={()=>choose(onManage)}>Manage project access</button>}
  </div>}
 </div>
}
