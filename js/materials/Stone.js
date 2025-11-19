import { Material } from './Material.js';
import { Air } from './Air.js';
import { Water } from './Water.js';

/**
 * Stone material - heavy, solid, affected by gravity
 */
export class Stone extends Material {
  constructor() {
    super('Stone', '#aaaaaa', 5);
  }

  hasGravity() {
    return true;
  }

  update(x, y, world) {
    const yBelow = y + 1;
    if (yBelow >= world.height) return false;

    const belowPixel = world.getPixel(x, yBelow);
    const belowMaterial = belowPixel.material;

    // Fall through air
    if (belowMaterial instanceof Air) {
      world.swapPixels(x, y, x, yBelow);
      return true;
    }

    // Stone can displace water (is heavier than water)
    if (belowMaterial instanceof Water) {
      world.swapPixels(x, y, x, yBelow);
      return true;
    }

    return false;
  }
}

