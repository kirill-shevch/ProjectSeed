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
    if (yBelow < world.height) {
      const belowPixel = world.getPixel(x, yBelow);

      // Only spawn below if it's Air (not if it's already Water or blocked)
      if (belowPixel && belowPixel.material instanceof Air) {
        world.setMaterial(x, yBelow, new Water());
        this.spawnCooldown = 16; // 4 times slower (was 4, now 16)
        return true;
      }
    }

    // If below is blocked or already has water, try to spawn on the sides
    const sides = [
      { x: x - 1, y: y }, // left
      { x: x + 1, y: y }  // right
    ];

    // Shuffle sides to randomize which one we try first
    if (Math.random() < 0.5) {
      sides.reverse();
    }

    for (const side of sides) {
      if (side.x >= 0 && side.x < world.width) {
        const sidePixel = world.getPixel(side.x, side.y);
        if (sidePixel && sidePixel.material instanceof Air) {
          world.setMaterial(side.x, side.y, new Water());
          this.spawnCooldown = 16;
          return true;
        }
      }
    }

    // Can't spawn anywhere (completely blocked)
    return false;
  }
}
