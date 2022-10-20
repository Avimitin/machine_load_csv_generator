export interface Record {
  ttime: Date,
  users: number,
  load: number,
}

function parseCSV(s: string): Record[] {
  // slice(1, -1) to skip the header and the trailing blank line
  const lines = s.split("\n").slice(1, -1);

  const records = lines.map(li => {
    const val = li.split(",")
    const ttime = new Date(val[0]);
    const users = parseInt(val[1]);
    const load = parseFloat(val[2]);
    return { ttime, users, load }
  })

  return records;
}

export interface GitHubContent {
  path: string,
  download_url: string,
  type: "dir" | "file",
}

export async function getLoadsByMachName(mname: string) {
  const files: GitHubContent[] = await ghCntFetcher(mname);
  // TODO: Remember to add a form to select date
  const csvdata = await fetch(files[0].download_url).then((resp) => resp.text());

  const records = parseCSV(csvdata);
  if (records.length === 0) {
    throw new Error(`No record found for ${mname}`);
  }

  if (records.length === 1) {
    return records;
  }

  const result = [];

  let i = 0, j = 0;
  while (j < records.length) {
    if (records[i].ttime.getDate() !== records[j].ttime.getDate()) {
      // calculate 95th percentile
      const sorted = records.slice(i, j).sort((a, b) => a.load - b.load);
      const idx = Math.round(sorted.length * 0.95) - 1;
      const pick = sorted[idx];
      result.push(pick);

      i = j;
    }

    j += 1;
  }

  return result;
}

export async function ghCntFetcher<T>(path: string) {
  const base = "https://api.github.com/repos/Avimitin/unmatched-load-data/contents/";
  const api = path === "/" ? new URL(base) : new URL(path, base);

  const files: T = await fetch(api, {
    method: "GET",
    headers: { "Accept": "application/vnd.github+json" }
  })
    .then(resp => resp.json())
    .catch(err => { console.log(err); throw new Error("Fail to fetch machines") });

  return files;
}

export interface MachineAliasInfo {
  alias: string,
  belong: string,
}
