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
  marker.lineStyle(5, 0xffffff, 1);
  marker.strokeRect(0, 0, map.tileWidth, map.tileHeight);
  marker.lineStyle(3, 0xff4f78, 1);
  marker.strokeRect(0, 0, map.tileWidth, map.tileHeight);

  // Help text that has a "fixed" position on the screen
  this.add
    .text(16, 16, "Arrow keys to scroll\nLeft-click to draw tiles\nShift + left-click to erase", {
      font: "18px monospace",
      fill: "#000000",
      padding: { x: 20, y: 10 },
      backgroundColor: "#ffffff"
    })
    .setScrollFactor(0);
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

  // Draw or erase tiles (only within the groundLayer)
  if (this.input.manager.activePointer.isDown) {
    if (shiftKey.isDown) {
      groundLayer.removeTileAtWorldXY(worldPoint.x, worldPoint.y);
    } else {
      groundLayer.putTileAtWorldXY(14, worldPoint.x, worldPoint.y);
    }
  }
}
