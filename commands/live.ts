import { Command, Option, OptionValues } from 'commander';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { setTimeout } from 'timers/promises';
import { FastcastConnection } from '../fastcast';

export class LiveCommand implements AsyncDisposable {
  fc: FastcastConnection;

  static register(program: Command): Command {
    console.debug('LiveCommand register');
    return program
      .command('live')
      .requiredOption('--game <game>')
      .addOption(
        new Option('--topic <topic>')
          .default('football-college-football')
          .choices(['football-college-football', 'hockey-nhl'])
      );
  }

  async run(options: OptionValues) {
    console.log('game', options.game);
    console.log('topic', options.topic);

    let done = false;

    this.fc = new FastcastConnection();
    this.fc.close$.subscribe(() => (done = true));

    await this.fc.connect();
    this.fc.subscribe(options.game, options.topic).subscribe(([sid, mid, data]) => {
      this.recordSnapshot(sid, mid, data);
      console.log('snap');
    });

    process.stdin.on('data', buf => {
      if (buf[0] === 0x03) {
        done = true;
        console.log('exit');
      }
    });

    while (!done) {
      console.log('waiting');
      await setTimeout(5000);
    }

    console.log('done');
  }

  async [Symbol.asyncDispose](): Promise<void> {
    console.log('dispose');
    this.fc[Symbol.asyncDispose]();
  }

  private async recordSnapshot(sid: string, mid: number, data: unknown) {
    const sessionDataPath = join('./live-data', sid);
    await mkdir(sessionDataPath, { recursive: true });
    await writeFile(join(sessionDataPath, `${mid}.json`), JSON.stringify(data, null, 2));
  }
}