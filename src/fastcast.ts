import { compact, set, unset } from 'lodash-es';
import { inflate } from 'pako';
import { Subject, combineLatest, concatMap, filter, from, map, shareReplay, take, takeUntil, tap } from 'rxjs';
import { WebSocketSubject, webSocket } from 'rxjs/webSocket';
import WebSocket from 'ws';

const FC_URL = 'https://fastcast.semfs.engsvc.go.com/public/websockethost';

type WebSocketCtor = new (url: string, protocols?: string | string[]) => globalThis.WebSocket;

interface WebSocketInfo {
  ip: string;
  port: number;
  securePort: number;
  token: string;
}

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

interface ResultOperationPayload {
  ts: number;
  '~c': 1;
  pl: string;
}

interface ResultSocketOperation extends SocketOperation {
  op: 'R';
  pl: string;
  mid: number;
  tc: string;
  lt?: boolean;
}

function isResultSocketOperation(obj: unknown): obj is ResultSocketOperation {
  return typeof obj === 'object' && obj != null && 'op' in obj && obj.op === 'R';
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

export class FastcastConnection implements AsyncDisposable {
  private readonly destroy$ = new Subject<boolean>();

  ws$: WebSocketSubject<AnySocketOperation>;

  open$ = new Subject<Event>();
  message$ = new Subject<AnySocketOperation>();
  closing$ = new Subject<void>();
  close$ = new Subject<Event>();

  sid$ = this.message$.pipe(
    filter(data => data.op === 'C'),
    map(data => data['sid'] as string),
    shareReplay()
  );

  async connect() {
    const { ip, securePort, token }: WebSocketInfo = await (await fetch(FC_URL)).json();

    this.ws$ = webSocket<AnySocketOperation>({
      url: `wss://${ip}:${securePort}/FastcastService/pubsub/profiles/12000?TrafficManager-Token=${token}`,
      openObserver: this.open$,
      closingObserver: this.closing$,
      closeObserver: this.close$,
      WebSocketCtor: WebSocket as unknown as WebSocketCtor,
    });

    this.open$.pipe(takeUntil(this.destroy$)).subscribe(() => console.log('open'));
    this.closing$.pipe(takeUntil(this.destroy$)).subscribe(e => console.log('closing', e));
    this.close$.pipe(takeUntil(this.destroy$)).subscribe(() => console.log('close'));

    this.ws$
      .pipe(
        takeUntil(this.destroy$),
        tap(data => console.log('message', data))
      )
      .subscribe(this.message$);

    this.ws$.next({ op: 'C' });
  }

  subscribe(game: string, topic: string) {
    if (!this.ws$) {
      throw new Error('connect before subscribing');
    }

    this.sid$.pipe(takeUntil(this.destroy$), take(1)).subscribe(sid => {
      this.ws$.next({ op: 'S', sid, tc: `gp-${topic}-${game}` } as SessionSocketOperation);
    });

    const hb$ = this.ws$.pipe(
      filter(data => data.op === 'H'),
      map(data => data as HeartbeatSocketOperation),
      concatMap(data => from(fetch(data.pl)).pipe(map(pl => [data.mid, pl] as const))),
      concatMap(([mid, pl]) => from(pl.json()).pipe(map(data => [mid, data] as const)))
    );

    const operations$ = this.ws$.pipe(
      filter(data => isResultSocketOperation(data)),
      map(data => this.parseResult(data as ResultSocketOperation)),
      tap(ops => console.log('ops', ops))
    );

    return combineLatest([this.sid$, hb$, operations$]).pipe(
      map(([sid, [mid, data], ops]) => {
        this.applyOperations(data, ops);
        return [sid, mid, data] as const;
      })
    );
  }

  async [Symbol.asyncDispose](): Promise<void> {
    console.log('dispose');
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
    this.ws$.complete();
  }

  private parseResult(data: ResultSocketOperation): AnyDataOperation[] {
    try {
      const payload = JSON.parse(data.pl) as ResultOperationPayload;

      const compressed = !!payload['~c'];
      if (compressed) {
        return JSON.parse(inflate(Buffer.from(payload.pl, 'base64'), { to: 'string' })) as AnyDataOperation[];
      }

      return payload.pl as unknown as AnyDataOperation[];
    } catch (e) {
      console.error('inflate error', e);
      return [];
    }
  }

  private applyOperations<T extends object>(data: T, ops: AnyDataOperation[]): void {
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
  }
}

function asLodashPath(path: string) {
  return compact(path.split('/')).join('.');
}
