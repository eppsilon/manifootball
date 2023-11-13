import { Command, OptionValues } from 'commander';
import { isDate } from 'date-fns';

export function formatSpread(team: string, spread: string | number): string {
  return team && spread != null ? `${team} ${Number.isNaN(spread) || +spread < 0 ? '' : '+'}${+spread}` : 'unknown';
}

export function formatDate(date: Date | number): string {
  const d = isDate(date) ? (date as Date) : new Date(date);
  const year = `${d.getFullYear()}`.padStart(4, '0');
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return [year, month, day].join('-');
}

export function formatTime(date: Date | number, tz = 'ET'): string {
  const d = isDate(date) ? (date as Date) : new Date(date);
  const hrs = d.getHours();
  const hour = hrs > 12 ? hrs - 12 : hrs;
  const amPm = hrs >= 12 ? 'PM' : 'AM';
  const minute = d.getMinutes();
  const time = minute ? `${hour}:${('' + minute).padStart(2, '0')}` : `${hour}`;
  return `${time} ${amPm} ${tz}`;
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
