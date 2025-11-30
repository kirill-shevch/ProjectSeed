/**
 * Renderer - handles drawing the pixel world to a canvas
 */
export class Renderer {
  constructor(canvas, pixelSize) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.pixelSize = pixelSize;
  }

  /**
   * Set up the canvas size based on world dimensions
   * @param {number} worldWidth - Width in pixels
   * @param {number} worldHeight - Height in pixels
   */
  setupCanvas(worldWidth, worldHeight) {
    this.canvas.width = worldWidth * this.pixelSize;
    this.canvas.height = worldHeight * this.pixelSize;
  }

  /**
   * Render the entire world
   * @param {PixelWorld} world - The world to render
   */
  render(world) {
    for (let y = 0; y < world.height; y++) {
      for (let x = 0; x < world.width; x++) {
        const pixel = world.getPixel(x, y);
        const color = pixel.getColor(x, y);

        this.ctx.fillStyle = color;
        this.ctx.fillRect(
          x * this.pixelSize,
          y * this.pixelSize,
          this.pixelSize,
          this.pixelSize
        );
      }
    }
  }

  /**
   * Convert canvas coordinates to world cell coordinates
   * @param {MouseEvent} event - Mouse event
   * @returns {{x: number, y: number}|null} - Cell coordinates or null
   */
  canvasCoordsToCell(event) {
    const rect = this.canvas.getBoundingClientRect();
    const cx = event.clientX - rect.left;
    const cy = event.clientY - rect.top;
    const x = Math.floor(cx / this.pixelSize);
    const y = Math.floor(cy / this.pixelSize);
    
    return { x, y };
  }
}

