interface FakeCache {
  [index: string]: boolean
}

let fakeCache: FakeCache = {};
const fakeMachines: Array<Machine> = [
  { id: 1, name: "magmortar" },
  { id: 2, name: "larvesta" },
  { id: 3, name: "feltchinder" },
];

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

interface Record {

}

export async function getMachineById(id: number) {
  await fakeNetwork(`boardId:${id}`);

  const mach = fakeMachines.find(machine => machine.id === id);
  if (mach === undefined) {
    throw new Error(`Machine ${id} not found`)
  }
  return mach ?? null;
}
