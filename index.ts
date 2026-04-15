import fs from "fs";
import { Model } from "./src/model";

const TEAMS_2026 = [
  "Mexico",
  "South Africa",
  "South Korea",
  "Czechia",
  "Canada",
  "Bosnia and Herzegovina",
  "Qatar",
  "Switzerland",
  "Brazil",
  "Morocco",
  "Haiti",
  "Scotland",
  "USA",
  "Paraguay",
  "Australia",
  "Türkiye",
  "Germany",
  "Curaçao",
  "Ivory Coast",
  "Ecuador",
  "Netherlands",
  "Japan",
  "Sweden",
  "Tunisia",
  "Belgium",
  "Egypt",
  "Iran",
  "New Zealand",
  "Spain",
  "Cape Verde",
  "Saudi Arabia",
  "Uruguay",
  "France",
  "Senegal",
  "Iraq",
  "Norway",
  "Argentina",
  "Algeria",
  "Austria",
  "Jordan",
  "Portugal",
  "DR Congo",
  "Uzbekistan",
  "Colombia",
  "England",
  "Croatia",
  "Ghana",
  "Panama",
];

const MODEL_DIR = "./model";

async function trainModel() {
  const datasetCsv = fs
    .readFileSync("./WorldCupDataset.csv", "utf-8")
    .trim()
    .split("\n");

  const featureColumns = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11]);
  const rows = datasetCsv.slice(1).map((line) => line.split(","));
  const headers = datasetCsv[0]
    .split(",")
    .filter((_, i) => featureColumns.has(i));

  const teamSet = new Set(TEAMS_2026);
  const filtered = rows.filter((row) => teamSet.has(row[12]));
  const input = filtered.map((row) =>
    row.filter((_, i) => featureColumns.has(i)),
  );
  const output = filtered.map((row) => row[12]);

  const model = new Model();

  const t0 = performance.now();
  await model.train(input, headers, output, TEAMS_2026);

  console.log(
    `Training time: ${((performance.now() - t0) / 1000).toFixed(2)}s`,
  );

  await model.save(MODEL_DIR);

  console.log(`Model saved to ${MODEL_DIR}`);

  return model;
}

(async () => {
  let model: Model;

  if (Model.exists(MODEL_DIR)) {
    console.log("Loading saved model...");
    model = await Model.load(MODEL_DIR);
  } else {
    model = await trainModel();
  }

  const worldCup2026 = [
    "2026", // Year
    "19 Jul 2026 - 15:00", // Datetime
    "Final", // Stage
    "MetLife Stadium", // Stadium
    "New York/New Jersey", // City
    "", // Referee
    "", // Assistant1
    "", // Assistant2
    "USA/Canada/Mexico", // Host
    "48", // QualifiedTeams
    "104", // TournamentMatches
  ];

  const probabilities = await model.predict(worldCup2026);

  const predictions = model.classLabels
    .map((label, i) => ({ label, probability: probabilities[i] }))
    .sort((a, b) => b.probability - a.probability);

  console.log("\n2026 World Cup Winner Predictions:");

  predictions.forEach(({ label, probability }) =>
    console.log(`  ${label}: ${(probability * 100).toFixed(2)}%`),
  );
})();
