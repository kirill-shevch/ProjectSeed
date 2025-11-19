import { Material } from './Material.js';
import { Air } from './Air.js';
import { Water } from './Water.js';

/**
 * Base class for earth materials (dry and wet)
 */
export class EarthBase extends Material {
  constructor(name, color, density) {
    super(name, color, density);
    this.justLanded = false; // Track when particle just stopped falling
  }

  hasGravity() {
    return true;
  }

  /**
   * Common update logic for all earth types
   */
  update(x, y, world) {
    const yBelow = y + 1;
    
    // Try to fall
    if (yBelow < world.height) {
      const belowPixel = world.getPixel(x, yBelow);
      const belowMaterial = belowPixel.material;

      // Fall through air
      if (belowMaterial instanceof Air) {
        world.swapPixels(x, y, x, yBelow);
        this.justLanded = false; // Still falling
        return true;
      }

      // Fall through water (earth is heavier)
      if (belowMaterial instanceof Water) {
        world.swapPixels(x, y, x, yBelow);
        this.justLanded = false; // Still falling
        return true;
      }
    }

    // If we get here, we couldn't fall - check if we just landed
    if (!this.justLanded) {
      this.justLanded = true;
      
      // Check if we're on a pillar (50% chance to slide off)
      if (Math.random() < 0.5) {
        const leftX = x - 1;
        const rightX = x + 1;
        
        let canSlideLeft = false;
        let canSlideRight = false;
        
        // Check left side
        if (leftX >= 0 && yBelow < world.height) {
          const leftPixel = world.getPixel(leftX, y);
          const belowLeftPixel = world.getPixel(leftX, yBelow);
          
          if (leftPixel.material instanceof Air && 
              belowLeftPixel.material instanceof Air) {
            canSlideLeft = true;
          }
        }
        
        // Check right side
        if (rightX < world.width && yBelow < world.height) {
          const rightPixel = world.getPixel(rightX, y);
          const belowRightPixel = world.getPixel(rightX, yBelow);
          
          if (rightPixel.material instanceof Air && 
              belowRightPixel.material instanceof Air) {
            canSlideRight = true;
          }
        }
        
        // Slide if possible
        if (canSlideLeft && canSlideRight) {
          // Both sides available, choose randomly
          const targetX = Math.random() < 0.5 ? leftX : rightX;
          world.swapPixels(x, y, targetX, y);
          this.justLanded = false; // Will continue falling
          return true;
        } else if (canSlideLeft) {
          world.swapPixels(x, y, leftX, y);
          this.justLanded = false; // Will continue falling
          return true;
        } else if (canSlideRight) {
          world.swapPixels(x, y, rightX, y);
          this.justLanded = false; // Will continue falling
          return true;
        }
      }
    }

    // Subclass-specific behavior
    return this.onLanded(x, y, world);
  }

  /**
   * Called when particle has landed and won't fall further
   * Override in subclasses for specific behavior
   */
  onLanded(x, y, world) {
    return false;
  }
}

