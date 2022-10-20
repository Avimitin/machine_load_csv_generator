import { isRouteErrorResponse, LoaderFunctionArgs, useLoaderData, useRouteError } from "react-router-dom"
import { getLoadsByMachName, Record } from "../data";
import { CategoryScale, Chart as ChartJS, Filler, Legend, LinearScale, LineElement, PointElement, Title, Tooltip } from "chart.js";
import { Line } from 'react-chartjs-2';
import useSWR from "swr";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const options = {
  responsive: true,
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  stacked: false,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: true,
      text: "CPU Usage & Loggined Users",
    }
  },
  scales: {
    load: {
      type: 'linear' as const,
      display: true,
      position: 'left' as const,
    },
    users: {
      type: 'linear' as const,
      display: true,
      position: 'right' as const,
      grid: {
        drawOnChartArea: false,
      }
    }
  }
}

export async function loader({ params }: LoaderFunctionArgs) {
  if (params.id === undefined) {
    throw new Error("No board id found in params")
  }

  return { id: params.id };
}

function BoardInfo({ records }: { records: Record[] }) {
  const load = records.map(rec => rec.load);
  const minLoad = Math.min(...load);
  const maxLoad = Math.max(...load);
  const avgLoad = load.length > 1 ? load.reduce((a, b) => a + b) / load.length : load[0];
  const idx = Math.round(load.length * 0.95) - 1;
  const sorted = load.sort();
  const p95Load = sorted[idx];

  return (
    <table>
      <thead>
        <tr>
          <th><span>min load</span></th>
          <th><span>max load</span></th>
          <th><span>avg load</span></th>
          <th><span>p95 load</span></th>
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

export default function Board() {
  const { id } = useLoaderData() as { id: string };
  const { data, error } = useSWR(id, getLoadsByMachName);
  if (error) {
    throw new Error(`Fail to fetch machines data ${error}`);
  }

  if (!data) {
    return (<div id="zero-state"><h2>Loading...</h2></div>)
  }

  const labels = data.map(rec => rec.ttime.getDate());
  const users = {
    label: "Loggined Users",
    data: data.map(rec => rec.users),
    borderColor: 'rgb(53, 162, 235)',
    backgroundColor: 'rgba(53, 162, 235, 0.5)',
    yAxisID: 'users',
  };
  const loads = {
    label: "Machine CPU Usage",
    fill: true,
    data: data.map(rec => rec.load),
    borderColor: 'rgb(115,238,163)',
    backgroundColor: 'rgba(115,238,163,0.7)',
    yAxisID: 'load',
  };

  return (<div>
    <h3>Board: {id}</h3>
    <Line options={options} data={{ labels, datasets: [users, loads] }} />
    <BoardInfo records={data} />
  </div>);
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
        <code>
          {`${error}`}
        </code>
      </div>
    );
  }
}
