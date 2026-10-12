import { Frame, HEIGHT, WIDTH, rgb, textWidth, type Color } from 'aula-f75-max-screen';
import type { Provider, Row } from './kleis';

const BACKGROUND = rgb(10, 12, 16);
const RULE = rgb(60, 66, 76);
const TRACK = rgb(28, 32, 40);
const WHITE = rgb(235, 235, 235);
const MUTED = rgb(150, 156, 166);
const PROVIDER: Record<Provider, { mark: string; color: Color }> = {
  claude: { mark: 'C', color: rgb(230, 120, 60) },
  codex: { mark: 'X', color: rgb(60, 200, 120) },
};
const WARN = 70;
const ALERT = 90;
const NAME_CHARS = 6;
const PRIMARY_HEIGHT = 36;
const LINE_HEIGHT = 11;

function level(percent: number): Color {
  if (percent >= ALERT) return rgb(255, 40, 40);
  if (percent >= WARN) return rgb(255, 170, 0);
  return rgb(40, 200, 90);
}

const name = (row: Row) => row.label.replaceAll(/\s+/g, '').slice(0, NAME_CHARS);
const percent = (value: number | null) => (value === null ? '--' : `${value}%`);

function bar(frame: Frame, x: number, y: number, width: number, height: number, value: number | null): void {
  frame.rect(x, y, width, height, TRACK);
  if (value !== null) frame.rect(x, y, Math.max(1, Math.round((value / 100) * width)), height, level(value));
}

function rightText(frame: Frame, text: string, right: number, y: number, color: Color): void {
  frame.text(text, right - textWidth(text), y, color);
}

/** The window closer to its limit, with its label. */
function tightest({ short, long }: Row): { title: string; value: number | null } {
  if (long === null || (short !== null && short >= long)) return { title: '5H', value: short };
  return { title: 'WK', value: long };
}

function primary(frame: Frame, row: Row, y: number): void {
  frame.rect(0, y, 3, PRIMARY_HEIGHT - 3, PROVIDER[row.provider].color).text(name(row), 6, y + 1, WHITE, 2);
  [
    { title: '5H', value: row.short },
    { title: 'WK', value: row.long },
  ].forEach(({ title, value }, index) => {
    const line = y + 17 + index * 9;
    frame.text(title, 6, line, RULE);
    bar(frame, 20, line + 2, 76, 3, value);
    rightText(frame, percent(value), WIDTH - 1, line, value === null ? RULE : WHITE);
  });
}

function secondary(frame: Frame, row: Row, y: number): void {
  const { mark, color } = PROVIDER[row.provider];
  const { title, value } = tightest(row);
  frame
    .text(mark, 2, y + 1, color)
    .text(name(row), 10, y + 1, MUTED)
    .text(title, 52, y + 1, RULE);
  bar(frame, 66, y + 3, 32, 3, value);
  const ink = value === null ? RULE : value >= WARN ? level(value) : WHITE;
  rightText(frame, percent(value), WIDTH - 1, y + 1, ink);
}

/**
 * Primary accounts large, with both windows; the rest one line each, showing whichever window is tightest, so an
 * account near its limit still turns amber or red. Kleis has at most one primary account per provider, so the large
 * blocks always fit; secondary accounts that do not are left off.
 */
export function dashboard(rows: readonly Row[]): Frame {
  const frame = new Frame(BACKGROUND);
  let y = 1;
  for (const row of rows.filter((candidate) => candidate.primary)) {
    primary(frame, row, y);
    y += PRIMARY_HEIGHT;
  }
  const others = rows.filter((candidate) => !candidate.primary);
  if (y > 1 && others.length > 0) frame.rect(0, y - 2, WIDTH, 1, RULE);
  for (const row of others) {
    if (y + LINE_HEIGHT - 2 > HEIGHT) break;
    secondary(frame, row, y);
    y += LINE_HEIGHT;
  }
  return frame;
}
