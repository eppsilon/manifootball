import { Command, OptionValues } from 'commander';

export function formatSpread(team: string, spread: string | number): string {
  return team && spread != null ? `${team} ${Number.isNaN(spread) || +spread < 0 ? '' : '+'}${+spread}` : 'unknown';
}

export function formatDate(date: Date): string {
  const year = `${date.getFullYear()}`.padStart(4, '0');
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return [year, month, day].join('-');
}

export function formatTime(date: Date, tz = 'ET'): string {
  const hrs = date.getHours();
  const hour = hrs > 12 ? hrs - 12 : hrs;
  const amPm = hrs >= 12 ? 'PM' : 'AM';
  const minute = date.getMinutes();
  const time = minute ? `${hour}:${('' + minute).padStart(2, '0')}` : `${hour}`;
  return `${time} ${tz}`;
}

export function mdBoldIf(condition: boolean, text: string) {
  return condition ? `**${text}**` : text;
}

export interface CommandBase extends AsyncDisposable {
  run(options: OptionValues): Promise<void>;
}

export interface CommandConstructor {
  new (): CommandBase;
  register(program: Command): Command;
}
