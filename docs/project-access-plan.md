# Project authorization implementation

Workspace LEADER is the owner override. ProjectMembership assigns ADMIN or MEMBER to existing workspace members. Project admins manage assignments and membership only in their own project and cannot promote another admin. Owners manage roles and create projects. Every task and thread operation verifies project access; legacy tasks without projects remain owner-only.

Dashboard and planner reads scope projects, tasks, people and capacity on the server. Project selection limits shared-member workload to that project. Workspace-global planning resources remain owner-only. Existing task assignees are backfilled as project members. Regression coverage exercises isolated projects, shared members and escalation denial.

Implementation: schema and backfill; centralized policy; guarded actions; scoped reads; role-management and selected-project UI; authorization tests and typecheck.

## Verification and rollout

Run `npx prisma migrate deploy` against the intended database before serving the new application, then `npx prisma generate`. The migration adds membership rows for existing task assignees who are workspace members; it does not grant unassigned workspace members access. Owners explicitly assign project admins/members in the project selector's access section. Unprojected legacy tasks remain accessible only to owners, who can move them into projects. Moving an assigned task requires its assignee to belong to the destination project.

Local validation: `npx prisma validate`, `npx tsc --noEmit`, and `node --env-file=.env --import tsx tests/project-authorization.test.ts`. The test refuses nonlocal databases and cleans its isolated fixture workspace and users. It verifies the shared authorization policy used by actions; it is not a browser/session end-to-end test. Workspace-global docs, goals, templates, fields, sprints and automation configuration remain owner-only. Admins can add an existing workspace member by exact email without browsing other projects' people. Removing project membership unassigns that user's project tasks.

### Concurrent assignment invariant

PostgreSQL 15+ is required. Migration `20261028010000_assignment_membership_constraint` adds a composite foreign key from Task(projectId, assigneeId) to ProjectMembership(projectId, userId). Membership deletion atomically clears only assigneeId and keeps projectId. Concurrent stale recurrence, auto-pull, dispatch, creation or reassignment cannot restore an assignment after roster removal; the database rejects it. Any legacy projected assignment without a valid roster entry is unassigned before adding the constraint. Owner-only unprojected assignments are unaffected.

The subset-column `ON DELETE SET NULL (assigneeId)` is SQL-managed because Prisma schema syntax cannot express that action. Preserve this migration and use migration deployment for schema changes rather than replacing the database with a schema push. Regression tests overlap a membership-deletion transaction and a stale task creation on another connection, then verify rejection, unassignment and project preservation.
