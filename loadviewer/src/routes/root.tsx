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
  search?: string,
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

  // sort the navbar list by search params
  if (nbdata.search) {
    const filtered = matchSorter(nbdata.machMaps, nbdata.search, { keys: ["name"] });
    nbdata.machMaps = filtered.sort((a, b) => a.name > b.name ? 1 : -1);
  }

  type DisplayAble = { link: string | null, content: string };

  // convert navbar data to display data
  const display: DisplayAble[] = nbdata.machMaps.map(mach => {
    const wanted = dirs.find(d => d.path.search(mach.name) !== -1);
    const content = `${mach.name} (${mach.team})`;
    return {
      link: wanted !== undefined ? wanted.path : null,
      content: content,
    }
  })

  const active: DisplayAble[] = [];
  const inactive: DisplayAble[] = [];
  display.forEach(dp => dp.link ? active.push(dp) : inactive.push(dp));
  const alphabeticSort = (a: DisplayAble, b: DisplayAble) => a.content < b.content ? -1 : 1;

  const activeNavList = active
    .sort(alphabeticSort)
    .map(machine => (
      <li key={machine.content}>
        <Nav to={machine.link as string} content={machine.content} />
      </li>
    ));

  const inactiveNavList = inactive
    .sort(alphabeticSort)
    .map(machine => (
      <li key={machine.content} id="non-exist-machine" >
        <span>{machine.content}</span>
      </li >
    ));

  return (
    <nav>
      <ul>
        {activeNavList}
        {inactiveNavList}
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
            search: q,
          }}
        />
      </div>
      <div id="detail" className={navigation.state === "loading" ? "loading" : ""}>
        <Outlet />
      </div>
    </>
  );
}
