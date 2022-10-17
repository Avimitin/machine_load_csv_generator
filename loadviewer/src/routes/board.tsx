import { LoaderFunctionArgs, useLoaderData } from "react-router-dom"

export async function loader({ params }: LoaderFunctionArgs) {
  return params.boardId;
}

export default function Board() {
  const board_id = useLoaderData();
  return (<h3><p>Place Holder for {`${board_id}`}</p></h3>);
}
