import { Command, Option, OptionValues } from 'commander';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { setTimeout } from 'timers/promises';
import { FastcastConnection } from '../fastcast';
import { Log, LogLevel } from '../log';

export class LiveCommand implements AsyncDisposable {
  static register(program: Command): Command {
    Log.debug('LiveCommand register');
    return program
      .command('live')
      .requiredOption('--game <game>')
      .addOption(
        new Option('--topic <topic>')
          .default('football-college-football')
          .choices(['football-college-football', 'hockey-nhl'])
      );
  }

  private fc?: FastcastConnection;

  async run(options: OptionValues) {
    Log.setLevel(LogLevel.Debug);
    Log.debug('game', options.game);
    Log.debug('topic', options.topic);

    let done = false;

    this.fc = new FastcastConnection();
    this.fc.close$.subscribe(() => (done = true));

    await this.fc.connect();
    this.fc.subscribe(options.game, options.topic).subscribe(([sid, mid, data]) => {
      this.recordSnapshot(sid, mid, data);
    });

    process.stdin.on('data', buf => {
      if (buf[0] === 0x03) {
        done = true;
        Log.debug('exit');
      }
    });

    while (!done) {
      await setTimeout(5000);
    }

    Log.debug('done');
  }

  async [Symbol.asyncDispose](): Promise<void> {
    if (this.fc) {
      this.fc[Symbol.asyncDispose]();
    }
  }

  private async recordSnapshot(sid: string, mid: number, data: unknown) {
    const sessionDataPath = join('./live-data', sid);
    await mkdir(sessionDataPath, { recursive: true });
    await writeFile(join(sessionDataPath, `${mid}.json`), JSON.stringify(data, null, 2));
  }
}
