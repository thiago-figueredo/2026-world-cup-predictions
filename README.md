# 2026 World Cup Predictions

A TensorFlow.js neural network that predicts the 2026 FIFA World Cup winner from historical match-level data across all 48 qualified nations.

## Architecture

```
Input Layer (N neurons)  -->  Hidden Layer (N units, ReLU)  -->  Output Layer (48 classes, Softmax)
```

- **Loss**: Categorical Crossentropy
- **Optimizer**: Adam
- **Preprocessing**: Min-max normalization for numeric features, one-hot encoding for categorical features

## Features

The model trains on `WorldCupDataset.csv` — an aggregated dataset built from match-level and tournament-level historical data. Input features used:

| Feature          | Type        | Example                |
| ---------------- | ----------- | ---------------------- |
| Year             | Numeric     | 2022                   |
| Datetime         | Categorical | 18 Dec 2022 - 15:00    |
| Stage            | Categorical | Final                  |
| Stadium          | Categorical | Lusail Stadium         |
| City             | Categorical | Lusail                 |
| Referee          | Categorical | Szymon Marciniak       |
| Assistant 1      | Categorical | Paweł Sokolnicki       |
| Assistant 2      | Categorical | Tomasz Listkiewicz     |
| Host             | Categorical | Qatar                  |
| QualifiedTeams   | Numeric     | 32                     |
| TournamentMatches| Numeric     | 64                     |

The output is the **winner** column — one of the 48 qualified teams for 2026.

## Model Persistence

Trained models are saved to `model/` and reused on subsequent runs, skipping retraining:

| File            | Contents                              |
| --------------- | ------------------------------------- |
| `model.json`    | Model topology + weight specs         |
| `weights.bin`   | Binary weight data                    |
| `metadata.json` | Column maps + class labels            |

Delete `model/` to retrain from scratch.

### Sample Output

```
2026 World Cup Winner Predictions:
  France: 65.02%
  Argentina: 24.97%
  Spain: 9.89%
  Germany: 0.08%
  England: 0.04%
  Brazil: 0.01%
  Uruguay: 0.00%
  ...
```

## Project Structure

```
├── index.ts                # Entry point — train or load, then predict
├── src/
│   ├── model.ts            # Neural network (train, predict, save, load)
│   ├── aggregate.ts        # Aggregates raw CSVs into WorldCupDataset.csv
│   └── fill-matches.ts     # Enriches WorldCupMatches.csv with extra fields
├── WorldCupDataset.csv     # Aggregated training data
├── WorldCupMatches.csv     # Match-level historical data
├── WorldCups.csv           # Tournament-level data (22 rows)
├── model/                  # Saved model artifacts (gitignored)
├── tsconfig.json
└── package.json
```

## Setup

```bash
npm install
npm run start
```

### With Nix

```bash
nix develop
npm install
npm run start
```

### Scripts

| Command              | Description                                    |
| -------------------- | ---------------------------------------------- |
| `npm run start`      | Build + run predictions                        |
| `npm run build`      | Compile TypeScript                             |
| `npm run aggregate`  | Regenerate `WorldCupDataset.csv` from raw data |
| `npm run fill-matches` | Enrich `WorldCupMatches.csv`                 |

## Tech Stack

- TypeScript
- TensorFlow.js
- Node.js
