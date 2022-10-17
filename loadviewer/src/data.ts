interface FakeCache {
  [index: string]: boolean
}

let fakeCache: FakeCache = {};

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

export async function GetMachineById(id: number) {
  await fakeNetwork(`boardId:${id}`);
  const machines: Array<Machine> = [
    { id: 1, name: "magmortar" },
    { id: 2, name: "larvesta"},
    { id: 3, name: "feltchinder"},
  ];

  const mach = machines.find(machine => machine.id === id);
  if (mach === undefined) {
    throw new Error(`Machine ${id} not found`)
  }
  return mach ?? null;
}
