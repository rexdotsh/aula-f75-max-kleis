# AGENTS.md

A small program that shows kleis account quotas on the Aula F75 Max keyboard's screen, built on [aula-f75-max-screen](https://github.com/rexdotsh/aula-f75-max-screen).

## Commands

Bun only; oxfmt and oxlint. `bun run fmt:check`, `bun run lint`, `bun run knip`, `bun run check` and `bun run test` must pass before every push. `bun run preview out.png` renders without a keyboard.

## Layout

```
src/kleis.ts      kleis's /admin/accounts response, validated into rows
src/dashboard.ts  the rows drawn as a 128x128 frame
src/config.ts     settings from the environment
src/main.ts       the refresh loop
test              bun tests
```

## Invariants

- Nothing account-specific is ever committed: the URL, token, allowed account IDs and display names come from the untracked `.env`. Tests use made-up accounts.
- kleis's response is untrusted JSON, validated once in `kleis.ts`; nothing else reads it.
- Uploads flash the keyboard's progress screen, so an unchanged dashboard is never re-sent.
- The keyboard library's lock lets this run alongside the OpenCode plugin without interleaving uploads; whichever uploads last owns the screen.

## Code standards and workflow

As in [aula-f75-max-screen's AGENTS.md](https://github.com/rexdotsh/aula-f75-max-screen/blob/main/AGENTS.md).

## Privacy

This repository is public. It must never contain anything that identifies a person, an account or a deployment.
