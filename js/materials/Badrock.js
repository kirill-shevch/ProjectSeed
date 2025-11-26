import { Material } from './Material.js';

/**
 * Badrock material - immovable, impassable platform
 * Acts like the borders of the world - nothing moves it, nothing passes through
 */
export class Badrock extends Material {
  constructor() {
    super('Badrock', '#222222', 999); // Very high density
  }

  hasGravity() {
    return false; // Static - never falls
  }

  update(x, y, world) {
    // Badrock never moves or changes - it's a permanent obstacle
    return false;
  }
}
