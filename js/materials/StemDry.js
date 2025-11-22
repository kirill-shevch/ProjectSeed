import { Material } from './Material.js';
import { RootDry } from './RootDry.js';
import { StemWet } from './StemWet.js';

/**
 * Dry Stem material - receives water from wet root or wet stem below
 */
export class StemDry extends Material {
  constructor(preferredDirection = 'up') {
    super('StemDry', '#7cba3d', 3);
    this.cooldown = 0; // Cooldown for water reception
    this.preferredDirection = preferredDirection; // Direction this stem came from
  }

  update(x, y, world) {
    // Decrement cooldown
    if (this.cooldown > 0) {
      this.cooldown--;
      return false;
    }

    // Check if there's wet root or wet stem below
    const yBelow = y + 1;

    if (yBelow < world.height) {
      const belowPixel = world.getPixel(x, yBelow);

      // Check if bottom is wet root or wet stem
      if (belowPixel.material.name === 'RootWet' ||
          belowPixel.material.name === 'StemWet') {
        // Transfer water: bottom becomes dry, this stem becomes wet

        // Bottom becomes dry
        if (belowPixel.material.name === 'RootWet') {
          const newRootDry = new RootDry();
          newRootDry.cooldown = 15; // Set cooldown
          world.setMaterial(x, yBelow, newRootDry);
        } else {
          const newStemDry = new StemDry();
          newStemDry.cooldown = 15; // Set cooldown
          world.setMaterial(x, yBelow, newStemDry);
        }

        // This stem becomes wet, passing along preferred direction
        const newStemWet = new StemWet(this.preferredDirection);
        newStemWet.cooldown = 15; // Set cooldown
        world.setMaterial(x, y, newStemWet);

        return true;
      }
    }

    return false;
  }
}
