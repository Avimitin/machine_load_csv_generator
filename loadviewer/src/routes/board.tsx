import { LoaderFunctionArgs, useLoaderData } from "react-router-dom"
import { getLoadsByMid, getMachineById, Machine, Record } from "../data";
import { CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Title, Tooltip } from "chart.js";
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

const options = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const,
    },
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

export default function Board() {
  const { name, records } = useLoaderData() as BoardData;
  const labels = records.map(rec => rec.ttime.getDate());
  const loads = {
    label: "Machine CPU Usage",
    data: records.map(rec => rec.load),
    borderColor: 'rgb(255, 99, 132)',
    backgroundColor: 'rgba(255, 99, 132, 0.5)',
  };
  const users = {
    label: "Loggined Users",
    data: records.map(rec => rec.users),
    borderColor: 'rgb(53, 162, 235)',
    backgroundColor: 'rgba(53, 162, 235, 0.5)',
  };

  return (<div>
    <h3>Board: {name}</h3>
    <Line options={options} data={{ labels, datasets: [loads, users] }} />
  </div>);
}
