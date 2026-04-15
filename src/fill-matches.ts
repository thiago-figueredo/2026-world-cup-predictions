import fs from "fs";

type CsvRow = string[];

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else current += ch;
  }
  result.push(current);
  return result;
}

function readCsv(path: string): CsvRow[] {
  return fs
    .readFileSync(path, "utf-8")
    .trim()
    .split("\n")
    .slice(1)
    .map(parseCsvLine);
}

const TEAM_NAME_MAP: Record<string, string> = { "United States": "USA" };
const CODE_MAP: Record<string, string> = {
  DEU: "GER", HRV: "CRO", CHE: "SUI", NLD: "NED", URY: "URU",
  CRI: "CRC", PRT: "POR", DNK: "DEN", SAU: "KSA",
};
const STAGE_MAP: Record<string, string> = {
  "round of 16": "Round of 16",
  "quarter-finals": "Quarter-finals",
  "semi-finals": "Semi-finals",
  "third-place match": "Play-off for third place",
  final: "Final",
};
const VENUE_ALIAS: Record<string, string> = {
  "Cosmos Arena": "Samara Arena",
};

function mapTeam(n: string) { return TEAM_NAME_MAP[n] ?? n; }
function mapCode(c: string) { return CODE_MAP[c] ?? c; }
function mapStage(s: string, g: string) {
  return s === "group stage" ? g : (STAGE_MAP[s] ?? s);
}
function normalizeVenue(v: string) { return VENUE_ALIAS[v] ?? v; }

function buildWinCondition(r: CsvRow): string {
  const et = r[28] === "1", pk = r[29] === "1";
  if (!et && !pk) return " ";
  const winner = r[33] === "home team win" ? mapTeam(r[18]) : mapTeam(r[21]);
  if (pk) return `${winner} win on penalties (${r[31]} - ${r[32]})`;
  return `${winner} win after extra time`;
}

function computeHtScores(goals: CsvRow[]): Map<string, [number, number]> {
  const m = new Map<string, [number, number]>();
  for (const g of goals) {
    if (g[24] !== "first half") continue;
    const id = g[4];
    if (!m.has(id)) m.set(id, [0, 0]);
    const ht = m.get(id)!;
    g[12] === "1" ? ht[0]++ : ht[1]++;
  }
  return m;
}

function buildRefMap(refs: CsvRow[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const r of refs) {
    m.set(r[3], `${r[10].toUpperCase()} ${r[9]} (${r[11]})`);
  }
  return m;
}

const ATTENDANCE_2018: [string, string, number][] = [
  ["2018-06-14","Luzhniki Stadium",78011],
  ["2018-06-15","Central Stadium",27015],
  ["2018-06-19","Krestovsky Stadium",64468],
  ["2018-06-20","Rostov Arena",42678],
  ["2018-06-25","Samara Arena",41970],
  ["2018-06-25","Volgograd Arena",36823],
  ["2018-06-15","Krestovsky Stadium",62548],
  ["2018-06-15","Fisht Olympic Stadium",43866],
  ["2018-06-20","Luzhniki Stadium",78011],
  ["2018-06-20","Kazan Arena",42718],
  ["2018-06-25","Mordovia Arena",41685],
  ["2018-06-25","Kaliningrad Stadium",33973],
  ["2018-06-16","Kazan Arena",41279],
  ["2018-06-16","Mordovia Arena",40502],
  ["2018-06-21","Samara Arena",40727],
  ["2018-06-21","Central Stadium",32789],
  ["2018-06-26","Luzhniki Stadium",78011],
  ["2018-06-26","Fisht Olympic Stadium",44073],
  ["2018-06-16","Otkritie Arena",44190],
  ["2018-06-16","Kaliningrad Stadium",31136],
  ["2018-06-21","Nizhny Novgorod Stadium",43319],
  ["2018-06-22","Volgograd Arena",40904],
  ["2018-06-26","Krestovsky Stadium",64468],
  ["2018-06-26","Rostov Arena",43472],
  ["2018-06-17","Samara Arena",41432],
  ["2018-06-17","Rostov Arena",43109],
  ["2018-06-22","Krestovsky Stadium",64468],
  ["2018-06-22","Kaliningrad Stadium",33167],
  ["2018-06-27","Otkritie Arena",44190],
  ["2018-06-27","Nizhny Novgorod Stadium",43319],
  ["2018-06-17","Luzhniki Stadium",78011],
  ["2018-06-18","Nizhny Novgorod Stadium",42300],
  ["2018-06-23","Rostov Arena",43472],
  ["2018-06-23","Fisht Olympic Stadium",44287],
  ["2018-06-27","Kazan Arena",41835],
  ["2018-06-27","Central Stadium",33061],
  ["2018-06-18","Fisht Olympic Stadium",43257],
  ["2018-06-18","Volgograd Arena",41064],
  ["2018-06-23","Otkritie Arena",44190],
  ["2018-06-24","Nizhny Novgorod Stadium",43319],
  ["2018-06-28","Kaliningrad Stadium",33973],
  ["2018-06-28","Mordovia Arena",37168],
  ["2018-06-19","Mordovia Arena",40842],
  ["2018-06-19","Otkritie Arena",44190],
  ["2018-06-24","Central Stadium",32572],
  ["2018-06-24","Kazan Arena",42873],
  ["2018-06-28","Volgograd Arena",42189],
  ["2018-06-28","Samara Arena",41970],
  ["2018-06-30","Kazan Arena",42873],
  ["2018-06-30","Fisht Olympic Stadium",44287],
  ["2018-07-01","Luzhniki Stadium",78011],
  ["2018-07-01","Nizhny Novgorod Stadium",40851],
  ["2018-07-02","Samara Arena",41970],
  ["2018-07-02","Rostov Arena",41466],
  ["2018-07-03","Krestovsky Stadium",64042],
  ["2018-07-03","Otkritie Arena",44190],
  ["2018-07-06","Nizhny Novgorod Stadium",43319],
  ["2018-07-06","Kazan Arena",42873],
  ["2018-07-07","Samara Arena",39991],
  ["2018-07-07","Fisht Olympic Stadium",44287],
  ["2018-07-10","Krestovsky Stadium",64286],
  ["2018-07-11","Luzhniki Stadium",78011],
  ["2018-07-14","Krestovsky Stadium",64406],
  ["2018-07-15","Luzhniki Stadium",78011],
];

function buildAtt2018(): Map<string, number> {
  const m = new Map<string, number>();
  for (const [date, venue, att] of ATTENDANCE_2018) {
    m.set(`${date}|${venue}`, att);
  }
  return m;
}

function buildAtt2022(rows: CsvRow[]): number[] {
  return rows.map((r) => Number(r[9]));
}

function formatDatetime(date: string, time: string): string {
  const d = new Date(date + "T00:00:00");
  const day = d.getDate().toString().padStart(2, "0");
  const months = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec",
  ];
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()} - ${time} `;
}

function toRow(
  r: CsvRow,
  ht: [number, number],
  ref: string,
  att: number,
): string {
  const year = r[11].split("-")[0];
  return [
    year,
    `"${formatDatetime(r[11], r[12])}"`,
    mapStage(r[5], r[6]),
    r[14],
    `"${r[15]} "`,
    mapTeam(r[18]),
    r[24],
    r[25],
    mapTeam(r[21]),
    `"${buildWinCondition(r)}"`,
    att || "",
    ht[0],
    ht[1],
    ref,
    "",
    "",
    "",
    "",
    mapCode(r[19]),
    mapCode(r[22]),
  ].join(",");
}

function main() {
  const matches = readCsv("./.tmp/fjelstul-matches.csv");
  const htScores = computeHtScores(readCsv("./.tmp/fjelstul-goals.csv"));
  const refMap = buildRefMap(readCsv("./.tmp/fjelstul-referees.csv"));
  const att2018 = buildAtt2018();
  const att2022 = buildAtt2022(readCsv("./.tmp/wc2022-attendance.csv"));

  const m2018 = matches.filter((r) => r[1] === "WC-2018");
  const m2022 = matches.filter((r) => r[1] === "WC-2022");

  const rows2018 = m2018.map((r) => {
    const key = `${r[11]}|${normalizeVenue(r[14])}`;
    return toRow(
      r,
      htScores.get(r[3]) ?? [0, 0],
      refMap.get(r[3]) ?? "",
      att2018.get(key) ?? 0,
    );
  });

  const rows2022 = m2022.map((r, i) =>
    toRow(r, htScores.get(r[3]) ?? [0, 0], refMap.get(r[3]) ?? "", att2022[i]),
  );

  const existing = fs
    .readFileSync("./WorldCupMatches.csv", "utf-8")
    .split("\n")
    .filter((l) => {
      const stripped = l.replace(/,/g, "").trim();
      if (stripped === "") return false;
      return !l.startsWith("2018,") && !l.startsWith("2022,");
    });

  const all = [...existing, ...rows2018, ...rows2022];
  fs.writeFileSync("./WorldCupMatches.csv", all.join("\n") + "\n");

  const missing2018 = rows2018.filter((r) => r.includes(",0,") || r.includes(",,")).length;
  console.log(`2018: ${rows2018.length} rows (${missing2018} with missing att)`);
  console.log(`2022: ${rows2022.length} rows`);
  console.log(`Total lines: ${all.length}`);
}

main();
