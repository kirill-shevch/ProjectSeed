import { Material } from './Material.js';
import { Air } from './Air.js';
import { Water } from './Water.js';

/**
 * Water Source material - infinite water generator
 * Spawns water below itself every 4 ticks
 */
export class WaterSource extends Material {
  constructor() {
    super('WaterSource', '#3fa9f5', 999); // Same color as water, very high density
    this.spawnCooldown = 0;
  }

  hasGravity() {
    return false; // Static - never falls
  }

  update(x, y, world) {
    // Decrement cooldown
    if (this.spawnCooldown > 0) {
      this.spawnCooldown--;
      return false;
    }

    // Check if we can spawn water below
    const yBelow = y + 1;
    if (yBelow >= world.height) return false;

    const belowPixel = world.getPixel(x, yBelow);
    if (!belowPixel) return false;

    // Only spawn if below is Air
    if (belowPixel.material instanceof Air) {
      world.setMaterial(x, yBelow, new Water());
      this.spawnCooldown = 4;
      return true;
    }

    // If below is Water, we're done (water already there)
    // If below is anything else (stone, earth, etc.), don't spawn
    return false;
  }
}
