# Data Aggregation Pipeline

## Goal

Merge `WorldCupMatches.csv` (match-level) and `WorldCups.csv` (tournament-level) into a single `WorldCupDataset.csv` with one row per match — enriching the neural network's training set from 22 rows to 980.

## Decision: Single Network over Ensemble

A single merged dataset was chosen over two separate neural networks because:

- The features are complementary (tournament context + team performance), not independent
- An ensemble would add complexity with no benefit at this data scale
- 22 tournament-level rows alone would always underfit a separate network

## Pipeline

### 1. Fill Missing Matches (`npm run fill-matches`)

`src/fill-matches.ts` backfills 2018 and 2022 World Cup matches (128 total) into `WorldCupMatches.csv`, which originally only covered 1930–2014.

Data sources:

- **Fjelstul World Cup Database** (GitHub) — dates, stadiums, cities, teams, scores, extra time, penalties, referees
- **Fjelstul goals.csv** — used to compute half-time scores (counting first-half goals per team)
- **Wikipedia 2018 WC page** — match-by-match attendance (matched by date + venue)
- **Kaggle (shreeparab1890)** — 2022 match attendance

Downloaded sources are stored in `.tmp/` (not committed).

Columns filled: `Datetime`, `Stage`, `Stadium`, `City`, `Home/Away Team`, `Goals`, `Win conditions`, `Attendance`, `Half-time scores`, `Referee`, `Team Initials`.

Columns left empty (not available in sources, not used by model): `Assistant 1`, `Assistant 2`, `RoundID`, `MatchID`.

### 2. Aggregate Dataset (`npm run aggregate`)

`src/aggregate.ts` reads both CSVs and produces `WorldCupDataset.csv` (one row per match, joined on Year):

| Column                     | Source              | Type        |
| -------------------------- | ------------------- | ----------- |
| Year                       | WorldCupMatches.csv | Numeric     |
| Datetime                   | WorldCupMatches.csv | Temporal    |
| Stage                      | WorldCupMatches.csv | Categorical |
| Stadium                    | WorldCupMatches.csv | Categorical |
| City                       | WorldCupMatches.csv | Categorical |
| Referee                    | WorldCupMatches.csv | Categorical |
| Assistant1 / Assistant2    | WorldCupMatches.csv | Categorical |
| Host                       | WorldCups.csv       | Categorical |
| TournamentGoals            | WorldCups.csv       | Numeric     |
| QualifiedTeams             | WorldCups.csv       | Numeric     |
| TournamentMatches          | WorldCups.csv       | Numeric     |
| Winner                     | WorldCups.csv       | Label       |

### 3. Nix Setup

Added `nix develop` option to `README.md` for reproducible Node.js 22 environment via `flake.nix`.

## Output

- `WorldCupMatches.csv` — 980 data rows (1930–2022, all 900+ matches)
- `WorldCupDataset.csv` — 980 rows (one per match, joined with tournament info, 1930–2022)
