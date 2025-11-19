/**
 * Pixel class - represents a single cell in the world grid
 * Each pixel holds a reference to its material
 */
export class Pixel {
  constructor(material) {
    this.material = material;
  }

  /**
   * Update the pixel based on its material's logic
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {PixelWorld} world - Reference to the world
   * @returns {boolean} - True if the pixel changed
   */
  update(x, y, world) {
    return this.material.update(x, y, world);
  }

  /**
   * Get the color for rendering
   * @returns {string} - Hex color
   */
  getColor() {
    return this.material.getColor();
  }
}

