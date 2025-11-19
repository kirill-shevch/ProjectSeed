import { Air } from './Air.js';
import { Water } from './Water.js';
import { EarthDry } from './EarthDry.js';
import { EarthWet } from './EarthWet.js';
import { Stone } from './Stone.js';

/**
 * MaterialRegistry - factory for creating material instances
 * Makes it easy to add new materials in the future
 */
export class MaterialRegistry {
  constructor() {
    // Register all available materials
    this.materials = {
      'air': { 
        class: Air, 
        name: 'Воздух (стереть)', 
        color: '#000000',
        borderColor: '#555'
      },
      'water': { 
        class: Water, 
        name: 'Вода', 
        color: '#3fa9f5',
        borderColor: '#0008'
      },
      'earth': { 
        class: EarthDry, 
        name: 'Земля', 
        color: '#8b5a2b',
        borderColor: '#0008'
      },
      'stone': { 
        class: Stone, 
        name: 'Камень', 
        color: '#aaaaaa',
        borderColor: '#0008'
      }
    };
  }

  /**
   * Create a new instance of a material by its ID
   * @param {string} materialId - The material identifier
   * @returns {Material} - New material instance
   */
  create(materialId) {
    const materialDef = this.materials[materialId];
    if (!materialDef) {
      throw new Error(`Unknown material: ${materialId}`);
    }
    return new materialDef.class();
  }

  /**
   * Get all registered materials for UI generation
   * @returns {Array} - Array of material definitions
   */
  getAll() {
    return Object.entries(this.materials).map(([id, def]) => ({
      id,
      ...def
    }));
  }

  /**
   * Register a new material type
   * @param {string} id - Material identifier
   * @param {class} materialClass - Material class
   * @param {string} name - Display name
   * @param {string} color - Display color
   */
  register(id, materialClass, name, color, borderColor = '#0008') {
    this.materials[id] = {
      class: materialClass,
      name,
      color,
      borderColor
    };
  }
}

