import { program } from 'commander';
import { AutocreateCommand } from './commands/autocreate';
import { LiveCommand } from './commands/live';
import { ScoreboardCommand } from './commands/scoreboard';
import * as packageJson from './package.json';

const commands: AsyncDisposable[] = [];
try {
  program.name('mf').description('Manifootball').version(packageJson['version']);
  commands.push(new AutocreateCommand(program), new ScoreboardCommand(program), new LiveCommand(program));
  await program.parseAsync();
} catch {
  process.exit(1);
} finally {
  await Promise.allSettled(
    commands.map(c => (c[Symbol.asyncDispose] ? c[Symbol.asyncDispose]() : c[Symbol.dispose]()))
  );
  process.exit(0);
}

export {};
