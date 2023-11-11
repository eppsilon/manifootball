import { program } from 'commander';
import { AutocreateCommand } from './commands/autocreate';
import { CommentCommand } from './commands/comment';
import { LiveCommand } from './commands/live';
import { ScoreboardCommand } from './commands/scoreboard';
import * as packageJson from './package.json';

const commands: AsyncDisposable[] = [];

try {
  program.name('mf').description('Manifootball').version(packageJson['version']);
  commands.push(
    new AutocreateCommand(program),
    new CommentCommand(program),
    new ScoreboardCommand(program),
    new LiveCommand(program)
  );
  await program.parseAsync();
} catch (e) {
  console.error(e);
  process.exit(1);
} finally {
  await Promise.allSettled(
    commands.map(c => (c[Symbol.asyncDispose] ? c[Symbol.asyncDispose]() : c[Symbol.dispose]()))
  );
  process.exit(0);
}

export {};
