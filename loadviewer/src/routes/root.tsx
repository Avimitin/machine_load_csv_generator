import { useEffect } from "react";
import { NavLink, Form, useLoaderData, useNavigation, useSubmit } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { getMachines, Machine } from "../data";

export async function loader({ request }: any) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  const boards = await getMachines(q);
  return { boards, q };
}

interface data {
  boards: Machine[],
  q: string,
}

export default function Root() {
  const { boards, q } = useLoaderData() as data;
  const navigation = useNavigation();
  const submit = useSubmit();

  const searching = navigation.location && new URLSearchParams(navigation.location.search).has("q");

  useEffect(() => {
    const element = document.getElementById("q") as HTMLInputElement;
    element.value = q;
  }, [q]);

  return (
    <>
      <div id="sidebar">
        <h1>Unmatched Status</h1>
        <div>
          <Form id="search-form" role="search">
            <input
              id="q"
              aria-label="Search contacts"
              placeholder="Search"
              type="search"
              name="q"
              defaultValue={q}
              className={searching ? "loading" : ""}
              onChange={(event) => {
                const isFirstSearch = q === null;
                submit(event.currentTarget.form, { replace: !isFirstSearch });
              }}
            />
            <div
              id="search-spinner"
              aria-hidden
              hidden={!searching}
            />
            <div
              className="sr-only"
              aria-live="polite"
            ></div>
          </Form>
        </div>
        <nav>
          <ul>
            {
              boards.length > 0
                ? boards.map(
                  (b) => (
                    <li key={b.id}>
                      <NavLink to={`board/${b.id}`}
                        className={({ isActive, isPending }) => isActive ? "active" : isPending ? "pending" : ""}
                      >{b.name}</NavLink>
                    </li>)
                )
                :
                <p><i>No board</i></p>
            }
          </ul>
        </nav>
      </div>
      <div id="detail" className={navigation.state === "loading" ? "loading" : ""}>
        <Outlet />
      </div>
    </>
  );
}
