# Chat history for this project

Every Claude Code conversation that built this repository, exported from the laptop so work can continue anywhere.
A new Claude session (cloud or local) cannot resume these chats. It reads them as reference, starting with the root `CLAUDE.md`.

| Session | Period | Your messages | Tool calls | Context summaries |
|---|---|---|---|---|
| [Session 1](session-1_2026-08-12_345f99ad.md) | 2026-08-12 → 2026-08-13 | 7 | 560 | 0 |
| [Session 2](session-2_2026-08-12_2a9fa21c.md) | 2026-08-12 → 2026-09-17 | 28 | 2427 | 3 |

## What to read first

1. `CLAUDE.md` in the repo root: current status, rules and the next task.
2. `BUILD_README.md`: what each module built and why.
3. The **context summaries** in the Session 2 log, especially the last one. Each is a detailed recap written when the conversation was compacted.

## Raw transcripts

`raw/*.jsonl.gz` are the complete original transcripts (gzip-compressed JSON Lines), with secret-looking strings redacted.
To read one: `gunzip -c raw/<id>.jsonl.gz | less`.
