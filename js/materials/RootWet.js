import { Material } from './Material.js';
import { RootDry } from './RootDry.js';
import { StemWet } from './StemWet.js';

/**
 * Wet Root material - transfers water upward or sideways
 */
export class RootWet extends Material {
  constructor() {
    super('RootWet', '#a0522d', 3); // Sienna - darker but still visible
    this.cooldown = 0; // Cooldown for water transfer
    this.spawnCooldown = 0; // Cooldown for spawning new roots
  }

  update(x, y, world) {
    // Decrement cooldowns
    if (this.cooldown > 0) {
      this.cooldown--;
      // Still decrement spawn cooldown even when transfer cooldown is active
      if (this.spawnCooldown > 0) {
        this.spawnCooldown--;
      }
      return false;
    }

    if (this.spawnCooldown > 0) {
      this.spawnCooldown--;
    }

    // Priority 0: Top cell (stem or root)
    const topY = y - 1;
    if (topY >= 0) {
      const topPixel = world.getPixel(x, topY);

      // Check if top is dry root or dry stem
      if (topPixel.material.name === 'RootDry' || topPixel.material.name === 'StemDry') {
        // Transfer water: this root becomes dry, target becomes wet
        const newRootDry = new RootDry();
        newRootDry.cooldown = 15; // Set cooldown for new dry root
        newRootDry.spawnCooldown = this.spawnCooldown; // Preserve spawn cooldown
        world.setMaterial(x, y, newRootDry);

        // Target becomes wet
        if (topPixel.material.name === 'RootDry') {
          const newRootWet = new RootWet();
          newRootWet.cooldown = 15; // Set cooldown
          world.setMaterial(x, topY, newRootWet);
        } else {
          const newStemWet = new StemWet();
          newStemWet.cooldown = 15; // Set cooldown
          world.setMaterial(x, topY, newStemWet);
        }

        return true;
      }
    }

    // Priority 1: Left or Right (random choice)
    const leftX = x - 1;
    const rightX = x + 1;

    const candidates = [];

    // Check left
    if (leftX >= 0) {
      const leftPixel = world.getPixel(leftX, y);
      if (leftPixel.material.name === 'RootDry' || leftPixel.material.name === 'StemDry') {
        candidates.push({ x: leftX, y: y, materialName: leftPixel.material.name });
      }
    }

    // Check right
    if (rightX < world.width) {
      const rightPixel = world.getPixel(rightX, y);
      if (rightPixel.material.name === 'RootDry' || rightPixel.material.name === 'StemDry') {
        candidates.push({ x: rightX, y: y, materialName: rightPixel.material.name });
      }
    }

    // Transfer water to random candidate
    if (candidates.length > 0) {
      const chosen = candidates[Math.floor(Math.random() * candidates.length)];

      // This root becomes dry
      const newRootDry = new RootDry();
      newRootDry.cooldown = 15; // Set cooldown
      newRootDry.spawnCooldown = this.spawnCooldown; // Preserve spawn cooldown
      world.setMaterial(x, y, newRootDry);

      // Target becomes wet
      if (chosen.materialName === 'RootDry') {
        const newRootWet = new RootWet();
        newRootWet.cooldown = 15; // Set cooldown
        world.setMaterial(chosen.x, chosen.y, newRootWet);
      } else {
        const newStemWet = new StemWet();
        newStemWet.cooldown = 15; // Set cooldown
        world.setMaterial(chosen.x, chosen.y, newStemWet);
      }

      return true;
    }

    return false;
  }
}
