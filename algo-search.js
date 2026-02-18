(() => {
  const normalize = (value) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

  const routes = new Map([
    ["linear search", "search.html?algo=linear"],
    ["binary search", "search.html?algo=binary"],
    ["breadth first search", "search.html?algo=bfs"],
    ["depth first search", "search.html?algo=dfs"],
    ["bfs", "search.html?algo=bfs"],
    ["dfs", "search.html?algo=dfs"],
    ["bubble sort", "sort.html?algo=bubble"],
    ["selection sort", "sort.html?algo=selection"],
    ["insertion sort", "sort.html?algo=insertion"],
    ["merge sort", "sort.html?algo=merge"],
    ["quick sort", "sort.html?algo=quick"],
    ["interval scheduling", "greedy.html?algo=interval"],
    ["interval partitioning", "greedy.html?algo=partition"],
    ["scheduling to minimize lateness", "greedy.html?algo=lateness"],
    ["minimize lateness", "greedy.html?algo=lateness"],
    ["dijkstra", "greedy.html?algo=dijkstra"],
    ["dijkstra s", "greedy.html?algo=dijkstra"],
    ["shortest path", "greedy.html?algo=dijkstra"],
    ["kruskal", "greedy.html?algo=kruskal"],
    ["prim", "greedy.html?algo=prim"],
    ["reverse delete", "greedy.html?algo=reverse_delete"]
  ]);

  document.querySelectorAll("[data-algo-search]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = form.querySelector('input[name="algorithm"]');
      const raw = input?.value ?? "";
      const key = normalize(raw);
      if (!key) return;

      if (routes.has(key)) {
        window.location.href = routes.get(key);
        return;
      }

      const partial = [...routes.keys()].find((k) => k.includes(key) || key.includes(k));
      if (partial) {
        window.location.href = routes.get(partial);
        return;
      }

      input.setCustomValidity("Algorithm not recognized. Try an option from the list.");
      input.reportValidity();
      setTimeout(() => input.setCustomValidity(""), 2000);
    });
  });
})();
