import { Material } from './Material.js';
import { Air } from './Air.js';
import { Water } from './Water.js';
import { EarthWet } from './EarthWet.js';
import { StemDry } from './StemDry.js';
import { RootDry } from './RootDry.js';
import { LeafDry } from './LeafDry.js';
import { LeafWet } from './LeafWet.js';

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

      // Check if on a leaf - try to slide off diagonally
      if (belowMaterial instanceof LeafDry || belowMaterial instanceof LeafWet) {
        const diagonals = [
          { x: x - 1, y: yBelow }, // bottom-left
          { x: x + 1, y: yBelow }  // bottom-right
        ];

        // Find valid slides (diagonals that are Air)
        const validSlides = [];
        for (const pos of diagonals) {
          if (pos.x >= 0 && pos.x < world.width) {
            const pixel = world.getPixel(pos.x, pos.y);
            if (pixel && pixel.material instanceof Air) {
              validSlides.push(pos);
            }
          }
        }

        // If there are valid slides, pick one randomly
        if (validSlides.length > 0) {
          const chosen = validSlides[Math.floor(Math.random() * validSlides.length)];
          world.swapPixels(x, y, chosen.x, chosen.y);
          return true;
        }
      }
    }

    // Seed stays as seed on dry earth, stone, or if no cell below
    return false;
  }
}
