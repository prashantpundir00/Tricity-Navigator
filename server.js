const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Graph represented as an adjacency list.
// Each key is a location and each value is a list of connected places with distance in km.
const graph = {
  CU: [
    { node: "Kharar", distance: 7 },
    { node: "Phase7", distance: 16 }
  ],
  Kharar: [
    { node: "CU", distance: 7 },
    { node: "Phase7", distance: 12 },
    { node: "VRPunjab", distance: 10 }
  ],
  Phase7: [
    { node: "CU", distance: 16 },
    { node: "Kharar", distance: 12 },
    { node: "Phase5", distance: 4 },
    { node: "PCAStadium", distance: 3 },
    { node: "QuarkCity", distance: 7 }
  ],
  Phase5: [
    { node: "Phase7", distance: 4 },
    { node: "ISBT", distance: 5 },
    { node: "PCAStadium", distance: 4 }
  ],
  QuarkCity: [
    { node: "Phase7", distance: 7 },
    { node: "VRPunjab", distance: 6 },
    { node: "ISBT", distance: 7 }
  ],
  ISBT: [
    { node: "Phase5", distance: 5 },
    { node: "QuarkCity", distance: 7 },
    { node: "Elante", distance: 6 },
    { node: "Sector17", distance: 8 }
  ],
  PCAStadium: [
    { node: "Phase7", distance: 3 },
    { node: "Phase5", distance: 4 },
    { node: "Sector17", distance: 9 }
  ],
  VRPunjab: [
    { node: "Kharar", distance: 10 },
    { node: "QuarkCity", distance: 6 },
    { node: "Elante", distance: 13 }
  ],
  Sector17: [
    { node: "ISBT", distance: 8 },
    { node: "PCAStadium", distance: 9 },
    { node: "RockGarden", distance: 5 },
    { node: "PGI", distance: 6 }
  ],
  SukhnaLake: [
    { node: "RockGarden", distance: 3 },
    { node: "Elante", distance: 8 },
    { node: "PGI", distance: 7 }
  ],
  PGI: [
    { node: "Sector17", distance: 6 },
    { node: "SukhnaLake", distance: 7 },
    { node: "RockGarden", distance: 4 }
  ],
  Elante: [
    { node: "ISBT", distance: 6 },
    { node: "VRPunjab", distance: 13 },
    { node: "SukhnaLake", distance: 8 },
    { node: "RockGarden", distance: 9 }
  ],
  RockGarden: [
    { node: "Sector17", distance: 5 },
    { node: "SukhnaLake", distance: 3 },
    { node: "PGI", distance: 4 },
    { node: "Elante", distance: 9 }
  ]
};

const locations = Object.keys(graph).sort();

const locationCoordinates = {
  CU: { x: 80, y: 560, area: "Campus" },
  Kharar: { x: 190, y: 505, area: "Kharar" },
  VRPunjab: { x: 305, y: 455, area: "Mohali" },
  QuarkCity: { x: 390, y: 375, area: "Mohali" },
  Phase7: { x: 290, y: 340, area: "Mohali" },
  Phase5: { x: 410, y: 300, area: "Mohali" },
  PCAStadium: { x: 345, y: 245, area: "Mohali" },
  ISBT: { x: 545, y: 275, area: "Mohali" },
  Elante: { x: 700, y: 250, area: "Chandigarh" },
  Sector17: { x: 585, y: 145, area: "Chandigarh" },
  PGI: { x: 515, y: 60, area: "Chandigarh" },
  RockGarden: { x: 685, y: 85, area: "Chandigarh" },
  SukhnaLake: { x: 825, y: 95, area: "Chandigarh" }
};

function getGraphEdges() {
  const seen = new Set();
  const edges = [];

  Object.entries(graph).forEach(([source, neighbors]) => {
    neighbors.forEach((neighbor) => {
      const edgeKey = [source, neighbor.node].sort().join("-");

      if (!seen.has(edgeKey)) {
        seen.add(edgeKey);
        edges.push({
          source,
          target: neighbor.node,
          distance: neighbor.distance
        });
      }
    });
  });

  return edges;
}

function isValidLocation(location) {
  return Boolean(location && graph[location]);
}

function calculatePathDistance(pathNodes) {
  let total = 0;

  for (let index = 0; index < pathNodes.length - 1; index++) {
    const current = pathNodes[index];
    const next = pathNodes[index + 1];
    const edge = graph[current].find((neighbor) => neighbor.node === next);

    if (!edge) {
      return Infinity;
    }

    total += edge.distance;
  }

  return total;
}

function bfsTraversal(start) {
  const visited = new Set();
  const queue = [start];
  const order = [];

  visited.add(start);

  while (queue.length > 0) {
    const current = queue.shift();
    order.push(current);

    graph[current].forEach((neighbor) => {
      if (!visited.has(neighbor.node)) {
        visited.add(neighbor.node);
        queue.push(neighbor.node);
      }
    });
  }

  return order;
}

function dfsTraversal(start) {
  const visited = new Set();
  const order = [];

  function visit(node) {
    visited.add(node);
    order.push(node);

    graph[node].forEach((neighbor) => {
      if (!visited.has(neighbor.node)) {
        visit(neighbor.node);
      }
    });
  }

  visit(start);
  return order;
}

// BFS shortest path by number of stops. This is useful for comparison.
function bfsShortestPath(source, destination) {
  const visited = new Set([source]);
  const queue = [{ node: source, path: [source] }];
  const visitedOrder = [source];

  while (queue.length > 0) {
    const current = queue.shift();

    if (current.node === destination) {
      return {
        path: current.path,
        distance: calculatePathDistance(current.path),
        visitedCount: visited.size,
        visitedOrder
      };
    }

    graph[current.node].forEach((neighbor) => {
      if (!visited.has(neighbor.node)) {
        visited.add(neighbor.node);
        visitedOrder.push(neighbor.node);
        queue.push({
          node: neighbor.node,
          path: [...current.path, neighbor.node]
        });
      }
    });
  }

  return null;
}

// Dijkstra finds the path with the smallest total distance.
function dijkstra(source, destination) {
  const distances = {};
  const previous = {};
  const unvisited = new Set(locations);
  const visitedOrder = [];

  locations.forEach((location) => {
    distances[location] = Infinity;
    previous[location] = null;
  });

  distances[source] = 0;

  while (unvisited.size > 0) {
    let current = null;

    unvisited.forEach((location) => {
      if (current === null || distances[location] < distances[current]) {
        current = location;
      }
    });

    if (current === null || distances[current] === Infinity) {
      break;
    }

    unvisited.delete(current);
    visitedOrder.push(current);

    if (current === destination) {
      break;
    }

    graph[current].forEach((neighbor) => {
      if (!unvisited.has(neighbor.node)) {
        return;
      }

      const newDistance = distances[current] + neighbor.distance;

      if (newDistance < distances[neighbor.node]) {
        distances[neighbor.node] = newDistance;
        previous[neighbor.node] = current;
      }
    });
  }

  const pathNodes = [];
  let current = destination;

  while (current) {
    pathNodes.unshift(current);
    current = previous[current];
  }

  if (pathNodes[0] !== source) {
    return null;
  }

  return {
    path: pathNodes,
    distance: distances[destination],
    visitedCount: visitedOrder.length,
    visitedOrder
  };
}

function getTrafficLevel(pathNodes) {
  const busyPlaces = ["Sector17", "Elante", "ISBT", "PCAStadium"];
  const busyCount = pathNodes.filter((node) => busyPlaces.includes(node)).length;

  if (busyCount >= 3) {
    return "High";
  }

  if (busyCount === 2) {
    return "Moderate";
  }

  return "Light";
}

function createAiExplanation(dijkstraResult, bfsResult) {
  const stops = dijkstraResult.path.length - 1;
  const traffic = getTrafficLevel(dijkstraResult.path);
  const bfsDistance = bfsResult ? bfsResult.distance : dijkstraResult.distance;
  const difference = bfsDistance - dijkstraResult.distance;

  let reason = `This route is better because it covers ${dijkstraResult.distance} km with ${stops} stop${stops === 1 ? "" : "s"}.`;

  if (difference > 0) {
    reason += ` It is ${difference} km shorter than the simple BFS route.`;
  } else {
    reason += " It also matches the simple BFS route distance for this trip.";
  }

  if (traffic === "High") {
    reason += " Traffic may be high near popular points, so starting early is recommended.";
  } else if (traffic === "Moderate") {
    reason += " Traffic looks moderate because the route touches a few busy locations.";
  } else {
    reason += " Traffic looks light because the route avoids most busy locations.";
  }

  return reason;
}

app.get("/locations", (req, res) => {
  res.json({ locations });
});

app.get("/graph", (req, res) => {
  res.json({
    nodes: locations.map((location) => ({
      id: location,
      ...locationCoordinates[location]
    })),
    edges: getGraphEdges()
  });
});

app.post("/find-route", (req, res) => {
  const { source, destination } = req.body;

  if (!isValidLocation(source) || !isValidLocation(destination)) {
    return res.status(400).json({ error: "Please select a valid source and destination." });
  }

  if (source === destination) {
    return res.json({
      algorithm: "Dijkstra",
      path: [source],
      distance: 0,
      visitedCount: 1,
      visitedOrder: [source],
      traffic: "Light",
      aiExplanation: "You are already at the destination, so no travel is needed.",
      bfsComparison: {
        path: [source],
        distance: 0,
        stops: 0
      }
    });
  }

  const shortestRoute = dijkstra(source, destination);
  const bfsRoute = bfsShortestPath(source, destination);

  if (!shortestRoute) {
    return res.status(404).json({ error: "No route found between the selected locations." });
  }

  res.json({
    algorithm: "Dijkstra",
    path: shortestRoute.path,
    distance: shortestRoute.distance,
    visitedCount: shortestRoute.visitedCount,
    visitedOrder: shortestRoute.visitedOrder,
    traffic: getTrafficLevel(shortestRoute.path),
    aiExplanation: createAiExplanation(shortestRoute, bfsRoute),
    bfsComparison: bfsRoute
      ? {
          path: bfsRoute.path,
          distance: bfsRoute.distance,
          stops: bfsRoute.path.length - 1
        }
      : null
  });
});

app.post("/bfs", (req, res) => {
  const { source, destination } = req.body;

  if (!isValidLocation(source)) {
    return res.status(400).json({ error: "Please select a valid source location." });
  }

  const traversal = bfsTraversal(source);
  const route = isValidLocation(destination) ? bfsShortestPath(source, destination) : null;

  res.json({
    algorithm: "BFS",
    traversal,
    visitedCount: traversal.length,
    route
  });
});

app.post("/dfs", (req, res) => {
  const { source } = req.body;

  if (!isValidLocation(source)) {
    return res.status(400).json({ error: "Please select a valid source location." });
  }

  const traversal = dfsTraversal(source);

  res.json({
    algorithm: "DFS",
    traversal,
    visitedCount: traversal.length
  });
});

app.listen(PORT, () => {
  console.log(`AI Smart Route Planner is running at http://localhost:${PORT}`);
});
