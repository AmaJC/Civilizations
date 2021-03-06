const config = {
  type: Phaser.AUTO,
  width: 1000,
  height: 700,
  parent: "game-container",
  pixelArt: true,
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

const game = new Phaser.Game(config);
let controls;
let marker;
let shiftKey;
let groundLayer;
let hudResources;

// All the hud resources go here
let population;
let wood;
let stone;
let food;
let hudHoverTileInfo;

let tileIndexToName = {
  11: "Land",
  12: "Water",
  14: "Dirt"
}

function preload() {
  this.load.image("tiles", "assets/tilesets/basictileset.png");
  this.load.tilemapTiledJSON("map", "assets/tilemaps/world.json");
}

function create() {
  const map = this.make.tilemap({ key: "map" });
  const tiles = map.addTilesetImage("basictileset", "tiles");

  // Same setup as static layers
  groundLayer = map.createDynamicLayer("Ground", tiles);

  shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

  // Set up the arrows to control the camera
  const cursors = this.input.keyboard.createCursorKeys();
  const controlConfig = {
    camera: this.cameras.main,
    left: cursors.left,
    right: cursors.right,
    up: cursors.up,
    down: cursors.down,
    speed: 0.5
  };
  controls = new Phaser.Cameras.Controls.FixedKeyControl(controlConfig);

  // Limit the camera to the map size
  this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

  // Create a simple graphic that can be used to show which tile the mouse is over
  marker = this.add.graphics();
  marker.lineStyle(2, 0xffffff, 1);
  marker.strokeRect(0, 0, map.tileWidth, map.tileHeight);
  marker.lineStyle(3, 0xffffff, 1);
  marker.strokeRect(0, 0, map.tileWidth, map.tileHeight);

  // Help text that has a "fixed" position on the screen
  this.add
    .text(16, 16, "Arrow keys to scroll\nLeft-click to draw tiles", {
      font: "18px monospace",
      fill: "#000000",
      padding: { x: 20, y: 10 },
      backgroundColor: "#ffffff"
    })
    .setScrollFactor(0);

    // Side bar HUD
    let group = this.add.group();
    let hud = this.add.graphics()
    hud.lineStyle(5, 0xafa782, 1.0);
    hud.fillStyle(0xe2d8ae, 1.0);
    console.log(map.widthInPixels)
    console.log(map.heightInPixels)
    hud.fillRect(config.width - 200, 2, 200, config.height); // x, y, width, height
    hud.strokeRect(config.width - 202, 2, 200, config.height - 4);
    hud.setScrollFactor(0);

    hud.beginPath();
    hud.moveTo(config.width - 200, 125);
    hud.lineTo(config.width, 125);
    hud.closePath();
    hud.strokePath();
    group.add(hud)

    population = 0;
    wood = 50;
    stone = 10;
    food = 0;

    hudHoverTileInfo = this.add
    .text(config.width - 200, 125, "This area:\n", {
      font: "20px monospace",
      fill: "#000000",
      padding: { x: 20, y: 10 },
    });
    hudHoverTileInfo.setScrollFactor(0);

    hudResources = this.add
    .text(config.width - 200, 16, 
      `Population: ${ population }\nWood: ${ wood }\nStone: ${ stone }\nFood: ${ food }`, 
      { font: "20px monospace",
        fill: "#000000",
        padding: { x: 20, y: 10 }}
    );
    hudResources.setScrollFactor(0);
}

function update(time, delta) {
  controls.update(delta);

  // Convert the mouse position to world position within the camera
  const worldPoint = this.input.activePointer.positionToCamera(this.cameras.main);

  // Place the marker in world space, but snap it to the tile grid. If we convert world -> tile and
  // then tile -> world, we end up with the position of the tile under the pointer
  const pointerTileXY = groundLayer.worldToTileXY(worldPoint.x, worldPoint.y);
  const snappedWorldPoint = groundLayer.tileToWorldXY(pointerTileXY.x, pointerTileXY.y);
  marker.setPosition(snappedWorldPoint.x, snappedWorldPoint.y);
  var hoverTile = groundLayer.getTileAtWorldXY(worldPoint.x, worldPoint.y);
  updateHudHoverTile(tileIndexToName[hoverTile.index])

  // Draw or erase tiles (only within the groundLayer)
  if (this.input.manager.activePointer.isDown) {
    if (shiftKey.isDown) {
      groundLayer.removeTileAtWorldXY(worldPoint.x, worldPoint.y);
    } else {
      var clickedTile = groundLayer.getTileAtWorldXY(worldPoint.x, worldPoint.y);
      if (clickedTile === null) {
        return;
      }
      if (clickedTile.index == 11 && wood >= 2) {
        groundLayer.putTileAtWorldXY(14, worldPoint.x, worldPoint.y);
        wood -= 2;
      }
    }
  }

  updateHudResources();
}

function updateHudResources() {
  hudResources.setText(`Population: ${ population }\nWood: ${ wood }\nStone: ${ stone }\nFood: ${ food }`);
}

function updateHudHoverTile(tileName) {
  hudHoverTileInfo.setText(`This area:\n ${ tileName }`);
}
