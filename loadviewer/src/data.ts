import useSWR from "swr";

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

function percentile<T>(a: T[], sf?: (a: T, b: T) => number): T {
  const sorted = a.sort(sf);
  const idx = Math.ceil(sorted.length * 0.95) - 1;
  return sorted[idx];
}

export async function getLoadsByNameAndDate(mname: string, date?: string) {
  const files: GitHubContent[] = await ghCntFetcher(mname);
  if (files.length === 0) {
    throw new Error("no csv data found");
  }

  // try to select file by date, or just return the first element
  const selected = date ? files.find(f => f.type === "file" && f.path.search(date) !== -1) : files[0];
  if (!selected) throw new Error("no load data found for this date");

  // return list of date options
  const dateList = files.map(f => {
    const matches = f.path.match(/(?<date>\d{4}-\d{1,2})/);
    if (!matches || !matches.groups) {
      throw new Error("Fail to get date [Regex Failure]");
    }
    return matches.groups["date"];
  });

  const csvdata = await fetch(selected.download_url)
    .then((resp) => resp.text())
    .catch(err => {
      console.error(err);
      throw new Error("fail to fetch csv data")
    });

  const records = parseCSV(csvdata);
  if (records.length === 0) {
    throw new Error(`No record found for ${mname}`);
  }

  if (records.length === 1) {
    return { recordResult: records, dateList };
  }

  const recordResult = [];

  let i = 0, j = 0;
  while (j < records.length) {
    if (records[i].ttime.getDate() !== records[j].ttime.getDate()) {
      // calculate 95th percentile
      recordResult.push(percentile(records.slice(i, j), (a, b) => a.load - b.load));

      i = j;
    }

    j += 1;
  }

  if (i == 0) {
    recordResult.push(percentile(records, (a, b) => a.load - b.load));
  }

  return { recordResult, dateList };
}

export interface MachMap {
  name: string,
  team: string,
}

export async function getMachines(): Promise<MachMap[]> {
  const files: GitHubContent[] = (await ghCntFetcher("/") as GitHubContent[])
    .filter(cnt => cnt.type === "file")
    .filter(f => f.path === "machMap.json");
  if (files.length === 0) {
    throw new Error("Fail to find file list");
  }
  return JSON.parse(await fetch(files[0].download_url)
    .then(res => res.text()));
}

export async function ghCntFetcher<T>(path: string) {
  const base = "https://api.github.com/repos/Avimitin/unmatched-load-data/contents/";
  const api = path === "/" ? new URL(base) : new URL(path, base);

  const files: T = await fetch(api, {
    method: "GET",
    headers: { "Accept": "application/vnd.github+json" }
  })
    .then(resp => {
      if (resp.status === 403) {
        throw new Error("Your IP has been rate limited by GitHub");
      } else {
        return resp.json()
      }
    })
    .catch(err => { console.error(err); throw err });

  return files;
}

export interface UseGitHubProps {
  file: string
}

export interface UseGitHubResp<T> {
  isLoading: boolean,
  error?: Error,
  data?: T,
}

async function ghRawFetch<T>(file: string | string[]): Promise<T> {
  const suffix = typeof(file) === "string" ? file : file.join("/");
  const url = new URL(suffix, "https://raw.githubusercontent.com/Avimitin/unmatched-load-data/master/")
  const resp = await fetch(url);
  if (resp.status !== 200) {
    throw new Error(`Fail to request from GitHub: ${resp.statusText}`);
  }
  return await resp.json();
}

export function useGitHub<T>({ file }: UseGitHubProps): UseGitHubResp<T> {
  const { data, error } = useSWR<T>(file, ghRawFetch);

  return {
    isLoading: !error && !data,
    error: error,
    data: data,
  }
}

export interface MachineAliasInfo {
  alias: string,
  belong: string,
}

export interface Result {
  date: Date,
  p95Load: number,
  p95Users: number,
}

export interface Location {
  [mach: string]: {
    path: string,
    data: string[],
  }
}