import { useEffect, useState } from "react";
export function useCapabilities() {
  const [state, setState] = useState({ ai: false, publishing: false });
  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/status", { signal: ctrl.signal })
      .then((r) => r.json())
      .then((data) =>
        setState({
          ai: data.ai === true,
          publishing: data.publishing === true,
        }),
      )
      .catch(() => {});
    return () => ctrl.abort();
  }, []);
  return state;
}
