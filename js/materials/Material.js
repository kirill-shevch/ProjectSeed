/**
 * Base Material class
 * All materials should extend this class and implement their own physics logic
 */
export class Material {
  constructor(name, color, density = 1) {
    this.name = name;
    this.color = color;
    this.density = density; // Used for determining which material sinks/floats
  }

  /**
   * Update the pixel based on material-specific physics
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {PixelWorld} world - Reference to the world
   * @returns {boolean} - True if the pixel moved/changed
   */
  update(x, y, world) {
    // Base implementation does nothing
    return false;
  }

  /**
   * Get the color for rendering
   * @returns {string} - Hex color
   */
  getColor() {
    return this.color;
  }

  /**
   * Check if this material is solid
   * @returns {boolean}
   */
  isSolid() {
    return true;
  }

  /**
   * Check if this material is affected by gravity
   * @returns {boolean}
   */
  hasGravity() {
    return false;
  }

  /**
   * Check if this material can flow
   * @returns {boolean}
   */
  canFlow() {
    return false;
  }
}

