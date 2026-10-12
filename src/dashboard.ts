import { Frame, WIDTH, rgb, textWidth, type Color } from 'aula-f75-max-screen';
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

const NAME_CHARS = 6;
const TOP = 15;
const ROW_HEIGHT = 16;
const BAR_HEIGHT = 11;
const BAR_WIDTH = 39;
const COLUMNS = [
  { title: '5H', x: 47, usage: (row: Row) => row.short },
  { title: 'WK', x: 88, usage: (row: Row) => row.long },
] as const;
const MAX_ROWS = 7;

function level(percent: number): Color {
  if (percent >= 90) return rgb(255, 40, 40);
  if (percent >= 70) return rgb(255, 170, 0);
  return rgb(40, 200, 90);
}

function bar(frame: Frame, x: number, y: number, percent: number | null): void {
  frame.rect(x, y, BAR_WIDTH, BAR_HEIGHT, TRACK);
  if (percent === null) return;
  frame.rect(x, y, Math.max(1, Math.round((percent / 100) * BAR_WIDTH)), BAR_HEIGHT, level(percent));
  const text = `${percent}%`;
  frame.text(text, x + BAR_WIDTH - 2 - textWidth(text), y + 2, WHITE);
}

/** Each account's short and long windows as bars, primary accounts brighter. */
export function dashboard(rows: readonly Row[]): Frame {
  const frame = new Frame(BACKGROUND).text('KLEIS', 2, 2, WHITE).rect(0, 11, WIDTH, 1, RULE);
  for (const { title, x } of COLUMNS) frame.text(title, x + (BAR_WIDTH - textWidth(title)) / 2, 2, RULE);
  rows.slice(0, MAX_ROWS).forEach((row, index) => {
    const y = TOP + index * ROW_HEIGHT;
    const { mark, color } = PROVIDER[row.provider];
    frame.text(mark, 2, y + 2, color);
    frame.text(row.label.replaceAll(/\s+/g, '').slice(0, NAME_CHARS), 9, y + 2, row.primary ? WHITE : MUTED);
    for (const { x, usage } of COLUMNS) bar(frame, x, y, usage(row));
  });
  return frame;
}
