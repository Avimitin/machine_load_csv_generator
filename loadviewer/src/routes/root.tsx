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
import { Location, MachMap, useGitHub } from "../data";

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

function GitHubIcon() {
  return (
    <a className="github-href" href="https://github.com/Avimitin/uptime-collector">
      <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <title>GitHub</title>
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
    </a>
  )
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
        <div id="footer">
          <GitHubIcon />
          <h1>Unmatched Status</h1>
        </div>
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
