import { stdin, stdout } from 'node:process';
import readline from 'node:readline/promises';

export class ReadlinePrompter implements AsyncDisposable {
  rl?: readline.Interface;

  initialize() {
    this.rl = readline.createInterface({ input: stdin, output: stdout });
  }

  async confirm(prompt: string): Promise<'Y' | 'N' | 'Q'> {
    if (!this.rl) {
      throw new Error('must initialize before prompting');
    }

    let response = (await this.rl.question(`${prompt} [Y/N/Q] (N) `)).toUpperCase();
    if (response !== 'Y' && response !== 'Q') {
      response = 'N';
    }
    return response as 'Y' | 'N' | 'Q';
  }

  async select(prompt: string, defaultResponse: number | 'N' = 'N'): Promise<number | 'N' | 'Q'> {
    if (!this.rl) {
      throw new Error('must initialize before prompting');
    }

    let response: string | number | 'N' | 'Q' = (
      await this.rl.question(`${prompt} [#/N/Q] (${defaultResponse}) `)
    ).toUpperCase();

    if (response !== '' && !Number.isNaN(+response)) {
      return +response;
    }

    if (response !== 'Q' && response !== 'N') {
      response = defaultResponse;
    }

    return response as number | 'N' | 'Q';
  }

  async [Symbol.asyncDispose](): Promise<void> {
    // Must fully clean up readline or other programs in the same shell will not work correctly.
    this.rl?.close();
    this.rl?.removeAllListeners();
    stdin.end();
    stdin.destroy();
  }
}
