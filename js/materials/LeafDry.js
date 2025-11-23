import { Material } from './Material.js';
import { LeafWet } from './LeafWet.js';
import { RootWet } from './RootWet.js';

/**
 * Dry Leaf material - waits for water from stem, generates solar energy
 */
export class LeafDry extends Material {
  constructor() {
    super('LeafDry', '#90EE90', 1); // Light green, low density (doesn't fall)
    this.cooldown = 0; // Cooldown for water reception
    this.energyCounter = 0; // Visual feedback counter for solar energy
    this.solarCooldown = 0; // Cooldown for solar energy generation (1 minute = 3600 ticks)
  }

  hasGravity() {
    return false; // Leaves don't fall
  }

  update(x, y, world) {
    // Decrement cooldown
    if (this.cooldown > 0) {
      this.cooldown--;
    }

    // Decrement energy visual counter
    if (this.energyCounter > 0) {
      this.energyCounter--;
    }

    // Decrement solar cooldown
    if (this.solarCooldown > 0) {
      this.solarCooldown--;
    }

    // Try to generate solar energy (0.5% chance per tick, but only if cooldown is ready)
    if (this.solarCooldown === 0 && Math.random() < 0.005) {
      const success = this.triggerSolarEnergy(x, y, world);
      if (success) {
        this.energyCounter = 15; // Visual effect for 15 ticks
        this.solarCooldown = 3600; // 1 minute cooldown (60 ticks/sec * 60 sec)
      }
    }

    // Dry leaves just wait for water from stem
    // Water transfer is handled by StemWet, not here
    return false;
  }

  /**
   * Override color for visual feedback when generating solar energy
   */
  getColor() {
    if (this.energyCounter > 0) {
      return '#FFFF99'; // Bright yellow when energized
    }
    return this.color; // Normal light green
  }

  /**
   * Trigger solar energy: find connected root and help it grow
   * Returns true if successful, false otherwise
   */
  triggerSolarEnergy(x, y, world) {
    // 1. Find adjacent stem cell
    const stem = this.findAdjacentStem(x, y, world);
    if (!stem) return false;

    // 2. Search downward from stem to find topmost connected root
    const root = this.searchForConnectedRoot(stem.x, stem.y, world);
    if (!root) return false;

    // 3. Trigger root growth (same as water absorption)
    this.triggerRootGrowth(root.x, root.y, world);
    return true;
  }

  /**
   * Find adjacent stem cell (4 cardinal directions)
   */
  findAdjacentStem(x, y, world) {
    const directions = [
      { x: x, y: y - 1 },
      { x: x, y: y + 1 },
      { x: x - 1, y: y },
      { x: x + 1, y: y }
    ];

    for (const dir of directions) {
      if (dir.x < 0 || dir.x >= world.width ||
          dir.y < 0 || dir.y >= world.height) {
        continue;
      }

      const pixel = world.getPixel(dir.x, dir.y);
      if (pixel.material.name === 'StemDry' || pixel.material.name === 'StemWet') {
        return { x: dir.x, y: dir.y };
      }
    }

    return null; // No stem found
  }

  /**
   * Search through connected stems/roots to find a DRY root that can duplicate
   */
  searchForConnectedRoot(x, y, world, visited = new Set()) {
    const key = `${x},${y}`;
    if (visited.has(key)) return null;
    visited.add(key);

    const pixel = world.getPixel(x, y);
    const materialName = pixel.material.name;

    // If we found a DRY root, check if it can duplicate
    if (materialName === 'RootDry') {
      const rootDry = pixel.material;
      // Check if this root can actually spawn (has spawn cooldown ready and earth neighbors)
      if (rootDry.spawnCooldown === 0 && this.rootCanSpawn(x, y, world)) {
        return { x, y };
      }
    }

    // Continue searching through stems and roots
    if (materialName === 'StemDry' || materialName === 'StemWet' ||
        materialName === 'RootDry' || materialName === 'RootWet') {
      const directions = [
        { x: x, y: y + 1 },      // below (priority)
        { x: x - 1, y: y },      // left
        { x: x + 1, y: y }       // right
      ];

      for (const dir of directions) {
        if (dir.x < 0 || dir.x >= world.width ||
            dir.y < 0 || dir.y >= world.height) {
          continue;
        }

        const result = this.searchForConnectedRoot(dir.x, dir.y, world, visited);
        if (result) return result; // Return first root that can spawn
      }
    }

    return null; // No spawnable root found
  }

  /**
   * Check if a root at this position can spawn new roots
   * Must match the logic in RootDry.trySpawnNewRoot
   */
  rootCanSpawn(x, y, world) {
    // First, count root neighbors of the current root (all 4 directions)
    const allDirections = [
      { x: x, y: y - 1 },  // top
      { x: x, y: y + 1 },  // bottom
      { x: x - 1, y: y },  // left
      { x: x + 1, y: y }   // right
    ];

    let rootNeighborCount = 0;
    const earthCandidates = [];

    for (const dir of allDirections) {
      if (dir.x < 0 || dir.x >= world.width ||
          dir.y < 0 || dir.y >= world.height) {
        continue;
      }

      const pixel = world.getPixel(dir.x, dir.y);
      const materialName = pixel.material.name;

      // Count root neighbors
      if (materialName === 'RootDry' || materialName === 'RootWet') {
        rootNeighborCount++;
      }

      // Collect earth candidates (left, right, bottom only - not top)
      if (dir.y !== y - 1 && (materialName === 'EarthDry' || materialName === 'EarthWet')) {
        earthCandidates.push(dir);
      }
    }

    // Root must have less than 3 neighbors to spawn (allows 1 parent + 2 children)
    if (rootNeighborCount >= 3) {
      return false;
    }

    // Check if any earth candidate would be valid (would have at most 1 root neighbor)
    for (const candidate of earthCandidates) {
      if (this.countRootNeighborsAt(candidate.x, candidate.y, world) <= 1) {
        return true; // Found at least one valid spawn location
      }
    }

    return false; // No valid spawn locations
  }

  /**
   * Count root neighbors at a specific position
   */
  countRootNeighborsAt(x, y, world) {
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
      const materialName = pixel.material.name;
      if (materialName === 'RootDry' || materialName === 'RootWet') {
        count++;
      }
    }

    return count;
  }

  /**
   * Trigger root growth (ONLY spawns new roots, does NOT provide water)
   */
  triggerRootGrowth(x, y, world) {
    const pixel = world.getPixel(x, y);

    // Only trigger on dry roots that can actually spawn
    if (pixel.material.name === 'RootDry') {
      const rootDry = pixel.material;

      // Spawn a new root (cooldown was already checked in search)
      rootDry.trySpawnNewRoot(x, y, world);

      // Note: trySpawnNewRoot sets the spawn cooldown internally
      // DO NOT transform to wet root - solar energy doesn't provide water!
      // This way roots expand to search for water, but don't feed the plant
    }
  }
}
