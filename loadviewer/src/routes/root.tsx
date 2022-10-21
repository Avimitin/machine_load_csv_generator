import { matchSorter } from "match-sorter";
import { useEffect } from "react";
import { NavLink, Form, useLoaderData, useNavigation, useSubmit, SubmitFunction } from "react-router-dom";
import { Outlet } from "react-router-dom";
import useSWR from "swr";
import { getMachines, ghCntFetcher, GitHubContent, MachMap } from "../data";

export async function loader({ request }: any) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  return { q };
}

interface data {
  boards: GitHubContent[],
  q: string,
}

interface NavBarData {
  dirs?: GitHubContent[],
  machMaps?: MachMap[],
  isLoading: boolean,
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

function NavBar({ nbdata }: { nbdata: NavBarData }) {
  if (nbdata.isLoading) {
    return (<nav><div><h4>Loading...</h4></div></nav>)
  }
  if (!nbdata.machMaps || nbdata.machMaps.length === 0 || !nbdata.dirs || nbdata.dirs.length === 0) {
    return (<nav><p><i>No board</i></p></nav>)
  }

  const dirs = nbdata.dirs.filter(f => f.type === "dir");

  const display = nbdata.machMaps.map(mach => {
    const wanted = dirs.find(d => d.path.search(mach.name) !== -1);
    const content = `${mach.name} (${mach.team})`;
    return {
      link: wanted !== undefined ? wanted.path : null,
      content: content,
    }
  })

  const navlist = display
  .sort((a, b) => a.link && !b.link ? -1 : 1)
  .map(machine =>
    machine.link ?
      (<li key={machine.content}>
        <Nav to={machine.link} content={machine.content} />
      </li>)
      :
      (<li key={machine.content} id="non-exist-machine">
        <span>{machine.content}</span>
      </li>)
  );

  return (
    <nav>
      <ul>
        {navlist}
      </ul>
    </nav>
  );
}

function SearchForm(props: { q: string, searching?: boolean, submit: SubmitFunction }) {
  const { q, searching, submit } = props;
  return (
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
  )
}

export default function Root() {
  const { q } = useLoaderData() as data;
  const navigation = useNavigation();
  const submit = useSubmit();
  let { data: extMachines, error: extMachErr } = useSWR("ExhaustedMachineList", getMachines);
  let { data: dirs, error: dirsError } = useSWR<GitHubContent[]>("/", ghCntFetcher);
  if (dirsError || extMachErr) {
    throw new Error(`Fail to fetch machines data ${dirsError || extMachErr}`);
  }

  if (q && dirs) {
    const filtered = matchSorter(dirs, q, { keys: ["path"] });
    dirs = filtered.sort((a, b) => a.path < b.path ? 1 : 0);
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
        <SearchForm q={q} searching={searching} submit={submit} />
        <NavBar
          nbdata={{
            dirs: dirs,
            machMaps: extMachines,
            isLoading: !dirsError && !dirs && !extMachines && !extMachErr,
          }}
        />
      </div>
      <div id="detail" className={navigation.state === "loading" ? "loading" : ""}>
        <Outlet />
      </div>
    </>
  );
}
