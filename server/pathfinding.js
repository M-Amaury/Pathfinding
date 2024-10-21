// server/pathfinding.js
function heuristic(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function findPath(start, end, mines) {
  let openList = [start];
  let closedList = [];
  let cameFrom = {};
  let gScore = {};
  let fScore = {};

  gScore[`${start.x},${start.y}`] = 0;
  fScore[`${start.x},${start.y}`] = heuristic(start, end);

  while (openList.length > 0) {
    let current = openList.reduce((a, b) => fScore[`${a.x},${a.y}`] < fScore[`${b.x},${b.y}`] ? a : b);

    if (current.x === end.x && current.y === end.y) {
      return reconstructPath(cameFrom, current);
    }

    openList = openList.filter(node => node !== current);
    closedList.push(current);

    let neighbors = getNeighbors(current, mines);
    for (let neighbor of neighbors) {
      if (closedList.some(node => node.x === neighbor.x && node.y === neighbor.y)) continue;

      let tentativeGScore = gScore[`${current.x},${current.y}`] + 1;

      if (!openList.some(node => node.x === neighbor.x && node.y === neighbor.y)) {
        openList.push(neighbor);
      } else if (tentativeGScore >= gScore[`${neighbor.x},${neighbor.y}`]) {
        continue;
      }

      cameFrom[`${neighbor.x},${neighbor.y}`] = current;
      gScore[`${neighbor.x},${neighbor.y}`] = tentativeGScore;
      fScore[`${neighbor.x},${neighbor.y}`] = gScore[`${neighbor.x},${neighbor.y}`] + heuristic(neighbor, end);
    }
  }

  return null; // Pas de chemin trouvé
}

function getNeighbors(node, mines) {
  let neighbors = [
    { x: node.x + 1, y: node.y },
    { x: node.x - 1, y: node.y },
    { x: node.x, y: node.y + 1 },
    { x: node.x, y: node.y - 1 }
  ];
  return neighbors.filter(n => !mines.some(m => m.x === n.x && m.y === n.y));
}

function reconstructPath(cameFrom, current) {
  let path = [];
  while (current) {
    path.unshift(`Go to (${current.x}, ${current.y})`);
    current = cameFrom[`${current.x},${current.y}`];
  }
  return path;
}

module.exports = { findPath };
