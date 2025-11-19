import { Pixel } from './Pixel.js';
import { Air } from '../materials/Air.js';

/**
 * PixelWorld - manages the 2D grid of pixels
 */
export class PixelWorld {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.grid = [];
    
    // Initialize grid with air
    this.initializeGrid();
  }

  /**
   * Initialize the grid with air pixels
   */
  initializeGrid() {
    for (let y = 0; y < this.height; y++) {
      const row = [];
      for (let x = 0; x < this.width; x++) {
        row.push(new Pixel(new Air()));
      }
      this.grid.push(row);
    }
  }

  /**
   * Get a pixel at the specified coordinates
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {Pixel|null} - The pixel or null if out of bounds
   */
  getPixel(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return null;
    }
    return this.grid[y][x];
  }

  /**
   * Set a pixel's material at the specified coordinates
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {Material} material - The material to set
   */
  setMaterial(x, y, material) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return;
    }
    this.grid[y][x] = new Pixel(material);
  }

  /**
   * Swap two pixels
   * @param {number} x1 - First pixel X
   * @param {number} y1 - First pixel Y
   * @param {number} x2 - Second pixel X
   * @param {number} y2 - Second pixel Y
   */
  swapPixels(x1, y1, x2, y2) {
    if (x1 < 0 || x1 >= this.width || y1 < 0 || y1 >= this.height) return;
    if (x2 < 0 || x2 >= this.width || y2 < 0 || y2 >= this.height) return;

    const temp = this.grid[y1][x1];
    this.grid[y1][x1] = this.grid[y2][x2];
    this.grid[y2][x2] = temp;
  }

  /**
   * Clear the world (fill with air)
   */
  clear() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.grid[y][x] = new Pixel(new Air());
      }
    }
  }

  /**
   * Update all pixels in the world (one simulation step)
   */
  step() {
    // Process from bottom to top, left to right
    for (let y = this.height - 1; y >= 0; y--) {
      for (let x = 0; x < this.width; x++) {
        const pixel = this.grid[y][x];
        pixel.update(x, y, this);
      }
    }
  }
}

