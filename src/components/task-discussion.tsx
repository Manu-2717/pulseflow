'use client'
import { useState,useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addTaskComment,reviewTask } from '@/app/actions'

type DiscussionComment={id:string;content:string;kind:string;createdAt:string;author:{id:string;name:string}}
const events:Record<string,string>={SUBMITTED:'submitted for review',APPROVED:'approved this task',CHANGES_REQUESTED:'requested changes',REOPENED:'reopened this task'}
export function TaskDiscussion({taskId,status,comments,canReview,ownTask}:{taskId:string;status:string;comments:DiscussionComment[];canReview:boolean;ownTask:boolean}){
 const router=useRouter(),[pending,start]=useTransition(),[content,setContent]=useState(''),[preview,setPreview]=useState(false),[error,setError]=useState('')
 function send(decision?:'approve'|'request_changes'){
  setError('')
  start(async()=>{try{
   if(decision)await reviewTask(taskId,decision,content)
   else await addTaskComment(taskId,content)
   setContent('');setPreview(false);router.refresh()
  }catch(cause){setError(cause instanceof Error?cause.message:'Could not save. Please try again.')}})
 }
 return <section className="task-conversation" aria-label="Task discussion and review">
  <h3>Discussion</h3><p>Share updates, ask questions, and leave feedback here.</p>
  {status==='IN_REVIEW'&&<div className="review-notice" role="status">{canReview&&!ownTask?'Ready for your review. Check the work, then approve it or request changes.':ownTask?'Your work is awaiting review. A leader, admin, or mentor must approve it.':'This task is waiting for a leader, admin, or mentor to review it.'}</div>}
  <ol className="task-comment-timeline">{comments.map(comment=><li key={comment.id} className={comment.kind==='COMMENT'?'task-comment':'task-comment review-event'}>
   <header><strong>{comment.author.name}</strong>{events[comment.kind]&&<span>{events[comment.kind]}</span>}<time dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZone:'UTC'})} UTC</time></header>
   <p>{comment.content}</p>
  </li>)}</ol>
  {!comments.length&&<p className="discussion-empty">No comments yet. Start the conversation.</p>}
  <form onSubmit={event=>{event.preventDefault();send()}}>
   <div className="comment-tabs"><button type="button" aria-pressed={!preview} onClick={()=>setPreview(false)}>Write</button><button type="button" aria-pressed={preview} onClick={()=>setPreview(true)}>Preview</button></div>
   <label htmlFor={`task-comment-${taskId}`} className="comment-label">Comment or review feedback</label>
   {preview?<div className="comment-preview">{content||'Nothing to preview yet.'}</div>:<textarea id={`task-comment-${taskId}`} value={content} onChange={event=>setContent(event.target.value)} maxLength={5000} placeholder="Add an update, explain your work, or leave feedback…" disabled={pending}/>}
   {error&&<p role="alert" className="comment-error">{error}</p>}
   <div className="comment-buttons"><button type="submit" disabled={pending||!content.trim()}>{pending?'Saving…':'Comment'}</button>{status==='IN_REVIEW'&&canReview&&!ownTask&&<><button type="button" disabled={pending||!content.trim()} onClick={()=>send('request_changes')}>Request changes</button><button type="button" className="approve-task" disabled={pending} onClick={()=>send('approve')}>Approve & mark done</button></>}</div>
   {status==='IN_REVIEW'&&canReview&&!ownTask&&<small>Describe the changes needed in your feedback before requesting changes.</small>}
  </form>
 </section>
}
