import { on } from "./reuse.ts";

export type Metrics = Record<string, number>;

function parseMetrics(text: string): Metrics {
  const metrics: Metrics = {};
  for (const line of text.split("\n")) {
    if (!line || line.startsWith("#")) {
      continue;
    }
    const m = line.match(/^(.+) ([-0-9.e]+)$/)!;
    metrics[m[1]] = parseFloat(m[2]);
  }
  return metrics;
}

export async function fetchMetrics(
  url: string,
  signal: AbortSignal,
): Promise<Metrics> {
  const abort = new AbortController();
  const off_abort = on(signal, "abort", () => abort.abort());
  const timer = setTimeout(() => {
    abort.abort(new Error(`fetchMetrics ${url} timeout`));
  }, 500);
  let res: Response;
  try {
    res = await fetch(url, { signal: abort.signal });
  } catch (e) {
    throw new Error(`fetchMetrics ${url} error`, { cause: e });
  } finally {
    off_abort();
    clearTimeout(timer);
  }
  if (!res.ok) {
    throw new Error(`fetchMetrics ${url} status ${res.status}`);
  }
  return parseMetrics(await res.text());
}
