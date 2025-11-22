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

    // Adjust weights based on preferred direction for zig-zag patterns
    let upWeight, leftWeight, rightWeight;

    if (this.preferredDirection === 'left') {
      // Continue left, occasionally go up or right
      upWeight = 0.2;
      leftWeight = 0.7;
      rightWeight = 0.1;
    } else if (this.preferredDirection === 'right') {
      // Continue right, occasionally go up or left
      upWeight = 0.2;
      leftWeight = 0.1;
      rightWeight = 0.7;
    } else {
      // Default: prefer up, occasionally branch sideways
      upWeight = 0.6;
      leftWeight = 0.2;
      rightWeight = 0.2;
    }

    // Check for available growth directions (up, left, right)
    const upPos = { x: x, y: y - 1, name: 'up', weight: upWeight };
    const leftPos = { x: x - 1, y: y, name: 'left', weight: leftWeight };
    const rightPos = { x: x + 1, y: y, name: 'right', weight: rightWeight };

    const growthCandidates = [];

    // Check up
    if (upPos.y >= 0) {
      const pixel = world.getPixel(upPos.x, upPos.y);
      if (pixel.material.name !== 'StemDry' && pixel.material.name !== 'StemWet' &&
          pixel.material instanceof Air &&
          this.countStemNeighbors(upPos.x, upPos.y, world) <= 1) {
        growthCandidates.push(upPos);
      }
    }

    // Check left
    if (leftPos.x >= 0) {
      const pixel = world.getPixel(leftPos.x, leftPos.y);
      if (pixel.material.name !== 'StemDry' && pixel.material.name !== 'StemWet' &&
          pixel.material instanceof Air &&
          this.countStemNeighbors(leftPos.x, leftPos.y, world) <= 1) {
        growthCandidates.push(leftPos);
      }
    }

    // Check right
    if (rightPos.x < world.width) {
      const pixel = world.getPixel(rightPos.x, rightPos.y);
      if (pixel.material.name !== 'StemDry' && pixel.material.name !== 'StemWet' &&
          pixel.material instanceof Air &&
          this.countStemNeighbors(rightPos.x, rightPos.y, world) <= 1) {
        growthCandidates.push(rightPos);
      }
    }

    // If we can grow, choose a weighted random direction
    if (growthCandidates.length > 0) {
      // Calculate total weight of available candidates
      const totalWeight = growthCandidates.reduce((sum, c) => sum + c.weight, 0);

      // Weighted random selection
      let random = Math.random() * totalWeight;
      let chosen = growthCandidates[0];

      for (const candidate of growthCandidates) {
        random -= candidate.weight;
        if (random <= 0) {
          chosen = candidate;
          break;
        }
      }

      // This stem becomes dry (keeps current preferred direction)
      const newStemDry = new StemDry(this.preferredDirection);
      newStemDry.cooldown = 15; // Set cooldown
      world.setMaterial(x, y, newStemDry);

      // Spawn new stem in chosen direction with that direction as preference
      const newStem = new StemDry(chosen.name);
      newStem.cooldown = 15; // Set cooldown
      world.setMaterial(chosen.x, chosen.y, newStem);

      return true;
    }

    // At the edge with no growth options, become dry
    if (growthCandidates.length === 0) {
      const newStemDry = new StemDry(this.preferredDirection);
      newStemDry.cooldown = 15; // Set cooldown
      world.setMaterial(x, y, newStemDry);
      return true;
    }

    return false;
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
