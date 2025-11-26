import { Material } from './Material.js';
import { Air } from './Air.js';
import { Water } from './Water.js';

/**
 * Cloud material - temporary floating clouds that spawn rain
 * Duplicates with decreasing chance, eventually disappearing
 */
export class Cloud extends Material {
  constructor(duplicationChance = 100) {
    super('Cloud', '#CCCCCC', 0); // Light gray, zero density (floats)
    this.duplicationChance = duplicationChance; // Starts at 100%
    this.duplicationCooldown = 0; // 20 ticks between duplication attempts
  }

  hasGravity() {
    return false; // Clouds float - no gravity
  }

  update(x, y, world) {
    // 1. Check if water is above us - swap positions (water falls through cloud)
    const yAbove = y - 1;
    if (yAbove >= 0) {
      const abovePixel = world.getPixel(x, yAbove);
      if (abovePixel && abovePixel.material instanceof Water) {
        world.swapPixels(x, y, x, yAbove);
        return true;
      }
    }

    // 2. Spawn water (3% chance)
    if (Math.random() < 0.03) {
      world.setMaterial(x, y, new Water());
      return true;
    }

    // 3. Handle duplication attempts
    if (this.duplicationCooldown > 0) {
      this.duplicationCooldown--;
      return false;
    }

    // Reset cooldown for next attempt
    this.duplicationCooldown = 20;

    // Try to duplicate
    const roll = Math.random() * 100;

    if (roll < this.duplicationChance) {
      // Success - spawn new cloud in random direction
      const directions = [
        { x: x - 1, y: y, weight: 0.35 }, // left
        { x: x + 1, y: y, weight: 0.35 }, // right
        { x: x, y: y - 1, weight: 0.15 }, // top
        { x: x, y: y + 1, weight: 0.15 }  // bottom
      ];

      // Weighted random selection
      const target = this.weightedRandom(directions);

      // Check if target is valid and air
      if (target.x >= 0 && target.x < world.width &&
          target.y >= 0 && target.y < world.height) {
        const targetPixel = world.getPixel(target.x, target.y);

        if (targetPixel && targetPixel.material instanceof Air) {
          // Spawn new cloud with reduced chance
          const newCloud = new Cloud(this.duplicationChance - 3);
          world.setMaterial(target.x, target.y, newCloud);

          // This cloud also loses 3%
          this.duplicationChance -= 3;
          return true;
        }
      }
    } else {
      // Failed duplication - cloud disappears
      world.setMaterial(x, y, new Air());
      return true;
    }

    return false;
  }

  /**
   * Weighted random selection
   */
  weightedRandom(options) {
    const total = options.reduce((sum, opt) => sum + opt.weight, 0);
    let random = Math.random() * total;

    for (const option of options) {
      random -= option.weight;
      if (random <= 0) {
        return option;
      }
    }

    return options[0];
  }
}
