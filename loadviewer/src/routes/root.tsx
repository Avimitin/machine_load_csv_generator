import { matchSorter } from "match-sorter";
import { useEffect } from "react";
import {
  NavLink,
  Form,
  useLoaderData,
  useNavigation,
  useSubmit,
  SubmitFunction,
} from "react-router-dom";
import { Outlet } from "react-router-dom";
import useSWR from "swr";
import { Location, MachMap, useGitHub, UseGitHubResp } from "../data";

export async function loader({ request }: any) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  return { q };
}

interface data {
  q: string;
}

interface NavBarData {
  search?: string;
}

function Nav({ to, content }: { to: string; content: string }) {
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
  let machMap = useGitHub<MachMap[]>({ file: "machMap.json" });
  const location = useGitHub<Location>({ file: "location.json" });
  if (location.isLoading || machMap.isLoading) {
    return (
      <nav>
        <div>
          <h4>Loading...</h4>
        </div>
      </nav>
    );
  }

  if (machMap.error || machMap.error) {
    console.error(machMap.error || machMap.error);
    return (
      <nav>
        <p>
          <i>Fail to load</i>
        </p>
      </nav>
    );
  }

  if (!machMap.data) {
    return (
      <nav>
        <p>
          <i>No board</i>
        </p>
      </nav>
    );
  }

  const locData = location.data;
  if (!locData) {
    return (
      <nav>
        <p>
          <i>No test results</i>
        </p>
      </nav>
    );
  }

  type DisplayAble = { link: string | null; content: string };
  const active: DisplayAble[] = [];
  const inactive: DisplayAble[] = [];

  // convert navbar data to display data
  machMap.data.forEach((mach) => {
    const content = `${mach.name} (${mach.team})`;
    const data = locData[mach.name];
    data
      ? active.push({ link: data.path, content: content })
      : inactive.push({ link: null, content: content });
  });

  // sort the navbar list by search params
  let sortedDisplayAble: DisplayAble[] | null = null;
  if (barData.search) {
    const filtered = matchSorter(active, barData.search, {
      keys: ["content"],
    });
    sortedDisplayAble = filtered.sort((a, b) =>
      a.content > b.content ? 1 : -1
    );
  }

  const alphabeticSort = (a: DisplayAble, b: DisplayAble) =>
    a.content < b.content ? -1 : 1;

  const activeNavList = (sortedDisplayAble ? sortedDisplayAble : active)
    .sort(alphabeticSort)
    .map((machine) => (
      <li key={machine.content}>
        <Nav to={machine.link as string} content={machine.content} />
      </li>
    ));

  const inactiveNavList = inactive.sort(alphabeticSort).map((machine) => (
    <li
      key={machine.content}
      id="non-exist-machine"
      style={sortedDisplayAble ? { display: "none" } : undefined}
    >
      <span>{machine.content}</span>
    </li>
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

function SearchForm(props: {
  q: string;
  searching?: boolean;
  submit: SubmitFunction;
}) {
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
        <div id="search-spinner" aria-hidden hidden={!searching} />
        <div className="sr-only" aria-live="polite"></div>
      </Form>
    </div>
  );
}

export default function Root() {
  const { q } = useLoaderData() as data;
  const navigation = useNavigation();
  const submit = useSubmit();

  const searching =
    navigation.location &&
    new URLSearchParams(navigation.location.search).has("q");

  useEffect(() => {
    const element = document.getElementById("q") as HTMLInputElement;
    element.value = q;
  }, [q]);

  return (
    <>
      <div id="sidebar">
        <h1>Unmatched Status</h1>
        <SearchForm q={q} searching={searching} submit={submit} />
        <NavBar barData={{ search: q }} />
      </div>
      <div
        id="detail"
        className={navigation.state === "loading" ? "loading" : ""}
      >
        <Outlet />
      </div>
    </>
  );
}
