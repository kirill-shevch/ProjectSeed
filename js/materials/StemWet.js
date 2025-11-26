import { Material } from './Material.js';
import { Air } from './Air.js';
import { StemDry } from './StemDry.js';
import { LeafDry } from './LeafDry.js';
import { LeafWet } from './LeafWet.js';
import { Bloom } from './Bloom.js';

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

    // Try to spawn bloom if stem is tall enough (20% chance)
    const bloomSpawned = this.trySpawnBloom(x, y, world);
    if (bloomSpawned) {
      return true;
    }

    // Check if we should transfer water to a dry leaf (40% chance)
    const leafTransfer = this.tryTransferToLeaf(x, y, world);
    if (leafTransfer) {
      return true;
    }

    // Otherwise, try to grow straight up (60% or no dry leaves)
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
   * Try to transfer water to an adjacent dry leaf or bloom (40% chance)
   */
  tryTransferToLeaf(x, y, world) {
    // Check all 4 directions for dry leaves and blooms
    const directions = [
      { x: x, y: y - 1 },      // up
      { x: x, y: y + 1 },      // down
      { x: x - 1, y: y },      // left
      { x: x + 1, y: y }       // right
    ];

    const dryLeafCandidates = [];
    const bloomCandidates = [];

    for (const dir of directions) {
      if (dir.x < 0 || dir.x >= world.width ||
          dir.y < 0 || dir.y >= world.height) {
        continue;
      }

      const pixel = world.getPixel(dir.x, dir.y);
      if (pixel.material instanceof LeafDry) {
        dryLeafCandidates.push(dir);
      }
      if (pixel.material instanceof Bloom) {
        bloomCandidates.push(dir);
      }
    }

    // If there are blooms, water them (same 40% chance)
    if (bloomCandidates.length > 0 && Math.random() < 0.4) {
      // Randomly choose one bloom
      const chosen = bloomCandidates[Math.floor(Math.random() * bloomCandidates.length)];
      const bloomPixel = world.getPixel(chosen.x, chosen.y);

      // Increment bloom's water counter
      bloomPixel.material.waterCounter++;

      // This stem becomes dry
      const newStemDry = new StemDry(this.preferredDirection);
      newStemDry.cooldown = 15;
      world.setMaterial(x, y, newStemDry);

      return true;
    }

    // If there are dry leaves and 40% chance succeeds
    if (dryLeafCandidates.length > 0 && Math.random() < 0.4) {
      // Randomly choose one dry leaf
      const chosen = dryLeafCandidates[Math.floor(Math.random() * dryLeafCandidates.length)];

      // This stem becomes dry
      const newStemDry = new StemDry(this.preferredDirection);
      newStemDry.cooldown = 15;
      world.setMaterial(x, y, newStemDry);

      // Target leaf becomes wet (preserve its solar cooldown)
      const chosenPixel = world.getPixel(chosen.x, chosen.y);
      const newLeafWet = new LeafWet();
      newLeafWet.cooldown = 15;
      newLeafWet.solarCooldown = chosenPixel.material.solarCooldown; // Preserve solar cooldown
      world.setMaterial(chosen.x, chosen.y, newLeafWet);

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

  /**
   * Try to spawn a bloom on the side if stem is 12+ pixels tall
   */
  trySpawnBloom(x, y, world) {
    // Measure stem height by counting stem pixels downward
    let height = 0;
    let checkY = y;

    while (checkY < world.height) {
      const pixel = world.getPixel(x, checkY);
      if (pixel && (pixel.material.name === 'StemDry' ||
                     pixel.material.name === 'StemWet')) {
        height++;
        checkY++;
      } else {
        break;
      }
    }

    // If height >= 12 and 20% chance
    if (height >= 12 && Math.random() < 0.2) {
      // Try to spawn bloom on left or right
      const directions = [
        { x: x - 1, y: y }, // left
        { x: x + 1, y: y }  // right
      ];

      const validCandidates = [];

      for (const dir of directions) {
        if (dir.x >= 0 && dir.x < world.width) {
          const pixel = world.getPixel(dir.x, dir.y);
          if (pixel && pixel.material instanceof Air) {
            validCandidates.push(dir);
          }
        }
      }

      if (validCandidates.length > 0) {
        const chosen = validCandidates[Math.floor(Math.random() * validCandidates.length)];
        world.setMaterial(chosen.x, chosen.y, new Bloom());

        // This stem becomes dry after spawning bloom
        const newStemDry = new StemDry(this.preferredDirection);
        newStemDry.cooldown = 15;
        world.setMaterial(x, y, newStemDry);

        return true;
      }
    }

    return false;
  }
}
