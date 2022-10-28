import { matchSorter } from "match-sorter";
import { useEffect } from "react";
import { NavLink, Form, useLoaderData, useNavigation, useSubmit, SubmitFunction } from "react-router-dom";
import { Outlet } from "react-router-dom";
import useSWR from "swr";
import { getMachines, ghCntFetcher, GitHubContent, Location, MachMap, useGitHub, UseGitHubResp } from "../data";

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
  machMap: UseGitHubResp<MachMap[]>,
  location: UseGitHubResp<Location>,
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

function NavBar({ barData }: { barData: NavBarData }) {
  if (barData.location.isLoading || barData.machMap.isLoading) {
    return (<nav><div><h4>Loading...</h4></div></nav>)
  }

  if (barData.machMap.error || barData.machMap.error) {
    console.error(barData.machMap.error || barData.machMap.error)
    return (<nav><p><i>Fail to load</i></p></nav>)
  }

  if (!barData.machMap.data || !barData.location.data) {
    return (<nav><p><i>No board</i></p></nav>)
  }

  let machMap = barData.machMap.data;
  const location = barData.location.data;

  // sort the navbar list by search params
  if (barData.search) {
    const filtered = matchSorter(machMap, barData.search, { keys: ["name"] });
    machMap = filtered.sort((a, b) => a.name > b.name ? 1 : -1);
  }

  type DisplayAble = { link: string | null, content: string };

  // convert navbar data to display data
  const display: DisplayAble[] = machMap.map(mach => {
    let match;
    for (const [key, value] of location) {
      if (mach.name === key) {
        match = value;
      }
    }
    const content = `${mach.name} (${mach.team})`;
    return {
      link: match ? match.path : null,
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
  const machMap = useGitHub<MachMap[]>({ file: "machMap.json" });
  const location = useGitHub<Location>({ file: "location.json" });

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
        <NavBar barData={{ machMap: machMap, location: location, search: q }} />
      </div>
      <div id="detail" className={navigation.state === "loading" ? "loading" : ""}>
        <Outlet />
      </div>
    </>
  );
}
