import { EarthBase } from './EarthBase.js';
import { EarthDry } from './EarthDry.js';

/**
 * Wet Earth material - spreads moisture to nearby dry earth, affected by gravity
 */
export class EarthWet extends EarthBase {
  constructor() {
    super('EarthWet', '#5b3b1f', 4);
    this.hasSpread = false; // Track if moisture has already spread from this pixel
  }

  /**
   * Override update to add vaporization before parent update
   */
  update(x, y, world) {
    // Vaporization: 0.017% chance to dry out (0.5% / 30)
    if (Math.random() < 0.00017) {
      world.setMaterial(x, y, new EarthDry());
      return true;
    }

    // Call parent update (gravity and landing)
    return super.update(x, y, world);
  }

  /**
   * Called when particle has landed
   * Spreads moisture to nearby dry earth
   */
  onLanded(x, y, world) {
    // Spread moisture to nearby dry earth (only once per pixel)
    if (!this.hasSpread) {
      this.spreadMoisture(x, y, world);
      this.hasSpread = true;
    }

    return false;
  }

  /**
   * Spread moisture to adjacent dry earth pixels in all 4 cardinal directions
   */
  spreadMoisture(x, y, world) {
    // Check all 4 cardinal directions with probabilities
    const spreadPositions = [
      { x: x, y: y + 1, probability: 0.8 },      // below: 80%
      { x: x - 1, y: y, probability: 0.5 },      // left: 50%
      { x: x + 1, y: y, probability: 0.5 },      // right: 50%
      { x: x, y: y - 1, probability: 0.2 }       // above: 20%
    ];

    for (const pos of spreadPositions) {
      if (pos.x >= 0 && pos.x < world.width && pos.y >= 0 && pos.y < world.height) {
        const pixel = world.getPixel(pos.x, pos.y);
        if (pixel.material instanceof EarthDry && Math.random() < pos.probability) {
          world.setMaterial(pos.x, pos.y, new EarthWet());
        }
      }
    }
  }
}

