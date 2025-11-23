# Pixel Physics Engine - Project Structure & Guidelines

## 🎯 Project Philosophy

**Primary Goal**: Create a maintainable, extensible particle simulation system where:
- Adding new materials is **simple and intuitive**
- Fixing interaction bugs is **straightforward**
- The codebase supports **unlimited material types**
- Each material's behavior is **self-contained and clear**

## 📖 What This Project Is

A **discrete particle simulator** where every pixel on the screen represents a material (air, water, earth, stone, plant parts, etc.). The simulation runs in discrete time steps:

1. Each frame, the grid is updated
2. Each material has its own logic for:
   - How gravity affects it
   - How it interacts with neighboring cells
3. Pixels can have **internal states** (e.g., "just landed", "has spread moisture", "spawn cooldown")
4. Some interactions happen **only once** (on coordinate change or first contact with specific materials)

## 🏗️ Architecture

### Core Structure

```
js/
├── core/              # Core engine components
│   ├── Pixel.js       # Pixel wrapper (holds material instance)
│   ├── PixelWorld.js  # 2D grid management & simulation loop
│   ├── Renderer.js    # Canvas rendering
│   └── Engine.js      # Main simulation loop
│
└── materials/         # All material types
    ├── Material.js           # Base abstract class
    ├── MaterialRegistry.js   # Material factory/registry
    ├── EarthBase.js          # Base for earth-like materials
    ├── Air.js                # Empty space
    ├── Water.js              # Liquid physics + vaporization
    ├── Stone.js              # Solid, heavy material
    ├── EarthDry.js           # Dry earth (absorbs water)
    ├── EarthWet.js           # Wet earth (spreads moisture + vaporization)
    ├── Seed.js               # Plant seed (germinates on wet earth)
    ├── RootDry.js            # Dry root (absorbs water, spawns new roots)
    ├── RootWet.js            # Wet root (transfers water upward/sideways)
    ├── StemDry.js            # Dry stem (receives water from below)
    └── StemWet.js            # Wet stem (grows with directional momentum)
```

### Key Design Patterns

#### 1. **Material Inheritance Hierarchy**
```
Material (abstract base)
├── Air
├── Water
├── Stone
├── EarthBase (shared earth logic)
│   ├── EarthDry
│   └── EarthWet
├── Seed
├── RootDry
├── RootWet
├── StemDry
├── StemWet
└── [Future materials...]
```

#### 2. **State Management**
Materials can have internal state:
- **Basic states**: `justLanded`, `hasSpread`
- **Cooldown states**: `cooldown`, `spawnCooldown`
- **Directional states**: `preferredDirection` (for directional growth)
- **Custom states** for new materials

#### 3. **Physics Lifecycle**
Each frame for each pixel:
1. `update(x, y, world)` is called
2. Material checks what's below/around it
3. Material decides to:
   - Move (swap with another pixel)
   - Transform (change its material type)
   - Interact (affect neighboring pixels)
   - Stay still

## 🎮 Implemented Features

### Basic Materials
- **Air**: Empty space, no physics
- **Water**:
  - Flows left/right, falls through air
  - Absorbed by dry earth in all 4 directions with probabilities:
    - 80% below, 50% sides (left/right), 20% above
  - Vaporizes slowly (0.033% per tick)
  - Slides off plant materials
- **Stone**: Heavy solid, falls through air and water, stops on earth/stone
- **Earth (Dry)**: Falls through air/water, absorbs water → becomes wet, slides off pillars
- **Earth (Wet)**: Same as dry, spreads moisture in all 4 directions (80% below, 50% sides, 20% above), vaporizes slowly (0.017% per tick)

### Plant Growth System ✅ COMPLETE

#### Seed Material
- Falls through air and water (has gravity)
- Germinates when landing on wet earth
- Transformation: seed → stem (above), wet earth → root (below)
- Stays dormant on dry earth or stone

#### Root System (RootDry + RootWet)

**RootDry:**
- Searches for water/wet earth in all 4 directions
- **30% chance** to absorb water: wet earth → dry earth, root becomes wet
- **30% chance** to absorb pure water: water → air, root becomes wet
- **Absorption cooldown**: 30 ticks between consumption attempts
- Spawns new roots with smart logic:
  - Only spawns in earth cells (left, right, bottom - not top)
  - Prevents squares: new root must have ≤1 root neighbor
  - Cooldown: 30 ticks between spawns
  - Both parent and child start with cooldown
- Preserves spawn cooldown when becoming wet

**RootWet:**
- Transfers water with priority system:
  - Priority 0 (highest): Top cell (stem or root above)
  - Priority 1: Left or right (random choice)
  - Never transfers downward
- Becomes dry after water transfer
- Preserves spawn cooldown when becoming dry

#### Stem System (StemDry + StemWet)

**StemDry:**
- Waits for water from wet root/stem below
- Receives water and becomes StemWet
- Tracks `preferredDirection` for growth momentum
- Preserves direction when transforming

**StemWet:**
- **Vertical growth only:**
  - Grows straight upward when water is available
  - No lateral branching or directional momentum
  - Creates simple vertical stalks
- **Smart growth:**
  - Only grows into air cells
  - Prevents squares: new stem must have ≤1 stem neighbor
  - Growth cooldown: 15 ticks between growth
- Becomes dry after spawning new stem above

### Physics Systems

#### Vaporization System
- **Water**: 0.033% chance per tick to evaporate → air
- **Wet Earth**: 0.017% chance per tick to dry → dry earth
- Creates natural water cycle
- 30x slower than original design for better balance

#### Growth Cooldown System
- Prevents instant/explosive growth
- **Root spawn cooldown**: 30 ticks between new root spawns
- **Root absorption cooldown**: 30 ticks between water consumption attempts
- **Stem growth**: 15 ticks between growth cycles
- Cooldowns preserved across transformations (dry ↔ wet)

#### Square Prevention Algorithm
Both roots and stems use neighbor counting:
```javascript
countNeighbors(x, y, world) {
  // Check all 4 directions
  // Count how many neighbors of same type
  // Only allow spawn if count ≤ 1
  // Prevents closed loops and thick growth
}
```

## 🔧 Implementation Details

### Plant Growth Cycle

**Full growth sequence:**
```
1. Seed lands on wet earth
2. Seed → StemDry (above), wet earth → RootDry (below)
3. RootDry finds wet earth/water
4. RootDry → RootWet, spawns new RootDry (if cooldown ready)
5. RootWet transfers water upward to StemDry
6. StemDry → StemWet
7. StemWet grows new StemDry in weighted direction
8. Pattern repeats, creating branching plant structure
```

### Water Flow Through Plant
```
Wet Earth/Water → RootDry (absorb)
                     ↓
                 RootWet (transfer up)
                     ↓
                 StemDry (receive)
                     ↓
                 StemWet (grow)
                     ↓
              New StemDry (continues)
```

### Vertical Stem Growth Example
```
Initial stem grows up → spawns up
New stem grows up → spawns up
Continues upward → creates straight vertical stalk
Simple, predictable vertical growth pattern
```

## 🤖 AI Assistant Guidelines

When working on this project in future conversations:

### ✅ DO:
1. **Keep materials self-contained** - all logic in the material class
2. **Use inheritance** - DRY principle for shared behavior
3. **Check existing materials** - see how similar physics is implemented
4. **Test interactions** - think through edge cases (what if X touches Y?)
5. **Maintain the registry** - always update MaterialRegistry.js
6. **Preserve demo scene** - index.html is kept simple intentionally
7. **Use cooldowns** - prevent instant growth/transformations
8. **Prevent squares** - use neighbor counting for organic growth

### ❌ DON'T:
1. **Don't add physics to Pixel class** - it just holds a material
2. **Don't put material logic in PixelWorld** - it manages the grid only
3. **Don't make materials depend on each other** - use `instanceof` checks
4. **Don't break existing materials** - test that current physics still works
5. **Don't over-engineer** - start simple, add complexity only when needed
6. **Don't forget cooldowns** - always preserve cooldowns across transformations

### 🔍 When Debugging:
1. Check if material is falling when it shouldn't (or vice versa)
2. Check if swapping is working correctly
3. Check if state flags are being reset properly
4. Check if instanceof checks are correct (import the right classes!)
5. Check cooldown preservation across transformations
6. Test edge cases: corners, edges of grid, multiple materials
7. Watch for infinite growth loops

### 📝 Common Patterns:

**Falling through materials:**
```javascript
const belowPixel = world.getPixel(x, y + 1);
if (belowPixel.material instanceof Air) {
  world.swapPixels(x, y, x, y + 1);
  return true;
}
```

**Density-based displacement:**
```javascript
if (belowMaterial.density < this.density) {
  world.swapPixels(x, y, x, y + 1);
  return true;
}
```

**Material transformation with cooldown preservation:**
```javascript
if (neighborPixel.material instanceof TargetMaterial) {
  const newMaterial = new NewMaterial();
  newMaterial.cooldown = 15;
  newMaterial.spawnCooldown = this.spawnCooldown; // PRESERVE!
  world.setMaterial(x, y, newMaterial);
  return true;
}
```

**Neighbor counting (square prevention):**
```javascript
countNeighbors(x, y, world) {
  const directions = [
    { x: x, y: y - 1 }, { x: x, y: y + 1 },
    { x: x - 1, y: y }, { x: x + 1, y: y }
  ];
  let count = 0;
  for (const dir of directions) {
    if (dir.x < 0 || dir.x >= world.width ||
        dir.y < 0 || dir.y >= world.height) continue;
    const pixel = world.getPixel(dir.x, dir.y);
    if (pixel.material.name === 'TargetType') count++;
  }
  return count;
}
```

**Weighted random selection:**
```javascript
const candidates = [
  { option: 'up', weight: 0.6 },
  { option: 'left', weight: 0.2 },
  { option: 'right', weight: 0.2 }
];
const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
let random = Math.random() * totalWeight;
let chosen = candidates[0];
for (const candidate of candidates) {
  random -= candidate.weight;
  if (random <= 0) {
    chosen = candidate;
    break;
  }
}
```

## 🌱 Plant System Design Decisions

### Why Separate Dry/Wet States?
- **Visibility**: Players can see water flowing through plant
- **Gameplay**: Creates interesting feedback loop
- **Realism**: Mimics real plant water transport (xylem)
- **Debugging**: Easy to see where water is stuck

### Why Growth Cooldowns?
- **Performance**: Prevents exponential growth lag
- **Visibility**: Players can observe growth happening
- **Balance**: Makes plant growth feel natural, not instant
- **Control**: Easy to tune growth speed

### Why Vertical-Only Stems?
- **Simplicity**: Easy to understand and predict growth
- **Realism**: Mimics grass, reeds, and straight-growing plants
- **Clarity**: Clear visual representation of water flow
- **Performance**: Simpler logic, faster updates

### Why Square Prevention?
- **Organic look**: Thin branches feel more plant-like
- **Performance**: Prevents solid mass of plant material
- **Gameplay**: Roots/stems spread farther
- **Visual clarity**: Easier to see plant structure

## 🎯 Future Roadmap

### Phase 1: Enhanced Plant System (Next)
- **Leaves** → sprout from stems, different color
- **Flowers** → grow from mature stems, produce seeds
- **Fruit** → contains seeds, can be harvested
- **Death mechanics** → plants decay without water
- **Seasonal changes** → growth rates vary

### Phase 2: Environmental Systems
- **Fire** → burns plants, spreads to adjacent flammable materials
- **Sand** → falls like earth but through water (lower density)
- **Lava** → flows slowly, burns everything, cools to stone
- **Ice/Steam** → water phase changes based on temperature

### Phase 3: Advanced Features
- **Temperature system** → affects all materials
- **Chemical reactions** → materials combine to create new ones
- **Ecosystem dynamics** → plants consume nutrients from earth
- **Multi-cell organisms** → creatures made of multiple pixels

### Phase 4: Optimization
- Spatial partitioning (quadtree) for large grids
- Update only "active" regions (dirty rectangles)
- Multi-threaded simulation (Web Workers)
- GPU acceleration (WebGL compute shaders)

## 🎨 UI Integration

The demo scene (`index.html`) is kept simple intentionally:
- It's for testing and demonstration
- Will NOT be migrated to future production versions
- Material buttons are auto-generated from MaterialRegistry
- Keep it minimal - no complex UI logic here

## 📚 Key Files to Understand

For AI assistants, these are the most important files to read:

1. **js/materials/Material.js** - Base class, all materials extend this
2. **js/materials/RootDry.js** - Complex example: water absorption, spawning, cooldowns
3. **js/materials/StemWet.js** - Complex example: directional growth, weighted selection
4. **js/core/PixelWorld.js** - Grid management, simulation loop
5. **js/materials/MaterialRegistry.js** - How materials are registered

## 🔄 Simulation Flow

```
1. Engine starts → calls world.step() each frame
2. PixelWorld.step():
   - Iterates through grid (bottom to top, left to right)
   - For each pixel: pixel.update(x, y, world)
3. Material.update():
   - Decrements cooldowns
   - Checks surroundings
   - Applies physics
   - Returns true if changed
4. Renderer draws the grid to canvas
```

## 🧪 Testing New Materials

When adding a material:
1. Create small test areas in the demo
2. Test interactions with each existing material
3. Test edge cases (corners, borders)
4. Test state changes (if any)
5. Watch for unexpected behavior over time
6. Test cooldown behavior
7. Test transformation chains (dry → wet → dry)

## 📊 Performance Considerations

Current optimizations:
- Bottom-to-top iteration (gravity falls naturally)
- Early returns in update() when no action needed
- Cooldowns prevent excessive transformations
- Square prevention limits growth density

When adding features:
- Avoid nested loops where possible
- Cache neighbor lookups
- Use early returns
- Consider cooldowns for expensive operations

## 📖 Russian Summary (Краткое описание)

Этот проект - дискретный симулятор частиц с полной системой роста растений. Каждый пиксель - материал (воздух, вода, земля, камень, части растений).

**Система роста растений:**
- Семена прорастают на влажной земле
- Корни ищут воду с 30% вероятностью поглощения, растут с задержкой
- Стебли растут прямо вверх (вертикально)
- Вода течёт через корни к стеблям
- Вода распространяется во все 4 направления (80% вниз, 50% в стороны, 20% вверх)
- Предотвращение квадратов для органичного роста

**Главная философия**: легко добавлять новые материалы, легко исправлять ошибки взаимодействия, каждый материал самодостаточен.

---

**Remember**: The goal is maintainability and extensibility. Keep it simple, keep it clear, keep it modular. The plant system demonstrates how complex emergent behavior can arise from simple, well-designed material rules.
