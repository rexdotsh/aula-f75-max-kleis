export type Provider = 'claude' | 'codex';

/** One account's usage: the short (about 5 hours) and long (a week or more) windows, in percent; null when absent. */
export interface Row {
  id: string;
  provider: Provider;
  label: string;
  primary: boolean;
  short: number | null;
  long: number | null;
}

const DAY_SECONDS = 86_400;

type Json = Record<string, unknown>;

const object = (value: unknown): Json | undefined =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value))
    : undefined;
const percent = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : null;

function claude(data: Json | undefined): Pick<Row, 'short' | 'long'> {
  const subscription = object(data?.subscription);
  return {
    short: percent(object(subscription?.fiveHour)?.utilization),
    long: percent(object(subscription?.sevenDay)?.utilization),
  };
}

// Codex reports up to two windows without saying which is which, so they are told apart by length.
function codex(data: Json | undefined): Pick<Row, 'short' | 'long'> {
  const status = object(data?.status);
  const windows = [object(status?.primaryWindow), object(status?.secondaryWindow)].filter((window) => window);
  const find = (short: boolean) => {
    const window = windows.find((candidate) => {
      const seconds = candidate?.windowSeconds;
      return typeof seconds === 'number' && seconds <= DAY_SECONDS === short;
    });
    return percent(window?.usedPercent);
  };
  return { short: find(true), long: find(false) };
}

const USAGE: Record<Provider, (data: Json | undefined) => Pick<Row, 'short' | 'long'>> = { claude, codex };

const isProvider = (value: unknown): value is Provider => value === 'claude' || value === 'codex';

/** Which accounts to show, by ID, and the names to show instead of their kleis labels. */
export interface Selection {
  allowed: ReadonlySet<string>;
  names: ReadonlyMap<string, string>;
}

/** The rows for kleis's `/admin/accounts` response: the enabled Claude and Codex accounts that are allowed. */
export function rows(body: unknown, { allowed, names }: Selection): Row[] {
  const accounts = object(body)?.accounts;
  if (!Array.isArray(accounts)) throw new TypeError('kleis returned no account list');
  return accounts.flatMap((value): Row[] => {
    const account = object(value);
    const { id, provider, label, isPrimary, enabled } = account ?? {};
    if (typeof id !== 'string' || !isProvider(provider) || enabled !== true || !allowed.has(id)) return [];
    const shown = typeof label === 'string' && label ? label : provider;
    return [
      {
        id,
        provider,
        label: names.get(shown) ?? shown,
        primary: isPrimary === true,
        ...USAGE[provider](object(object(account?.quota)?.data)),
      },
    ];
  });
}

export async function fetchRows(url: string, token: string, selection: Selection): Promise<Row[]> {
  const response = await fetch(new URL('/admin/accounts', url), {
    headers: { authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`kleis answered ${response.status} ${response.statusText}`);
  return rows(await response.json(), selection);
}
