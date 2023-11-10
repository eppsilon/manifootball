import { Command, Option, OptionValues } from 'commander';
import { mkdir, writeFile } from 'fs/promises';
import { compact, set, unset } from 'lodash-es';
import { inflate } from 'pako';
import { join } from 'path';
import { Subject, combineLatest, concatMap, filter, from, map, take, tap } from 'rxjs';
import { WebSocketSubject, webSocket } from 'rxjs/webSocket';
import { setTimeout } from 'timers/promises';
import WebSocket from 'ws';

const FC_URL = 'https://fastcast.semfs.engsvc.go.com/public/websockethost';

interface SocketOperation {
  op: 'B' | 'C' | 'H' | 'I' | 'P' | 'R' | 'S';
}

interface ConnectSocketOperation extends SocketOperation {
  op: 'C';
  rc?: 200;
  hbi?: number;
  sid?: string;
}

interface HeartbeatSocketOperation extends SocketOperation {
  op: 'H';
  useCDN: boolean;
  pl: string;
  tc: string;
  mid: number;
}

interface ResultSocketOperation extends SocketOperation {
  op: 'R';
  pl: string;
  mid: number;
  tc: string;
  lt?: boolean;
}

interface SessionSocketOperation extends SocketOperation {
  op: 'S';
  sid: string;
  tc: string;
}

type AnySocketOperation =
  | ConnectSocketOperation
  | HeartbeatSocketOperation
  | ResultSocketOperation
  | SessionSocketOperation;

interface DataOperation {
  op: 'add' | 'replace' | 'remove';
}

interface AddDataOperation extends DataOperation {
  op: 'add';
  path: string;
  value: Record<string, unknown>;
}

interface ReplaceDataOperation extends DataOperation {
  op: 'replace';
  path: string;
  value: string;
}

interface RemoveDataOperation extends DataOperation {
  op: 'remove';
  path: string;
}

type AnyDataOperation = AddDataOperation | ReplaceDataOperation | RemoveDataOperation;

export class LiveCommand implements AsyncDisposable {
  ws$: WebSocketSubject<AnySocketOperation>;

  constructor(program: Command) {
    program
      .command('live')
      .argument('<game>')
      .addOption(
        new Option('--topic <topic>')
          .default('football-college-football')
          .choices(['football-college-football', 'hockey-nhl'])
      )
      .action((game, options) => this.run(game, options));
  }

  async run(game: string, options: OptionValues) {
    console.log('game', game);
    console.log('topic', options.topic);

    const { ip, securePort, token }: { ip: string; port: number; securePort: number; token: string } = await (
      await fetch(FC_URL)
    ).json();

    const open$ = new Subject<Event>();
    const closing$ = new Subject<void>();
    const close$ = new Subject<Event>();

    let done = false;

    this.ws$ = webSocket<AnySocketOperation>({
      url: `wss://${ip}:${securePort}/FastcastService/pubsub/profiles/12000?TrafficManager-Token=${token}`,
      openObserver: open$,
      closingObserver: closing$,
      closeObserver: close$,
      WebSocketCtor: WebSocket,
    });

    open$.subscribe(() => console.log('open'));
    closing$.subscribe(e => console.log('closing', e));
    close$.subscribe(() => {
      console.log('close');
      done = true;
    });

    this.ws$.subscribe();

    this.ws$.pipe(tap(data => console.log('message', data))).subscribe();

    const sid$ = this.ws$.pipe(
      filter(data => data.op === 'C'),
      map(data => data['sid'])
    );

    sid$.pipe(take(1)).subscribe(sid => {
      this.ws$.next({ op: 'S', sid, tc: `gp-${options.topic}-${game}` } as SessionSocketOperation);
    });

    const hb$ = this.ws$.pipe(
      filter(data => data.op === 'H'),
      map(data => data as HeartbeatSocketOperation),
      concatMap(data => from(fetch(data.pl)).pipe(map(pl => [data.mid, pl] as [number, Response]))),
      concatMap(([mid, pl]) => from(pl.json()).pipe(map(data => [mid, data] as [number, Record<string, unknown>])))
    );

    const operations$ = this.ws$.pipe(
      filter(data => data.op === 'R'),
      map(data => JSON.parse(data['pl']) as { ts: number; '~c': 1; pl: string }),
      map(pl => {
        try {
          return (
            pl['~c'] ? JSON.parse(inflate(Buffer.from(pl.pl, 'base64'), { to: 'string' })) : pl.pl
          ) as AnyDataOperation[];
        } catch (e) {
          console.error('inflate error', e);
        }
      }),
      tap(ops => console.log('ops', ops))
    );

    combineLatest([sid$, hb$, operations$])
      .pipe(
        map(([sid, [mid, data], ops]) => {
          for (const op of ops) {
            try {
              switch (op.op) {
                case 'add':
                  break;
                case 'replace':
                  set(data, asLodashPath(op.path), op.value);
                  break;
                case 'remove':
                  unset(data, asLodashPath(op.path));
                  break;
              }
            } catch (e) {
              console.error('failed to apply operation', op, e);
            }
          }
          return [sid, mid, data];
        }),
        concatMap(([sid, mid, data]) => from(recordSnapshot(sid, mid, data)))
      )
      .subscribe();

    process.stdin.on('data', buf => {
      if (buf[0] === 0x03) {
        done = true;
        console.log('exit');
      }
    });

    this.ws$.next({ op: 'C' });

    while (!done) {
      console.log('waiting');
      await setTimeout(5000);
    }

    console.log('done');
  }

  async [Symbol.asyncDispose](): Promise<void> {
    console.log('dispose');
    this.ws$.complete();
  }
}

function asLodashPath(path: string) {
  return compact(path.split('/')).join('.');
}

async function recordSnapshot(sid: string, mid: number, data: unknown) {
  const sessionDataPath = join('./live-data', sid);
  await mkdir(sessionDataPath, { recursive: true });
  await writeFile(join(sessionDataPath, `${mid}.json`), JSON.stringify(data, null, 2));
}
