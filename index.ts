import fs from "fs";
import { Model } from "./model";

(async () => {
  const datasetCsv = fs
    .readFileSync("./WorldCups.csv", "utf-8")
    .trim()
    .split("\n");

  const featureColumns = new Set([0, 1, 7, 8]);
  const rows = datasetCsv.slice(1).map((line) => line.split(","));
  const headers = datasetCsv[0]
    .split(",")
    .filter((_, i) => featureColumns.has(i));

  const input = rows.map((row) => row.filter((_, i) => featureColumns.has(i)));
  const output = rows.map((row) => row[2]);

  const model = new Model();

  const trainingResult = await model.train(input, headers, output);
  console.log({ trainingResult });

  const worldCup2026 = [
    "2026", // Year
    "USA/Canada/Mexico", // Hosted Country
    "48", // Number of Teams
    "104", // Matches Played
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
