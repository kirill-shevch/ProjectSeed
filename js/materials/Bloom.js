import { Material } from './Material.js';
import { Air } from './Air.js';
import { LeafDry } from './LeafDry.js';
import { LeafWet } from './LeafWet.js';
import { Flower } from './Flower.js';

/**
 * Bloom material - accumulates water and spawns flower structure
 */
export class Bloom extends Material {
  constructor() {
    super('Bloom', '#FF69B4', 3); // Pink
    this.waterCounter = 0;
  }

  hasGravity() {
    return false; // Blooms stay attached to stem
  }

  update(x, y, world) {
    // Check if we've accumulated enough water
    if (this.waterCounter >= 12) {
      this.spawnFlower(x, y, world);
      return true;
    }

    return false;
  }

  /**
   * Spawn flower structure when water counter reaches 12
   */
  spawnFlower(x, y, world) {
    // Determine which side of stem we're on
    const leftPixel = world.getPixel(x - 1, y);
    const rightPixel = world.getPixel(x + 1, y);

    // Check which side has the stem
    const stemOnLeft = leftPixel && (leftPixel.material.name === 'StemDry' || leftPixel.material.name === 'StemWet');
    const stemOnRight = rightPixel && (rightPixel.material.name === 'StemDry' || rightPixel.material.name === 'StemWet');

    // Determine spawn direction (away from stem)
    // If stem on left, go right (direction = 1), if stem on right, go left (direction = -1)
    const direction = stemOnLeft ? 1 : -1;

    // Generate flower pattern positions
    const pattern = this.generateFlowerPattern(x, y, direction);

    // Spawn flower pixels at valid positions
    for (const pos of pattern) {
      const pixel = world.getPixel(pos.x, pos.y);
      if (pixel && (pixel.material instanceof Air ||
                     pixel.material instanceof LeafDry ||
                     pixel.material instanceof LeafWet)) {
        world.setMaterial(pos.x, pos.y, new Flower());
      }
    }

    // Transform bloom itself to flower
    world.setMaterial(x, y, new Flower());
  }

  /**
   * Generate circle-like flower pattern
   */
  generateFlowerPattern(centerX, centerY, direction) {
    const positions = [];
    let pointerX = centerX + direction;
    let pointerY = centerY;

    // Step 1: opposite side of stem
    positions.push({ x: pointerX, y: pointerY });

    // Step 2: above and below pointer
    positions.push({ x: pointerX, y: pointerY - 1 });
    positions.push({ x: pointerX, y: pointerY + 1 });

    // Step 3: move pointer
    pointerX += direction;

    // Step 4: vertical line (2 above, 2 below)
    positions.push({ x: pointerX, y: pointerY - 2 });
    positions.push({ x: pointerX, y: pointerY - 1 });
    positions.push({ x: pointerX, y: pointerY + 1 });
    positions.push({ x: pointerX, y: pointerY + 2 });

    // Step 5: move pointer
    pointerX += direction;

    // Step 6: vertical line (2 above, 2 below)
    positions.push({ x: pointerX, y: pointerY - 2 });
    positions.push({ x: pointerX, y: pointerY - 1 });
    positions.push({ x: pointerX, y: pointerY + 1 });
    positions.push({ x: pointerX, y: pointerY + 2 });

    // Step 7: move pointer
    pointerX += direction;

    // Step 8: vertical line (2 above, 2 below)
    positions.push({ x: pointerX, y: pointerY - 2 });
    positions.push({ x: pointerX, y: pointerY - 1 });
    positions.push({ x: pointerX, y: pointerY + 1 });
    positions.push({ x: pointerX, y: pointerY + 2 });

    // Step 9: move pointer
    pointerX += direction;

    // Step 10: above and below pointer
    positions.push({ x: pointerX, y: pointerY - 1 });
    positions.push({ x: pointerX, y: pointerY + 1 });

    return positions;
  }
}
