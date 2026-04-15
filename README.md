# Simple Multi Neural Network

A TensorFlow.js neural network that predicts 2026 FIFA World Cup winners based on historical tournament data.

## Architecture

```
Input Layer (N features)  -->  Hidden Layer (N units, ReLU)  -->  Output Layer (8 classes, Softmax)
```

- **Loss**: Categorical Crossentropy
- **Optimizer**: Adam
- **Preprocessing**: Min-max normalization for numeric features, one-hot encoding for categorical features

## Current State

The model trains on `WorldCups.csv` (22 tournaments, 1930-2022) using only features known **before** a tournament starts:

| Feature        | Type        | Example |
| -------------- | ----------- | ------- |
| Year           | Numeric     | 2022    |
| Country (host) | Categorical | Qatar   |
| QualifiedTeams | Numeric     | 32      |
| MatchesPlayed  | Numeric     | 64      |

Post-tournament columns (Runners-Up, Third, Fourth, GoalsScored, Attendance) are excluded to avoid data leakage.

### Sample Output

```
2026 World Cup Winner Predictions:
  Brazil: 21.66%
  Italy: 16.58%
  Germany: 15.34%
  France: 14.05%
  Uruguay: 8.98%
  Argentina: 8.17%
  Spain: 7.99%
  England: 7.21%
```

## Next Steps

Cross-reference match-level data from `WorldCupMatches.csv` (~4500 matches) to enrich the model with per-team performance features. Fields to extract:

| Field      | Column            |
| ---------- | ----------------- |
| Year       | `Year`            |
| Datetime   | `Datetime`        |
| Stage      | `Stage`           |
| Stadium    | `Stadium`         |
| City       | `City`            |
| Home Team  | `Home Team Name`  |
| Home Goals | `Home Team Goals` |
| Away Goals | `Away Team Goals` |
| Away Team  | `Away Team Name`  |

This will allow computing features like win rates, average goals scored/conceded, knockout stage performance, and historical head-to-head records per team.

The goal is to predict the **win probability for every country** participating in the 2026 World Cup, not just past winners.

## Project Structure

```
├── model.ts             # Neural network (training, normalization, prediction)
├── index.ts             # Data loading, training, and prediction entry point
├── WorldCups.csv        # Tournament-level data (22 rows)
├── WorldCupMatches.csv  # Match-level data (~4500 rows)
├── WorldCupPlayers.csv  # Player-level data
├── tsconfig.json
└── package.json
```

## Setup

```bash
npm install
npm run start
```

## Tech Stack

- TypeScript
- TensorFlow.js
- Node.js
