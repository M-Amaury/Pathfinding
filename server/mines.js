// server/mines.js
let minesList = [];

function addMine(mine) {
  minesList.push(mine);
}

function getMines() {
  return minesList;
}

function removeMine(index) {
  if (index >= 0 && index < minesList.length) {
    minesList.splice(index, 1);
    return true;
  }
  return false;
}

module.exports = { addMine, getMines, removeMine };
