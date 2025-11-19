# Pixel Physics Engine

A discrete particle simulation where every pixel is a material that follows physics rules and interacts with its neighbors.

🎮 **[Open Demo](index.html)** | 📖 **[Full Architecture Guide](PROJECT_STRUCTURE.md)**

## ✨ Features

- **Real-time physics simulation** - gravity, fluid dynamics, material transformations
- **Multiple materials**: Air, Water, Earth (dry/wet), Stone
- **Smart interactions**: Earth absorbs water, materials flow and settle realistically
- **Anti-pillar physics**: Particles slide off narrow columns (50% chance) for natural distribution
- **Extensible architecture**: Easy to add new materials and interactions

## 🚀 Quick Start

1. Open `index.html` in a web browser
2. Select a material (Water, Earth, Stone)
3. Click and drag to draw
4. Watch the physics simulation in action!

### Controls
- **Воздух (Erase)** - Remove pixels
- **Вода (Water)** - Draw flowing water
- **Земля (Earth)** - Draw earth that absorbs water
- **Камень (Stone)** - Draw heavy stones
- **Пауза (Pause)** - Pause/resume simulation
- **Очистить (Clear)** - Clear the canvas

## 🏗️ Architecture

The codebase follows an object-oriented design for easy maintenance and extensibility:

```
js/
├── core/              # Engine components
│   ├── Pixel.js       # Pixel wrapper (holds material)
│   ├── PixelWorld.js  # Grid management & simulation
│   ├── Renderer.js    # Canvas rendering
│   └── Engine.js      # Main simulation loop
│
└── materials/         # Material types
    ├── Material.js           # Base abstract class
    ├── MaterialRegistry.js   # Material factory
    ├── EarthBase.js          # Shared earth physics
    ├── Air.js                # Empty space
    ├── Water.js              # Liquid
    ├── Stone.js              # Heavy solid
    ├── EarthDry.js           # Absorbs water
    └── EarthWet.js           # Spreads moisture
```

**For detailed architecture, design philosophy, and development guidelines, see [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)**

## 🎨 Current Materials

| Material | Behavior | Density |
|----------|----------|---------|
| **Air** | Empty space | 0 |
| **Water** | Falls, flows sideways, absorbed by dry earth | 2 |
| **Stone** | Heavy, falls through air/water, stops on earth | 5 |
| **Earth (Dry)** | Falls, absorbs water → becomes wet, slides off pillars | 4 |
| **Earth (Wet)** | Same as dry + spreads moisture to nearby dry earth | 4 |

## ➕ Adding New Materials

Adding a new material is simple:

### 1. Create Material Class

```javascript
// js/materials/MyMaterial.js
import { Material } from './Material.js';

export class MyMaterial extends Material {
  constructor() {
    super('MyMaterial', '#FF00FF', 3); // name, color, density
  }

  hasGravity() {
    return true; // or false
  }

  update(x, y, world) {
    // Your physics logic here
    // Check neighbors, swap positions, transform, etc.
    return false; // true if changed
  }
}
```

### 2. Register in MaterialRegistry

```javascript
// js/materials/MaterialRegistry.js
import { MyMaterial } from './MyMaterial.js';

this.materials = {
  // ... existing materials
  'my_material': {
    class: MyMaterial,
    name: 'My Material',
    color: '#FF00FF',
    borderColor: '#CC00CC'
  }
};
```

### 3. Done! ✅

The material automatically appears in the UI and works in the simulation.

## 🌱 Future Roadmap

### Next: Plant Growth System
- **Seed** → grows when touching earth + water nearby
- **Root** → grows downward, absorbs water
- **Stem** → grows upward when root has water
- **Leaf** → sprouts from stem at intervals

### Later:
- Fire/burning system
- Sand (falls through water)
- Lava (flows, burns)
- Ice/Steam (phase changes)
- Optimization for larger grids

## 🎯 Philosophy

The project's main goal is **maintainability and extensibility**:

✅ Adding new materials should be **easy and intuitive**  
✅ Fixing interaction bugs should be **straightforward**  
✅ Each material's behavior should be **self-contained**  
✅ The codebase should support **unlimited material types**  

See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for complete development guidelines.

## 📝 License

Open source - use however you like!

---

**Краткое описание (Russian)**: Дискретный симулятор частиц, где каждый пиксель - это материал со своей физикой. Легко добавлять новые материалы и взаимодействия. Следующий шаг: система роста растений.
