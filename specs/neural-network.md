# Neural Network

## Goal

Predict the probability of each of the 48 qualified teams winning the 2026 FIFA World Cup, using historical match and tournament data (1930–2022).

## Architecture

`src/model.ts` implements a TensorFlow.js sequential model with two dense layers:

1. **Input layer** — ReLU activation, neuron count matches the normalized input width
2. **Output layer** — softmax activation, 48 neurons (one per qualified team)

Loss: categorical crossentropy | Optimizer: Adam | Epochs: 100 | Training time is measured and logged.

### Input Normalization

The model handles mixed-type columns automatically:

- **Numeric columns** — min-max scaled to [0, 1]
- **Categorical columns** — one-hot encoded (each unique value becomes a neuron)

Column metadata (min/max, unique values) is stored in `columnsMaps` during training and reused at prediction time.

## Training (`index.ts`)

### Features

All columns from `WorldCupDataset.csv` except TournamentGoals and Winner (columns 0–8, 10, 11):

| Feature          | Type        |
| ---------------- | ----------- |
| Year             | Numeric     |
| Datetime         | Categorical |
| Stage            | Categorical |
| Stadium          | Categorical |
| City             | Categorical |
| Referee          | Categorical |
| Assistant1       | Categorical |
| Assistant2       | Categorical |
| Host             | Categorical |
| QualifiedTeams   | Numeric     |
| TournamentMatches| Numeric     |

### Label

`Winner` (column 12) — the tournament winner for each match's World Cup year.

### Filtering

Training rows are filtered to only include tournaments won by one of the 48 teams qualified for 2026. This excludes Italy's 4 wins (1934, 1938, 1982, 2006), leaving ~829 training samples.

### Class Labels

All 48 qualified teams are passed as predefined class labels via the optional `classLabels` parameter in `Model.train()`. This ensures the output layer covers all 48 teams, even those that have never won a World Cup.

## Prediction

A single input vector represents the 2026 World Cup context:

```
["2026", "19 Jul 2026 - 15:00", "Final", "MetLife Stadium", "New York/New Jersey", "", "", "", "USA/Canada/Mexico", "48", "104"]
```

The model outputs a softmax probability distribution across all 48 teams, printed sorted by descending probability.

## 48 Qualified Teams

| Group | Teams |
| ----- | ----- |
| A | Mexico, South Africa, South Korea, Czechia |
| B | Canada, Bosnia and Herzegovina, Qatar, Switzerland |
| C | Brazil, Morocco, Haiti, Scotland |
| D | USA, Paraguay, Australia, Türkiye |
| E | Germany, Curaçao, Ivory Coast, Ecuador |
| F | Netherlands, Japan, Sweden, Tunisia |
| G | Belgium, Egypt, Iran, New Zealand |
| H | Spain, Cape Verde, Saudi Arabia, Uruguay |
| I | France, Senegal, Iraq, Norway |
| J | Argentina, Algeria, Austria, Jordan |
| K | Portugal, DR Congo, Uzbekistan, Colombia |
| L | England, Croatia, Ghana, Panama |
