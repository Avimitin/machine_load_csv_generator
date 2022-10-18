import { NavLink, useLoaderData, useNavigation } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { getMachines, Machine } from "../data";

export async function loader() {
  const boards = await getMachines();
  return { boards };
}

interface data {
  boards: Machine[],
}

export default function Root() {
  const { boards } = useLoaderData() as data;
  const navigation = useNavigation();

  return (
    <>
      <div id="sidebar">
        <h1>Unmatched Status</h1>
        <div>
          <form id="search-form" role="search">
            <input
              id="q"
              aria-label="Search contacts"
              placeholder="Search"
              type="search"
              name="q"
            />
            <div
              id="search-spinner"
              aria-hidden
              hidden={true}
            />
            <div
              className="sr-only"
              aria-live="polite"
            ></div>
          </form>
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
