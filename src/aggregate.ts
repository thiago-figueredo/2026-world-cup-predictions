import fs from "fs";

function parseCsv(path: string): string[][] {
  return fs
    .readFileSync(path, "utf-8")
    .trim()
    .split("\n")
    .slice(1)
    .map((line) => line.split(",").map((v) => v.replace(/^"|"$/g, "").trim()));
}

type TournamentInfo = {
  host: string;
  winner: string;
  goals: string;
  qualifiedTeams: string;
  matches: string;
};

function buildDataset() {
  const matches = parseCsv("./WorldCupMatches.csv");
  const cups = parseCsv("./WorldCups.csv");

  const tournamentMap = new Map<string, TournamentInfo>(
    cups.map((c) => [
      c[0],
      {
        host: c[1],
        winner: c[2],
        goals: c[6],
        qualifiedTeams: c[7],
        matches: c[8],
      },
    ]),
  );

  const headers = [
    "Year", "Datetime", "Stage", "Stadium", "City",
    "Referee", "Assistant1", "Assistant2",
    "Host", "TournamentGoals", "QualifiedTeams", "TournamentMatches",
    "Winner",
  ];

  const rows = [headers.join(",")];

  for (const m of matches) {
    const t = tournamentMap.get(m[0]);
    if (!t) continue;

    rows.push(
      [
        m[0], m[1], m[2], m[3], m[4],
        m[13], m[14], m[15],
        t.host, t.goals, t.qualifiedTeams, t.matches,
        t.winner,
      ].join(","),
    );
  }

  fs.writeFileSync("./WorldCupDataset.csv", rows.join("\n") + "\n");
  console.log(`Written ${rows.length - 1} rows to WorldCupDataset.csv`);
}

buildDataset();
