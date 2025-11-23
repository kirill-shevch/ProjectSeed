import { Material } from './Material.js';
import { Air } from './Air.js';
import { RootDry } from './RootDry.js';
import { StemWet } from './StemWet.js';
import { LeafDry } from './LeafDry.js';

/**
 * Dry Stem material - receives water from wet root or wet stem below
 */
export class StemDry extends Material {
  constructor(preferredDirection = 'up') {
    super('StemDry', '#7cba3d', 3);
    this.cooldown = 0; // Cooldown for water reception
    this.preferredDirection = preferredDirection; // Direction this stem came from
  }

  update(x, y, world) {
    // Decrement cooldown
    if (this.cooldown > 0) {
      this.cooldown--;
      return false;
    }

    // Check if there's wet root or wet stem below
    const yBelow = y + 1;

    if (yBelow < world.height) {
      const belowPixel = world.getPixel(x, yBelow);

      // Check if bottom is wet root or wet stem
      if (belowPixel.material.name === 'RootWet' ||
          belowPixel.material.name === 'StemWet') {
        // Transfer water: bottom becomes dry, this stem becomes wet

        // Before transforming to wet, try to spawn a leaf (10% chance)
        this.trySpawnLeaf(x, y, world);

        // Bottom becomes dry
        if (belowPixel.material.name === 'RootWet') {
          const newRootDry = new RootDry();
          newRootDry.cooldown = 15; // Set cooldown
          world.setMaterial(x, yBelow, newRootDry);
        } else {
          const newStemDry = new StemDry();
          newStemDry.cooldown = 15; // Set cooldown
          world.setMaterial(x, yBelow, newStemDry);
        }

        // This stem becomes wet, passing along preferred direction
        const newStemWet = new StemWet(this.preferredDirection);
        newStemWet.cooldown = 15; // Set cooldown
        world.setMaterial(x, y, newStemWet);

        return true;
      }
    }

    return false;
  }

  /**
   * Try to spawn a leaf on the side of this stem
   * 5% chance if no leaves are attached in 4 cardinal directions
   */
  trySpawnLeaf(x, y, world) {
    // Check all 4 directions for existing leaves
    const directions = [
      { x: x, y: y - 1 },      // up
      { x: x, y: y + 1 },      // down
      { x: x - 1, y: y },      // left
      { x: x + 1, y: y }       // right
    ];

    let hasLeaf = false;
    for (const dir of directions) {
      if (dir.x < 0 || dir.x >= world.width ||
          dir.y < 0 || dir.y >= world.height) {
        continue;
      }

      const pixel = world.getPixel(dir.x, dir.y);
      if (pixel.material.name === 'LeafDry' || pixel.material.name === 'LeafWet') {
        hasLeaf = true;
        break;
      }
    }

    // If no leaves attached, 5% chance to spawn one
    if (!hasLeaf && Math.random() < 0.05) {
      // Try to spawn on left or right (horizontal only)
      const candidates = [];

      const leftX = x - 1;
      if (leftX >= 0) {
        const leftPixel = world.getPixel(leftX, y);
        if (leftPixel.material instanceof Air && this.isValidLeafPosition(leftX, y, x, y, world)) {
          candidates.push({ x: leftX, y: y });
        }
      }

      const rightX = x + 1;
      if (rightX < world.width) {
        const rightPixel = world.getPixel(rightX, y);
        if (rightPixel.material instanceof Air && this.isValidLeafPosition(rightX, y, x, y, world)) {
          candidates.push({ x: rightX, y: y });
        }
      }

      if (candidates.length > 0) {
        // Randomly choose left or right
        const chosen = candidates[Math.floor(Math.random() * candidates.length)];
        const newLeaf = new LeafDry();
        newLeaf.cooldown = 15;
        world.setMaterial(chosen.x, chosen.y, newLeaf);
      }
    }
  }

  /**
   * Check if a position would be valid for a leaf spawned by this stem
   * Valid = only touches air, leaves, or the stem that's spawning it
   */
  isValidLeafPosition(leafX, leafY, stemX, stemY, world) {
    const neighbors = [
      { x: leafX, y: leafY - 1 },
      { x: leafX, y: leafY + 1 },
      { x: leafX - 1, y: leafY },
      { x: leafX + 1, y: leafY }
    ];

    for (const neighbor of neighbors) {
      if (neighbor.x < 0 || neighbor.x >= world.width ||
          neighbor.y < 0 || neighbor.y >= world.height) {
        continue;
      }

      // Check if this neighbor is the stem spawning the leaf (exception)
      if (neighbor.x === stemX && neighbor.y === stemY) {
        continue; // Stem is allowed
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
}
