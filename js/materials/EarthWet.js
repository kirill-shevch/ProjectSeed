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
   * Spread moisture to adjacent dry earth pixels
   */
  spreadMoisture(x, y, world) {
    const yBelow = y + 1;
    if (yBelow >= world.height) return;

    // Below: 70% chance
    const belowPixel = world.getPixel(x, yBelow);
    if (belowPixel.material instanceof EarthDry && Math.random() < 0.7) {
      world.setMaterial(x, yBelow, new EarthWet());
    }

    // Below-left: 25% chance
    const leftX = x - 1;
    if (leftX >= 0) {
      const belowLeftPixel = world.getPixel(leftX, yBelow);
      if (belowLeftPixel.material instanceof EarthDry && Math.random() < 0.25) {
        world.setMaterial(leftX, yBelow, new EarthWet());
      }
    }

    // Below-right: 25% chance
    const rightX = x + 1;
    if (rightX < world.width) {
      const belowRightPixel = world.getPixel(rightX, yBelow);
      if (belowRightPixel.material instanceof EarthDry && Math.random() < 0.25) {
        world.setMaterial(rightX, yBelow, new EarthWet());
      }
    }
  }
}

