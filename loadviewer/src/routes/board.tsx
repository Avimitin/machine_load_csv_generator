import {
  isRouteErrorResponse,
  LoaderFunctionArgs,
  useLoaderData,
  useRouteError,
} from "react-router-dom";
import { Location, Machine, Record, useGitHub } from "../data";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  ScriptableLineSegmentContext,
  Title,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useState } from "react";
import Select from "react-select";
import chartOptions from "../chart-options";
import produce, { enableMapSet } from "immer";

enableMapSet();

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export async function loader({ params }: LoaderFunctionArgs) {
  if (params.id === undefined) {
    throw new Error("No board id found in params");
  }

  return { id: params.id };
}

interface DateMenuOption {
  value: string;
  label: string;
}

function BoardInfo({ records }: { records: Record[] }) {
  if (records.length === 0) {
    return <BoardNotFound />;
  }
  const load = records.map((rec) => rec.p95Load);
  const minLoad = Math.min(...load);
  const maxLoad = Math.max(...load);
  const avgLoad =
    load.length > 1 ? load.reduce((a, b) => a + b) / load.length : load[0];
  const idx = Math.ceil(load.length * 0.95) - 1;
  const sorted = load.sort();
  const p95Load = sorted[idx];

  return (
    <table>
      <thead>
        <tr>
          <th>
            <span>Min CPU Usage</span>
          </th>
          <th>
            <span>Max CPU Usage</span>
          </th>
          <th>
            <span>Avg CPU Usage</span>
          </th>
          <th>
            <span>P95 CPU Usage</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{minLoad.toFixed(2)}</td>
          <td>{maxLoad.toFixed(2)}</td>
          <td>{avgLoad.toFixed(2)}</td>
          <td>{p95Load.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
  );
}

function BoardNotFound() {
  return (
    <div id="zero-state">
      <h2>No CPU Usage was found</h2>
      <p>This machine is not online yet.</p>
    </div>
  );
}

export default function Details() {
  const location = useGitHub<Location>({ file: "location.json" });
  const { id } = useLoaderData() as { id: string };

  if (location.isLoading) {
    return (
      <div id="zero-state">
        <h2>Loading...</h2>
      </div>
    );
  }
  if (location.error) {
    console.error(location.error);
    return <BoardNotFound />;
  }
  const locData = location.data;
  if (!locData) {
    return <BoardNotFound />;
  }

  const machine = locData[id.replace(/-\w+$/, "")];
  if (!machine) {
    return <BoardNotFound />;
  }

  return <Board machine={machine} />
}

interface BoardProps {
  machine: Machine,
}

function useDate(machID: string): [DateMenuOption | null, (opt: DateMenuOption) => void] {
  const [storage, setStorage] = useState<Map<string, DateMenuOption>>(new Map());

  const setDate = (opt: DateMenuOption) => {
    setStorage(
      produce((store) => {
        store.set(machID, opt);
      })
    );
  }

  return [storage.get(machID) || null, setDate];
}

export function Board({ machine }: BoardProps) {
  const [selectedDate, setDate] = useDate(machine.path);
  const records = useGitHub<Record[]>({
    file: `${machine.path}/${selectedDate ?
      selectedDate.value + ".json"
      : machine.data[0]}`,
  });

  if (records.isLoading) {
    return (
      <div id="zero-state">
        <h2>Loading...</h2>
      </div>
    );
  }
  if (records.error) {
    console.error(records.error);
    return <BoardNotFound />;
  }
  if (!records.data) {
    return <BoardNotFound />;
  }

  const onChange = (option: DateMenuOption | null) => {
    if (!option) return;
    setDate(option);
  };

  const dateOptions = machine.data.map((d) => {
    const date = d.replace(".json", "");
    return { value: date, label: date };
  });

  const hlHighUsage = (ctx: ScriptableLineSegmentContext) => {
    return ctx.p0.parsed.y > 100 || ctx.p1.parsed.y > 100
      ? "rgba(192,75,75,0.8)"
      : undefined;
  };

  const labels = records.data.map((rec) => new Date(rec.date).getDate());
  const users = {
    label: "Loggedin Users",
    data: records.data.map((rec) => rec.p95Users),
    borderColor: "rgb(53, 162, 235)",
    backgroundColor: "rgba(53, 162, 235, 0.5)",
    tension: 0.4,
    yAxisID: "users",
  };
  const loads = {
    label: "Machine CPU Usage",
    fill: true,
    data: records.data.map((rec) => rec.p95Load),
    borderColor: "rgb(115,238,163)",
    backgroundColor: "rgba(115,238,163,0.7)",
    yAxisID: "load",
    tension: 0.4,
    segment: {
      borderColor: (ctx: ScriptableLineSegmentContext) =>
        hlHighUsage(ctx),
      backgroundColor: (ctx: ScriptableLineSegmentContext) =>
        hlHighUsage(ctx),
    },
  };

  return (
    <div>
      <Select
        defaultValue={selectedDate || dateOptions[0]}
        onChange={onChange}
        options={dateOptions}
      />
      <Line options={chartOptions} data={{ labels, datasets: [users, loads] }} />
      <BoardInfo records={records.data} />
    </div>
  );
}

export function ErrorPage() {
  const error = useRouteError();
  console.error(error);

  if (isRouteErrorResponse(error)) {
    return (
      <div id="error-page">
        <h1>Oops</h1>
        <p>Sorry, an unexpected error occur</p>
        <p>
          <i>{error.statusText}</i>
        </p>
      </div>
    );
  } else {
    return (
      <div id="error-page">
        <h1>Oops, error occur</h1>
        <h3>Details</h3>
        <code>{`${error}`}</code>
      </div>
    );
  }
}
