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

export interface GitHubRootDirResponse {
  path: string,
  download_url: string,
}

export async function getLoadsByMachName(mname: string) {
  const files = await ghCntFetcher(mname);
  // TODO: Remember to add a form to select date
  const csvdata = await fetch(files[0].download_url).then((resp) => resp.text());

  const record = parseCSV(csvdata);
  return record;
}

export async function ghCntFetcher(path: string) {
  const base = "https://api.github.com/repos/Avimitin/unmatched-load-data/contents/";
  const api = path === "/" ? new URL(base) : new URL(path, base);

  const files: GitHubRootDirResponse[] = await fetch(api, {
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

export async function getAllMachineAlias() {
  const files = await fetch("https://api.github.com/repos/Avimitin/unmatched-load-data/contents/all.csv").then(res => res.json());
  const csv = await fetch(files.download_url).then(res => res.text());
  const row = csv.split("\n").slice(0, -1);
  const info = row.map(line => {
    const cell = line.split(",");
    return { alias: cell[0], belong: cell[1] };
  });

  return info;
}
