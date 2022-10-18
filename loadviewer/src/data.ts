import { matchSorter } from "match-sorter";

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

const fakeStorage: {[index: number]: Array<Record>} = {
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

export async function getMachines(query: string | null) {
  await fakeNetwork(`getMachines:${query}`);
  let contacts = [];
  if (query !== null) {
    contacts = matchSorter(fakeMachines, query, { keys: ["name"] });
    return contacts.sort((a, b) => a.id < b.id ? 1 : 0);
  }
  return fakeMachines;
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
