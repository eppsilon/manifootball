# Manifootball

[Manifold](https://manifold.markets) lets anyone create prediction markets using play money. This tool uses the [Manifold API](https://docs.manifold.markets/api) and data from [College Football Data](https://collegefootballdata.com) to automatically create a market for each game in a given week.

## Usage

Clone this repository. Install [Bun](https://bun.sh) if necessary, then run `bun install` in the repo folder. Create a file called `config.ts` with these constants:

```ts
export const CFB_API_KEY = 'ABCXYZ'; // get a key here: https://collegefootballdata.com/key
export const MF_API_KEY = 'big-honkin-guid'; // find your key by editing your Manifold user profile
export const CFB_WEEK = 42; // set to week number 1-14 (ish) to create games for
```

Find the `matching-games.json` file and delete it. This is a mapping between CFB Data game IDs and Manifold market IDs, and a new one will be created after you use the tool the first time.

Now run the script with Bun:

```sh
bun index.ts
```

The tool will show the teams/time of each game and ask whether you want to create a market for it:

```
2023-10-26 at 4:30 PM ET: Syracuse (1451) @ Virginia Tech (1466)
Create market? [Y/N/Q] (N) y
Create market {
  "question": "🏈 2023 NCAAF: Will Syracuse beat Virginia Tech?",
  "outcomeType": "BINARY",
  "description": "2023-10-26 at 7:30 PM ET",
  "closeTime": 1698363000000,
  "initialProb": 50
}? [Y/N/Q] (N) y
Market created { … }
```

## Features

- Fetches the schedule for a week of games and creates a market for each.
- Puts the start time in the description and sets the close time to `start time + 4 hrs`.
- Looks up each team's AP ranking and adds it to the question text.
- Searches for markets you've already created and lets you match them up with games (so as to not create duplicates).
- Sets topics (groups) on each market, including those for the conferences of the teams involved.
- Checks descriptions and close times and suggests corrections.

## Limitations

- Cannot update question, description, or close time via API (no Manifold API route exists).
- Can only create binary questions with an initial probability of 50%, but this could be modified easily.

## To Do

- [ ] Support updating markets once API support arrives.
- [ ] Support posting a comment on every game's market.
- [ ] Support monitoring game progress and extending close times.
- [ ] Support placing an initial bet on every market after creating it.
- [ ] Use `yargs` or similar library for ARGV parsing and subcommands.
- [ ] Use `debug` or similar for configurable log levels.
- [ ] Maybe: create NPM package to allow installing as a global or running with `bunx`/`npx`.
