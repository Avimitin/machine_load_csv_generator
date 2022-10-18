import { LoaderFunctionArgs, useLoaderData } from "react-router-dom"
import { getLoadsByMid, getMachineById, Machine, Record } from "../data";
import { CategoryScale, Chart as ChartJS, Filler, Legend, LinearScale, LineElement, PointElement, Title, Tooltip } from "chart.js";
import { Line } from 'react-chartjs-2';

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

interface BoardData {
  name: string,
  records: Record[],
}

export async function loader({ params }: LoaderFunctionArgs): Promise<BoardData> {
  if (params.boardId === undefined) {
    throw new Error("No board id found in params")
  }
  const id = parseInt(params.boardId);
  const machine = await getMachineById(id);
  const records = await getLoadsByMid(machine.id);
  return { name: machine.name, records: records };
}

function BoardInfo({ records }: { records: Record[] }) {
  const load = records.map(rec => rec.load);
  const minLoad = Math.min(...load);
  const maxLoad = Math.max(...load);
  const avgLoad = load.reduce((a, b) => a + b) / load.length;

  return (
    <table>
      <thead>
        <tr>
          <th><span>min load</span></th>
          <th><span>max load</span></th>
          <th><span>avg load</span></th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{minLoad * 100}</td>
          <td>{maxLoad * 100}</td>
          <td>{avgLoad * 100}</td>
        </tr>
      </tbody>
    </table>
  );
}

export default function Board() {
  const { name, records } = useLoaderData() as BoardData;
  const labels = records.map(rec => rec.ttime.getDate());
  const users = {
    label: "Loggined Users",
    data: records.map(rec => rec.users),
    borderColor: 'rgb(53, 162, 235)',
    backgroundColor: 'rgba(53, 162, 235, 0.5)',
    yAxisID: 'users',
  };
  const loads = {
    label: "Machine CPU Usage",
    fill: true,
    data: records.map(rec => rec.load),
    borderColor: 'rgb(115,238,163)',
    backgroundColor: 'rgba(115,238,163,0.7)',
    yAxisID: 'load',
  };

  return (<div>
    <h3>Board: {name}</h3>
    <Line options={options} data={{ labels, datasets: [users, loads] }} />
    <BoardInfo records={records} />
  </div>);
}
