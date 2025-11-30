import { Material } from './Material.js';
import { Air } from './Air.js';
import { Seed } from './Seed.js';

/**
 * Flower material - independent aging pixels that produce seeds
 */
export class Flower extends Material {
  constructor(centerX = 0, centerY = 0) {
    super('Flower', '#FF69B4', 3); // Pink initially
    this.timer = 1000;
    this.centerX = centerX; // Center of the flower (bloom position)
    this.centerY = centerY;
    this.baseColor = '#FF69B4'; // Pink for first phase
  }

  hasGravity() {
    return false; // Flowers stay in place
  }

  update(x, y, world) {
    // Decrement timer
    this.timer--;

    // Change color at halfway point
    if (this.timer === 500) {
      this.baseColor = '#2F4F2F'; // Dark green for second phase
      return true;
    }

    // At timer = 0, become seed or air
    if (this.timer <= 0) {
      if (Math.random() < 0.1) {
        // 10% chance: become seed (with diagonal falling enabled)
        world.setMaterial(x, y, new Seed(true));
      } else {
        // 90% chance: disappear
        world.setMaterial(x, y, new Air());
      }
      return true;
    }

    return false;
  }

  getColor(x, y) {
    // Calculate gradient based on position relative to center
    // Distance from center (horizontal + vertical)
    const dx = Math.abs(x - this.centerX);
    const dy = y - this.centerY; // Vertical distance (positive = below center)

    // Combined distance factor (0 at center, higher farther away)
    const distanceFactor = (dx + Math.abs(dy)) / 8; // Normalize by flower size

    // Vertical factor (positive = above center = lighter, negative = below = darker)
    const verticalFactor = -dy / 4;

    // Total brightness adjustment (-0.5 to +0.5)
    const brightness = Math.max(-0.5, Math.min(0.5, distanceFactor * 0.3 + verticalFactor * 0.4));

    // Apply gradient to base color
    return this.applyBrightness(this.baseColor, brightness);
  }

  /**
   * Adjust color brightness
   * @param {string} hexColor - Base hex color
   * @param {number} factor - Brightness adjustment (-0.5 to +0.5)
   * @returns {string} - Adjusted hex color
   */
  applyBrightness(hexColor, factor) {
    // Parse hex color
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);

    // Adjust brightness
    const adjust = (value) => {
      if (factor > 0) {
        // Brighten: move towards 255
        return Math.round(value + (255 - value) * factor);
      } else {
        // Darken: move towards 0
        return Math.round(value * (1 + factor));
      }
    };

    const newR = Math.max(0, Math.min(255, adjust(r)));
    const newG = Math.max(0, Math.min(255, adjust(g)));
    const newB = Math.max(0, Math.min(255, adjust(b)));

    // Convert back to hex
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }
}
