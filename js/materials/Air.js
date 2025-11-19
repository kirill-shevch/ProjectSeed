import { Material } from './Material.js';

/**
 * Air material - represents empty space
 */
export class Air extends Material {
  constructor() {
    super('Air', '#000000', 0);
  }

  isSolid() {
    return false;
  }

  update(x, y, world) {
    // Air doesn't move or interact
    return false;
  }
}

