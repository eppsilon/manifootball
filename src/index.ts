import { program } from 'commander';
import { AutocreateCommand } from './commands/autocreate';
import { CommentCommand } from './commands/comment';
import { LiveCommand } from './commands/live';
import { ScoreboardCommand } from './commands/scoreboard';
import { CommandBase, CommandConstructor } from './commands/util';

let command: CommandBase;
let commands: CommandConstructor[] = [AutocreateCommand, CommentCommand, ScoreboardCommand, LiveCommand];

try {
  program.name('mf').description('Manifootball').version('1.0.0');
  commands.forEach(c => {
    c.register(program).action(options => {
      console.debug('run command', c.name);
      command = new c();
      return command.run(options);
    });
  });
  await program.parseAsync();
} catch (e) {
  console.error(e);
  process.exit(1);
} finally {
  await command[Symbol.asyncDispose]();
  process.exit(0);
}

export {};
