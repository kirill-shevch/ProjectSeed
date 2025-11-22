import { Material } from './Material.js';
import { Air } from './Air.js';
import { Water } from './Water.js';
import { EarthWet } from './EarthWet.js';
import { StemDry } from './StemDry.js';
import { RootDry } from './RootDry.js';

/**
 * Seed material - falls and germinates on wet earth
 */
export class Seed extends Material {
  constructor() {
    super('Seed', '#9b7653', 3);
  }

  hasGravity() {
    return true;
  }

  update(x, y, world) {
    const yBelow = y + 1;

    // Try to fall through air or water
    if (yBelow < world.height) {
      const belowPixel = world.getPixel(x, yBelow);
      const belowMaterial = belowPixel.material;

      // Fall through air
      if (belowMaterial instanceof Air) {
        world.swapPixels(x, y, x, yBelow);
        return true;
      }

      // Fall through water
      if (belowMaterial instanceof Water) {
        world.swapPixels(x, y, x, yBelow);
        return true;
      }

      // Check if landed on wet earth - germinate!
      if (belowMaterial instanceof EarthWet) {
        // Transform seed into stem
        world.setMaterial(x, y, new StemDry());
        // Transform wet earth below into root
        world.setMaterial(x, yBelow, new RootDry());
        return true;
      }
    }

    // Seed stays as seed on dry earth, stone, or if no cell below
    return false;
  }
}
