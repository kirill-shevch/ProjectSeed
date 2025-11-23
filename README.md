# Pixel Physics Engine

A discrete particle simulation where every pixel is a material that follows physics rules and interacts with its neighbors. Now featuring a complete **plant growth system**!

🎮 **[Open Demo](index.html)** | 📖 **[Full Architecture Guide](PROJECT_STRUCTURE.md)**

## ✨ Features

- **Real-time physics simulation** - gravity, fluid dynamics, material transformations
- **Multiple materials**: Air, Water, Earth (dry/wet), Stone, Seeds, Roots, Stems, Leaves
- **Plant growth system** - Seeds germinate and grow into complex root, stem, and leaf networks
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
- **Лист (Leaf)** - Draw leaf material directly
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
    ├── StemWet.js            # Grows upward, spawns leaves
    ├── LeafDry.js            # Waits for water from stem
    └── LeafWet.js            # Duplicates or transfers water
```

**For detailed architecture, design philosophy, and development guidelines, see [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)**

## 🎨 Current Materials

### Basic Materials

| Material | Behavior | Density |
|----------|----------|---------|
| **Air** | Empty space | 0 |
| **Water** | Falls, flows sideways, absorbed by earth in all 4 directions (80% below, 50% sides, 20% above), evaporates slowly (0.033% per tick) | 2 |
| **Stone** | Heavy, falls through air/water, stops on earth | 5 |
| **Earth (Dry)** | Falls, absorbs water → becomes wet, slides off pillars | 4 |
| **Earth (Wet)** | Same as dry + spreads moisture in all 4 directions (80% below, 50% sides, 20% above), slowly dries (0.017% per tick) | 4 |

### Plant Materials

| Material | Behavior | Key Features |
|----------|----------|--------------|
| **Seed** | Falls until landing on wet earth, then germinates | Creates stem above + root below on germination |
| **Root (Dry)** | Searches for water/wet earth in all 4 directions | 30% chance to absorb water → becomes wet, spawns new roots with cooldown (30 ticks), absorption cooldown (30 ticks) |
| **Root (Wet)** | Transfers water to dry roots/stems | Priority: top (0) > left/right (1, random), becomes dry after transfer |
| **Stem (Dry)** | Waits for water from below, spawns leaves | Receives water → becomes wet, 5% chance to spawn leaf if none attached |
| **Stem (Wet)** | Distributes water to leaves or grows upward | 40% chance to water adjacent dry leaf, otherwise grows up |
| **Leaf (Dry)** | Waits for water from stem, generates solar energy | No gravity, stays in place, 0.5% chance to energize connected root |
| **Leaf (Wet)** | Expands leaf network or transfers water, generates solar energy | Duplicates into air (only touches air/leaves), transfers to dry leaves, or dries out, 0.5% chance to energize connected root |

## 🌱 Plant Growth System

The plant growth system simulates realistic plant behavior:

### Germination
1. **Seed falls** through air and water
2. **Lands on wet earth** → transforms into stem, wet earth becomes root
3. **Lands on dry earth/stone** → stays dormant

### Root Network
- **Water absorption**: Dry roots have 30% chance to absorb from wet earth or water cells
- **Branching expansion**: Roots spawn in earth (left/right/bottom) and can have up to 3 neighbors
  - Allows 1 parent + 2 children configuration for web-like growth
  - Still prevents dense squares: new root must have ≤1 root neighbor
- **Growth cooldown**: 30-tick delay between spawns for natural spreading
- **Absorption cooldown**: 30-tick delay between water consumption attempts
- **Water transfer**: Wet roots transfer water upward (priority) or sideways (random)

### Stem Growth
- **Vertical growth**: Stems grow straight upward only
- **Simple mechanics**: No directional branching, creates straight vertical stalks
- **Square prevention**: Only grows where it would have ≤1 stem neighbor
- **Water-driven**: Growth only occurs when stem receives water from below
- **Leaf spawning**: 5% chance to spawn leaf when receiving water (if no leaves attached)

### Leaf Network
- **No gravity**: Leaves stay in place, don't fall
- **Spawning**: Stems spawn leaves horizontally (left/right) with 5% chance in early growth stage
- **Spawn validation**: New leaf positions validated to only touch air/leaves (plus spawning stem)
- **Water distribution**: Wet stems have 40% chance to water adjacent dry leaves
- **Expansion**: Wet leaves duplicate into air cells that only touch air or other leaves
- **Isolation**: Leaves can't touch stems, roots, earth, water, or stone (only air and other leaves)
- **Water flow**: Wet leaves transfer water to adjacent dry leaves, or dry out if stuck
- **Solar energy**: Both dry and wet leaves have 0.5% chance per tick to generate solar energy (1 minute cooldown)
- **Energy pathway**: Solar energy travels through stem → searches through connected plant → finds valid root → triggers root growth
- **Smart targeting**: If a root can't duplicate, searches continue through connected roots until finding one that can
- **Root validation**: Targets roots with <3 neighbors and valid earth cells for spawning
- **Visual feedback**: Energized leaves flash bright yellow (#FFFF99) for 15 ticks
- **Root growth**: Solar energy helps roots expand through dry earth to find water sources
- **Cooldown**: Each leaf has 1-minute (3600 ticks) cooldown after generating solar energy

### Water Dynamics
- **4-directional spreading**: Water wets earth in all directions with probabilities:
  - 80% chance below (gravity-assisted)
  - 50% chance on sides (lateral spreading)
  - 20% chance above (capillary action)
- **Wet earth spreading**: Same probabilities apply when wet earth spreads to dry earth
- **Root consumption**: Roots have 30% chance to drink water (gives water time to spread)
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

**Краткое описание (Russian)**: Дискретный симулятор частиц с полной системой роста растений. Семена прорастают на влажной земле, корни ищут воду, стебли растут вверх и порождают листья. Листья расширяют сеть в воздухе, используя воду для роста. Вода испаряется, земля высыхает, растения взаимодействуют с окружающей средой реалистично.
