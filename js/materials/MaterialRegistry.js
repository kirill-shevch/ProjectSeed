import { Air } from './Air.js';
import { Water } from './Water.js';
import { EarthDry } from './EarthDry.js';
import { EarthWet } from './EarthWet.js';
import { Stone } from './Stone.js';
import { Seed } from './Seed.js';
import { RootDry } from './RootDry.js';
import { StemDry } from './StemDry.js';
import { LeafDry } from './LeafDry.js';
import { Badrock } from './Badrock.js';
import { WaterSource } from './WaterSource.js';
import { Cloud } from './Cloud.js';
import { Bloom } from './Bloom.js';
import { Flower } from './Flower.js';

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
      },
      'seed': {
        class: Seed,
        name: 'Семя',
        color: '#9b7653',
        borderColor: '#0008'
      },
      'root': {
        class: RootDry,
        name: 'Корень',
        color: '#d2691e',
        borderColor: '#0008'
      },
      'stem': {
        class: StemDry,
        name: 'Стебель',
        color: '#7cba3d',
        borderColor: '#0008'
      },
      'leaf': {
        class: LeafDry,
        name: 'Лист',
        color: '#90EE90',
        borderColor: '#0008'
      },
      'badrock': {
        class: Badrock,
        name: 'Платформа',
        color: '#222222',
        borderColor: '#0008'
      },
      'watersource': {
        class: WaterSource,
        name: 'Источник воды',
        color: '#3fa9f5',
        borderColor: '#0008'
      },
      'cloud': {
        class: Cloud,
        name: 'Облако',
        color: '#CCCCCC',
        borderColor: '#0008'
      },
      'bloom': {
        class: Bloom,
        name: 'Бутон',
        color: '#FF69B4',
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

