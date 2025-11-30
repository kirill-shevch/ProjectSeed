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
  constructor(useDiagonalFalling = false) {
    super('Seed', '#9b7653', 3);
    this.useDiagonalFalling = useDiagonalFalling;
    // Choose diagonal direction: 50% left, 50% right (only used if useDiagonalFalling is true)
    this.diagonalDirection = Math.random() < 0.5 ? -1 : 1;
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

      // Only use diagonal falling if enabled (seeds from flowers)
      if (this.useDiagonalFalling) {
        // 33% chance to move diagonally, 67% chance to fall straight
        const shouldMoveDiagonal = Math.random() < 0.33;

        if (shouldMoveDiagonal) {
          // Try to move diagonally
          const targetX = x + this.diagonalDirection;
          const targetY = yBelow;

          if (targetX >= 0 && targetX < world.width) {
            const diagonalPixel = world.getPixel(targetX, targetY);
            const diagonalMaterial = diagonalPixel.material;

            if (diagonalMaterial instanceof Air || diagonalMaterial instanceof Water) {
              // Can move diagonally
              world.swapPixels(x, y, targetX, targetY);
              return true;
            } else {
              // Blocked diagonally - flip direction
              this.diagonalDirection = -this.diagonalDirection;
              // Fall straight down instead
            }
          } else {
            // Out of bounds - flip direction
            this.diagonalDirection = -this.diagonalDirection;
            // Fall straight down instead
          }
        }
      }

      // Fall straight down (either by choice or fallback from blocked diagonal)
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
