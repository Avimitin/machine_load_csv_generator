import { isRouteErrorResponse, useRouteError } from "react-router-dom";

export default function Index() {
  return (
    <div id="zero-state">
      <h2>Unmatched Board Load Viewer</h2>
      <p>
        The Web viewer for our unmatched boards.
        <br/>
        Click the left navbar to view details of our board.
      </p>
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
        <code>
          {`${error}`}
        </code>
      </div>
    );
  }
}
