import { Material } from './Material.js';
import { Air } from './Air.js';
import { LeafDry } from './LeafDry.js';
import { RootWet } from './RootWet.js';
import { Bloom } from './Bloom.js';

/**
 * Wet Leaf material - tries to duplicate or transfer water, generates solar energy
 */
export class LeafWet extends Material {
  constructor() {
    super('LeafWet', '#32CD32', 1); // Lime green (brighter than dry), low density
    this.cooldown = 0; // Cooldown for duplication/transfer
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
      return false;
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

    // Check if there's a bloom nearby - if yes, DON'T duplicate or expand
    // All resources go to bloom until it's fully watered
    if (this.hasBloomNearby(x, y, world)) {
      // There's a bloom somewhere nearby, just become dry and wait
      // Don't duplicate, don't transfer - let water go to bloom
      const newLeafDry = new LeafDry();
      newLeafDry.cooldown = 15;
      newLeafDry.solarCooldown = this.solarCooldown; // Preserve solar cooldown
      world.setMaterial(x, y, newLeafDry);
      return true;
    }

    // Priority 1: Try to duplicate into valid air cell
    const duplicateResult = this.tryDuplicate(x, y, world);
    if (duplicateResult) {
      return true;
    }

    // Priority 2: Transfer water to adjacent dry leaf
    const transferResult = this.tryTransferToLeaf(x, y, world);
    if (transferResult) {
      return true;
    }

    // Priority 3: Become dry (water consumed/evaporated)
    const newLeafDry = new LeafDry();
    newLeafDry.cooldown = 15;
    newLeafDry.solarCooldown = this.solarCooldown; // Preserve solar cooldown
    world.setMaterial(x, y, newLeafDry);
    return true;
  }

  /**
   * Try to duplicate into a valid air cell
   * Valid = air cell that would only touch air or leaf cells after becoming a leaf
   */
  tryDuplicate(x, y, world) {
    const directions = [
      { x: x, y: y - 1 },      // up
      { x: x, y: y + 1 },      // down
      { x: x - 1, y: y },      // left
      { x: x + 1, y: y }       // right
    ];

    const validCandidates = [];

    for (const dir of directions) {
      if (dir.x < 0 || dir.x >= world.width ||
          dir.y < 0 || dir.y >= world.height) {
        continue;
      }

      const pixel = world.getPixel(dir.x, dir.y);

      // Check if it's an air cell
      if (pixel.material instanceof Air) {
        // Check if this air cell would only touch air or leaves
        if (this.isValidLeafPosition(dir.x, dir.y, world)) {
          validCandidates.push(dir);
        }
      }
    }

    if (validCandidates.length > 0) {
      // Randomly choose one valid position
      const chosen = validCandidates[Math.floor(Math.random() * validCandidates.length)];

      // This leaf becomes dry
      const newLeafDry = new LeafDry();
      newLeafDry.cooldown = 15;
      newLeafDry.solarCooldown = this.solarCooldown; // Preserve solar cooldown
      world.setMaterial(x, y, newLeafDry);

      // Spawn new dry leaf at chosen position (starts fresh)
      const newLeaf = new LeafDry();
      newLeaf.cooldown = 15;
      newLeaf.solarCooldown = 0; // New leaf starts with no solar cooldown
      world.setMaterial(chosen.x, chosen.y, newLeaf);

      return true;
    }

    return false;
  }

  /**
   * Check if a position would be valid for a leaf
   * Valid = only touches air or other leaves (no stems, roots, earth, water, stone)
   */
  isValidLeafPosition(x, y, world) {
    const neighbors = [
      { x: x, y: y - 1 },
      { x: x, y: y + 1 },
      { x: x - 1, y: y },
      { x: x + 1, y: y }
    ];

    for (const neighbor of neighbors) {
      if (neighbor.x < 0 || neighbor.x >= world.width ||
          neighbor.y < 0 || neighbor.y >= world.height) {
        continue;
      }

      const pixel = world.getPixel(neighbor.x, neighbor.y);
      const materialName = pixel.material.name;

      // Only allow Air and Leaf (Dry or Wet) as neighbors
      if (!(pixel.material instanceof Air) &&
          materialName !== 'LeafDry' &&
          materialName !== 'LeafWet') {
        return false; // Found invalid neighbor
      }
    }

    return true; // All neighbors are valid
  }

  /**
   * Try to transfer water to an adjacent dry leaf
   */
  tryTransferToLeaf(x, y, world) {
    const directions = [
      { x: x, y: y - 1 },
      { x: x, y: y + 1 },
      { x: x - 1, y: y },
      { x: x + 1, y: y }
    ];

    const dryLeafCandidates = [];

    for (const dir of directions) {
      if (dir.x < 0 || dir.x >= world.width ||
          dir.y < 0 || dir.y >= world.height) {
        continue;
      }

      const pixel = world.getPixel(dir.x, dir.y);
      if (pixel.material instanceof LeafDry) {
        dryLeafCandidates.push(dir);
      }
    }

    if (dryLeafCandidates.length > 0) {
      // Randomly choose one dry leaf
      const chosen = dryLeafCandidates[Math.floor(Math.random() * dryLeafCandidates.length)];

      // This leaf becomes dry
      const newLeafDry = new LeafDry();
      newLeafDry.cooldown = 15;
      newLeafDry.solarCooldown = this.solarCooldown; // Preserve solar cooldown
      world.setMaterial(x, y, newLeafDry);

      // Target leaf becomes wet
      const chosenPixel = world.getPixel(chosen.x, chosen.y);
      const newLeafWet = new LeafWet();
      newLeafWet.cooldown = 15;
      newLeafWet.solarCooldown = chosenPixel.material.solarCooldown; // Preserve target's solar cooldown
      world.setMaterial(chosen.x, chosen.y, newLeafWet);

      return true;
    }

    return false;
  }

  /**
   * Override color for visual feedback when generating solar energy
   */
  getColor() {
    if (this.energyCounter > 0) {
      return '#FFFF99'; // Bright yellow when energized
    }
    return this.color; // Normal lime green
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

  /**
   * Check if there's a bloom nearby (within 5 cells radius)
   * If bloom exists, leaves should not expand - all resources go to bloom
   */
  hasBloomNearby(x, y, world) {
    // Check a 11x11 area around this leaf (5 cells in each direction)
    const radius = 5;

    for (let checkY = y - radius; checkY <= y + radius; checkY++) {
      for (let checkX = x - radius; checkX <= x + radius; checkX++) {
        if (checkX < 0 || checkX >= world.width ||
            checkY < 0 || checkY >= world.height) {
          continue;
        }

        const pixel = world.getPixel(checkX, checkY);
        if (pixel && pixel.material instanceof Bloom) {
          return true; // Found a bloom nearby!
        }
      }
    }

    return false; // No bloom nearby
  }
}
