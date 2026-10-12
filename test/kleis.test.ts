import { expect, test } from 'bun:test';
import { rows, type Row } from '../src/kleis';

const window = (usedPercent: number, windowSeconds: number) => ({ usedPercent, windowSeconds });
const claude = (id: string, label: string, fiveHour: number | null, sevenDay: number | null) => ({
  id,
  provider: 'claude',
  label,
  isPrimary: false,
  enabled: true,
  quota: { data: { subscription: { fiveHour: { utilization: fiveHour }, sevenDay: { utilization: sevenDay } } } },
});
const codex = (id: string, label: string, primaryWindow: unknown, secondaryWindow: unknown) => ({
  id,
  provider: 'codex',
  label,
  isPrimary: false,
  enabled: true,
  quota: { data: { status: { primaryWindow, secondaryWindow } } },
});
const selection = { ignored: new Set(['hidden']), names: new Map([['long label', 'short']]) };

test.each<[string, unknown, Partial<Row>[]]>([
  ['claude reports its five-hour and seven-day windows', [claude('a', 'one', 31, 80)], [{ short: 31, long: 80 }]],
  [
    'codex windows are told apart by length, whichever slot they arrive in',
    [codex('a', 'one', window(10, 604_800), window(4, 18_000))],
    [{ short: 4, long: 10 }],
  ],
  [
    'a codex account with only a 30-day window has no short window',
    [codex('a', 'one', window(2, 2_592_000), null)],
    [{ short: null, long: 2 }],
  ],
  [
    'an account without quota data shows empty bars',
    [{ ...claude('a', 'one', 0, 0), quota: null }],
    [{ short: null, long: null }],
  ],
  ['ignored accounts are left out', [claude('hidden', 'one', 1, 1), claude('b', 'two', 1, 1)], [{ id: 'b' }]],
  ['disabled accounts are left out', [{ ...claude('a', 'one', 1, 1), enabled: false }], []],
  ['a configured name replaces the kleis label', [claude('a', 'long label', 1, 1)], [{ label: 'short' }]],
  ['usage outside 0-100 is clamped', [claude('a', 'one', 140, -3)], [{ short: 100, long: 0 }]],
])('%s', (_, accounts, expected) => {
  const result = rows({ accounts }, selection);
  expect(result).toHaveLength(expected.length);
  expected.forEach((row, index) => expect(result[index]).toMatchObject(row));
});

test('a response without an account list is refused', () => {
  expect(() => rows({ error: 'unauthorized' }, selection)).toThrow(TypeError);
});
