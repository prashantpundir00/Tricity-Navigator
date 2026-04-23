const sourceSelect = document.getElementById("source");
const destinationSelect = document.getElementById("destination");
const findRouteBtn = document.getElementById("findRouteBtn");
const bfsBtn = document.getElementById("bfsBtn");
const dfsBtn = document.getElementById("dfsBtn");

const pathOutput = document.getElementById("pathOutput");
const distanceOutput = document.getElementById("distanceOutput");
const visitedOutput = document.getElementById("visitedOutput");
const trafficOutput = document.getElementById("trafficOutput");
const aiOutput = document.getElementById("aiOutput");
const compareTitle = document.getElementById("compareTitle");
const compareOutput = document.getElementById("compareOutput");
const howTitle = document.getElementById("howTitle");
const howOutput = document.getElementById("howOutput");
const mapInfo = document.getElementById("mapInfo");
const algorithmInfo = document.getElementById("algorithmInfo");
const graphTitle = document.getElementById("graphTitle");
const routeLine = document.getElementById("routeLine");
const mapSvg = document.getElementById("mapSvg");
const graphSvg = document.getElementById("graphSvg");

let graphData = {
  nodes: [],
  edges: []
};

function formatPath(path) {
  return path.join(" \u2192 ");
}

function edgeKey(source, target) {
  return [source, target].sort().join("-");
}

function getNode(location) {
  return graphData.nodes.find((node) => node.id === location);
}

function createSvgElement(tagName, attributes = {}) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tagName);

  Object.entries(attributes).forEach(([name, value]) => {
    element.setAttribute(name, value);
  });

  return element;
}

function clearSvg(svg) {
  while (svg.firstChild) {
    svg.removeChild(svg.firstChild);
  }
}

function addLine(svg, source, target, className) {
  const sourceNode = getNode(source);
  const targetNode = getNode(target);

  if (!sourceNode || !targetNode) {
    return;
  }

  svg.appendChild(createSvgElement("line", {
    x1: sourceNode.x,
    y1: sourceNode.y,
    x2: targetNode.x,
    y2: targetNode.y,
    class: className
  }));
}

function pathToEdgeSet(path) {
  const set = new Set();

  for (let index = 0; index < path.length - 1; index++) {
    set.add(edgeKey(path[index], path[index + 1]));
  }

  return set;
}

function addMapZones(svg) {
  const zones = [
    { x: 30, y: 430, width: 250, height: 150, label: "Campus and Kharar" },
    { x: 250, y: 210, width: 350, height: 270, label: "Mohali" },
    { x: 510, y: 35, width: 350, height: 245, label: "Chandigarh" }
  ];

  zones.forEach((zone) => {
    svg.appendChild(createSvgElement("rect", {
      x: zone.x,
      y: zone.y,
      width: zone.width,
      height: zone.height,
      rx: 18,
      class: "map-zone"
    }));

    const text = createSvgElement("text", {
      x: zone.x + 16,
      y: zone.y + 28,
      class: "zone-label"
    });
    text.textContent = zone.label;
    svg.appendChild(text);
  });
}

function renderVisuals(options = {}) {
  const {
    path = [],
    visitedOrder = [],
    activeAlgorithm = "Dijkstra",
    mapMode = "route"
  } = options;

  clearSvg(mapSvg);
  clearSvg(graphSvg);

  const routeEdges = pathToEdgeSet(path);
  const visitedEdges = pathToEdgeSet(visitedOrder);
  const visitedSet = new Set(visitedOrder);
  const routeSet = new Set(path);

  addMapZones(mapSvg);

  graphData.edges.forEach((edge) => {
    const key = edgeKey(edge.source, edge.target);
    addLine(mapSvg, edge.source, edge.target, routeEdges.has(key) ? "route-road" : "road-line");
    addLine(
      graphSvg,
      edge.source,
      edge.target,
      routeEdges.has(key) ? "active-edge" : visitedEdges.has(key) ? "visited-edge" : "graph-edge"
    );

    const sourceNode = getNode(edge.source);
    const targetNode = getNode(edge.target);

    if (sourceNode && targetNode) {
      const label = createSvgElement("text", {
        x: (sourceNode.x + targetNode.x) / 2,
        y: (sourceNode.y + targetNode.y) / 2 - 6,
        class: "distance-label"
      });
      label.textContent = `${edge.distance} km`;
      graphSvg.appendChild(label);
    }
  });

  graphData.nodes.forEach((node) => {
    const mapPin = createSvgElement("circle", {
      cx: node.x,
      cy: node.y,
      r: routeSet.has(node.id) ? 13 : 10,
      class: routeSet.has(node.id) ? "map-pin route" : "map-pin"
    });
    mapSvg.appendChild(mapPin);

    const mapLabel = createSvgElement("text", {
      x: node.x + 14,
      y: node.y - 12,
      class: "pin-label"
    });
    mapLabel.textContent = node.id;
    mapSvg.appendChild(mapLabel);

    const graphNodeClass = routeSet.has(node.id)
      ? "graph-node route"
      : visitedSet.has(node.id)
        ? "graph-node visited"
        : "graph-node";

    graphSvg.appendChild(createSvgElement("circle", {
      cx: node.x,
      cy: node.y,
      r: 16,
      class: graphNodeClass
    }));

    const graphLabel = createSvgElement("text", {
      x: node.x + 18,
      y: node.y - 17,
      class: "node-label"
    });
    graphLabel.textContent = node.id;
    graphSvg.appendChild(graphLabel);

    const orderIndex = visitedOrder.indexOf(node.id);

    if (orderIndex !== -1) {
      graphSvg.appendChild(createSvgElement("circle", {
        cx: node.x,
        cy: node.y + 24,
        r: 12,
        class: "order-badge"
      }));

      const orderText = createSvgElement("text", {
        x: node.x,
        y: node.y + 24,
        class: "order-text"
      });
      orderText.textContent = orderIndex + 1;
      graphSvg.appendChild(orderText);
    }
  });

  graphTitle.textContent = `${activeAlgorithm} Graph View`;

  if (mapMode === "route" && path.length > 1) {
    mapInfo.textContent = `Map view highlights the selected road path: ${formatPath(path)}. Green roads show the final route, while grey roads show other available connections.`;
  } else {
    mapInfo.textContent = "Map view is showing the full road network. Select Find Route or BFS with a destination to highlight a travel path.";
  }

  algorithmInfo.textContent = `${activeAlgorithm} visited ${visitedOrder.length || 0} node${visitedOrder.length === 1 ? "" : "s"}. Yellow nodes show visited locations, green nodes show the final route, and numbered badges show exploration order.`;
}

function renderRoute(path, highlighted = true) {
  routeLine.innerHTML = "";

  path.forEach((location, index) => {
    const node = document.createElement("span");
    node.className = highlighted ? "route-node shortest" : "route-node";
    node.textContent = location;
    node.style.animationDelay = `${index * 60}ms`;
    routeLine.appendChild(node);

    if (index < path.length - 1) {
      const arrow = document.createElement("span");
      arrow.className = "route-arrow";
      arrow.textContent = "\u2192";
      routeLine.appendChild(arrow);
    }
  });
}

function showError(message) {
  pathOutput.textContent = "Something needs attention";
  distanceOutput.textContent = message;
  visitedOutput.textContent = "0";
  trafficOutput.textContent = "No route";
  aiOutput.textContent = "Please check the selected locations and try again.";
}

async function postData(url, data) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Request failed");
  }

  return result;
}

async function loadInitialData() {
  const [locationsResponse, graphResponse] = await Promise.all([
    fetch("/locations"),
    fetch("/graph")
  ]);

  const locationsData = await locationsResponse.json();
  graphData = await graphResponse.json();

  locationsData.locations.forEach((location) => {
    const sourceOption = document.createElement("option");
    sourceOption.value = location;
    sourceOption.textContent = location;
    sourceSelect.appendChild(sourceOption);

    const destinationOption = document.createElement("option");
    destinationOption.value = location;
    destinationOption.textContent = location;
    destinationSelect.appendChild(destinationOption);
  });

  sourceSelect.value = "CU";
  destinationSelect.value = "Sector17";
}

async function findRoute() {
  try {
    const result = await postData("/find-route", {
      source: sourceSelect.value,
      destination: destinationSelect.value
    });

    pathOutput.textContent = formatPath(result.path);
    distanceOutput.textContent = `Total distance: ${result.distance} km`;
    visitedOutput.textContent = result.visitedCount;
    trafficOutput.textContent = `${result.traffic} traffic`;
    aiOutput.textContent = result.aiExplanation;
    howTitle.textContent = "Dijkstra shortest path";
    howOutput.textContent = "Dijkstra gives every location a temporary distance, repeatedly chooses the nearest unvisited location, then rebuilds the final path from destination back to source.";
    renderRoute(result.path, true);
    renderVisuals({
      path: result.path,
      visitedOrder: result.visitedOrder || result.path,
      activeAlgorithm: "Dijkstra",
      mapMode: "route"
    });

    if (result.bfsComparison) {
      compareTitle.textContent = "Dijkstra vs BFS";
      compareOutput.textContent = `Dijkstra checks weighted distance. BFS route: ${formatPath(result.bfsComparison.path)} (${result.bfsComparison.distance} km, ${result.bfsComparison.stops} stops).`;
    }
  } catch (error) {
    showError(error.message);
  }
}

async function showBfs() {
  try {
    const result = await postData("/bfs", {
      source: sourceSelect.value,
      destination: destinationSelect.value
    });

    compareTitle.textContent = "BFS Traversal";
    compareOutput.textContent = formatPath(result.traversal);
    visitedOutput.textContent = result.visitedCount;
    trafficOutput.textContent = "Breadth first";
    aiOutput.textContent = "BFS explores nearby locations level by level, so it is useful for finding fewer-stop routes.";
    howTitle.textContent = "BFS flow";
    howOutput.textContent = "BFS uses a queue. It visits the source first, then every direct neighbor, then the next layer. The graph badges show that level-by-level order.";

    if (result.route) {
      pathOutput.textContent = formatPath(result.route.path);
      distanceOutput.textContent = `BFS route distance: ${result.route.distance} km`;
      renderRoute(result.route.path, false);
      renderVisuals({
        path: result.route.path,
        visitedOrder: result.traversal,
        activeAlgorithm: "BFS",
        mapMode: "route"
      });
    } else {
      renderVisuals({
        visitedOrder: result.traversal,
        activeAlgorithm: "BFS",
        mapMode: "network"
      });
    }
  } catch (error) {
    showError(error.message);
  }
}

async function showDfs() {
  try {
    const result = await postData("/dfs", {
      source: sourceSelect.value
    });

    compareTitle.textContent = "DFS Traversal";
    compareOutput.textContent = formatPath(result.traversal);
    visitedOutput.textContent = result.visitedCount;
    trafficOutput.textContent = "Depth first";
    aiOutput.textContent = "DFS goes deep along one route before backtracking, so it is useful for exploring connected areas.";
    pathOutput.textContent = "DFS exploration order";
    distanceOutput.textContent = "DFS is traversal-focused, so it does not calculate shortest distance here.";
    howTitle.textContent = "DFS flow";
    howOutput.textContent = "DFS uses recursion like a stack. It follows one connection as far as possible, then returns backward and tries another unvisited branch.";
    renderRoute(result.traversal, false);
    renderVisuals({
      visitedOrder: result.traversal,
      activeAlgorithm: "DFS",
      mapMode: "network"
    });
  } catch (error) {
    showError(error.message);
  }
}

findRouteBtn.addEventListener("click", findRoute);
bfsBtn.addEventListener("click", showBfs);
dfsBtn.addEventListener("click", showDfs);

loadInitialData().then(findRoute).catch((error) => {
  showError(error.message);
});
