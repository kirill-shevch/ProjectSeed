import { Pixel } from './Pixel.js';
import { Air } from '../materials/Air.js';
import { Water } from '../materials/Water.js';
import { EarthDry } from '../materials/EarthDry.js';
import { EarthWet } from '../materials/EarthWet.js';
import { Stone } from '../materials/Stone.js';
import { Seed } from '../materials/Seed.js';
import { RootDry } from '../materials/RootDry.js';
import { RootWet } from '../materials/RootWet.js';
import { StemDry } from '../materials/StemDry.js';
import { StemWet } from '../materials/StemWet.js';
import { LeafDry } from '../materials/LeafDry.js';
import { LeafWet } from '../materials/LeafWet.js';
import { Badrock } from '../materials/Badrock.js';
import { WaterSource } from '../materials/WaterSource.js';
import { Cloud } from '../materials/Cloud.js';
import { Bloom } from '../materials/Bloom.js';
import { Flower } from '../materials/Flower.js';

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

  /**
   * Serialize the world to JSON for saving
   */
  serialize() {
    const pixels = [];

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const pixel = this.grid[y][x];
        const material = pixel.material;

        // Skip air pixels to save space
        if (material.name === 'Air') continue;

        // Serialize material state
        const state = {};

        // Copy all custom properties (cooldowns, counters, etc.)
        for (const key in material) {
          if (key !== 'name' && key !== 'color' && key !== 'density' &&
              material.hasOwnProperty(key)) {
            state[key] = material[key];
          }
        }

        pixels.push({
          x: x,
          y: y,
          material: material.name,
          state: state
        });
      }
    }

    return {
      version: '1.0',
      width: this.width,
      height: this.height,
      pixels: pixels
    };
  }

  /**
   * Deserialize the world from JSON for loading
   */
  deserialize(data) {
    // Validate version
    if (data.version !== '1.0') {
      throw new Error('Incompatible save file version');
    }

    // Validate dimensions
    if (data.width !== this.width || data.height !== this.height) {
      throw new Error('Save file dimensions do not match world dimensions');
    }

    // Clear the world
    this.clear();

    // Restore pixels
    for (const pixelData of data.pixels) {
      const { x, y, material: materialName, state } = pixelData;

      // Create material instance
      let material;

      // Handle materials by name
      switch (materialName) {
        case 'Water':
          material = new Water();
          break;
        case 'EarthDry':
          material = new EarthDry();
          break;
        case 'EarthWet':
          material = new EarthWet();
          break;
        case 'Stone':
          material = new Stone();
          break;
        case 'Seed':
          material = new Seed();
          break;
        case 'RootDry':
          material = new RootDry();
          break;
        case 'RootWet':
          material = new RootWet();
          break;
        case 'StemDry':
          material = new StemDry();
          break;
        case 'StemWet':
          material = new StemWet();
          break;
        case 'LeafDry':
          material = new LeafDry();
          break;
        case 'LeafWet':
          material = new LeafWet();
          break;
        case 'Badrock':
          material = new Badrock();
          break;
        case 'WaterSource':
          material = new WaterSource();
          break;
        case 'Cloud':
          material = new Cloud();
          break;
        case 'Bloom':
          material = new Bloom();
          break;
        case 'Flower':
          material = new Flower();
          break;
        default:
          console.warn(`Unknown material: ${materialName}`);
          continue;
      }

      // Restore state
      Object.assign(material, state);

      // Set material
      this.setMaterial(x, y, material);
    }
  }
}

