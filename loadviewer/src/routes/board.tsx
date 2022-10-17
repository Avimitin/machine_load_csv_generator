import { LoaderFunctionArgs, useLoaderData } from "react-router-dom"
import { getMachineById, Machine } from "../data";

export async function loader({ params }: LoaderFunctionArgs) {
  if (params.boardId === undefined) {
    throw new Error("No board id found in params")
  }
  const id = parseInt(params.boardId);
  return getMachineById(id);
}

export default function Board() {
  const board = useLoaderData() as Machine;
  return (<h3><p>Board: {board.name}</p></h3>);
}
