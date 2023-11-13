import { program } from 'commander';
import { AutocreateCommand } from './commands/autocreate';
import { CommentCommand } from './commands/comment';
import { LiveCommand } from './commands/live';
import { ScoreboardCommand } from './commands/scoreboard';
import { CommandBase, CommandConstructor } from './commands/util';
import { Log, LogLevel } from './log';

let command: CommandBase | undefined;
let commands: CommandConstructor[] = [AutocreateCommand, CommentCommand, ScoreboardCommand, LiveCommand];

try {
  program.name('mf').description('Manifootball').version('1.0.0');
  commands.forEach(c => {
    c.register(program)
      .option('--verbose')
      .action(options => {
        if (options.verbose) {
          Log.setLevel(LogLevel.Debug);
        }
        Log.debug('run command', c.name);
        command = new c();
        return command.run(options);
      });
  });
  await program.parseAsync();
} catch (e) {
  Log.error(e);
  process.exit(1);
} finally {
  if (command) {
    await command[Symbol.asyncDispose]();
  }

  process.exit(0);
}

export {};
