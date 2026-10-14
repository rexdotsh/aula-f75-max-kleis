import type { Selection } from './kleis';

export interface Config {
  url: string;
  token: string;
  selection: Selection;
  intervalMs: number;
}

const DEFAULT_INTERVAL_MINUTES = 5;

const list = (value: string | undefined) =>
  (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

function names(value: string | undefined): Map<string, string> {
  return new Map(
    list(value).map((pair) => {
      const at = pair.lastIndexOf('=');
      if (at <= 0 || at === pair.length - 1) throw new Error(`KLEIS_NAMES entries are label=name, not "${pair}"`);
      return [pair.slice(0, at).trim(), pair.slice(at + 1).trim()];
    }),
  );
}

/** Everything account-specific comes from the environment (a local, untracked `.env`), never from the repository. */
export function config(env: Readonly<Record<string, string | undefined>>): Config {
  const { KLEIS_URL: url, KLEIS_TOKEN: token, KLEIS_ACCOUNTS, KLEIS_NAMES, KLEIS_INTERVAL_MINUTES } = env;
  if (!url) throw new Error('set KLEIS_URL to the kleis server, e.g. https://kleis.example.com');
  if (!token) throw new Error("set KLEIS_TOKEN to kleis's ADMIN_TOKEN");
  const allowed = new Set(list(KLEIS_ACCOUNTS));
  if (allowed.size === 0) throw new Error('set KLEIS_ACCOUNTS to the IDs of the accounts to show, comma separated');
  const minutes = Number(KLEIS_INTERVAL_MINUTES ?? DEFAULT_INTERVAL_MINUTES);
  if (!(Number.isFinite(minutes) && minutes >= 1)) throw new Error('KLEIS_INTERVAL_MINUTES must be at least 1');
  return {
    url,
    token,
    selection: { allowed, names: names(KLEIS_NAMES) },
    intervalMs: minutes * 60_000,
  };
}
