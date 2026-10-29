# Task review and discussion

Tasks move from Queued to In progress to Awaiting review. Completion requires an explicit approval from a workspace leader, project admin, or project mentor. The assignee cannot review their own task, even when they hold a reviewer role. A reviewer can request changes with feedback, returning the task to In progress for another submission.

Project admins and workspace owners assign the Mentor role through **Manage project access**. Mentors can review tasks and comment in their own projects; they cannot manage project access, assign tasks, or promote themselves. Only workspace owners manage project admins.

Each task includes a chronological discussion with author, timestamp, comment preview, and review events. Comments and review actions use authenticated server actions and project authorization. Comments render as text so pasted HTML is not executed. Comment drafts are cleared only after a successful save. The existing five-second refresh brings in teammates' updates.

Open blockers, unfinished subtasks, and incomplete dependencies prevent submission or approval. Status changes and review events commit together in a serializable transaction. Repeated or conflicting approvals cannot create duplicate approvals. Recurrence and completion automations run only after approval, never on submission. Already completed tasks are preserved; a reviewer can reopen them for a new review cycle.

Validation: `npx tsx --env-file=.env tests/task-review.test.ts` requires a local database. Existing project authorization and invitation suites cover shared project boundaries. The browser check posts a comment, previews it, approves a disposable local task, and verifies the Done status and approval event.
