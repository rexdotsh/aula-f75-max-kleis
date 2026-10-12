import { Animation, Keyboard, png } from 'aula-f75-max-screen';
import { parseArgs } from 'node:util';
import { config } from './config';
import { dashboard } from './dashboard';
import { fetchRows } from './kleis';

const settings = config(process.env);
const {
  values: { preview },
} = parseArgs({ options: { preview: { type: 'string' } } });

const log = (message: string, error?: unknown) =>
  console.error(`${new Date().toISOString()} ${message}`, ...(error === undefined ? [] : [error]));

async function render() {
  return dashboard(await fetchRows(settings.url, settings.token, settings.selection));
}

if (preview) {
  await Bun.write(preview, png([(await render()).pixels]));
  log(`wrote ${preview}`);
  process.exit(0);
}

let shown: string | undefined;
let missing = false;

// Uploads flash the keyboard's progress screen, so an unchanged dashboard is not sent again.
async function tick(): Promise<void> {
  const frame = await render();
  const picture = Buffer.from(frame.pixels.buffer).toString('base64');
  if (picture === shown) return;
  const keyboard = await Keyboard.open();
  if (!keyboard) {
    if (!missing) log('keyboard not plugged in; trying again each refresh');
    missing = true;
    return;
  }
  missing = false;
  try {
    await keyboard.upload(Animation.still(frame));
    shown = picture;
    log('dashboard updated');
  } finally {
    await keyboard.close();
  }
}

log(`refreshing every ${settings.intervalMs / 60_000} min`);
for (;;) {
  // oxlint-disable-next-line no-await-in-loop -- one refresh at a time, forever
  await tick().catch((error: unknown) => log('refresh failed', error));
  // oxlint-disable-next-line no-await-in-loop -- waiting between refreshes
  await Bun.sleep(settings.intervalMs);
}
