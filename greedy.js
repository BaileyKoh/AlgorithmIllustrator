(() => {
  const tabs = document.getElementById("greedyTabs");
  if (!tabs) return;

  const timelineEl = document.getElementById("greedyTimeline");
  const graphEl = document.getElementById("greedyGraph");
  const stateEl = document.getElementById("greedyState");
  const conceptEl = document.getElementById("greedyConcept");
  const problemEl = document.getElementById("greedyProblem");
  const logicEl = document.getElementById("greedyLogic");
  const pseudocodeEl = document.getElementById("greedyPseudocode");
  const complexityEl = document.getElementById("greedyComplexity");
  const speedInput = document.getElementById("greedySpeed");

  const buildBtn = document.getElementById("greedyBuild");
  const playBtn = document.getElementById("greedyPlay");
  const pauseBtn = document.getElementById("greedyPause");
  const stepBtn = document.getElementById("greedyStep");
  const backBtn = document.getElementById("greedyBack");
  const resetBtn = document.getElementById("greedyReset");

  const timelineModes = new Set(["interval", "partition", "lateness"]);

  const concepts = {
    interval:
      "Sort by earliest finish and build the compatible solution set one interval at a time.",
    partition:
      "Sort by start time, then assign each interval to the first room that is free.",
    lateness:
      "Schedule jobs by earliest due date (EDD) and track the growing schedule + max lateness.",
    dijkstra:
      "Repeatedly settle the closest unvisited node and relax outgoing edges.",
    kruskal:
      "Sort edges by weight and add each one only if it connects different components.",
    prim: "Grow one tree from a seed node by repeatedly taking the minimum crossing edge.",
    reverse_delete:
      "Start with all edges and remove heavy edges whenever connectivity is preserved."
  };

  const details = {
    interval: {
      problem: "Given intervals with start/end times, select a maximum-size subset of mutually non-overlapping intervals.",
      logic: "Sort by earliest finish time. Greedily take the next interval that starts after the last chosen finish.",
      pseudocode: `Input: intervals I[1..n] with (start, finish)
sort I by increasing finish time
lastFinish = -infinity
for each interval x in I:
  if x.start >= lastFinish:
    select x
    lastFinish = x.finish`,
      complexity: "Time: O(n log n) from sorting, then O(n) scan. Space: O(1) extra (or O(n) to store selected set)."
    },
    partition: {
      problem: "Assign each interval to a room so overlapping intervals are never in the same room, minimizing number of rooms.",
      logic: "Sort by start time; for each interval, reuse the earliest-available room or open a new room.",
      pseudocode: `Input: intervals I[1..n] with (start, finish)
sort I by increasing start time
H = min-heap of (finishTime, roomId)
for each interval x in I:
  if min(H).finishTime <= x.start:
    reuse that room
  else:
    open new room
  push/update (x.finish, roomId) in H`,
      complexity: "Time: O(n log n). Space: O(n) for heap/assignments."
    },
    lateness: {
      problem: "Single-machine scheduling with processing times p_j and deadlines d_j; minimize maximum lateness Lmax.",
      logic: "Schedule jobs by nondecreasing deadline (Earliest Due Date / EDD), then compute running lateness.",
      pseudocode: `Input: jobs J[1..n] with processing p[j], deadline d[j]
sort J by increasing d[j]
time = 0
Lmax = 0
for each job j in J:
  time = time + p[j]
  lateness = max(0, time - d[j])
  Lmax = max(Lmax, lateness)`,
      complexity: "Time: O(n log n) from sorting. Space: O(1) extra (or O(n) if storing full schedule)."
    },
    dijkstra: {
      problem: "Find shortest path distances from one source to all nodes in a graph with nonnegative edge weights.",
      logic: "Repeatedly settle the unvisited node with minimum tentative distance and relax its outgoing edges.",
      pseudocode: `Input: weighted graph G=(V,E), source s
for each v in V: dist[v] = infinity
dist[s] = 0
while unvisited nodes remain:
  u = unvisited node with smallest dist
  mark u visited
  for each edge (u, v, w):
    dist[v] = min(dist[v], dist[u] + w)`,
      complexity: "Time: O((V + E) log V) with heap; O(V^2) with simple array scan. Space: O(V)."
    },
    kruskal: {
      problem: "Compute a minimum spanning tree (MST) of a connected weighted undirected graph.",
      logic: "Sort edges by weight; add edge if it connects two different components (Union-Find).",
      pseudocode: `Input: connected weighted graph G=(V,E)
sort E by increasing edge weight
make-set(v) for each v in V
for each edge (u, v) in E:
  if find(u) != find(v):
    add (u, v) to MST
    union(u, v)`,
      complexity: "Time: O(E log E) for sorting + near-linear Union-Find operations. Space: O(V)."
    },
    prim: {
      problem: "Compute an MST by growing one tree outward from a start vertex.",
      logic: "Maintain crossing edges from tree to non-tree vertices and repeatedly choose minimum such edge.",
      pseudocode: `Input: connected weighted graph G=(V,E), start s
TreeVertices = {s}
while tree does not contain all vertices:
  pick minimum edge (u, v) with u in TreeVertices and v not in TreeVertices
  add v to TreeVertices
  add edge (u, v) to MST`,
      complexity: "Time: O(E log V) with priority queue; O(V^2) with adjacency matrix scan. Space: O(V)."
    },
    reverse_delete: {
      problem: "Compute MST by deleting unnecessary heavy edges.",
      logic: "Sort edges descending; remove an edge if graph remains connected without it.",
      pseudocode: `Input: connected weighted graph G=(V,E)
sort E by decreasing edge weight
for each edge e in E:
  remove e temporarily
  if graph becomes disconnected:
    restore e`,
      complexity: "Time: typically O(E * (V + E)) with repeated connectivity checks; can be improved with advanced structures. Space: O(V + E)."
    }
  };

  function renderDetails(key) {
    const d = details[key];
    problemEl.textContent = d.problem;
    logicEl.textContent = d.logic;
    pseudocodeEl.textContent = d.pseudocode;
    complexityEl.textContent = d.complexity;
  }

  // Chosen to mirror textbook interval examples: dense overlap early, branching rooms later.
  const intervals = [
    { id: "a", s: 0, e: 3 },
    { id: "b", s: 0, e: 6 },
    { id: "c", s: 0, e: 3 },
    { id: "d", s: 3, e: 6 },
    { id: "e", s: 3, e: 8 },
    { id: "f", s: 6, e: 8 },
    { id: "g", s: 6, e: 8 },
    { id: "h", s: 8, e: 11 },
    { id: "i", s: 9, e: 11 },
    { id: "j", s: 9, e: 11 }
  ];

  const jobs = [
    { id: "J1", p: 2, d: 3 },
    { id: "J2", p: 1, d: 4 },
    { id: "J3", p: 3, d: 8 },
    { id: "J4", p: 2, d: 9 },
    { id: "J5", p: 2, d: 10 }
  ];

  const graphNodes = [
    { id: "A", x: 90, y: 80 },
    { id: "B", x: 250, y: 60 },
    { id: "C", x: 160, y: 190 },
    { id: "D", x: 360, y: 125 },
    { id: "E", x: 520, y: 95 },
    { id: "F", x: 460, y: 265 },
    { id: "G", x: 250, y: 300 }
  ];

  const graphEdges = [
    { id: "A-B", u: "A", v: "B", w: 4 },
    { id: "A-C", u: "A", v: "C", w: 3 },
    { id: "B-C", u: "B", v: "C", w: 2 },
    { id: "B-D", u: "B", v: "D", w: 5 },
    { id: "C-D", u: "C", v: "D", w: 7 },
    { id: "C-G", u: "C", v: "G", w: 6 },
    { id: "D-E", u: "D", v: "E", w: 3 },
    { id: "D-F", u: "D", v: "F", w: 4 },
    { id: "E-F", u: "E", v: "F", w: 2 },
    { id: "F-G", u: "F", v: "G", w: 1 },
    { id: "D-G", u: "D", v: "G", w: 8 }
  ];

  const byId = Object.fromEntries(graphNodes.map((n) => [n.id, n]));
  const neighbors = {};
  graphNodes.forEach((n) => {
    neighbors[n.id] = [];
  });
  graphEdges.forEach((e) => {
    neighbors[e.u].push({ to: e.v, edge: e });
    neighbors[e.v].push({ to: e.u, edge: e });
  });

  let mode = "interval";
  let steps = [];
  let idx = -1;
  let timer = null;

  function snapshotSet(set) {
    return Array.from(set.values());
  }

  function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function buildIntervalScheduling() {
    const ordered = [...intervals].sort((a, b) => a.e - b.e || a.s - b.s);
    const selected = [];
    const rejected = new Set();
    const out = [];
    let lastEnd = -Infinity;

    ordered.forEach((iv) => {
      out.push({
        text: `Consider ${iv.id} = [${iv.s}, ${iv.e}] against last selected finish ${lastEnd}.`,
        active: iv.id,
        selected: selected.map((x) => x.id),
        rejected: [...rejected],
        kind: "interval"
      });

      if (iv.s >= lastEnd) {
        selected.push(iv);
        lastEnd = iv.e;
        out.push({
          text: `Select ${iv.id}. The solution set grows: {${selected.map((x) => x.id).join(", ")}}.`,
          active: iv.id,
          selected: selected.map((x) => x.id),
          rejected: [...rejected],
          kind: "interval"
        });
      } else {
        rejected.add(iv.id);
        out.push({
          text: `Reject ${iv.id}. It overlaps with the current solution set.`,
          active: iv.id,
          selected: selected.map((x) => x.id),
          rejected: [...rejected],
          kind: "interval"
        });
      }
    });

    out.push({
      text: `Finished. Maximum compatible set: {${selected.map((x) => x.id).join(", ")}}.`,
      active: null,
      selected: selected.map((x) => x.id),
      rejected: [...rejected],
      kind: "interval"
    });

    return out;
  }

  function buildIntervalPartitioning() {
    const ordered = [...intervals].sort((a, b) => a.s - b.s || a.e - b.e);
    const roomEnd = [];
    const assignments = {};
    const out = [];

    ordered.forEach((iv) => {
      out.push({
        text: `Place ${iv.id} = [${iv.s}, ${iv.e}] in the first available room.`,
        active: iv.id,
        assignments: deepCopy(assignments),
        roomEnd: roomEnd.slice(),
        kind: "partition"
      });

      let roomIdx = roomEnd.findIndex((endTime) => endTime <= iv.s);
      if (roomIdx === -1) {
        roomEnd.push(iv.e);
        roomIdx = roomEnd.length - 1;
      } else {
        roomEnd[roomIdx] = iv.e;
      }
      assignments[iv.id] = roomIdx;

      out.push({
        text: `${iv.id} assigned to room ${roomIdx + 1}. Rooms in use: ${roomEnd.length}.`,
        active: iv.id,
        assignments: deepCopy(assignments),
        roomEnd: roomEnd.slice(),
        kind: "partition"
      });
    });

    out.push({
      text: `Finished. Minimum number of rooms = ${roomEnd.length}.`,
      active: null,
      assignments: deepCopy(assignments),
      roomEnd: roomEnd.slice(),
      kind: "partition"
    });

    return out;
  }

  function buildLateness() {
    const ordered = [...jobs].sort((a, b) => a.d - b.d);
    const out = [];
    const scheduled = [];
    let time = 0;
    let maxLate = 0;

    ordered.forEach((job) => {
      out.push({
        text: `Select next earliest-deadline job ${job.id} (d=${job.d}).`,
        active: job.id,
        orderedJobs: ordered,
        scheduled: deepCopy(scheduled),
        maxLate,
        kind: "lateness"
      });

      const start = time;
      const finish = time + job.p;
      const lateness = Math.max(0, finish - job.d);
      maxLate = Math.max(maxLate, lateness);
      scheduled.push({ ...job, start, finish, lateness });
      time = finish;

      out.push({
        text: `${job.id} scheduled [${start}, ${finish}] with lateness ${lateness}. Current Lmax=${maxLate}.`,
        active: job.id,
        orderedJobs: ordered,
        scheduled: deepCopy(scheduled),
        maxLate,
        kind: "lateness"
      });
    });

    out.push({
      text: `Finished EDD schedule. Minimum possible maximum lateness is ${maxLate}.`,
      active: null,
      orderedJobs: ordered,
      scheduled: deepCopy(scheduled),
      maxLate,
      kind: "lateness"
    });

    return out;
  }

  function buildDijkstra() {
    const start = "A";
    const dist = {};
    const parent = {};
    const visited = new Set();
    graphNodes.forEach((n) => {
      dist[n.id] = Infinity;
      parent[n.id] = null;
    });
    dist[start] = 0;
    const out = [];

    out.push({
      text: `Initialize distances from ${start}.`,
      activeNode: start,
      activeEdge: null,
      visited: [],
      dist: deepCopy(dist),
      treeEdges: [],
      removedEdges: [],
      kind: "graph"
    });

    while (visited.size < graphNodes.length) {
      let nextNode = null;
      let nextDist = Infinity;
      graphNodes.forEach((n) => {
        if (!visited.has(n.id) && dist[n.id] < nextDist) {
          nextDist = dist[n.id];
          nextNode = n.id;
        }
      });
      if (!nextNode) break;

      out.push({
        text: `Settle ${nextNode} with distance ${dist[nextNode]}.`,
        activeNode: nextNode,
        activeEdge: null,
        visited: snapshotSet(visited),
        dist: deepCopy(dist),
        treeEdges: Object.entries(parent)
          .filter(([, p]) => p)
          .map(([v, p]) => [v, p].sort().join("-")),
        removedEdges: [],
        kind: "graph"
      });

      visited.add(nextNode);

      neighbors[nextNode].forEach(({ to, edge }) => {
        if (visited.has(to)) return;
        const cand = dist[nextNode] + edge.w;

        out.push({
          text: `Relax ${edge.id}, candidate dist(${to})=${cand}.`,
          activeNode: nextNode,
          activeEdge: edge.id,
          visited: snapshotSet(visited),
          dist: deepCopy(dist),
          treeEdges: Object.entries(parent)
            .filter(([, p]) => p)
            .map(([v, p]) => [v, p].sort().join("-")),
          removedEdges: [],
          kind: "graph"
        });

        if (cand < dist[to]) {
          dist[to] = cand;
          parent[to] = nextNode;
          out.push({
            text: `Update dist(${to})=${cand}, parent(${to})=${nextNode}.`,
            activeNode: to,
            activeEdge: edge.id,
            visited: snapshotSet(visited),
            dist: deepCopy(dist),
            treeEdges: Object.entries(parent)
              .filter(([, p]) => p)
              .map(([v, p]) => [v, p].sort().join("-")),
            removedEdges: [],
            kind: "graph"
          });
        }
      });
    }

    out.push({
      text: "Dijkstra complete. Shortest-path tree is highlighted.",
      activeNode: null,
      activeEdge: null,
      visited: snapshotSet(visited),
      dist: deepCopy(dist),
      treeEdges: Object.entries(parent)
        .filter(([, p]) => p)
        .map(([v, p]) => [v, p].sort().join("-")),
      removedEdges: [],
      kind: "graph"
    });

    return out;
  }

  class UF {
    constructor(items) {
      this.parent = {};
      this.rank = {};
      items.forEach((i) => {
        this.parent[i] = i;
        this.rank[i] = 0;
      });
    }

    find(x) {
      if (this.parent[x] !== x) this.parent[x] = this.find(this.parent[x]);
      return this.parent[x];
    }

    union(a, b) {
      const ra = this.find(a);
      const rb = this.find(b);
      if (ra === rb) return false;
      if (this.rank[ra] < this.rank[rb]) this.parent[ra] = rb;
      else if (this.rank[ra] > this.rank[rb]) this.parent[rb] = ra;
      else {
        this.parent[rb] = ra;
        this.rank[ra] += 1;
      }
      return true;
    }
  }

  function buildKruskal() {
    const edges = [...graphEdges].sort((a, b) => a.w - b.w);
    const uf = new UF(graphNodes.map((n) => n.id));
    const tree = new Set();
    const rejected = new Set();
    const out = [];

    edges.forEach((edge) => {
      out.push({
        text: `Consider ${edge.id} (w=${edge.w}).`,
        activeEdge: edge.id,
        treeEdges: [...tree],
        removedEdges: [...rejected],
        kind: "graph"
      });

      if (uf.union(edge.u, edge.v)) {
        tree.add(edge.id);
        out.push({
          text: `Accept ${edge.id}; it connects two components.`,
          activeEdge: edge.id,
          treeEdges: [...tree],
          removedEdges: [...rejected],
          kind: "graph"
        });
      } else {
        rejected.add(edge.id);
        out.push({
          text: `Reject ${edge.id}; it creates a cycle.`,
          activeEdge: edge.id,
          treeEdges: [...tree],
          removedEdges: [...rejected],
          kind: "graph"
        });
      }
    });

    out.push({
      text: "Kruskal complete. MST edges are highlighted.",
      activeEdge: null,
      treeEdges: [...tree],
      removedEdges: [...rejected],
      kind: "graph"
    });

    return out;
  }

  function buildPrim() {
    const visited = new Set(["A"]);
    const tree = new Set();
    const out = [];

    out.push({
      text: "Start Prim from node A.",
      activeNode: "A",
      activeEdge: null,
      visited: [...visited],
      treeEdges: [...tree],
      removedEdges: [],
      kind: "graph"
    });

    while (visited.size < graphNodes.length) {
      let best = null;
      graphEdges.forEach((edge) => {
        const inU = visited.has(edge.u);
        const inV = visited.has(edge.v);
        if ((inU && !inV) || (inV && !inU)) {
          if (!best || edge.w < best.w) best = edge;
        }
      });

      if (!best) break;
      const nextNode = visited.has(best.u) ? best.v : best.u;

      out.push({
        text: `Choose minimum crossing edge ${best.id} (w=${best.w}).`,
        activeNode: nextNode,
        activeEdge: best.id,
        visited: [...visited],
        treeEdges: [...tree],
        removedEdges: [],
        kind: "graph"
      });

      tree.add(best.id);
      visited.add(nextNode);
      out.push({
        text: `Add ${best.id} and visit node ${nextNode}.`,
        activeNode: nextNode,
        activeEdge: best.id,
        visited: [...visited],
        treeEdges: [...tree],
        removedEdges: [],
        kind: "graph"
      });
    }

    out.push({
      text: "Prim complete. MST edges are highlighted.",
      activeNode: null,
      activeEdge: null,
      visited: [...visited],
      treeEdges: [...tree],
      removedEdges: [],
      kind: "graph"
    });

    return out;
  }

  function connected(activeEdges) {
    const adj = {};
    graphNodes.forEach((n) => {
      adj[n.id] = [];
    });
    graphEdges.forEach((e) => {
      if (!activeEdges.has(e.id)) return;
      adj[e.u].push(e.v);
      adj[e.v].push(e.u);
    });

    const seen = new Set();
    const stack = [graphNodes[0].id];
    while (stack.length) {
      const u = stack.pop();
      if (seen.has(u)) continue;
      seen.add(u);
      adj[u].forEach((v) => {
        if (!seen.has(v)) stack.push(v);
      });
    }
    return seen.size === graphNodes.length;
  }

  function buildReverseDelete() {
    const edges = [...graphEdges].sort((a, b) => b.w - a.w);
    const active = new Set(graphEdges.map((e) => e.id));
    const removed = new Set();
    const out = [];

    edges.forEach((edge) => {
      out.push({
        text: `Try removing ${edge.id} (w=${edge.w}).`,
        activeEdge: edge.id,
        treeEdges: [...active],
        removedEdges: [...removed],
        kind: "graph"
      });

      active.delete(edge.id);
      if (connected(active)) {
        removed.add(edge.id);
        out.push({
          text: `Remove ${edge.id}; graph remains connected.`,
          activeEdge: edge.id,
          treeEdges: [...active],
          removedEdges: [...removed],
          kind: "graph"
        });
      } else {
        active.add(edge.id);
        out.push({
          text: `Keep ${edge.id}; removing it disconnects the graph.`,
          activeEdge: edge.id,
          treeEdges: [...active],
          removedEdges: [...removed],
          kind: "graph"
        });
      }
    });

    out.push({
      text: "Reverse-delete complete. Remaining edges form an MST.",
      activeEdge: null,
      treeEdges: [...active],
      removedEdges: [...removed],
      kind: "graph"
    });

    return out;
  }

  function buildSteps() {
    if (mode === "interval") steps = buildIntervalScheduling();
    else if (mode === "partition") steps = buildIntervalPartitioning();
    else if (mode === "lateness") steps = buildLateness();
    else if (mode === "dijkstra") steps = buildDijkstra();
    else if (mode === "kruskal") steps = buildKruskal();
    else if (mode === "prim") steps = buildPrim();
    else steps = buildReverseDelete();

    idx = -1;
    applyCurrent();
  }

  function laneTitle(text) {
    const title = document.createElement("div");
    title.className = "timeline-title";
    title.textContent = text;
    return title;
  }

  function renderAxis(maxT) {
    const axis = document.createElement("div");
    axis.className = "timeline-axis";
    [0, Math.floor(maxT / 3), Math.floor((2 * maxT) / 3), maxT].forEach((t) => {
      const tick = document.createElement("span");
      tick.textContent = String(t);
      axis.appendChild(tick);
    });
    timelineEl.appendChild(axis);
  }

  function drawIntervalBlock(container, item, maxT, statusClass, active) {
    const block = document.createElement("div");
    block.className = `interval-block ${statusClass}`.trim();
    block.style.left = `${(item.s / maxT) * 100}%`;
    block.style.width = `${((item.e - item.s) / maxT) * 100}%`;
    block.textContent = `${item.id} (${item.s}-${item.e})`;
    if (active) block.classList.add("active");
    container.appendChild(block);
  }

  function buildPackedRows(items) {
    const rows = [];
    const rowEnd = [];
    const ordered = [...items].sort((a, b) => a.s - b.s || a.e - b.e);

    ordered.forEach((iv) => {
      let placed = false;
      for (let r = 0; r < rowEnd.length; r += 1) {
        if (rowEnd[r] <= iv.s) {
          rows[r].push(iv);
          rowEnd[r] = iv.e;
          placed = true;
          break;
        }
      }
      if (!placed) {
        rows.push([iv]);
        rowEnd.push(iv.e);
      }
    });
    return rows;
  }

  function renderIntervalScheduling(step) {
    const maxT = Math.max(...intervals.map((x) => x.e));
    const packed = buildPackedRows(intervals);

    timelineEl.appendChild(laneTitle("All Intervals"));
    packed.forEach((row) => {
      const lane = document.createElement("div");
      lane.className = "timeline-lane";
      row.forEach((iv) => {
        let cls = "pending";
        if (step?.selected?.includes(iv.id)) cls = "selected";
        if (step?.rejected?.includes(iv.id)) cls = "rejected";
        drawIntervalBlock(lane, iv, maxT, cls, step?.active === iv.id);
      });
      timelineEl.appendChild(lane);
    });

    timelineEl.appendChild(laneTitle("Solution Set (Constructed So Far)"));
    const solutionLane = document.createElement("div");
    solutionLane.className = "timeline-lane";
    const selectedSet = new Set(step?.selected || []);
    intervals
      .filter((iv) => selectedSet.has(iv.id))
      .sort((a, b) => a.s - b.s || a.e - b.e)
      .forEach((iv) => {
        drawIntervalBlock(solutionLane, iv, maxT, "selected", step?.active === iv.id);
      });
    timelineEl.appendChild(solutionLane);

    renderAxis(maxT);
  }

  function renderIntervalPartitioning(step) {
    const maxT = Math.max(...intervals.map((x) => x.e));
    const packed = buildPackedRows(intervals);

    timelineEl.appendChild(laneTitle("All Intervals"));
    packed.forEach((row) => {
      const lane = document.createElement("div");
      lane.className = "timeline-lane";
      row.forEach((iv) => {
        const assigned = step?.assignments && step.assignments[iv.id] !== undefined;
        drawIntervalBlock(
          lane,
          iv,
          maxT,
          assigned ? "selected" : "pending",
          step?.active === iv.id
        );
      });
      timelineEl.appendChild(lane);
    });

    timelineEl.appendChild(laneTitle("Room Assignment (Built Incrementally)"));
    const assignedRooms = Object.values(step?.assignments || {});
    const roomCount = Math.max(1, Math.max(-1, ...assignedRooms) + 1);

    for (let room = 0; room < roomCount; room += 1) {
      const label = document.createElement("div");
      label.className = "timeline-subtitle";
      label.textContent = `Room ${room + 1}`;
      timelineEl.appendChild(label);

      const lane = document.createElement("div");
      lane.className = "timeline-lane";
      intervals.forEach((iv) => {
        if (step?.assignments?.[iv.id] !== room) return;
        drawIntervalBlock(lane, iv, maxT, "selected", step?.active === iv.id);
      });
      timelineEl.appendChild(lane);
    }

    renderAxis(maxT);
  }

  function renderLateness(step) {
    const ordered = step?.orderedJobs || [...jobs].sort((a, b) => a.d - b.d);
    const horizon = Math.max(1, ordered.reduce((sum, j) => sum + j.p, 0));

    timelineEl.appendChild(laneTitle("All Jobs (EDD Order)"));
    const poolLane = document.createElement("div");
    poolLane.className = "timeline-lane";

    let cursor = 0;
    ordered.forEach((job) => {
      const pseudo = { id: `${job.id} d=${job.d}`, s: cursor, e: cursor + job.p };
      const already = (step?.scheduled || []).some((x) => x.id === job.id);
      drawIntervalBlock(poolLane, pseudo, horizon, already ? "selected" : "pending", step?.active === job.id);
      cursor += job.p;
    });
    timelineEl.appendChild(poolLane);

    timelineEl.appendChild(laneTitle("Constructed Schedule"));
    const schedLane = document.createElement("div");
    schedLane.className = "timeline-lane";
    (step?.scheduled || []).forEach((job) => {
      const blockJob = { id: `${job.id} L=${job.lateness}`, s: job.start, e: job.finish };
      drawIntervalBlock(schedLane, blockJob, horizon, "selected", step?.active === job.id);
    });
    timelineEl.appendChild(schedLane);

    renderAxis(horizon);
  }

  function renderTimeline(step) {
    timelineEl.innerHTML = "";

    if (mode === "interval") {
      renderIntervalScheduling(step);
      return;
    }
    if (mode === "partition") {
      renderIntervalPartitioning(step);
      return;
    }
    renderLateness(step);
  }

  function renderGraph(step) {
    graphEl.innerHTML = "";
    const tree = new Set(step?.treeEdges || []);
    const removed = new Set(step?.removedEdges || []);

    graphEdges.forEach((edge) => {
      const from = byId[edge.u];
      const to = byId[edge.v];

      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", from.x);
      line.setAttribute("y1", from.y);
      line.setAttribute("x2", to.x);
      line.setAttribute("y2", to.y);
      line.setAttribute("class", "edge");
      if (edge.id === step?.activeEdge) line.classList.add("active");
      if (tree.has(edge.id)) line.classList.add("tree");
      if (removed.has(edge.id)) line.classList.add("removed");
      graphEl.appendChild(line);

      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", String((from.x + to.x) / 2));
      label.setAttribute("y", String((from.y + to.y) / 2 - 5));
      label.setAttribute("class", "weight-label");
      label.textContent = String(edge.w);
      graphEl.appendChild(label);
    });

    graphNodes.forEach((node) => {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", String(node.x));
      circle.setAttribute("cy", String(node.y));
      circle.setAttribute("r", "24");
      circle.setAttribute("class", "node");
      if (step?.visited?.includes(node.id)) circle.classList.add("seen");
      if (step?.activeNode === node.id) circle.classList.add("visiting");
      graphEl.appendChild(circle);

      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", String(node.x));
      text.setAttribute("y", String(node.y));
      text.setAttribute("class", "node-label");
      text.textContent = node.id;
      graphEl.appendChild(text);

      if (step?.dist) {
        const d = step.dist[node.id];
        const distText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        distText.setAttribute("x", String(node.x - 20));
        distText.setAttribute("y", String(node.y + 35));
        distText.setAttribute("class", "weight-label");
        distText.textContent = d === Infinity ? "inf" : `d=${d}`;
        graphEl.appendChild(distText);
      }
    });
  }

  function applyCurrent() {
    if (idx < 0) {
      stateEl.textContent = "Ready. Build steps to begin.";
      if (timelineModes.has(mode)) renderTimeline(null);
      else renderGraph(null);
      return;
    }

    const step = steps[idx];
    stateEl.textContent = `Step ${idx + 1}/${steps.length}\n${step.text}`;
    if (timelineModes.has(mode)) renderTimeline(step);
    else renderGraph(step);
  }

  function setMode(next) {
    mode = next;
    tabs.querySelectorAll("button").forEach((b) => {
      b.classList.toggle("active", b.dataset.mode === next);
    });

    const showTimeline = timelineModes.has(next);
    timelineEl.style.display = showTimeline ? "grid" : "none";
    graphEl.style.display = showTimeline ? "none" : "block";
    conceptEl.textContent = concepts[next];
    renderDetails(next);

    stop();
    steps = [];
    idx = -1;
    applyCurrent();
  }

  function stepForward() {
    if (!steps.length || idx >= steps.length - 1) return;
    idx += 1;
    applyCurrent();
  }

  function stepBack() {
    if (idx <= -1) return;
    idx -= 1;
    applyCurrent();
  }

  function stop() {
    if (!timer) return;
    clearInterval(timer);
    timer = null;
  }

  function play() {
    stop();
    timer = setInterval(() => {
      if (idx >= steps.length - 1) {
        stop();
        return;
      }
      stepForward();
    }, Number(speedInput.value));
  }

  tabs.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-mode]");
    if (!button) return;
    setMode(button.dataset.mode);
  });

  buildBtn.addEventListener("click", buildSteps);
  playBtn.addEventListener("click", play);
  pauseBtn.addEventListener("click", stop);
  stepBtn.addEventListener("click", stepForward);
  backBtn.addEventListener("click", stepBack);
  resetBtn.addEventListener("click", () => {
    stop();
    steps = [];
    idx = -1;
    applyCurrent();
  });

  speedInput.addEventListener("input", () => {
    if (timer) play();
  });

  const requested = new URLSearchParams(window.location.search).get("algo");
  const valid = ["interval", "partition", "lateness", "dijkstra", "kruskal", "prim", "reverse_delete"];
  if (requested && valid.includes(requested)) setMode(requested);
  else setMode("interval");
  if (requested && valid.includes(requested)) buildSteps();
})();
