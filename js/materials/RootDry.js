import { Material } from './Material.js';
import { EarthWet } from './EarthWet.js';
import { EarthDry } from './EarthDry.js';
import { RootWet } from './RootWet.js';
import { Water } from './Water.js';
import { Air } from './Air.js';

/**
 * Dry Root material - absorbs water from wet earth and spawns new roots
 */
export class RootDry extends Material {
  constructor() {
    super('RootDry', '#d2691e', 3); // Chocolate brown - more visible
    this.cooldown = 0; // Cooldown for water absorption
    this.spawnCooldown = 0; // Cooldown for spawning new roots
  }

  update(x, y, world) {
    // Decrement cooldowns
    if (this.cooldown > 0) {
      this.cooldown--;
      // Still decrement spawn cooldown even when absorption cooldown is active
      if (this.spawnCooldown > 0) {
        this.spawnCooldown--;
      }
      return false;
    }

    if (this.spawnCooldown > 0) {
      this.spawnCooldown--;
    }

    // Check all 4 directions for wet earth or water
    const neighbors = [
      { x: x, y: y - 1, dir: 'top' },    // top
      { x: x, y: y + 1, dir: 'bottom' }, // bottom
      { x: x - 1, y: y, dir: 'left' },   // left
      { x: x + 1, y: y, dir: 'right' }   // right
    ];

    // Look for wet earth or water to absorb
    for (const neighbor of neighbors) {
      if (neighbor.x < 0 || neighbor.x >= world.width ||
          neighbor.y < 0 || neighbor.y >= world.height) {
        continue;
      }

      const neighborPixel = world.getPixel(neighbor.x, neighbor.y);

      // Absorb from wet earth
      if (neighborPixel.material instanceof EarthWet) {
        // Absorb water: wet earth → dry earth, dry root → wet root
        world.setMaterial(neighbor.x, neighbor.y, new EarthDry());

        const newRootWet = new RootWet();
        newRootWet.cooldown = 15; // Set cooldown for new wet root

        // Try to spawn a new root after absorption (only if spawn cooldown is ready)
        if (this.spawnCooldown === 0) {
          this.trySpawnNewRoot(x, y, world);
        }

        // Preserve spawn cooldown
        newRootWet.spawnCooldown = this.spawnCooldown;
        world.setMaterial(x, y, newRootWet);

        return true;
      }

      // Absorb from water
      if (neighborPixel.material instanceof Water) {
        // Absorb water: water → air, dry root → wet root
        world.setMaterial(neighbor.x, neighbor.y, new Air());

        const newRootWet = new RootWet();
        newRootWet.cooldown = 15; // Set cooldown for new wet root

        // Try to spawn a new root after absorption (only if spawn cooldown is ready)
        if (this.spawnCooldown === 0) {
          this.trySpawnNewRoot(x, y, world);
        }

        // Preserve spawn cooldown
        newRootWet.spawnCooldown = this.spawnCooldown;
        world.setMaterial(x, y, newRootWet);

        return true;
      }
    }

    return false;
  }

  /**
   * Try to spawn a new root cell after absorbing water
   */
  trySpawnNewRoot(x, y, world) {
    // Count root neighbors (all 4 directions)
    const directions = [
      { x: x, y: y - 1 },     // top
      { x: x, y: y + 1 },     // bottom
      { x: x - 1, y: y },     // left
      { x: x + 1, y: y }      // right
    ];

    let rootNeighborCount = 0;
    const earthCandidates = [];

    for (const dir of directions) {
      if (dir.x < 0 || dir.x >= world.width ||
          dir.y < 0 || dir.y >= world.height) {
        continue;
      }

      const pixel = world.getPixel(dir.x, dir.y);

      // Count root neighbors (check by name to handle both wet and dry)
      if (pixel.material.name === 'RootDry' || pixel.material.name === 'RootWet') {
        rootNeighborCount++;
      }

      // Collect earth candidates (left, right, bottom only)
      if ((dir.x !== x || dir.y !== y - 1) && // Not top
          (pixel.material instanceof EarthDry ||
           pixel.material instanceof EarthWet)) {
        earthCandidates.push({ x: dir.x, y: dir.y });
      }
    }

    // Spawn new root if conditions are met
    if (rootNeighborCount < 2 && earthCandidates.length > 0) {
      // Filter candidates: ensure new root won't have more than 1 root neighbor
      const validCandidates = earthCandidates.filter(candidate => {
        return this.countRootNeighbors(candidate.x, candidate.y, world) <= 1;
      });

      if (validCandidates.length > 0) {
        // Randomly choose one valid earth cell
        const chosen = validCandidates[Math.floor(Math.random() * validCandidates.length)];
        const newRoot = new RootDry();
        newRoot.spawnCooldown = 30; // Set spawn cooldown for new root
        world.setMaterial(chosen.x, chosen.y, newRoot);

        // Set cooldown on this root before next spawn
        this.spawnCooldown = 30;
      }
    }
  }

  /**
   * Count root neighbors at a specific position
   */
  countRootNeighbors(x, y, world) {
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
      if (pixel.material.name === 'RootDry' || pixel.material.name === 'RootWet') {
        count++;
      }
    }

    return count;
  }
}
