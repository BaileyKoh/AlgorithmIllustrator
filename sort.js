(() => {
  const view = document.getElementById("sortArrayView");
  if (!view) return;

  const algoTabs = document.getElementById("sortAlgoTabs");
  const sizeInput = document.getElementById("sizeInput");
  const speedInput = document.getElementById("sortSpeed");
  const stateEl = document.getElementById("sortState");
  const conceptEl = document.getElementById("sortConcept");
  const problemEl = document.getElementById("sortProblem");
  const logicEl = document.getElementById("sortLogic");
  const pseudocodeEl = document.getElementById("sortPseudocode");
  const complexityEl = document.getElementById("sortComplexity");

  const newArrayBtn = document.getElementById("newArrayBtn");
  const buildBtn = document.getElementById("buildSortBtn");
  const playBtn = document.getElementById("playSortBtn");
  const pauseBtn = document.getElementById("pauseSortBtn");
  const stepBtn = document.getElementById("stepSortBtn");
  const backBtn = document.getElementById("backSortBtn");
  const resetBtn = document.getElementById("resetSortBtn");

  let base = [];
  let steps = [];
  let idx = -1;
  let timer = null;
  let currentAlgo = "bubble";

  const conceptMap = {
    bubble: "Bubble sort repeatedly swaps adjacent out-of-order pairs.",
    selection: "Selection sort picks the minimum of the unsorted suffix each pass.",
    insertion: "Insertion sort grows a sorted prefix by inserting each new element.",
    merge: "Merge sort divides recursively and merges sorted halves.",
    quick: "Quick sort partitions around a pivot, then recurses on both sides."
  };

  const details = {
    bubble: {
      problem: "Sort an array into nondecreasing order.",
      logic: "Repeatedly compare adjacent elements and swap if out of order; large elements bubble rightward.",
      pseudocode: `Input: array A[0..n-1]
for i = 0 to n - 1:
  for j = 0 to n - i - 2:
    if A[j] > A[j + 1]:
      swap(A[j], A[j + 1])`,
      complexity: "Time: O(n^2) worst/average, O(n) best with early stop optimization. Space: O(1)."
    },
    selection: {
      problem: "Sort an array by repeatedly fixing the next smallest value.",
      logic: "Find the minimum in the unsorted suffix and swap it into position i.",
      pseudocode: `Input: array A[0..n-1]
for i = 0 to n - 1:
  min = i
  for j = i + 1 to n - 1:
    if A[j] < A[min]: min = j
  swap(A[i], A[min])`,
      complexity: "Time: O(n^2) in best/average/worst. Space: O(1)."
    },
    insertion: {
      problem: "Sort by maintaining a growing sorted prefix.",
      logic: "Take the next key and shift larger prefix elements right until insertion point is found.",
      pseudocode: `Input: array A[0..n-1]
for i = 1 to n - 1:
  key = A[i]
  j = i - 1
  while j >= 0 and A[j] > key:
    A[j + 1] = A[j]
    j = j - 1
  A[j + 1] = key`,
      complexity: "Time: O(n^2) worst/average, O(n) best (already sorted). Space: O(1)."
    },
    merge: {
      problem: "Sort efficiently using divide-and-conquer.",
      logic: "Recursively sort left/right halves, then merge two sorted lists into one sorted segment.",
      pseudocode: `mergeSort(A, left, right):
  if left >= right: return
  mid = floor((left + right) / 2)
  mergeSort(A, left, mid)
  mergeSort(A, mid + 1, right)
  merge(A, left, mid, right)`,
      complexity: "Time: O(n log n) in all cases. Space: O(n) auxiliary merge storage."
    },
    quick: {
      problem: "Sort by partitioning around pivots.",
      logic: "Choose a pivot, partition into <= pivot and > pivot, then recurse on both parts.",
      pseudocode: `quickSort(A, low, high):
  if low >= high: return
  p = partition(A, low, high)
  quickSort(A, low, p - 1)
  quickSort(A, p + 1, high)`,
      complexity: "Time: O(n^2) worst, O(n log n) average/best. Space: O(log n) average recursion depth."
    }
  };

  function renderDetails(key) {
    const d = details[key];
    problemEl.textContent = d.problem;
    logicEl.textContent = d.logic;
    pseudocodeEl.textContent = d.pseudocode;
    complexityEl.textContent = d.complexity;
  }

  function setAlgo(next) {
    if (!conceptMap[next]) return;
    currentAlgo = next;
    algoTabs.querySelectorAll("button").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.mode === next);
    });
    conceptEl.textContent = conceptMap[next];
    renderDetails(next);
    stopPlaying();
    steps = [];
    idx = -1;
    applyStep();
  }

  function randomArray(n) {
    return Array.from({ length: n }, () => Math.floor(Math.random() * 80) + 15);
  }

  function clone(arr) {
    return arr.slice();
  }

  function pushStep(out, arr, active = [], compare = [], sorted = [], text = "") {
    out.push({ arr: clone(arr), active: [...active], compare: [...compare], sorted: [...sorted], text });
  }

  function buildBubble(input) {
    const arr = clone(input);
    const out = [];
    const sorted = [];

    for (let i = 0; i < arr.length; i += 1) {
      for (let j = 0; j < arr.length - i - 1; j += 1) {
        pushStep(out, arr, [], [j, j + 1], sorted, `Compare indices ${j} and ${j + 1}.`);
        if (arr[j] > arr[j + 1]) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          pushStep(out, arr, [j, j + 1], [], sorted, `Swap ${j} and ${j + 1}.`);
        }
      }
      sorted.push(arr.length - i - 1);
      pushStep(out, arr, [], [], sorted, `Position ${arr.length - i - 1} is fixed.`);
    }

    return out;
  }

  function buildSelection(input) {
    const arr = clone(input);
    const out = [];
    const sorted = [];

    for (let i = 0; i < arr.length; i += 1) {
      let min = i;
      pushStep(out, arr, [i], [], sorted, `Set index ${i} as current minimum.`);

      for (let j = i + 1; j < arr.length; j += 1) {
        pushStep(out, arr, [min], [min, j], sorted, `Compare min index ${min} with ${j}.`);
        if (arr[j] < arr[min]) {
          min = j;
          pushStep(out, arr, [min], [], sorted, `New minimum found at ${min}.`);
        }
      }

      if (min !== i) {
        [arr[i], arr[min]] = [arr[min], arr[i]];
        pushStep(out, arr, [i, min], [], sorted, `Swap ${i} and ${min}.`);
      }
      sorted.push(i);
      pushStep(out, arr, [], [], sorted, `Index ${i} is now sorted.`);
    }

    return out;
  }

  function buildInsertion(input) {
    const arr = clone(input);
    const out = [];

    pushStep(out, arr, [0], [], [0], "Start with first element as sorted.");

    for (let i = 1; i < arr.length; i += 1) {
      const key = arr[i];
      let j = i - 1;
      pushStep(out, arr, [i], [], [], `Insert value ${key} from index ${i}.`);

      while (j >= 0 && arr[j] > key) {
        pushStep(out, arr, [j], [j, j + 1], [], `Shift ${arr[j]} right from index ${j}.`);
        arr[j + 1] = arr[j];
        pushStep(out, arr, [j + 1], [], [], `Index ${j + 1} updated.`);
        j -= 1;
      }

      arr[j + 1] = key;
      const sorted = Array.from({ length: i + 1 }, (_, k) => k);
      pushStep(out, arr, [j + 1], [], sorted, `Placed ${key} at index ${j + 1}.`);
    }

    return out;
  }

  function buildMerge(input) {
    const arr = clone(input);
    const out = [];

    function merge(left, mid, right) {
      const leftArr = arr.slice(left, mid + 1);
      const rightArr = arr.slice(mid + 1, right + 1);
      let i = 0;
      let j = 0;
      let k = left;

      while (i < leftArr.length && j < rightArr.length) {
        pushStep(out, arr, [k], [], [], `Merge compare ${leftArr[i]} and ${rightArr[j]}.`);
        if (leftArr[i] <= rightArr[j]) {
          arr[k] = leftArr[i];
          i += 1;
        } else {
          arr[k] = rightArr[j];
          j += 1;
        }
        pushStep(out, arr, [k], [], [], `Write merged value at index ${k}.`);
        k += 1;
      }

      while (i < leftArr.length) {
        arr[k] = leftArr[i];
        pushStep(out, arr, [k], [], [], `Copy remaining left value to index ${k}.`);
        i += 1;
        k += 1;
      }

      while (j < rightArr.length) {
        arr[k] = rightArr[j];
        pushStep(out, arr, [k], [], [], `Copy remaining right value to index ${k}.`);
        j += 1;
        k += 1;
      }

      const sorted = [];
      for (let s = left; s <= right; s += 1) sorted.push(s);
      pushStep(out, arr, [], [], sorted, `Merged segment [${left}, ${right}].`);
    }

    function run(left, right) {
      if (left >= right) return;
      const mid = Math.floor((left + right) / 2);
      run(left, mid);
      run(mid + 1, right);
      merge(left, mid, right);
    }

    run(0, arr.length - 1);
    pushStep(out, arr, [], [], Array.from({ length: arr.length }, (_, i) => i), "Merge sort complete.");
    return out;
  }

  function buildQuick(input) {
    const arr = clone(input);
    const out = [];

    function partition(low, high) {
      const pivot = arr[high];
      let i = low - 1;
      pushStep(out, arr, [high], [], [], `Pivot is ${pivot} at index ${high}.`);

      for (let j = low; j < high; j += 1) {
        pushStep(out, arr, [high], [j, high], [], `Compare index ${j} with pivot.`);
        if (arr[j] <= pivot) {
          i += 1;
          [arr[i], arr[j]] = [arr[j], arr[i]];
          pushStep(out, arr, [i, j], [], [], `Swap indices ${i} and ${j}.`);
        }
      }

      [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
      pushStep(out, arr, [i + 1], [], [i + 1], `Place pivot at index ${i + 1}.`);
      return i + 1;
    }

    function run(low, high) {
      if (low < high) {
        const pi = partition(low, high);
        run(low, pi - 1);
        run(pi + 1, high);
      }
    }

    run(0, arr.length - 1);
    pushStep(out, arr, [], [], Array.from({ length: arr.length }, (_, i) => i), "Quick sort complete.");
    return out;
  }

  function buildSteps() {
    const algo = currentAlgo;

    if (algo === "bubble") steps = buildBubble(base);
    else if (algo === "selection") steps = buildSelection(base);
    else if (algo === "insertion") steps = buildInsertion(base);
    else if (algo === "merge") steps = buildMerge(base);
    else steps = buildQuick(base);

    idx = -1;
    applyStep();
  }

  function render(step) {
    const frame = step ? step.arr : base;
    const active = new Set(step?.active || []);
    const compare = new Set(step?.compare || []);
    const sorted = new Set(step?.sorted || []);

    view.innerHTML = "";
    frame.forEach((v, i) => {
      const bar = document.createElement("div");
      bar.className = "bar";
      bar.style.height = `${20 + v * 2.5}px`;
      const label = document.createElement("span");
      label.textContent = v;
      bar.appendChild(label);

      if (active.has(i)) bar.classList.add("active");
      if (compare.has(i)) bar.classList.add("compare");
      if (sorted.has(i)) bar.classList.add("sorted");

      view.appendChild(bar);
    });
  }

  function applyStep() {
    if (idx < 0) {
      stateEl.textContent = "Ready. Build steps and start playback.";
      render(null);
      return;
    }

    const step = steps[idx];
    render(step);
    stateEl.textContent = `Step ${idx + 1}/${steps.length}\n${step.text}`;
  }

  function stepForward() {
    if (!steps.length || idx >= steps.length - 1) return;
    idx += 1;
    applyStep();
  }

  function stepBack() {
    if (idx <= -1) return;
    idx -= 1;
    applyStep();
  }

  function stopPlaying() {
    if (!timer) return;
    clearInterval(timer);
    timer = null;
  }

  function startPlaying() {
    stopPlaying();
    timer = setInterval(() => {
      if (idx >= steps.length - 1) {
        stopPlaying();
        return;
      }
      stepForward();
    }, Number(speedInput.value));
  }

  function resetArray() {
    stopPlaying();
    base = randomArray(Number(sizeInput.value));
    steps = [];
    idx = -1;
    applyStep();
  }

  newArrayBtn.addEventListener("click", resetArray);
  buildBtn.addEventListener("click", () => {
    stopPlaying();
    buildSteps();
  });
  playBtn.addEventListener("click", startPlaying);
  pauseBtn.addEventListener("click", stopPlaying);
  stepBtn.addEventListener("click", stepForward);
  backBtn.addEventListener("click", stepBack);
  resetBtn.addEventListener("click", () => {
    stopPlaying();
    idx = -1;
    applyStep();
  });
  speedInput.addEventListener("input", () => {
    if (timer) startPlaying();
  });

  algoTabs.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-mode]");
    if (!button) return;
    setAlgo(button.dataset.mode);
  });

  sizeInput.addEventListener("input", resetArray);

  setAlgo("bubble");
  const requested = new URLSearchParams(window.location.search).get("algo");
  if (requested && conceptMap[requested]) {
    setAlgo(requested);
  }
  resetArray();
  if (requested && conceptMap[requested]) buildSteps();
})();
