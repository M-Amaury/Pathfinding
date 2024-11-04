// server/pathfinding.js
function heuristic(a, b) {
  const R = 6371000;
  const φ1 = a.lat * Math.PI/180;
  const φ2 = b.lat * Math.PI/180;
  const Δφ = (b.lat-a.lat) * Math.PI/180;
  const Δλ = (b.lng-a.lng) * Math.PI/180;

  const a1 = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a1), Math.sqrt(1-a1));

  return R * c;
}

function findPaths(start, end, mines) {
  const paths = [];
  
  // Premier chemin - le plus direct possible
  const path1 = findSinglePath(start, end, mines, 1);
  if (path1) paths.push(path1);

  // Deuxième chemin - avec une déviation vers le nord
  const northBias = {
    lat: start.lat + (end.lat - start.lat) * 0.5 + 0.005,
    lng: start.lng + (end.lng - start.lng) * 0.5
  };
  const path2 = findSinglePath(start, end, mines, 1.1, northBias);
  if (path2) paths.push(path2);

  // Troisième chemin - avec une déviation vers le sud
  const southBias = {
    lat: start.lat + (end.lat - start.lat) * 0.5 - 0.005,
    lng: start.lng + (end.lng - start.lng) * 0.5
  };
  const path3 = findSinglePath(start, end, mines, 1.2, southBias);
  if (path3) paths.push(path3);

  return paths;
}

function findSinglePath(start, end, mines, weightFactor = 1, biasPoint = null) {
  const maxIterations = 1000; // Limite d'itérations pour éviter les boucles infinies
  let iterations = 0;
  let openList = [start];
  let closedList = new Set();
  let cameFrom = {};
  let gScore = {};
  let fScore = {};

  const startKey = `${start.lat},${start.lng}`;
  gScore[startKey] = 0;
  fScore[startKey] = heuristic(start, end) * weightFactor;

  while (openList.length > 0 && iterations < maxIterations) {
    iterations++;
    let current = openList.reduce((a, b) => 
      fScore[`${a.lat},${a.lng}`] < fScore[`${b.lat},${b.lng}`] ? a : b
    );

    const distanceToEnd = heuristic(current, end);
    if (distanceToEnd < 50) { // Réduire la distance d'arrivée à 50 mètres
      return reconstructPath(cameFrom, current, end);
    }

    openList = openList.filter(node => node !== current);
    closedList.add(`${current.lat},${current.lng}`);

    let neighbors = getNeighbors(current, mines, end);
    for (let neighbor of neighbors) {
      const neighborKey = `${neighbor.lat},${neighbor.lng}`;
      
      if (closedList.has(neighborKey)) continue;

      const tentativeGScore = gScore[`${current.lat},${current.lng}`] + 
        heuristic(current, neighbor);

      if (!openList.some(node => `${node.lat},${node.lng}` === neighborKey)) {
        openList.push(neighbor);
      } else if (tentativeGScore >= (gScore[neighborKey] || Infinity)) {
        continue;
      }

      cameFrom[neighborKey] = current;
      gScore[neighborKey] = tentativeGScore;
      fScore[neighborKey] = tentativeGScore + heuristic(neighbor, end) * weightFactor;
    }
  }

  return null;
}

function getNeighbors(node, mines, end) {
  const angles = Array.from({length: 16}, (_, i) => (2 * Math.PI * i) / 16);
  const baseStep = 0.0003; // Réduire le pas pour plus de précision
  let neighbors = [];

  // Ajuster le pas en fonction de la distance à la destination
  const distanceToEnd = heuristic(node, end);
  const step = distanceToEnd > 1000 ? baseStep * 2 : baseStep;

  for (let angle of angles) {
    const neighbor = {
      lat: node.lat + step * Math.cos(angle),
      lng: node.lng + step * Math.sin(angle)
    };

    if (isPointSafe(neighbor, mines)) {
      neighbors.push(neighbor);
    }
  }

  return neighbors;
}

function isPointSafe(point, mines) {
  for (let mine of mines) {
    const distance = heuristic(point, mine);
    const safeDistance = mine.type === 'PFM-1' ? 5 : 20;
    if (distance < safeDistance) {
      return false;
    }
  }
  return true;
}

function reconstructPath(cameFrom, current, end) {
  let coordinates = [];
  let instructions = [];
  let distance = 0;
  let prev = null;

  while (current) {
    coordinates.unshift([current.lat, current.lng]);
    instructions.unshift(`Aller à (${current.lat.toFixed(6)}, ${current.lng.toFixed(6)})`);
    
    if (prev) {
      distance += heuristic(current, prev);
    }
    
    prev = current;
    current = cameFrom[`${current.lat},${current.lng}`];
  }

  // Ajouter le point final si nécessaire
  if (heuristic(prev, end) > 1) {
    coordinates.push([end.lat, end.lng]);
    instructions.push(`Aller à (${end.lat.toFixed(6)}, ${end.lng.toFixed(6)})`);
    distance += heuristic(prev, end);
  }

  return {
    coordinates,
    instructions,
    distance: distance,
    duration: distance / 1.4
  };
}

module.exports = { findPaths };
