(() => {
  const tabs = document.getElementById("searchAlgoTabs");
  if (!tabs) return;

  const arrayView = document.getElementById("arrayView");
  const arraySection = document.getElementById("arraySection");
  const graphSection = document.getElementById("graphSection");
  const graphView = document.getElementById("graphView");
  const stateEl = document.getElementById("searchState");
  const conceptEl = document.getElementById("searchConcept");
  const targetControlEl = document.getElementById("targetControl");
  const problemEl = document.getElementById("searchProblem");
  const logicEl = document.getElementById("searchLogic");
  const pseudocodeEl = document.getElementById("searchPseudocode");
  const complexityEl = document.getElementById("searchComplexity");
  const targetInput = document.getElementById("targetInput");
  const speedInput = document.getElementById("speedInput");

  const buildBtn = document.getElementById("buildBtn");
  const playBtn = document.getElementById("playBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const stepBtn = document.getElementById("stepBtn");
  const backBtn = document.getElementById("backBtn");
  const resetBtn = document.getElementById("resetBtn");

  let mode = "linear";
  const baseArray = [7, 12, 19, 25, 31, 42, 49, 58, 61, 75, 88, 93];

  const graphNodes = [
    { id: "A", x: 90, y: 80 },
    { id: "B", x: 270, y: 70 },
    { id: "C", x: 190, y: 180 },
    { id: "D", x: 410, y: 125 },
    { id: "E", x: 520, y: 280 },
    { id: "F", x: 300, y: 300 },
    { id: "G", x: 110, y: 290 }
  ];

  const graphEdges = [
    ["A", "B"],
    ["A", "C"],
    ["A", "G"],
    ["B", "C"],
    ["B", "D"],
    ["C", "D"],
    ["C", "F"],
    ["D", "E"],
    ["F", "E"],
    ["F", "G"]
  ];

  const adjacency = graphNodes.reduce((acc, n) => {
    acc[n.id] = [];
    return acc;
  }, {});
  graphEdges.forEach(([u, v]) => {
    adjacency[u].push(v);
    adjacency[v].push(u);
  });
  Object.values(adjacency).forEach((arr) => arr.sort());

  let steps = [];
  let index = -1;
  let timer = null;

  const concepts = {
    linear: "Linear search checks each element in order until it finds the target or reaches the end.",
    binary: "Binary search repeatedly halves the search interval in a sorted list.",
    bfs: "Breadth First Search explores neighbors level by level with a queue.",
    dfs: "Depth First Search explores one path deeply before backtracking with a stack."
  };

  const details = {
    linear: {
      problem: "Given an array and a target value, find the target index (or report that it is absent).",
      logic: "Scan from left to right and stop when the current value matches the target.",
      pseudocode: `Input: array A[0..n-1], target x
for i = 0 to n - 1:
  if A[i] == x:
    return i
return NOT_FOUND`,
      complexity: "Time: O(n) worst/average, O(1) best. Space: O(1)."
    },
    binary: {
      problem: "Find a target value in a sorted array.",
      logic: "Compare target to the middle element, then discard half the search range each step.",
      pseudocode: `Input: sorted array A[0..n-1], target x
left = 0, right = n - 1
while left <= right:
  mid = floor((left + right) / 2)
  if A[mid] == x: return mid
  if A[mid] < x: left = mid + 1
  else: right = mid - 1
return NOT_FOUND`,
      complexity: "Time: O(log n) worst/average, O(1) best. Space: O(1)."
    },
    bfs: {
      problem: "Traverse a graph from a start node in increasing distance layers.",
      logic: "Use a queue: dequeue a node, then enqueue each unvisited neighbor.",
      pseudocode: `Input: graph G=(V,E), start s
mark s visited
enqueue(s)
while queue not empty:
  u = dequeue()
  for each neighbor v of u:
    if v is not visited:
      mark v visited
      enqueue(v)`,
      complexity: "Time: O(V + E). Space: O(V) for visited set and queue."
    },
    dfs: {
      problem: "Traverse a graph by exploring each branch deeply before backtracking.",
      logic: "Use a stack (or recursion) and push unvisited neighbors to continue depth-first.",
      pseudocode: `Input: graph G=(V,E), start s
mark s visited
push(s)
while stack not empty:
  u = pop()
  for each neighbor v of u:
    if v is not visited:
      mark v visited
      push(v)`,
      complexity: "Time: O(V + E). Space: O(V) for visited set and stack/recursion."
    }
  };

  function renderDetails(key) {
    const d = details[key];
    problemEl.textContent = d.problem;
    logicEl.textContent = d.logic;
    pseudocodeEl.textContent = d.pseudocode;
    complexityEl.textContent = d.complexity;
  }

  function setMode(next) {
    mode = next;
    tabs.querySelectorAll("button").forEach((b) => {
      b.classList.toggle("active", b.dataset.mode === next);
    });

    const showGraph = next === "bfs" || next === "dfs";
    targetControlEl.style.display = showGraph ? "none" : "block";
    arraySection.style.display = showGraph ? "none" : "block";
    graphSection.style.display = showGraph ? "block" : "none";
    conceptEl.textContent = concepts[next];
    renderDetails(next);
    stopPlaying();
    resetState();
    if (showGraph) renderGraph(null);
    else renderArray(null);
  }

  function resetState() {
    steps = [];
    index = -1;
    stateEl.textContent = "No steps built yet.";
  }

  function renderArray(step) {
    const target = Number(targetInput.value);
    arrayView.innerHTML = "";

    baseArray.forEach((value, i) => {
      const bar = document.createElement("div");
      bar.className = "bar";
      bar.style.height = `${36 + value * 2}px`;
      const label = document.createElement("span");
      label.textContent = value;
      bar.appendChild(label);

      if (step) {
        if (step.activeIndices?.includes(i)) bar.classList.add("active");
        if (step.foundIndex === i) bar.classList.add("found");
      }

      if (value === target && !step) {
        bar.style.opacity = "0.95";
      }

      arrayView.appendChild(bar);
    });
  }

  function edgeKey(a, b) {
    return [a, b].sort().join("-");
  }

  function renderGraph(step) {
    graphView.innerHTML = "";

    graphEdges.forEach(([u, v]) => {
      const from = graphNodes.find((n) => n.id === u);
      const to = graphNodes.find((n) => n.id === v);
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", from.x);
      line.setAttribute("y1", from.y);
      line.setAttribute("x2", to.x);
      line.setAttribute("y2", to.y);
      line.setAttribute("class", "edge");
      if (step?.activeEdge === edgeKey(u, v)) line.classList.add("active");
      graphView.appendChild(line);
    });

    graphNodes.forEach((n) => {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", n.x);
      circle.setAttribute("cy", n.y);
      circle.setAttribute("r", 24);
      circle.setAttribute("class", "node");
      if (step?.seen?.includes(n.id)) circle.classList.add("seen");
      if (step?.activeNode === n.id) circle.classList.add("visiting");
      graphView.appendChild(circle);

      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", n.x);
      text.setAttribute("y", n.y);
      text.setAttribute("class", "node-label");
      text.textContent = n.id;
      graphView.appendChild(text);
    });
  }

  function buildLinearSteps(target) {
    const out = [];
    for (let i = 0; i < baseArray.length; i += 1) {
      out.push({
        activeIndices: [i],
        foundIndex: null,
        text: `Inspect index ${i} (value ${baseArray[i]}).`
      });
      if (baseArray[i] === target) {
        out.push({
          activeIndices: [i],
          foundIndex: i,
          text: `Found target ${target} at index ${i}.`
        });
        return out;
      }
    }
    out.push({ activeIndices: [], foundIndex: null, text: `Target ${target} is not in the array.` });
    return out;
  }

  function buildBinarySteps(target) {
    const out = [];
    let left = 0;
    let right = baseArray.length - 1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      out.push({
        activeIndices: [left, mid, right],
        foundIndex: null,
        text: `Range [${left}, ${right}], check middle index ${mid} (value ${baseArray[mid]}).`
      });
      if (baseArray[mid] === target) {
        out.push({
          activeIndices: [mid],
          foundIndex: mid,
          text: `Found target ${target} at index ${mid}.`
        });
        return out;
      }
      if (baseArray[mid] < target) {
        left = mid + 1;
        out.push({
          activeIndices: [left, right].filter((i) => i >= 0 && i < baseArray.length),
          foundIndex: null,
          text: `Target is larger, move left boundary to ${left}.`
        });
      } else {
        right = mid - 1;
        out.push({
          activeIndices: [left, right].filter((i) => i >= 0 && i < baseArray.length),
          foundIndex: null,
          text: `Target is smaller, move right boundary to ${right}.`
        });
      }
    }

    out.push({ activeIndices: [], foundIndex: null, text: `Target ${target} is not in the array.` });
    return out;
  }

  function buildGraphSteps(kind) {
    const start = "A";
    const seen = new Set([start]);
    const out = [];
    const fullName = kind === "bfs" ? "Breadth First Search" : "Depth First Search";

    if (kind === "bfs") {
      const queue = [start];
      out.push({
        activeNode: start,
        seen: [...seen],
        activeEdge: null,
        text: `Initialize Breadth First Search queue with ${start}: [${queue.join(", ")}].`
      });

      while (queue.length) {
        const node = queue.shift();
        out.push({
          activeNode: node,
          seen: [...seen],
          activeEdge: null,
          text: `Dequeue ${node}. Queue: [${queue.join(", ")}].`
        });

        for (const next of adjacency[node]) {
          out.push({
            activeNode: node,
            seen: [...seen],
            activeEdge: edgeKey(node, next),
            text: `Inspect edge ${node} -> ${next}.`
          });
          if (!seen.has(next)) {
            seen.add(next);
            queue.push(next);
            out.push({
              activeNode: next,
              seen: [...seen],
              activeEdge: edgeKey(node, next),
              text: `Discover ${next}. Queue: [${queue.join(", ")}].`
            });
          }
        }
      }
    } else {
      const stack = [start];
      out.push({
        activeNode: start,
        seen: [...seen],
        activeEdge: null,
        text: `Initialize Depth First Search stack with ${start}: [${stack.join(", ")}].`
      });

      while (stack.length) {
        const node = stack.pop();
        out.push({
          activeNode: node,
          seen: [...seen],
          activeEdge: null,
          text: `Pop ${node}. Stack: [${stack.join(", ")}].`
        });

        const neighbors = [...adjacency[node]].reverse();
        for (const next of neighbors) {
          out.push({
            activeNode: node,
            seen: [...seen],
            activeEdge: edgeKey(node, next),
            text: `Inspect edge ${node} -> ${next}.`
          });
          if (!seen.has(next)) {
            seen.add(next);
            stack.push(next);
            out.push({
              activeNode: next,
              seen: [...seen],
              activeEdge: edgeKey(node, next),
              text: `Discover ${next}. Stack: [${stack.join(", ")}].`
            });
          }
        }
      }
    }

    out.push({
      activeNode: null,
      seen: [...seen],
      activeEdge: null,
      text: `${fullName} complete. Visited nodes: ${[...seen].join(", ")}.`
    });

    return out;
  }

  function buildSteps() {
    const target = Number(targetInput.value);
    if (Number.isNaN(target)) {
      stateEl.textContent = "Enter a valid numeric target.";
      return;
    }

    if (mode === "linear") steps = buildLinearSteps(target);
    else if (mode === "binary") steps = buildBinarySteps(target);
    else steps = buildGraphSteps(mode);

    index = -1;
    applyCurrent();
  }

  function applyCurrent() {
    if (index < 0) {
      stateEl.textContent = "Ready. Build steps then play or step forward.";
      renderArray(null);
      renderGraph(null);
      return;
    }

    const step = steps[index];
    stateEl.textContent = `Step ${index + 1}/${steps.length}\n${step.text}`;

    if (mode === "linear" || mode === "binary") renderArray(step);
    else renderGraph(step);
  }

  function stepForward() {
    if (!steps.length || index >= steps.length - 1) return;
    index += 1;
    applyCurrent();
  }

  function stepBack() {
    if (index <= -1) return;
    index -= 1;
    applyCurrent();
  }

  function startPlaying() {
    stopPlaying();
    timer = setInterval(() => {
      if (index >= steps.length - 1) {
        stopPlaying();
        return;
      }
      stepForward();
    }, Number(speedInput.value));
  }

  function stopPlaying() {
    if (!timer) return;
    clearInterval(timer);
    timer = null;
  }

  tabs.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-mode]");
    if (!button) return;
    setMode(button.dataset.mode);
  });

  buildBtn.addEventListener("click", buildSteps);
  playBtn.addEventListener("click", startPlaying);
  pauseBtn.addEventListener("click", stopPlaying);
  stepBtn.addEventListener("click", stepForward);
  backBtn.addEventListener("click", stepBack);
  resetBtn.addEventListener("click", () => {
    stopPlaying();
    resetState();
    if (mode === "linear" || mode === "binary") renderArray(null);
    else renderGraph(null);
  });

  speedInput.addEventListener("input", () => {
    if (timer) startPlaying();
  });

  const requested = new URLSearchParams(window.location.search).get("algo");
  if (requested && ["linear", "binary", "bfs", "dfs"].includes(requested)) setMode(requested);
  else setMode("linear");
  if (requested && ["linear", "binary", "bfs", "dfs"].includes(requested)) buildSteps();
})();
