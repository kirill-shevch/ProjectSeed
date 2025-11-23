import { Material } from './Material.js';
import { Air } from './Air.js';
import { EarthDry } from './EarthDry.js';
import { EarthWet } from './EarthWet.js';

/**
 * Water material - flows and can be absorbed by dry earth
 */
export class Water extends Material {
  constructor() {
    super('Water', '#3fa9f5', 2);
  }

  hasGravity() {
    return true;
  }

  canFlow() {
    return true;
  }

  update(x, y, world) {
    // Vaporization: 0.033% chance to evaporate (1% / 30)
    if (Math.random() < 0.00033) {
      world.setMaterial(x, y, new Air());
      return true;
    }

    const yBelow = y + 1;

    // Check if water is on top of plant material - slide off
    if (yBelow < world.height) {
      const belowPixel = world.getPixel(x, yBelow);
      const belowName = belowPixel.material.name;

      if (belowName === 'RootDry' || belowName === 'RootWet' ||
          belowName === 'StemDry' || belowName === 'StemWet' ||
          belowName === 'Seed') {
        // Try to slide left or right
        const leftX = x - 1;
        const rightX = x + 1;
        const candidates = [];

        if (leftX >= 0) {
          const leftPixel = world.getPixel(leftX, y);
          if (leftPixel.material instanceof Air) {
            candidates.push(leftX);
          }
        }

        if (rightX < world.width) {
          const rightPixel = world.getPixel(rightX, y);
          if (rightPixel.material instanceof Air) {
            candidates.push(rightX);
          }
        }

        if (candidates.length > 0) {
          const targetX = candidates[Math.floor(Math.random() * candidates.length)];
          world.swapPixels(x, y, targetX, y);
          return true;
        }
      }
    }

    // Check if water can be absorbed by dry earth (all 4 directions with probabilities)
    const earthCheckPositions = [
      { x: x, y: yBelow, probability: 0.8 },      // below: 80%
      { x: x - 1, y: y, probability: 0.5 },       // left: 50%
      { x: x + 1, y: y, probability: 0.5 },       // right: 50%
      { x: x, y: y - 1, probability: 0.2 }        // above: 20%
    ];

    for (const pos of earthCheckPositions) {
      if (pos.x >= 0 && pos.x < world.width && pos.y >= 0 && pos.y < world.height) {
        const pixel = world.getPixel(pos.x, pos.y);
        if (pixel.material instanceof EarthDry && Math.random() < pos.probability) {
          // Water gets absorbed, earth becomes wet
          world.setMaterial(x, y, new Air());
          world.setMaterial(pos.x, pos.y, new EarthWet());
          return true;
        }
      }
    }

    // Apply gravity - fall down
    if (this.applyGravity(x, y, world)) {
      return true;
    }

    // Water spreading logic - only if there's water below
    if (yBelow < world.height) {
      const belowPixel = world.getPixel(x, yBelow);
      if (belowPixel.material instanceof Water) {
        // Try to spread horizontally
        return this.spread(x, y, world);
      }
    }

    return false;
  }

  /**
   * Apply gravity to the water
   */
  applyGravity(x, y, world) {
    const yBelow = y + 1;
    if (yBelow >= world.height) return false;

    const belowPixel = world.getPixel(x, yBelow);
    const belowMaterial = belowPixel.material;

    // Fall through air
    if (belowMaterial instanceof Air) {
      world.swapPixels(x, y, x, yBelow);
      return true;
    }

    // Check if material below is lighter (lower density)
    if (belowMaterial.density < this.density) {
      world.swapPixels(x, y, x, yBelow);
      return true;
    }

    return false;
  }

  /**
   * Spread water horizontally when it's on top of other water
   */
  spread(x, y, world) {
    const yBelow = y + 1;
    let stopLeft = false;
    let stopRight = false;
    let targetX = null;

    // Search for empty space to flow into
    for (let dx = 1; dx < world.width; dx++) {
      // Check left
      if (!stopLeft) {
        const lx = x - dx;
        if (lx < 0) {
          stopLeft = true;
        } else {
          const material = world.getPixel(lx, yBelow).material;
          if (material instanceof Air) {
            targetX = lx;
            break;
          } else if (material instanceof Water) {
            // Continue searching
          } else {
            // Hit a solid material
            stopLeft = true;
          }
        }
      }

      // Check right
      if (!stopRight) {
        const rx = x + dx;
        if (rx >= world.width) {
          stopRight = true;
        } else {
          const material = world.getPixel(rx, yBelow).material;
          if (material instanceof Air) {
            targetX = rx;
            break;
          } else if (material instanceof Water) {
            // Continue searching
          } else {
            // Hit a solid material
            stopRight = true;
          }
        }
      }

      if (stopLeft && stopRight) break;
    }

    if (targetX !== null) {
      world.swapPixels(x, y, targetX, yBelow);
      return true;
    }

    return false;
  }
}

