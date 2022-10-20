import { matchSorter } from "match-sorter";
import { useEffect } from "react";
import { NavLink, Form, useLoaderData, useNavigation, useSubmit } from "react-router-dom";
import { Outlet } from "react-router-dom";
import useSWR from "swr";
import { ghCntFetcher, GitHubContent } from "../data";

export async function loader({ request }: any) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  return { q };
}

interface data {
  boards: GitHubContent[],
  q: string,
}

type GhFileResp = {
  data?: GitHubContent[],
  isLoading: boolean,
  error: any,
}

function Nav({ to, content }: { to: string, content: string }) {
  return (
    <NavLink
      to={`board/${to}`}
      className={({ isActive, isPending }) =>
        isActive ? "active" : isPending ? "pending" : ""
      }
    >
      {content}
    </NavLink>
  );
}

function NavBar({ ghfile }: { ghfile: GhFileResp }) {
  if (ghfile.isLoading) {
    return (<nav><div><h4>Loading...</h4></div></nav>)
  }
  if (!ghfile.data || ghfile.data?.length == 0) {
    return (<nav><p><i>No board</i></p></nav>)
  }

  const data = ghfile.data.filter(f => f.type === "dir");

  const list = data.map(machine => (
    <li key={machine.path}>
      <Nav to={machine.path} content={machine.path} />
    </li>
  ));

  return (
    <nav>
      <ul>
        {list}
      </ul>
    </nav>
  );
}

export default function Root() {
  const { q } = useLoaderData() as data;
  const navigation = useNavigation();
  const submit = useSubmit();
  let { data, error } = useSWR<GitHubContent[]>("/", ghCntFetcher);
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
        <NavBar
          ghfile={{
            data: data,
            isLoading: !error && !data,
            error: error,
          }}
        />
      </div>
      <div id="detail" className={navigation.state === "loading" ? "loading" : ""}>
        <Outlet />
      </div>
    </>
  );
}
