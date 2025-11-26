import { Material } from './Material.js';
import { Air } from './Air.js';
import { Seed } from './Seed.js';

/**
 * Flower material - independent aging pixels that produce seeds
 */
export class Flower extends Material {
  constructor() {
    super('Flower', '#FF69B4', 3); // Pink initially
    this.timer = 1000;
  }

  hasGravity() {
    return false; // Flowers stay in place
  }

  update(x, y, world) {
    // Decrement timer
    this.timer--;

    // Change color at halfway point
    if (this.timer === 500) {
      this.color = '#2F4F2F'; // Dark green
      return true;
    }

    // At timer = 0, become seed or air
    if (this.timer <= 0) {
      if (Math.random() < 0.1) {
        // 10% chance: become seed
        world.setMaterial(x, y, new Seed());
      } else {
        // 90% chance: disappear
        world.setMaterial(x, y, new Air());
      }
      return true;
    }

    return false;
  }

  getColor() {
    return this.color; // Dynamic color based on timer
  }
}
