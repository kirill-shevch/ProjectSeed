# Pixel Physics Engine

A discrete particle simulation where every pixel is a material that follows physics rules and interacts with its neighbors. Now featuring a complete **plant growth system**!

🎮 **[Open Demo](index.html)** | 📖 **[Full Architecture Guide](PROJECT_STRUCTURE.md)**

## ✨ Features

- **Real-time physics simulation** - gravity, fluid dynamics, material transformations
- **Multiple materials**: Air, Water, Earth (dry/wet), Stone, Seeds, Roots, Stems
- **Plant growth system** - Seeds germinate and grow into complex root and stem networks
- **Smart interactions**: Water absorption, vaporization, root water consumption
- **Advanced plant physics**: Directional stem growth, growth cooldowns, square prevention
- **Anti-pillar physics**: Particles slide off narrow columns (50% chance) for natural distribution
- **Extensible architecture**: Easy to add new materials and interactions

## 🚀 Quick Start

1. Open `index.html` in a web browser
2. Select a material (Water, Earth, Stone, Seed)
3. Click and drag to draw
4. Watch the physics simulation in action!

### Controls
- **Воздух (Erase)** - Remove pixels
- **Вода (Water)** - Draw flowing water
- **Земля (Earth)** - Draw earth that absorbs water
- **Камень (Stone)** - Draw heavy stones
- **Семя (Seed)** - Place seeds that grow into plants
- **Корень (Root)** - Draw root material directly
- **Стебель (Stem)** - Draw stem material directly
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
    ├── Water.js              # Liquid with vaporization
    ├── Stone.js              # Heavy solid
    ├── EarthDry.js           # Absorbs water
    ├── EarthWet.js           # Spreads moisture + vaporizes
    ├── Seed.js               # Germinates on wet earth
    ├── RootDry.js            # Absorbs water, spawns roots
    ├── RootWet.js            # Transfers water upward
    ├── StemDry.js            # Receives water from below
    └── StemWet.js            # Grows with directional momentum
```

**For detailed architecture, design philosophy, and development guidelines, see [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)**

## 🎨 Current Materials

### Basic Materials

| Material | Behavior | Density |
|----------|----------|---------|
| **Air** | Empty space | 0 |
| **Water** | Falls, flows sideways, absorbed by earth (left/right/below), evaporates slowly (0.033% per tick) | 2 |
| **Stone** | Heavy, falls through air/water, stops on earth | 5 |
| **Earth (Dry)** | Falls, absorbs water → becomes wet, slides off pillars | 4 |
| **Earth (Wet)** | Same as dry + spreads moisture to nearby dry earth, slowly dries (0.017% per tick) | 4 |

### Plant Materials

| Material | Behavior | Key Features |
|----------|----------|--------------|
| **Seed** | Falls until landing on wet earth, then germinates | Creates stem above + root below on germination |
| **Root (Dry)** | Searches for water/wet earth in all 4 directions | Absorbs water → becomes wet, spawns new roots with cooldown (30 ticks) |
| **Root (Wet)** | Transfers water to dry roots/stems | Priority: top (0) > left/right (1, random), becomes dry after transfer |
| **Stem (Dry)** | Waits for water from below | Receives water from wet root/stem → becomes wet |
| **Stem (Wet)** | Grows into air cells | Directional momentum: 70% continue current direction, creates zig-zag patterns |

## 🌱 Plant Growth System

The plant growth system simulates realistic plant behavior:

### Germination
1. **Seed falls** through air and water
2. **Lands on wet earth** → transforms into stem, wet earth becomes root
3. **Lands on dry earth/stone** → stays dormant

### Root Network
- **Water absorption**: Dry roots absorb from wet earth or water cells
- **Smart expansion**: Roots spawn in earth (left/right/bottom), avoiding squares
- **Growth cooldown**: 30-tick delay between spawns for natural spreading
- **Water transfer**: Wet roots transfer water upward (priority) or sideways (random)

### Stem Growth
- **Vertical bias**: 60% chance to grow upward, 20% left, 20% right
- **Directional momentum**: Stems remember their growth direction
  - Left-growing stems: 70% continue left, 20% up, 10% right
  - Right-growing stems: 70% continue right, 20% up, 10% left
- **Zig-zag patterns**: Creates natural branching structures
- **Square prevention**: Only grows where it would have ≤1 stem neighbor

### Water Dynamics
- **Multi-directional absorption**: Water soaks into earth from below, left, and right
- **Root consumption**: Roots can drink water directly (water → air)
- **Plant protection**: Water slides off plant materials instead of destroying them
- **Vaporization**: Water gradually evaporates, wet earth slowly dries

## ➕ Adding New Materials

Adding a new material is simple:

### 1. Create Material Class

```javascript
// js/materials/MyMaterial.js
import { Material } from './Material.js';

export class MyMaterial extends Material {
  constructor() {
    super('MyMaterial', '#FF00FF', 3); // name, color, density
    this.customState = 0; // Optional state
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

## 🎯 Future Roadmap

### Phase 1: Enhanced Plant System
- **Leaves** → sprout from stems, photosynthesize
- **Flowers** → grow from mature stems
- **Fruit** → produces new seeds
- **Death mechanics** → plants decay without water

### Phase 2: Environmental Systems
- **Fire** → burns plants and spreads
- **Sand** → falls like earth but through water
- **Lava** → flows, burns materials
- **Ice/Steam** → water phase changes

### Phase 3: Optimization
- Spatial partitioning for large grids
- Update only "active" regions
- Multi-threaded simulation

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

**Краткое описание (Russian)**: Дискретный симулятор частиц с полной системой роста растений. Семена прорастают на влажной земле, корни ищут воду, стебли растут вверх с зигзагообразными узорами. Вода испаряется, земля высыхает, растения взаимодействуют с окружающей средой реалистично.
