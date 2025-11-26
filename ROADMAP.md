# ProjectSeed - Implementation Roadmap

This document contains the detailed specifications for upcoming features to be implemented in the Pixel Physics Engine.

## 🎯 Priority Todo List

### 1. ⬛ Badrock Material
**Purpose**: Immovable platform for building vertical levels

**Behavior**:
- No gravity - stays in place
- Nothing passes through it (acts like world borders)
- Impassable by all materials
- User can draw it

**Technical Details**:
- Density: 999 (very high)
- Color: Dark gray (#222222 or similar - solid, unbreakable appearance)
- `hasGravity()`: false
- `update()`: returns false (never changes)

---

### 2. 💧 Water Source Material
**Purpose**: Infinite water generator for creating water features

**Behavior**:
- Spawns water pixel **below itself** every 4 ticks
- Only works if below is Air or Water
- If below is not Air/Water - waits until space is available
- Water source itself never moves

**Technical Details**:
- Color: Same as regular Water (#3fa9f5)
- Has spawn cooldown counter (4 ticks)
- No gravity - stays in place
- Check below: if Air, spawn Water; if Water, do nothing (water already there)
- If Stone/Earth/etc below, no spawn

---

### 3. ☁️ Cloud Material
**Purpose**: Temporary floating clouds that spawn rain

**Behavior**:

#### Duplication Mechanics
- Cloud starts with **100% duplication chance** when first created
- Every **20 ticks**, attempts duplication:
  - Roll against current duplication chance
  - **If successful**: Creates new cloud in random direction:
    - 35% chance: Left
    - 35% chance: Right
    - 15% chance: Top
    - 15% chance: Bottom
  - Both parent and child clouds get `parentChance - 3%`
  - **If failed**: Original cloud disappears
- Can only duplicate into **Air** pixels (cardinal directions only)

#### Water Spawning
- Every tick: **3% chance** to spawn Water on its own position
- Spawned water **falls through cloud pixels** (cloud and water swap positions)
- Water falls normally after passing through cloud layer

#### Physics
- No gravity - floats in place
- When water is on top of cloud, they swap positions
- Color: Light gray (#CCCCCC or similar)

**Technical Details**:
- State: `duplicationChance` (starts at 100, decreases by 3 each generation)
- State: `duplicationCooldown` (20 ticks between attempts)
- Every tick: 3% chance to spawn water at own position
- When water pixel is above cloud, swap positions
- Duplication only into Air in 4 cardinal directions

**Example Lifecycle**:
```
1. Cloud A (100%) spawns at position
2. After 20 ticks: duplicates → Cloud B (97%)
3. Cloud A now also 97%
4. After 20 more ticks: both try to duplicate (97% chance each)
5. Eventually clouds reach low % and start disappearing
6. Creates temporary rain clouds that grow and dissipate
```

---

### 4. 🌸 Bloom/Flower System
**Purpose**: Complete plant lifecycle with flowering and seed production

This is the most complex feature, broken into several parts:

#### 4.1 Bloom Spawning Conditions
- Bloom can only spawn from **StemWet** that is **12+ pixels tall**
- Height measured from root/seed origin upward
- **20% chance** to spawn bloom when conditions met
- Bloom spawns on **left or right** side of stem (random)
- Only one bloom pixel spawned initially

#### 4.2 Bloom Water Accumulation
- Bloom starts as **single pixel** attached to stem
- **Does NOT prioritize** over leaves (leaves keep their 40% chance)
- Bloom has internal `waterCounter` (starts at 0, max 12)
- When adjacent StemWet gives water: `waterCounter++`
- Bloom tracks water but doesn't change visually until counter reaches 12

**Technical Details**:
- Initial color: Pink (#FF69B4 or similar)
- State: `waterCounter` (0-12)
- Remains single pixel until waterCounter === 12

#### 4.3 Flower Growth Pattern (Instant Spawn)
When `waterCounter` reaches 12, bloom **instantly spawns all flower pixels** in one update cycle.

**Spawn Pattern**:
```
Starting position: Bloom attached to stem (left or right)

Bloom spawns 11 Flower pixels in this pattern (all at once):
1. Place flower pixel on opposite side of stem (pointer)
2. Place pixel above and below pointer
3. Move pointer left/right (away from stem)
4. Place 2 pixels above and 2 below pointer (vertical line of 4)
5. Move pointer left/right
6. Place 2 pixels above and 2 below pointer (vertical line of 4)
7. Move pointer left/right
8. Place 2 pixels above and 2 below pointer (vertical line of 4)
9. Move pointer left/right
10. Place pixel above and below pointer

Then Bloom transforms itself into Flower (12th pixel)
Result: 12 independent Flower pixels in circle-like structure
```

**Visual Example**:
```
     F F F
   F       F
   F   F   F    (S = stem, F = flower pixels, all independent)
   F       F
     F F F
```

**Spawn Rules**:
- Can spawn into: **Air** or **Leaf** (replaces leaf)
- **Cannot** spawn into: Stem, Root, Earth, Water, Stone, Badrock, etc.
- If any position is blocked: **SKIP that pixel** (partial flower is okay)
- All spawning happens in one update cycle (not sequential)
- Bloom transforms to Flower after spawning others

**Technical Details**:
- Bloom state: `waterCounter` (0-12) only
- When waterCounter === 12: Bloom.update() spawns all flowers at once
- No growth steps, no coordination needed
- Each spawned Flower starts with timer = 1000

#### 4.4 Flower Material (Independent Pixels)
After bloom spawns flowers, each Flower pixel is **completely independent**.

**Flower Behavior**:
- Each flower pixel has `timer` starting at **1000 ticks**
- No gravity - stays in place
- Timer decrements each tick
- At `timer === 500`: Color changes to **dark green** (#2F4F2F or similar)
- At `timer === 0`: Each pixel **independently**:
  - **10% chance**: Becomes Seed
  - **90% chance**: Becomes Air (flower disappears)

**Technical Details**:
- Material name: `Flower` (single material type)
- State: `timer` (1000 → 0)
- Initial color: Pink (#FF69B4)
- Aged color (timer ≤ 500): Dark green (#2F4F2F)
- `hasGravity()`: false
- Each flower pixel acts independently - no coordination
- Seeds created have gravity and fall normally

---

### 5. 🌰 Seed Sliding on Leaves
**Purpose**: Seeds slide off leaves naturally

**Behavior**:
- When seed lands on leaf, check diagonal down positions
- If bottom-left or bottom-right is free (Air): slide to that position
- Similar to earth's anti-pillar sliding mechanic
- Random choice if both diagonals are free

**Technical Details**:
- Modify `Seed.js` update logic
- Check if below is LeafDry or LeafWet
- If yes, attempt diagonal slide before staying still
- Helps seeds fall through canopy to ground

---

### 6. 💾 Save/Load System
**Purpose**: Persist world state between sessions

**Requirements**:
- Save entire world state to **localStorage**
- Use **JSON format** for serialization
- Single save slot (can expand to multiple later)
- Save includes:
  - Grid dimensions (width, height)
  - Every pixel's material type
  - Every pixel's internal state (counters, cooldowns, flags)

**UI Integration**:
- Add "Save" button to interface
- Add "Load" button to interface
- Optional: "Clear" confirmation before load

**Technical Details**:
- Serialize: Convert PixelWorld grid to JSON
  - Material name/type for each pixel
  - Internal state variables
- Deserialize: Recreate materials from JSON
  - Use MaterialRegistry to instantiate correct classes
  - Restore state variables
- Storage key: `pixelPhysics_saveData` or similar

**JSON Structure Example**:
```json
{
  "version": "1.0",
  "width": 400,
  "height": 400,
  "pixels": [
    {"x": 0, "y": 0, "material": "Air", "state": {}},
    {"x": 1, "y": 0, "material": "Water", "state": {}},
    {"x": 2, "y": 0, "material": "Bloom", "state": {"waterCounter": 5, "timer": 1000}}
  ]
}
```

**Future Scaling**:
- JSON format works for future non-browser implementations
- Can add versioning for backward compatibility
- Can compress for large worlds

---

## 📋 Implementation Order

Recommended order based on complexity and dependencies:

1. **Badrock** - Simplest, no dependencies (5 min)
2. **Water Source** - Simple, standalone (20 min)
3. **Seed Sliding** - Small modification to existing Seed (5 min)
4. **Cloud** - Moderate complexity, standalone (1-2 hours)
5. **Bloom Material** - Water accumulation counter (30 min)
6. **Flower Material** - Independent timer-based pixels (30 min)
7. **Bloom → Flower spawning** - Pattern-based spawning logic (1 hour)
8. **Save/Load System** - Infrastructure feature (2-3 hours)

**Total estimated time: 6-9 hours**

---

## 🎨 Color Palette

| Material | Color | Hex Code (Suggested) |
|----------|-------|---------------------|
| Badrock | Dark gray | #222222 |
| Water Source | Blue (same as water) | #3fa9f5 |
| Cloud | Light gray | #CCCCCC |
| Bloom (initial) | Pink | #FF69B4 |
| Flower (fresh) | Pink | #FF69B4 |
| Flower (aged) | Dark green | #2F4F2F |

---

## 🧪 Testing Checklist

### Badrock
- [ ] Badrock doesn't fall
- [ ] Water can't pass through badrock
- [ ] Earth stops on badrock
- [ ] Seeds stop on badrock
- [ ] Can build platforms

### Water Source
- [ ] Spawns water below every 4 ticks
- [ ] Stops working if blocked by stone/earth
- [ ] Works correctly when stacked vertically
- [ ] Creates infinite water column

### Cloud
- [ ] Clouds float (no gravity)
- [ ] Clouds duplicate and spread
- [ ] Duplication chance decreases properly
- [ ] Clouds disappear when chance fails
- [ ] Spawns water that falls through cloud
- [ ] Water swaps with cloud when above

### Bloom/Flower
- [ ] Bloom only spawns on stems 12+ pixels tall
- [ ] Bloom accumulates water counter (0-12)
- [ ] When counter reaches 12, bloom spawns all flowers instantly
- [ ] Spawning skips blocked positions (partial flowers okay)
- [ ] Flowers can replace leaves during spawning
- [ ] Each flower has independent timer (1000 ticks)
- [ ] Flower color changes at timer = 500
- [ ] Flowers produce seeds at 10% rate when timer = 0
- [ ] Seeds slide off leaves

### Save/Load
- [ ] Save captures entire world state
- [ ] Load restores world exactly
- [ ] Material states preserved (counters, timers)
- [ ] Works after refresh
- [ ] JSON is valid and readable

---

## 💡 Design Notes

### Why these features?
- **Badrock**: Enables level design, vertical gameplay
- **Water Source**: QoL for testing, creative mode features
- **Cloud**: Dynamic weather, temporary water supply
- **Bloom/Flower**: Completes plant lifecycle, adds visual beauty
- **Save/Load**: Essential for complex scenes and experimentation

### Balance Considerations
- Cloud duplication rate creates temporary rain bursts
- Flower seed production (10%) prevents overpopulation
- Bloom height requirement (12 pixels) rewards tall plants
- Instant flower spawning creates satisfying visual "blooming" effect
- Each flower ages independently, creating natural variety

---

## 🔧 Implementation Details

### Badrock Implementation
```javascript
// js/materials/Badrock.js
export class Badrock extends Material {
  constructor() {
    super('Badrock', '#222222', 999); // Very high density
  }
  hasGravity() { return false; }
  update(x, y, world) { return false; } // Never changes
}
```

### Water Source Implementation
```javascript
// js/materials/WaterSource.js
export class WaterSource extends Material {
  constructor() {
    super('WaterSource', '#3fa9f5', 999); // Same color as water
    this.spawnCooldown = 0;
  }

  hasGravity() { return false; }

  update(x, y, world) {
    if (this.spawnCooldown > 0) {
      this.spawnCooldown--;
      return false;
    }

    const below = world.getPixel(x, y + 1);
    if (!below) return false;

    // Only spawn if below is Air
    if (below.material instanceof Air) {
      world.setMaterial(x, y + 1, new Water());
      this.spawnCooldown = 4;
      return true;
    }

    // If below is Water, we're done (water already there)
    return false;
  }
}
```

### Cloud Implementation
```javascript
// js/materials/Cloud.js
export class Cloud extends Material {
  constructor(duplicationChance = 100) {
    super('Cloud', '#CCCCCC', 0); // Zero density (floats)
    this.duplicationChance = duplicationChance;
    this.duplicationCooldown = 0;
  }

  hasGravity() { return false; }

  update(x, y, world) {
    // 1. Check if water is above us - swap positions
    const above = world.getPixel(x, y - 1);
    if (above && above.material instanceof Water) {
      world.swapPixels(x, y, x, y - 1);
      return true;
    }

    // 2. Spawn water (3% chance)
    if (Math.random() < 0.03) {
      world.setMaterial(x, y, new Water());
      return true;
    }

    // 3. Handle duplication
    if (this.duplicationCooldown > 0) {
      this.duplicationCooldown--;
      return false;
    }

    this.duplicationCooldown = 20;

    // Try to duplicate
    const roll = Math.random() * 100;
    if (roll < this.duplicationChance) {
      // Success - spawn new cloud
      const directions = [
        { x: x - 1, y: y, weight: 0.35 }, // left
        { x: x + 1, y: y, weight: 0.35 }, // right
        { x: x, y: y - 1, weight: 0.15 }, // top
        { x: x, y: y + 1, weight: 0.15 }  // bottom
      ];

      // Weighted random selection
      const target = this.weightedRandom(directions);
      const targetPixel = world.getPixel(target.x, target.y);

      if (targetPixel && targetPixel.material instanceof Air) {
        const newCloud = new Cloud(this.duplicationChance - 3);
        world.setMaterial(target.x, target.y, newCloud);

        // This cloud also loses 3%
        this.duplicationChance -= 3;
      }

      return true;
    } else {
      // Failed - disappear
      world.setMaterial(x, y, new Air());
      return true;
    }
  }

  weightedRandom(options) {
    const total = options.reduce((sum, opt) => sum + opt.weight, 0);
    let random = Math.random() * total;

    for (const option of options) {
      random -= option.weight;
      if (random <= 0) return option;
    }

    return options[0];
  }
}
```

### Bloom Implementation
```javascript
// js/materials/Bloom.js
export class Bloom extends Material {
  constructor() {
    super('Bloom', '#FF69B4', 3); // Pink
    this.waterCounter = 0;
  }

  hasGravity() { return false; }

  update(x, y, world) {
    // Check if we've accumulated enough water
    if (this.waterCounter >= 12) {
      this.spawnFlower(x, y, world);
      return true;
    }

    return false;
  }

  spawnFlower(x, y, world) {
    // Determine which side of stem we're on
    const leftPixel = world.getPixel(x - 1, y);
    const rightPixel = world.getPixel(x + 1, y);

    // Check which side has the stem
    const stemOnLeft = leftPixel && (leftPixel.material.name === 'StemDry' || leftPixel.material.name === 'StemWet');
    const stemOnRight = rightPixel && (rightPixel.material.name === 'StemDry' || rightPixel.material.name === 'StemWet');

    // Determine spawn direction (away from stem)
    const direction = stemOnLeft ? 1 : -1; // 1 = right, -1 = left

    // Spawn pattern (11 additional flowers)
    const pattern = this.generateFlowerPattern(x, y, direction);

    for (const pos of pattern) {
      const pixel = world.getPixel(pos.x, pos.y);
      if (pixel && (pixel.material instanceof Air ||
                     pixel.material.name === 'LeafDry' ||
                     pixel.material.name === 'LeafWet')) {
        world.setMaterial(pos.x, pos.y, new Flower());
      }
    }

    // Transform bloom itself to flower
    world.setMaterial(x, y, new Flower());
  }

  generateFlowerPattern(centerX, centerY, direction) {
    // Pattern creates circle-like structure
    const positions = [];
    let pointerX = centerX + direction;
    let pointerY = centerY;

    // Step 1: opposite side of stem
    positions.push({ x: pointerX, y: pointerY });

    // Step 2: above and below pointer
    positions.push({ x: pointerX, y: pointerY - 1 });
    positions.push({ x: pointerX, y: pointerY + 1 });

    // Step 3: move pointer
    pointerX += direction;

    // Step 4: vertical line (2 above, 2 below)
    positions.push({ x: pointerX, y: pointerY - 2 });
    positions.push({ x: pointerX, y: pointerY - 1 });
    positions.push({ x: pointerX, y: pointerY + 1 });
    positions.push({ x: pointerX, y: pointerY + 2 });

    // Step 5: move pointer
    pointerX += direction;

    // Step 6: vertical line (2 above, 2 below)
    positions.push({ x: pointerX, y: pointerY - 2 });
    positions.push({ x: pointerX, y: pointerY - 1 });
    positions.push({ x: pointerX, y: pointerY + 1 });
    positions.push({ x: pointerX, y: pointerY + 2 });

    // Step 7: move pointer
    pointerX += direction;

    // Step 8: vertical line (2 above, 2 below)
    positions.push({ x: pointerX, y: pointerY - 2 });
    positions.push({ x: pointerX, y: pointerY - 1 });
    positions.push({ x: pointerX, y: pointerY + 1 });
    positions.push({ x: pointerX, y: pointerY + 2 });

    // Step 9: move pointer
    pointerX += direction;

    // Step 10: above and below pointer
    positions.push({ x: pointerX, y: pointerY - 1 });
    positions.push({ x: pointerX, y: pointerY + 1 });

    return positions;
  }
}
```

### Flower Implementation
```javascript
// js/materials/Flower.js
export class Flower extends Material {
  constructor() {
    super('Flower', '#FF69B4', 3); // Pink initially
    this.timer = 1000;
  }

  hasGravity() { return false; }

  update(x, y, world) {
    // Decrement timer
    this.timer--;

    // Change color at halfway point
    if (this.timer === 500) {
      this.color = '#2F4F2F'; // Dark green
      return true;
    }

    // At timer = 0, become seed or air
    if (this.timer <= 0) {
      if (Math.random() < 0.1) {
        // 10% chance: become seed
        world.setMaterial(x, y, new Seed());
      } else {
        // 90% chance: disappear
        world.setMaterial(x, y, new Air());
      }
      return true;
    }

    return false;
  }

  getColor() {
    return this.color; // Dynamic color based on timer
  }
}
```

### StemWet Modification (to water Bloom)
```javascript
// In StemWet.js tryTransferToLeaf method
// Add Bloom to the candidates alongside LeafDry

const dryLeafCandidates = [];
const bloomCandidates = [];

for (const dir of directions) {
  // ... existing checks ...

  const pixel = world.getPixel(dir.x, dir.y);
  if (pixel.material instanceof LeafDry) {
    dryLeafCandidates.push(dir);
  }
  if (pixel.material instanceof Bloom) {
    bloomCandidates.push(dir);
  }
}

// If there are bloom candidates, water them (same 40% chance)
if (bloomCandidates.length > 0 && Math.random() < 0.4) {
  const chosen = bloomCandidates[Math.floor(Math.random() * bloomCandidates.length)];
  const bloomPixel = world.getPixel(chosen.x, chosen.y);
  bloomPixel.material.waterCounter++;

  // This stem becomes dry
  const newStemDry = new StemDry(this.preferredDirection);
  newStemDry.cooldown = 15;
  world.setMaterial(x, y, newStemDry);

  return true;
}
```

### StemDry/StemWet Modification (to spawn Bloom)
```javascript
// In StemDry.js or StemWet.js
// Add method to check stem height and spawn bloom

checkAndSpawnBloom(x, y, world) {
  // Measure height by counting stem pixels downward
  let height = 0;
  let checkY = y;

  while (checkY < world.height) {
    const pixel = world.getPixel(x, checkY);
    if (pixel && (pixel.material.name === 'StemDry' ||
                   pixel.material.name === 'StemWet')) {
      height++;
      checkY++;
    } else {
      break;
    }
  }

  // If height >= 12 and 20% chance
  if (height >= 12 && Math.random() < 0.2) {
    // Try to spawn bloom on left or right
    const directions = [
      { x: x - 1, y: y },
      { x: x + 1, y: y }
    ];

    const chosen = directions[Math.floor(Math.random() * directions.length)];
    const targetPixel = world.getPixel(chosen.x, chosen.y);

    if (targetPixel && targetPixel.material instanceof Air) {
      world.setMaterial(chosen.x, chosen.y, new Bloom());
      return true;
    }
  }

  return false;
}
```

### Seed Modification (slide off leaves)
```javascript
// In Seed.js update method
// After checking if can't fall, try to slide off leaves

const belowPixel = world.getPixel(x, y + 1);
if (belowPixel && (belowPixel.material.name === 'LeafDry' ||
                    belowPixel.material.name === 'LeafWet')) {
  // Try to slide diagonally
  const diagonals = [
    { x: x - 1, y: y + 1 },
    { x: x + 1, y: y + 1 }
  ];

  const validSlides = diagonals.filter(pos => {
    const pixel = world.getPixel(pos.x, pos.y);
    return pixel && pixel.material instanceof Air;
  });

  if (validSlides.length > 0) {
    const chosen = validSlides[Math.floor(Math.random() * validSlides.length)];
    world.swapPixels(x, y, chosen.x, chosen.y);
    return true;
  }
}
```

---

**Document created**: 2025-11-26
**Document updated**: 2025-11-26
**Status**: Ready for implementation
**Architecture**: All features maintain independent pixel model
**Next session**: Start with Badrock material
