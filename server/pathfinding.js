// server/pathfinding.js
function heuristic(a, b) {
  const R = 6371000; // Rayon de la Terre en mètres
  const φ1 = a.lat * Math.PI/180;
  const φ2 = b.lat * Math.PI/180;
  const Δφ = (b.lat-a.lat) * Math.PI/180;
  const Δλ = (b.lng-a.lng) * Math.PI/180;

  const a1 = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a1), Math.sqrt(1-a1));

  return R * c; // Distance en mètres
}

function isPointSafe(point, mines) {
  for (let mine of mines) {
    const distance = heuristic(point, mine);
    const safeDistance = mine.type === 'PFM-1' ? 5 : 20; // 10m pour PFM-1, 100m pour TM-62
    if (distance < safeDistance) {
      return false;
    }
  }
  return true;
}

function getNeighbors(node, mines) {
  const angles = Array.from({length: 32}, (_, i) => (2 * Math.PI * i) / 32);
  const step = 0.0005; // Environ 110 mètres
  let neighbors = [];

  for (let angle of angles) {
    const neighbor = {
      lat: node.lat + step * Math.cos(angle),
      lng: node.lng + step * Math.sin(angle)
    };

    if (isPointSafe(neighbor, mines) && isPathSafe(node, neighbor, mines)) {
      neighbors.push(neighbor);
    }
  }

  return neighbors;
}

function isPathSafe(from, to, mines) {
  const steps = 10;
  for (let i = 0; i <= steps; i++) {
    const point = {
      lat: from.lat + (to.lat - from.lat) * (i / steps),
      lng: from.lng + (to.lng - from.lng) * (i / steps)
    };
    if (!isPointSafe(point, mines)) {
      return false;
    }
  }
  return true;
}

function findPath(start, end, mines) {
  if (!isPointSafe(start, mines)) {
    console.log("Le point de départ est trop proche d'une mine");
    return null;
  }
  if (!isPointSafe(end, mines)) {
    console.log("Le point d'arrivée est trop proche d'une mine");
    return null;
  }

  let openList = [start];
  let closedList = [];
  let cameFrom = {};
  let gScore = {};
  let fScore = {};

  const startKey = `${start.lat},${start.lng}`;
  gScore[startKey] = 0;
  fScore[startKey] = heuristic(start, end);

  while (openList.length > 0) {
    let current = openList.reduce((a, b) => 
      fScore[`${a.lat},${a.lng}`] < fScore[`${b.lat},${b.lng}`] ? a : b
    );

    if (heuristic(current, end) < 100) { // Distance d'arrivée de 100 mètres
      return reconstructPath(cameFrom, current, end);
    }

    openList = openList.filter(node => node !== current);
    closedList.push(current);

    let neighbors = getNeighbors(current, mines);
    for (let neighbor of neighbors) {
      const neighborKey = `${neighbor.lat},${neighbor.lng}`;
      
      if (closedList.some(node => heuristic(node, neighbor) < 10)) continue;

      let tentativeGScore = gScore[`${current.lat},${current.lng}`] + 
        heuristic(current, neighbor);

      if (!gScore[neighborKey] || tentativeGScore < gScore[neighborKey]) {
        cameFrom[neighborKey] = current;
        gScore[neighborKey] = tentativeGScore;
        fScore[neighborKey] = gScore[neighborKey] + heuristic(neighbor, end);
        
        if (!openList.some(node => heuristic(node, neighbor) < 10)) {
          openList.push(neighbor);
        }
      }
    }
  }

  console.log("Aucun chemin sûr trouvé");
  return null;
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

  if (prev && heuristic(prev, end) > 1) {
    coordinates.push([end.lat, end.lng]);
    instructions.push(`Aller à (${end.lat.toFixed(6)}, ${end.lng.toFixed(6)})`);
    distance += heuristic(prev, end);
  }

  return {
    coordinates,
    instructions,
    distance: distance,
    duration: distance / 1.4 // Vitesse moyenne de marche : 1.4 m/s
  };
}

module.exports = { findPath };
