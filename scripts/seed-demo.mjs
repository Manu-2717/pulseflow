import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('Seeding demo data...')

  // 1. Update or create Alex Rivera
  let alex = await prisma.user.findUnique({ where: { email: 'alex@pulseflow.dev' } })
  if (!alex) {
    alex = await prisma.user.create({
      data: {
        id: 'user_alex',
        name: 'Alex Rivera',
        email: 'alex@pulseflow.dev',
        specialty: 'Fullstack Lead',
        avatarColor: '#10b981',
      }
    })
  } else {
    alex = await prisma.user.update({
      where: { id: alex.id },
      data: { specialty: 'Fullstack Lead', avatarColor: '#10b981' }
    })
  }

  // 2. Create other teammates
  const teammates = [
    { id: 'user_maya', name: 'Maya Chen', email: 'maya@pulseflow.dev', specialty: 'Frontend', avatarColor: '#06b6d4' },
    { id: 'user_ishan', name: 'Ishan Rao', email: 'ishan@pulseflow.dev', specialty: 'Backend', avatarColor: '#f43f5e' },
    { id: 'user_elena', name: 'Elena Rostova', email: 'elena@pulseflow.dev', specialty: 'Systems & Cloud', avatarColor: '#eab308' },
    { id: 'user_marcus', name: 'Marcus Brody', email: 'marcus@pulseflow.dev', specialty: 'Product Design', avatarColor: '#a855f7' },
  ]

  const createdTeammates = []
  for (const t of teammates) {
    const user = await prisma.user.upsert({
      where: { email: t.email },
      create: t,
      update: { specialty: t.specialty, avatarColor: t.avatarColor, name: t.name }
    })
    createdTeammates.push(user)
  }

  // 3. Workspace
  const workspaceSlug = 'pulseflow-eng'
  let workspace = await prisma.workspace.findUnique({ where: { slug: workspaceSlug } })
  if (workspace) {
    // Delete existing tasks, projects, etc. for fresh clean demo
    await prisma.workspace.delete({ where: { id: workspace.id } })
  }

  workspace = await prisma.workspace.create({
    data: {
      name: 'PulseFlow Engineering',
      slug: workspaceSlug,
      nextTaskNumber: 8,
      members: {
        create: [
          { userId: alex.id, role: 'LEADER' },
          { userId: createdTeammates[0].id, role: 'MEMBER' },
          { userId: createdTeammates[1].id, role: 'MEMBER' },
          { userId: createdTeammates[2].id, role: 'MEMBER' },
          { userId: createdTeammates[3].id, role: 'MEMBER' },
        ]
      }
    }
  })

  // 4. Projects
  const projCore = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      name: 'Core Platform',
      color: '#10b981',
      members: {
        create: [
          { userId: alex.id, role: 'ADMIN' },
          { userId: createdTeammates[0].id, role: 'MEMBER' },
          { userId: createdTeammates[1].id, role: 'MEMBER' },
          { userId: createdTeammates[2].id, role: 'MEMBER' },
        ]
      }
    }
  })

  const projRealtime = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      name: 'Realtime Engine',
      color: '#3b82f6',
      members: {
        create: [
          { userId: alex.id, role: 'ADMIN' },
          { userId: createdTeammates[1].id, role: 'MEMBER' },
          { userId: createdTeammates[2].id, role: 'MEMBER' },
        ]
      }
    }
  })

  const projDesign = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      name: 'Developer Experience',
      color: '#8b5cf6',
      members: {
        create: [
          { userId: alex.id, role: 'ADMIN' },
          { userId: createdTeammates[0].id, role: 'MEMBER' },
          { userId: createdTeammates[3].id, role: 'MEMBER' },
        ]
      }
    }
  })

  // 5. Sprint
  const now = new Date()
  const sprintStart = new Date(now.getTime() - 3 * 86400000)
  const sprintEnd = new Date(now.getTime() + 11 * 86400000)

  const sprint = await prisma.sprint.create({
    data: {
      workspaceId: workspace.id,
      name: 'Sprint 42 — Reliability & Dispatch',
      goal: 'Improve system dispatch latency, capacity radar responsiveness, and blocker resolution workflows.',
      startDate: sprintStart,
      endDate: sprintEnd,
    }
  })

  // 6. Custom Fields
  const fieldEnv = await prisma.customField.create({
    data: {
      workspaceId: workspace.id,
      name: 'Environment',
      type: 'SELECT',
      options: ['Production', 'Staging', 'Edge'],
    }
  })

  const fieldImpact = await prisma.customField.create({
    data: {
      workspaceId: workspace.id,
      name: 'Impact Level',
      type: 'SELECT',
      options: ['Tier 1 Critical', 'Tier 2 High', 'Tier 3 Standard'],
    }
  })

  // 7. Workspace Documents
  await prisma.workspaceDocument.createMany({
    data: [
      {
        workspaceId: workspace.id,
        title: 'Architecture Blueprint & Dispatch Model',
        content: `# System Architecture

PulseFlow pairs live team capacity signals with an optimistic Kanban workflow and dedicated blocker resolution threads.

### Principles:
1. **Live Workload Visibility**: Know who is free, active, overloaded, or blocked in real time.
2. **Context-Aware Smart Dispatch**: Matches task requirements with team specialty.
3. **Dedicated Blocker Spaces**: Focused discussions, AI summaries, and accepted solutions.`
      },
      {
        workspaceId: workspace.id,
        title: 'Q4 Reliability & Production Playbook',
        content: `Runbook for zero-downtime deployment, encrypted backup rotation, and incident escalation.`
      }
    ]
  })

  // 8. Measurable Goals
  await prisma.goal.createMany({
    data: [
      {
        workspaceId: workspace.id,
        title: 'Zero High-Severity Incidents',
        target: 10,
        current: 8,
        dueDate: new Date(now.getTime() + 20 * 86400000),
      },
      {
        workspaceId: workspace.id,
        title: 'Mean Blocker Resolution Time < 4h',
        target: 5,
        current: 4,
        dueDate: new Date(now.getTime() + 15 * 86400000),
      },
      {
        workspaceId: workspace.id,
        title: 'Weekly Production Releases',
        target: 12,
        current: 10,
        dueDate: new Date(now.getTime() + 30 * 86400000),
      }
    ]
  })

  // 9. Task Templates
  await prisma.taskTemplate.createMany({
    data: [
      {
        workspaceId: workspace.id,
        name: 'Production Incident Postmortem',
        description: 'Document timeline, root cause analysis, preventive actions, and monitoring updates.',
        priority: 'CRITICAL',
        estimatedPts: 3,
      },
      {
        workspaceId: workspace.id,
        name: 'API Service Feature RFC',
        description: 'Draft technical spec, schema migrations, unit tests, and OpenAPI documentation.',
        priority: 'HIGH',
        estimatedPts: 4,
      }
    ]
  })

  // 10. Tasks
  // Task 1: TSK-01
  const tsk1 = await prisma.task.create({
    data: {
      workspaceId: workspace.id,
      code: 'TSK-01',
      title: 'Optimize Postgres connection pooler & index hot queries',
      description: 'Tune PgBouncer pool size and add partial indexes to prevent connection exhaustion during traffic spikes.',
      priority: 'HIGH',
      estimatedPts: 3,
      status: 'IN_PROGRESS',
      assigneeId: createdTeammates[1].id, // Ishan
      projectId: projCore.id,
      sprintId: sprint.id,
      startDate: new Date(now.getTime() - 2 * 86400000),
      dueDate: new Date(now.getTime() + 2 * 86400000),
      subtasks: {
        create: [
          { title: 'Profile query execution plans on task list', done: true },
          { title: 'Tune transaction pooler timeouts', done: true },
          { title: 'Verify connection pooling under 500 RPS', done: false },
        ]
      },
      timeEntries: {
        create: [
          { userId: createdTeammates[1].id, minutes: 120, note: 'Analyzed query plan and created composite index' },
          { userId: createdTeammates[1].id, minutes: 90, note: 'Tested pooler parameters under simulated load' }
        ]
      },
      fieldValues: {
        create: [
          { fieldId: fieldEnv.id, value: 'Production' },
          { fieldId: fieldImpact.id, value: 'Tier 1 Critical' },
        ]
      }
    }
  })

  // Task 2: TSK-02
  const tsk2 = await prisma.task.create({
    data: {
      workspaceId: workspace.id,
      code: 'TSK-02',
      title: 'Design interactive Gantt timeline & calendar synchronization',
      description: 'Implement draggable scheduling bars, deadline indicators, and Google Calendar one-click sync links.',
      priority: 'MEDIUM',
      estimatedPts: 2,
      status: 'DONE',
      completedAt: new Date(now.getTime() - 86400000),
      assigneeId: createdTeammates[0].id, // Maya
      projectId: projCore.id,
      sprintId: sprint.id,
      startDate: new Date(now.getTime() - 4 * 86400000),
      dueDate: new Date(now.getTime() - 86400000),
      subtasks: {
        create: [
          { title: 'Build responsive SVG timeline track', done: true },
          { title: 'Format RFC 5545 calendar links', done: true },
        ]
      },
      timeEntries: {
        create: [
          { userId: createdTeammates[0].id, minutes: 150, note: 'Implemented schedule layout and date math' }
        ]
      }
    }
  })

  // Task 3: TSK-03 (BLOCKED with IssueThread & AI brief)
  const tsk3 = await prisma.task.create({
    data: {
      workspaceId: workspace.id,
      code: 'TSK-03',
      title: 'Scale AI blocker brief generation with rate limiter & local fallback',
      description: 'Handle external provider rate limits gracefully using a sliding window semaphore and local deterministic heuristic extraction.',
      priority: 'CRITICAL',
      estimatedPts: 4,
      status: 'BLOCKED',
      assigneeId: createdTeammates[2].id, // Elena
      projectId: projRealtime.id,
      sprintId: sprint.id,
      startDate: new Date(now.getTime() - 86400000),
      dueDate: new Date(now.getTime() + 86400000),
      subtasks: {
        create: [
          { title: 'Simulate concurrent generation bursts', done: true },
          { title: 'Implement local regex & keyword analyzer fallback', done: true },
          { title: 'Add sliding-window quota tracker', done: false },
        ]
      },
      timeEntries: {
        create: [
          { userId: createdTeammates[2].id, minutes: 180, note: 'Reproduced 429 errors and drafted fallback pipeline' }
        ]
      },
      fieldValues: {
        create: [
          { fieldId: fieldEnv.id, value: 'Production' },
          { fieldId: fieldImpact.id, value: 'Tier 1 Critical' },
        ]
      }
    }
  })

  // Thread on TSK-03
  const thread = await prisma.issueThread.create({
    data: {
      workspaceId: workspace.id,
      taskId: tsk3.id,
      authorId: createdTeammates[2].id,
      title: 'Provider 429 rate limit errors during peak team standup bursts',
      category: 'BUG',
      status: 'OPEN',
      aiTldr: 'Concurrent blocker summarization requests exceed OpenAI hourly quotas during team standup surges, causing unhandled 429 rejection errors.',
      aiRootCause: 'Lack of client-side request queueing and absence of the local fallback heuristic in the background worker.',
      aiNextSteps: '1. Wrap the API caller with a 12-second timeout and sliding-window rate limiter.\n2. Fall back to local deterministic keyphrase extraction when quota is exceeded.\n3. Return cached brief if unblock action plan is already confirmed.',
      aiGeneratedAt: new Date(now.getTime() - 3600000),
    }
  })

  const comment1 = await prisma.comment.create({
    data: {
      threadId: thread.id,
      authorId: createdTeammates[2].id,
      content: 'Multiple teammates triggered blocker briefs simultaneously at 10:00 AM, resulting in upstream 429 rate limit errors.',
      createdAt: new Date(now.getTime() - 7200000),
    }
  })

  const comment2 = await prisma.comment.create({
    data: {
      threadId: thread.id,
      authorId: createdTeammates[1].id,
      content: 'I created a lightweight token-bucket scheduler that queues calls and gracefully delegates to the local heuristic analyzer if tokens are exhausted:',
      codeSnippet: `export async function getBlockerBrief(threadId: string) {
  if (rateLimiter.isExhausted()) {
    return deterministicFallbackExtractor(threadId);
  }
  return await callOpenAIWithRetry(threadId, { timeoutMs: 12000 });
}`,
      isSolution: true,
      createdAt: new Date(now.getTime() - 3600000),
    }
  })

  await prisma.issueThread.update({
    where: { id: thread.id },
    data: { pinnedCommentId: comment2.id }
  })

  // Task 4: TSK-04
  await prisma.task.create({
    data: {
      workspaceId: workspace.id,
      code: 'TSK-04',
      title: 'Refine dotted canvas theme, micro-animations & dark/light contrast',
      description: 'Enhance the tactile paper navigation, mint accents, and badge contrast across high-density displays.',
      priority: 'MEDIUM',
      estimatedPts: 2,
      status: 'IN_PROGRESS',
      assigneeId: createdTeammates[3].id, // Marcus
      projectId: projDesign.id,
      sprintId: sprint.id,
      startDate: now,
      dueDate: new Date(now.getTime() + 3 * 86400000),
      subtasks: {
        create: [
          { title: 'Update dotted grid SVG pattern with CSS variables', done: true },
          { title: 'Test card hover states and spring transitions', done: false },
        ]
      }
    }
  })

  // Task 5: TSK-05
  await prisma.task.create({
    data: {
      workspaceId: workspace.id,
      code: 'TSK-05',
      title: 'Automated age-encrypted database backup and rotation pipeline',
      description: 'Package scripts/backup-database.mjs with asymmetric age key encryption and automated daily cron retention.',
      priority: 'HIGH',
      estimatedPts: 3,
      status: 'IN_REVIEW',
      assigneeId: createdTeammates[2].id, // Elena
      projectId: projCore.id,
      sprintId: sprint.id,
      startDate: new Date(now.getTime() - 3 * 86400000),
      dueDate: now,
      subtasks: {
        create: [
          { title: 'Write age key generation and envelope encryption script', done: true },
          { title: 'Validate restoration test suite on staging', done: true },
        ]
      }
    }
  })

  // Task 6: TSK-06
  await prisma.task.create({
    data: {
      workspaceId: workspace.id,
      code: 'TSK-06',
      title: 'Smart dispatch load balancer: balance tasks by teammate capacity',
      description: 'Evaluate active points, blocked count, and member specialty before recommending next task assignee.',
      priority: 'LOW',
      estimatedPts: 2,
      status: 'QUEUED',
      projectId: projCore.id,
      sprintId: sprint.id,
      startDate: new Date(now.getTime() + 86400000),
      dueDate: new Date(now.getTime() + 4 * 86400000),
    }
  })

  // Task 7: TSK-07
  await prisma.task.create({
    data: {
      workspaceId: workspace.id,
      code: 'TSK-07',
      title: 'Link GitHub PRs & Google Docs with live state badges',
      description: 'Allow team members to attach external review links and automatically display merge status.',
      priority: 'MEDIUM',
      estimatedPts: 3,
      status: 'QUEUED',
      projectId: projDesign.id,
      sprintId: sprint.id,
      startDate: new Date(now.getTime() + 2 * 86400000),
      dueDate: new Date(now.getTime() + 6 * 86400000),
    }
  })

  console.log('Seeding completed successfully!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
