# Pixel Physics Engine

A discrete particle simulation where every pixel is a material that follows physics rules and interacts with its neighbors. Now featuring a complete **plant growth system**!

🎮 **[Open Demo](index.html)** | 📖 **[Full Architecture Guide](PROJECT_STRUCTURE.md)**

## ✨ Features

- **Real-time physics simulation** - gravity, fluid dynamics, material transformations
- **Multiple materials**: Air, Water, Earth (dry/wet), Stone, Seeds, Roots, Stems, Leaves, Blooms, Flowers, Clouds, Water Sources, Platforms
- **Complete plant lifecycle** - Seeds → Germination → Root/Stem growth → Leaf networks → Blooms → Flowers → New seeds
- **Flowering system** - Blooms spawn from mature stems (12+ pixels), accumulate water, bloom into gradient-colored flowers
- **Weather system** - Clouds spawn, duplicate, produce rain, and dissipate naturally
- **Smart interactions**: Water absorption, vaporization, root water consumption, cloud rain generation
- **Advanced plant physics**: Directional stem growth, growth cooldowns, square prevention, solar energy production
- **Position-based rendering**: Gradient coloring for flowers based on vertical/horizontal position
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
- **Семя (Seed)** - Place seeds that grow into plants (falls straight down)
- **Корень (Root)** - Draw root material directly
- **Стебель (Stem)** - Draw stem material directly
- **Лист (Leaf)** - Draw leaf material directly
- **Платформа (Badrock)** - Immovable platforms for building
- **Источник воды (Water Source)** - Infinite water generator
- **Облако (Cloud)** - Rain-producing clouds that duplicate and dissipate
- **Бутон (Bloom)** - Flower buds (spawn from stems, accumulate water)
- **Пауза (Pause)** - Pause/resume simulation
- **Очистить (Clear)** - Clear the canvas
- **Сохранить (Save)** - Save world to browser storage
- **Загрузить (Load)** - Load saved world

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
    ├── Material.js           # Base abstract class (with position-based colors)
    ├── MaterialRegistry.js   # Material factory
    ├── EarthBase.js          # Shared earth physics
    ├── Air.js                # Empty space
    ├── Water.js              # Liquid with vaporization
    ├── Stone.js              # Heavy solid
    ├── EarthDry.js           # Absorbs water
    ├── EarthWet.js           # Spreads moisture + vaporizes
    ├── Seed.js               # Germinates on wet earth (dual falling modes)
    ├── RootDry.js            # Absorbs water, spawns roots
    ├── RootWet.js            # Transfers water upward
    ├── StemDry.js            # Receives water from below
    ├── StemWet.js            # Grows upward, spawns leaves & blooms
    ├── LeafDry.js            # Waits for water from stem, solar energy
    ├── LeafWet.js            # Duplicates or transfers water, solar energy
    ├── Bloom.js              # Accumulates water, blooms into flowers
    ├── Flower.js             # Ages, gradient colors, produces seeds
    ├── Cloud.js              # Duplicates, spawns rain, dissipates
    ├── WaterSource.js        # Infinite water generator
    └── Badrock.js            # Immovable platform
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
| **Seed** | Falls until landing on wet earth, then germinates | **Dual modes:** User-placed seeds fall straight (100% vertical), flower-spawned seeds use diagonal falling (33% diagonal, 67% vertical). Creates stem above + root below on germination. |
| **Root (Dry)** | Searches for water/wet earth in all 4 directions | 30% chance to absorb water → becomes wet, spawns new roots with cooldown (30 ticks), absorption cooldown (30 ticks) |
| **Root (Wet)** | Transfers water to dry roots/stems | Priority: top (0) > left/right (1, random), becomes dry after transfer |
| **Stem (Dry)** | Waits for water from below, spawns leaves | Receives water → becomes wet, 5% chance to spawn leaf if none attached |
| **Stem (Wet)** | Distributes water to leaves or grows upward | **Bloom spawning:** Stems 12+ pixels tall have 1% chance to spawn bloom. **Water priority:** Waters adjacent blooms (100%) > nearby blooms via upward transfer > waters leaves (40%) > grows upward |
| **Leaf (Dry)** | Waits for water from stem, generates solar energy | No gravity, stays in place, 0.5% chance to energize connected root (1 minute cooldown) |
| **Leaf (Wet)** | Expands leaf network or transfers water, generates solar energy | Duplicates into air (only touches air/leaves), transfers to dry leaves, or dries out, 0.5% chance to energize connected root (1 minute cooldown) |
| **Bloom** | Accumulates water from adjacent wet stems | Starts with waterCounter = 0. Each watering +1. At 12 water: blooms into flower structure (circular pattern, 20+ pixels). Detects stems cardinally AND diagonally for proper water routing. |
| **Flower** | Ages over time, produces seeds | **Phase 1 (1000-501 ticks):** Pink with gradient. **Phase 2 (500-0 ticks):** Green with gradient. **Gradient:** Top/far = lighter, bottom/near = darker. **At 0:** 10% chance → Seed (diagonal falling enabled), 90% → Air. |

### Advanced Materials

| Material | Behavior | Key Features |
|----------|----------|--------------|
| **Cloud** | Duplicates and spawns rain, temporary lifespan | **Duplication:** Every 20 ticks, rolls against duplication chance (starts 100%). Success = spawn new cloud (chance - 0.5%) in random direction (35% left/right, 15% up/down). Fail = disappear. **Water spawning:** 0.15% chance per tick. Water falls through clouds. **Lifecycle:** ~200 generations before reaching 0% and disappearing. New clouds start with 20-tick cooldown. |
| **Water Source** | Infinite water generator | **Priority 1:** Spawns water below (if Air). **Priority 2:** If blocked below, spawns on random side (left/right, if Air). Spawns every 16 ticks. Won't overwrite existing water. Creates continuous water flow. |
| **Badrock** | Immovable platform material | No gravity, never moves. Blocks all materials. Perfect for building multi-level structures. Density: 999. |

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

## 🌸 Flowering System

The complete plant lifecycle from seed to flower to new seeds:

### Bloom Spawning
- **Trigger:** Stems 12+ pixels tall (measured from root/seed origin)
- **Chance:** 1% per tick when wet stem meets height requirement
- **Position:** Spawns on left or right side of stem (random)
- **Initial state:** Single bloom pixel with waterCounter = 0

### Water Accumulation
- **Wet stems** water adjacent blooms with **100% priority**
- **Water routing:** Stems detect blooms diagonally (within 3-cell radius) and route water upward to reach them
- **Counter:** Each watering increments bloom's waterCounter by 1
- **Threshold:** Blooms at waterCounter = 12

### Flowering
- **Trigger:** When waterCounter reaches 12
- **Pattern:** Circular flower structure (20+ pixels)
- **Direction:** Grows away from stem
- **Replaces:** Air, dry leaves, and wet leaves
- **Structure:** Complete circle with no gaps (includes all center pixels)

### Flower Lifecycle
1. **Phase 1 - Pink (1000-501 ticks):**
   - Base color: #FF69B4 (Hot Pink)
   - Gradient applied: top/far = lighter, bottom/near = darker

2. **Phase 2 - Green (500-0 ticks):**
   - Base color: #2F4F2F (Dark Green)
   - Same gradient pattern continues

3. **End of Life (0 ticks):**
   - **10% chance:** Transform to Seed (with diagonal falling enabled)
   - **90% chance:** Disappear (become Air)

### Gradient Coloring
- **Position-based:** Each flower pixel calculates its color based on coordinates
- **Vertical gradient:** Pixels above center = lighter, below = darker
- **Horizontal gradient:** Pixels farther from center = slightly lighter
- **Both phases:** Gradient applies to both pink and green phases
- **Dynamic:** Calculated at render time, not stored

## ☁️ Weather System

### Cloud Mechanics
- **Spawning:** User-placed or naturally appearing
- **Duplication:** Every 20 ticks, attempts to duplicate
  - Rolls against current duplication chance (starts at 100%)
  - Success: Spawns new cloud with reduced chance (-0.5%)
  - Failure: Cloud disappears
  - No space: Cloud disappears
- **Rain Production:** 0.15% chance per tick to spawn water
- **Water Physics:** Water falls through cloud pixels
- **Lifecycle:** ~200 generation lifespan before reaching 0%
- **Distribution:** 35% left/right, 15% up/down when duplicating

## 🎯 Future Roadmap

### Phase 1: Additional Features
- **Fruit** → intermediate stage between flower and seed
- **Death mechanics** → plants decay without water
- **Seasonal changes** → environmental cycles

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

## 🖥️ Configuration

### World Dimensions
- **Width:** 120 pixels (720px rendered at 6px/pixel)
- **Height:** 128 pixels (768px rendered at 6px/pixel)
- **Total cells:** 15,360 pixels
- **Render size:** 720px × 768px

The world is 1.6x taller than the original 80-pixel height, providing more vertical space for:
- Taller plant growth
- Multi-level structures with platforms
- Complex cloud formations
- Deeper water features

### Performance
- **Update rate:** 60 ticks per second (requestAnimationFrame)
- **Render mode:** Canvas 2D with pixelated rendering
- **Optimization:** Position-based colors calculated at render time
- **Save system:** Browser localStorage for world persistence

## 📋 Recent Changes

For detailed information about recent improvements and bug fixes, see [RECENT_CHANGES.md](RECENT_CHANGES.md).

**Latest updates include:**
- Cloud duplication mechanics overhaul (natural lifecycle)
- Bloom watering detection fixes (diagonal bloom detection)
- Seed dual falling modes (straight for user, diagonal for flowers)
- Flower gradient coloring system (position-based rendering)
- Water source side-spawning (works on solid ground)
- Screen height increase (1.6x taller)

## 📝 License

Open source - use however you like!

---

**Краткое описание (Russian)**: Дискретный симулятор частиц с полной системой роста растений. Семена прорастают на влажной земле, корни ищут воду, стебли растут вверх и порождают листья и бутоны. Бутоны накапливают воду и превращаются в красивые цветы с градиентом. Цветы производят новые семена. Облака дублируются, производят дождь и рассеиваются. Полный жизненный цикл растений от семени до цветка и обратно к семени.
