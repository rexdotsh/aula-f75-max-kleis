# aula-f75-max-kleis

Shows [kleis](https://github.com/rexdotsh/kleis) account quotas on the Aula F75 Max keyboard's screen: one row per Claude (`C`) or Codex (`X`) account, with its five-hour and weekly usage as bars that turn amber at 70% and red at 90%.

Built on [aula-f75-max-screen](https://github.com/rexdotsh/aula-f75-max-screen). The keyboard must be plugged in over USB.

```sh
bun install
cp .env.example .env   # then fill it in
bun run preview out.png   # render once without the keyboard
bun start                 # refresh the screen every few minutes
```

## Configuration

Everything account-specific lives in `.env`, which is not tracked:

| Variable                 | Meaning                                                               |
| ------------------------ | --------------------------------------------------------------------- |
| `KLEIS_URL`              | the kleis server                                                      |
| `KLEIS_TOKEN`            | its `ADMIN_TOKEN`                                                     |
| `KLEIS_IGNORE`           | account IDs to leave out, comma separated                             |
| `KLEIS_NAMES`            | `label=name` pairs to show instead of kleis labels (6 characters fit) |
| `KLEIS_INTERVAL_MINUTES` | how often to refresh, default 5                                       |

Each upload flashes the keyboard's own progress screen for about 1.5s, so the dashboard is only sent again when it changed.
