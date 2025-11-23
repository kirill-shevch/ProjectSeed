import { Material } from './Material.js';
import { Air } from './Air.js';
import { StemDry } from './StemDry.js';

/**
 * Wet Stem material - grows upward by spawning new stem cells
 */
export class StemWet extends Material {
  constructor(preferredDirection = 'up') {
    super('StemWet', '#5a9a2d', 3);
    this.cooldown = 0; // Cooldown for growth
    this.preferredDirection = preferredDirection; // Direction bias for growth
  }

  update(x, y, world) {
    // Decrement cooldown
    if (this.cooldown > 0) {
      this.cooldown--;
      return false;
    }

    // Check if we can grow straight up
    const upY = y - 1;

    if (upY >= 0) {
      const upPixel = world.getPixel(x, upY);

      // Check if up position is available for growth
      if (upPixel.material instanceof Air &&
          upPixel.material.name !== 'StemDry' &&
          upPixel.material.name !== 'StemWet' &&
          this.countStemNeighbors(x, upY, world) <= 1) {

        // This stem becomes dry
        const newStemDry = new StemDry('up');
        newStemDry.cooldown = 15; // Set cooldown
        world.setMaterial(x, y, newStemDry);

        // Spawn new stem above
        const newStem = new StemDry('up');
        newStem.cooldown = 15; // Set cooldown
        world.setMaterial(x, upY, newStem);

        return true;
      }
    }

    // Can't grow anymore, become dry
    const newStemDry = new StemDry(this.preferredDirection);
    newStemDry.cooldown = 15; // Set cooldown
    world.setMaterial(x, y, newStemDry);
    return true;
  }

  /**
   * Count stem neighbors at a specific position
   */
  countStemNeighbors(x, y, world) {
    const directions = [
      { x: x, y: y - 1 },
      { x: x, y: y + 1 },
      { x: x - 1, y: y },
      { x: x + 1, y: y }
    ];

    let count = 0;
    for (const dir of directions) {
      if (dir.x < 0 || dir.x >= world.width ||
          dir.y < 0 || dir.y >= world.height) {
        continue;
      }

      const pixel = world.getPixel(dir.x, dir.y);
      if (pixel.material.name === 'StemDry' || pixel.material.name === 'StemWet') {
        count++;
      }
    }

    return count;
  }
}
