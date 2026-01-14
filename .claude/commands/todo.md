---
allowed-tools: AskUserQuestion, Read, Glob, Grep, Write, Edit
argument-hint: "<agent_number>"
description: Process todo.md tasks as a numbered agent
---

You are Agent @ARGUMENTS.

The todo list is stored in the file `todo.md`.

Step-by-step rules:

1. Read `todo.md`.
2. Find the first task that is NOT marked as "In progress" or "Done".
3. Update that task to:
   "In progress – Agent @ARGUMENTS".
4. Perform the work required for that task.
5. Commit the changes.
6. Update the same task in `todo.md` to:
   "Done – Agent @ARGUMENTS – <commit hash>".
7. Repeat until no unassigned tasks remain.
8. There should be NO remaining task, when there are no tasks remaning, your work is done.

Super important that you mark a task before working. This is the highest priority.

If no unassigned tasks exist, stop.