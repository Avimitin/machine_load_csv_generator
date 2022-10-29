import useSWR from "swr";

export interface MachMap {
  name: string;
  team: string;
}
export interface UseGitHubProps {
  file: string;
}

export interface UseGitHubResp<T> {
  isLoading: boolean;
  error?: Error;
  data?: T;
}

async function ghRawFetch<T>(file: string | string[]): Promise<T> {
  const suffix = typeof file === "string" ? file : file.join("/");
  const url = new URL(
    suffix,
    "https://raw.githubusercontent.com/Avimitin/unmatched-load-data/master/"
  );
  const resp = await fetch(url);
  if (resp.status !== 200) {
    throw new Error(`Fail to request from GitHub: ${resp.statusText}`);
  }
  return await resp.json();
}

export function useGitHub<T>({ file }: UseGitHubProps): UseGitHubResp<T> {
  const { data, error } = useSWR<T>(file, ghRawFetch);

  return {
    isLoading: !error && !data,
    error: error,
    data: data,
  };
}

export interface MachineAliasInfo {
  alias: string;
  belong: string;
}

export interface Record {
  date: string;
  p95Load: number;
  p95Users: number;
}

export interface Machine {
  path: string;
  data: string[];
}

export interface Location {
  [mach: string]: Machine
}
