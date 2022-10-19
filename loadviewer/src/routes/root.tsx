import { matchSorter } from "match-sorter";
import { useEffect } from "react";
import { NavLink, Form, useLoaderData, useNavigation, useSubmit } from "react-router-dom";
import { Outlet } from "react-router-dom";
import useSWR from "swr";
import { getAllMachineAlias, ghCntFetcher, GitHubRootDirResponse, MachineAliasInfo } from "../data";

export async function loader({ request }: any) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  return { q };
}

interface data {
  boards: GitHubRootDirResponse[],
  q: string,
}


export default function Root() {
  const { q } = useLoaderData() as data;
  const navigation = useNavigation();
  const submit = useSubmit();
  let { data, error } = useSWR("/", ghCntFetcher);
  const { data: alias, error: aliasErr } = useSWR("getAllMachinesAlias", getAllMachineAlias);
  if (error) {
    throw new Error(`Fail to fetch machines data ${error}`);
  }

  if (q && data) {
    const filtered = matchSorter(data, q, { keys: ["path"] });
    data = filtered.sort((a, b) => a.path < b.path ? 1 : 0);
  }

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
          {
            (data === undefined
              ? <div id="zero-state"><h4>Loading</h4></div>
              :
              <ul>
                {
                  data.length > 0
                    ? data.map(
                      (machine) => (
                        <li key={machine.path}>
                          <NavLink
                            to={`board/${machine.path}`}
                            className={({ isActive, isPending }) =>
                              isActive ? "active" : isPending ? "pending" : ""
                            }
                          >
                            {machine.path} {(() => {
                              if (aliasErr || !alias) {
                                return "";
                              }
                              const a = alias.find(a => a.alias === machine.path);
                              if (!a) {
                                return "";
                              }
                              return `(${a.belong})`;
                            })()}
                          </NavLink>
                        </li>)
                    )
                    :
                    <p><i>No board</i></p>
                }
              </ul>
            )
          }
        </nav>
      </div>
      <div id="detail" className={navigation.state === "loading" ? "loading" : ""}>
        <Outlet />
      </div>
    </>
  );
}
