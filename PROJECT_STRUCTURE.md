# Pixel Physics Engine - Project Structure & Guidelines

## 🎯 Project Philosophy

**Primary Goal**: Create a maintainable, extensible particle simulation system where:
- Adding new materials is **simple and intuitive**
- Fixing interaction bugs is **straightforward**
- The codebase supports **unlimited material types**
- Each material's behavior is **self-contained and clear**

## 📖 What This Project Is

A **discrete particle simulator** where every pixel on the screen represents a material (air, water, earth, stone, etc.). The simulation runs in discrete time steps:

1. Each frame, the grid is updated
2. Each material has its own logic for:
   - How gravity affects it
   - How it interacts with neighboring cells
3. Pixels can have **internal states** (e.g., "just landed", "has spread moisture")
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
    ├── Water.js              # Liquid physics
    ├── Stone.js              # Solid, heavy material
    ├── EarthDry.js           # Dry earth (absorbs water)
    └── EarthWet.js           # Wet earth (spreads moisture)
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
└── [Future materials...]
```

#### 2. **State Management**
Materials can have internal state:
- `justLanded` - tracks when a falling particle stops
- `hasSpread` - prevents moisture from spreading multiple times
- Custom states for new materials

#### 3. **Physics Lifecycle**
Each frame for each pixel:
1. `update(x, y, world)` is called
2. Material checks what's below/around it
3. Material decides to:
   - Move (swap with another pixel)
   - Transform (change its material type)
   - Interact (affect neighboring pixels)
   - Stay still

## 🔧 How to Add a New Material

### Step 1: Create Material Class

```javascript
// js/materials/YourMaterial.js
import { Material } from './Material.js';

export class YourMaterial extends Material {
  constructor() {
    super('YourMaterial', '#FF0000', density);
    // Add any state you need
    this.yourState = false;
  }

  hasGravity() {
    return true; // or false
  }

  update(x, y, world) {
    // 1. Try to fall (if has gravity)
    // 2. Check interactions with neighbors
    // 3. Apply state-based logic
    // 4. Return true if anything changed
    return false;
  }
}
```

### Step 2: Register in MaterialRegistry

```javascript
// js/materials/MaterialRegistry.js
import { YourMaterial } from './YourMaterial.js';

this.materials = {
  // ... existing materials
  'your_material': {
    class: YourMaterial,
    name: 'Display Name',
    color: '#FF0000',
    borderColor: '#CC0000'
  }
};
```

### Step 3: That's It!
The system automatically:
- Creates the button in the UI
- Handles drawing/placing
- Runs update logic each frame

## 🎮 Current Features

### Materials
- **Air**: Empty space, no physics
- **Water**: Flows left/right, falls through air, absorbed by dry earth
- **Stone**: Heavy solid, falls through air and water, stops on earth/stone
- **Earth (Dry)**: Falls through air/water, absorbs water → becomes wet, slides off pillars
- **Earth (Wet)**: Same as dry, but spreads moisture to nearby dry earth

### Physics
- ✅ Gravity simulation
- ✅ Density-based interactions (heavy sinks through light)
- ✅ Material transformations (dry earth + water → wet earth)
- ✅ Anti-pillar logic (50% chance to slide off narrow pillars)
- ✅ State-based single-fire events

## 🌱 Future Roadmap

### Phase 1: Plant System (Next)

**Goal**: Seeds grow into plants with roots, stems, and leaves

#### New Material Types Needed:
1. **Seed** - starting cell
   - State: `hasGrown`
   - Needs: adjacent earth + water nearby
   - Action: divides into Root + Stem

2. **Root** - grows downward into earth
   - State: `age`, `hasWater`
   - Behavior: searches for water, absorbs it
   - Growth: spreads down/sideways in earth

3. **Stem** - grows upward
   - State: `age`, `height`
   - Behavior: grows up from seed position
   - Growth: extends upward if root has water

4. **Leaf** - grows from stem
   - State: `age`
   - Behavior: sprouts from stem at intervals
   - Growth: extends left/right from stem

#### Implementation Strategy:
```javascript
// Example: Seed.js
class Seed extends Material {
  constructor() {
    super('Seed', '#8B4513', 3);
    this.hasGrown = false;
    this.ticksSinceCheck = 0;
  }

  update(x, y, world) {
    if (this.hasGrown) return false;
    
    // Check every N ticks
    if (++this.ticksSinceCheck < 30) return false;
    this.ticksSinceCheck = 0;

    // Check for earth below and water nearby
    if (this.canGrow(x, y, world)) {
      this.sprout(x, y, world);
      this.hasGrown = true;
      return true;
    }
    return false;
  }

  canGrow(x, y, world) {
    // Check earth below
    const below = world.getPixel(x, y + 1);
    if (!(below.material instanceof EarthDry || below.material instanceof EarthWet)) {
      return false;
    }

    // Check for water nearby (within radius)
    return this.hasWaterNearby(x, y, world, 3);
  }

  sprout(x, y, world) {
    // Create root below
    world.setMaterial(x, y + 1, new Root());
    // Transform self into stem
    world.setMaterial(x, y, new Stem());
  }
}
```

### Phase 2: Advanced Features (Later)
- Fire/burning
- Sand (falls like earth but through water)
- Lava (flows, burns things)
- Ice (freezes water)
- Steam (water → steam when heated)

### Phase 3: Optimization (When needed)
- Spatial partitioning for large grids
- Update only "active" regions
- Multi-threaded simulation

## 🤖 AI Assistant Guidelines

When working on this project in future conversations:

### ✅ DO:
1. **Keep materials self-contained** - all logic in the material class
2. **Use inheritance** - DRY principle for shared behavior
3. **Check existing materials** - see how similar physics is implemented
4. **Test interactions** - think through edge cases (what if X touches Y?)
5. **Maintain the registry** - always update MaterialRegistry.js
6. **Preserve demo scene** - index.html is kept simple intentionally

### ❌ DON'T:
1. **Don't add physics to Pixel class** - it just holds a material
2. **Don't put material logic in PixelWorld** - it manages the grid only
3. **Don't make materials depend on each other** - use `instanceof` checks
4. **Don't break existing materials** - test that current physics still works
5. **Don't over-engineer** - start simple, add complexity only when needed

### 🔍 When Debugging:
1. Check if material is falling when it shouldn't (or vice versa)
2. Check if swapping is working correctly
3. Check if state flags are being reset properly
4. Check if instanceof checks are correct (import the right classes!)
5. Test edge cases: corners, edges of grid, multiple materials

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

**Material transformation:**
```javascript
if (belowPixel.material instanceof Water) {
  world.setMaterial(x, y, new NewMaterial());
  return true;
}
```

**Neighbor checking:**
```javascript
for (let dx = -1; dx <= 1; dx++) {
  for (let dy = -1; dy <= 1; dy++) {
    if (dx === 0 && dy === 0) continue;
    const neighbor = world.getPixel(x + dx, y + dy);
    // ... check neighbor
  }
}
```

## 🎨 UI Integration

The demo scene (`index.html`) is kept simple intentionally:
- It's for testing and demonstration
- Will NOT be migrated to future production versions
- Material buttons are auto-generated from MaterialRegistry
- Keep it minimal - no complex UI logic here

## 📚 Key Files to Understand

For AI assistants, these are the most important files to read:

1. **js/materials/Material.js** - Base class, all materials extend this
2. **js/materials/EarthBase.js** - Example of shared behavior base class
3. **js/core/PixelWorld.js** - Grid management, simulation loop
4. **js/materials/MaterialRegistry.js** - How materials are registered

## 🔄 Simulation Flow

```
1. Engine starts → calls world.step() each frame
2. PixelWorld.step():
   - Iterates through grid (bottom to top)
   - For each pixel: pixel.update(x, y, world)
3. Material.update():
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

## 📖 Russian Summary (Краткое описание)

Этот проект - дискретный симулятор частиц. Каждый пиксель соответствует материалу (воздух, вода, земля, камень). Каждый шаг симуляции обновляет сетку - для каждого материала определена логика гравитации и взаимодействия с соседями. 

Главная философия: **легко добавлять новые материалы, легко исправлять ошибки взаимодействия**.

Следующий шаг: система роста растений (семена → корни → стебли → листья).

---

**Remember**: The goal is maintainability and extensibility. Keep it simple, keep it clear, keep it modular.

