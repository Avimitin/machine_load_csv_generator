interface FakeCache {
  [index: string]: boolean
}

let fakeCache: FakeCache = {};
const fakeMachines: Array<Machine> = [
  { id: 1, name: "magmortar" },
  { id: 2, name: "larvesta" },
  { id: 3, name: "feltchinder" },
];

const fakeRecords1: Array<Record> = [
  { ttime: new Date(2022, 10, 18, 14, 8, 32), users: 8, load: 3.71 },
  { ttime: new Date(2022, 10, 19, 15, 8, 32), users: 7, load: 1.45 },
  { ttime: new Date(2022, 10, 20, 16, 8, 32), users: 10, load: 4.83 },
  { ttime: new Date(2022, 10, 21, 17, 8, 32), users: 10, load: 6.23 },
];

const fakeRecords2: Array<Record> = [
  { ttime: new Date(2022, 10, 18, 14, 8, 32), users: 8, load: 2.32 },
  { ttime: new Date(2022, 10, 19, 15, 8, 32), users: 8, load: 8.88 },
  { ttime: new Date(2022, 10, 20, 16, 8, 32), users: 8, load: 0.32 },
  { ttime: new Date(2022, 10, 21, 17, 8, 32), users: 8, load: 0.61 },
];

const fakeStorage: { [index: number]: Array<Record> } = {
  1: fakeRecords1,
  2: fakeRecords2,
}

async function fakeNetwork(key: string | null) {
  if (key === null) {
    fakeCache = {};
    return;
  }

  if (fakeCache[key] !== undefined) {
    return;
  }

  fakeCache[key] = true;
  return new Promise(res => {
    setTimeout(res, Math.random() * 800);
  });
}

export interface Machine {
  id: number,
  name: string,
}

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

export async function getMachineById(id: number) {
  await fakeNetwork(`boardId:${id}`);

  const mach = fakeMachines.find(machine => machine.id === id);
  if (mach === undefined) {
    throw new Error(`Machine ${id} not found`)
  }
  return mach ?? null;
}

export async function getLoadsByMid(id: number) {
  await fakeNetwork(`records:${id}`);
  const record = fakeStorage[id];
  if (record === undefined) {
    throw new Error(`Machine ${id} not found`);
  }

  return record;
}

export async function getLoadsByMachName(mname: string) {
  const files = await GhCntFetcher(mname);
  // TODO: Remember to add a form to select date
  const csvdata = await fetch(files[0].download_url).then((resp) => resp.text());

  const record = parseCSV(csvdata);
  return record;
}

export async function GhCntFetcher(path: string) {
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
