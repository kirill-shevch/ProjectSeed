# Recent Changes & Improvements

This document details all recent changes made to the ProjectSeed simulation engine, including bug fixes, feature enhancements, and new mechanics.

---

## Table of Contents
1. [Cloud System Improvements](#cloud-system-improvements)
2. [Bloom & Flower System Fixes](#bloom--flower-system-fixes)
3. [Seed Physics Enhancement](#seed-physics-enhancement)
4. [Flower Gradient Coloring](#flower-gradient-coloring)
5. [Water Source Enhancement](#water-source-enhancement)
6. [Display Configuration](#display-configuration)

---

## Cloud System Improvements

### Water Production
**File:** `js/materials/Cloud.js:31-34`

**Change:** Adjusted water spawning mechanics for better balance

**Details:**
- Water spawn chance: **0.15%** per tick (was 0.1%)
- Spawn chance is 3x higher than before to compensate for larger, sparser clouds
- Water spawning is **independent of duplication** - does not prevent cloud from duplicating in the same update
- When water spawns, it replaces the cloud pixel and falls normally

**Technical Implementation:**
```javascript
// 2. Spawn water (0.15% chance)
if (Math.random() < 0.0015) {
  world.setMaterial(x, y, new Water());
}
```

### Duplication Logic Overhaul
**File:** `js/materials/Cloud.js:10-90`

**Problem Solved:** Clouds were duplicating endlessly because new clouds started with cooldown = 0, causing immediate duplication on their first update.

**Changes:**
1. **Initial Cooldown:** New clouds start with `duplicationCooldown = 20` instead of 0
   - Prevents immediate duplication after spawning
   - Creates natural growth rate

2. **Duplication Chance Decay:** Each duplication reduces chance by **0.5%**
   - Parent cloud: loses 0.5%
   - Child cloud: spawns with parent's chance - 0.5%
   - Results in ~200 generations before reaching 0%

3. **Fail State:** Clouds now **disappear** when duplication fails or no space available
   - **Success + Space:** Duplicates and continues
   - **Success + No Space:** Disappears (tried to duplicate but couldn't)
   - **Failed Roll:** Disappears immediately
   - This creates natural cloud lifecycle and prevents infinite accumulation

**Technical Flow:**
```javascript
constructor(duplicationChance = 100) {
  this.duplicationChance = duplicationChance; // Starts at 100%
  this.duplicationCooldown = 20; // Start with cooldown
}

update(x, y, world) {
  // Cooldown countdown
  if (this.duplicationCooldown > 0) {
    this.duplicationCooldown--;
    return false;
  }

  // Reset cooldown for next attempt
  this.duplicationCooldown = 20;

  // Roll against duplication chance
  const roll = Math.random() * 100;

  if (roll < this.duplicationChance) {
    // Try to duplicate
    if (canDuplicate) {
      spawnNewCloud(this.duplicationChance - 0.5);
      this.duplicationChance -= 0.5;
      return true;
    } else {
      // No space - disappear
      world.setMaterial(x, y, new Air());
      return true;
    }
  }

  // Failed roll - disappear
  world.setMaterial(x, y, new Air());
  return true;
}
```

**Result:** Clouds now have natural lifecycles - they grow, produce rain, and eventually dissipate.

---

## Bloom & Flower System Fixes

### Bloom Watering Detection
**File:** `js/materials/StemWet.js:247-252`

**Problem:** Blooms were getting stuck with `waterCounter: 0/12` forever. The issue was that `findNearbyBloom()` was skipping all adjacent positions (including diagonals), preventing stems from detecting blooms that were diagonally nearby.

**Fix:** Modified `findNearbyBloom()` to only skip **cardinal directions** (up, down, left, right) that are already checked by `findAdjacentBlooms()`, but include **diagonal positions** in the search.

**Before:**
```javascript
// Skipped ALL adjacent cells (including diagonals)
if (Math.abs(checkX - x) <= 1 && Math.abs(checkY - y) <= 1 &&
    (checkX !== x || checkY !== y)) {
  continue;
}
```

**After:**
```javascript
// Skip only cardinally adjacent (already checked by findAdjacentBlooms)
// But DON'T skip diagonals - they need to be detected for water routing
if ((checkX === x && Math.abs(checkY - y) === 1) ||
    (checkY === y && Math.abs(checkX - x) === 1)) {
  continue;
}
```

**Result:** Stems can now detect diagonally-adjacent blooms and route water upward to reach them, ensuring all blooms receive water properly.

### Flower Rendering Fix
**File:** `js/materials/Bloom.js:124-127`

**Problem:** The farthest column of the flower pattern was missing the center pixel, creating a visible gap in the circular flower shape.

**Fix:** Added the missing center pixel to Step 10 of the flower pattern generation.

**Before:**
```javascript
// Step 10: above and below pointer (missing center!)
positions.push({ x: pointerX, y: pointerY - 1 });
positions.push({ x: pointerX, y: pointerY + 1 });
```

**After:**
```javascript
// Step 10: above, center, and below pointer (completes the circle)
positions.push({ x: pointerX, y: pointerY - 1 });
positions.push({ x: pointerX, y: pointerY });     // CENTER!
positions.push({ x: pointerX, y: pointerY + 1 });
```

**Result:** Flowers now render as complete circles with no gaps.

### Debug Logging Removal
**Files:** `js/materials/Bloom.js`, `js/materials/StemWet.js`

**Removed:**
- `Bloom.js:22-24` - Periodic bloom status logging
- `Bloom.js:28` - Bloom flowering logging
- `StemWet.js:43` - Watering bloom logging
- `StemWet.js:56` - Nearby bloom detection logging

**Result:** Clean console output with no debug spam.

---

## Seed Physics Enhancement

### Dual Falling Modes
**File:** `js/materials/Seed.js:14-74`, `js/materials/Flower.js:35`

**Feature:** Seeds now have two distinct falling behaviors depending on their origin.

**Purpose:**
- **User-placed seeds:** Fall straight down for accurate planting
- **Flower-spawned seeds:** Use diagonal falling for natural distribution

**Implementation:**

#### Constructor Changes
```javascript
export class Seed extends Material {
  constructor(useDiagonalFalling = false) {
    super('Seed', '#9b7653', 3);
    this.useDiagonalFalling = useDiagonalFalling;
    // Choose diagonal direction: 50% left, 50% right
    this.diagonalDirection = Math.random() < 0.5 ? -1 : 1;
  }
}
```

#### Falling Behavior
**Straight Mode** (default, `useDiagonalFalling = false`):
- 100% vertical falling
- Falls straight down every tick
- Used for manually placed seeds

**Diagonal Mode** (`useDiagonalFalling = true`):
- **33% chance** per tick to move diagonally (left or right based on `diagonalDirection`)
- **67% chance** per tick to fall straight down
- When blocked diagonally: flips direction and falls straight
- When hitting world boundary: flips direction and falls straight

**Example Fall Pattern (Diagonal Mode):**
```
Tick 1: down (67% roll)
Tick 2: down (67% roll)
Tick 3: down-right (33% roll, direction = +1)
Tick 4: down (67% roll)
Tick 5: down-right (33% roll)
Tick 6: [blocked by obstacle] flip direction, down
Tick 7: down-left (33% roll, direction = -1)
Tick 8: down (67% roll)
```

**Usage:**
```javascript
// User placing seed manually (MaterialRegistry)
new Seed(); // Falls straight

// Flower producing seed
new Seed(true); // Falls diagonally for distribution
```

**Result:** Players can plant seeds with precision, while flower-produced seeds naturally spread to create new plants in different locations.

---

## Flower Gradient Coloring

### Position-Based Color System
**Files:**
- `js/materials/Material.js:30`
- `js/core/Pixel.js:27`
- `js/core/Renderer.js:29`
- `js/materials/Flower.js:9-94`
- `js/materials/Bloom.js:68,73`

**Feature:** Flowers now have beautiful gradient coloring based on their position relative to the flower center.

### System Architecture

**1. Rendering Pipeline Update**

Extended the color system to support position-based colors:

```javascript
// Material.js
getColor(x, y) {
  return this.color;
}

// Pixel.js
getColor(x, y) {
  return this.material.getColor(x, y);
}

// Renderer.js
render(world) {
  for (let y = 0; y < world.height; y++) {
    for (let x = 0; x < world.width; x++) {
      const pixel = world.getPixel(x, y);
      const color = pixel.getColor(x, y); // Pass coordinates
      // ... render with color
    }
  }
}
```

**2. Flower Class Enhancement**

Each flower pixel stores the center position of the flower (bloom location):

```javascript
export class Flower extends Material {
  constructor(centerX = 0, centerY = 0) {
    super('Flower', '#FF69B4', 3);
    this.centerX = centerX; // Center of the flower
    this.centerY = centerY;
    this.baseColor = '#FF69B4'; // Pink for first phase
  }
}
```

**3. Gradient Calculation**

The `getColor(x, y)` method calculates brightness based on:

- **Horizontal Distance:** `dx = Math.abs(x - centerX)`
- **Vertical Position:** `dy = y - centerY` (positive = below center, negative = above)

**Gradient Formula:**
```javascript
// Distance factor: farther from center = slightly lighter
const distanceFactor = (dx + Math.abs(dy)) / 8;

// Vertical factor: above = lighter, below = darker
const verticalFactor = -dy / 4;

// Total brightness adjustment (-0.5 to +0.5)
const brightness = Math.max(-0.5, Math.min(0.5,
  distanceFactor * 0.3 + verticalFactor * 0.4
));
```

**4. Color Application**

```javascript
applyBrightness(hexColor, factor) {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  const adjust = (value) => {
    if (factor > 0) {
      // Brighten: move towards 255
      return Math.round(value + (255 - value) * factor);
    } else {
      // Darken: move towards 0
      return Math.round(value * (1 + factor));
    }
  };

  const newR = Math.max(0, Math.min(255, adjust(r)));
  const newG = Math.max(0, Math.min(255, adjust(g)));
  const newB = Math.max(0, Math.min(255, adjust(b)));

  return `#${newR.toString(16).padStart(2, '0')}...`;
}
```

### Color Phases

**Phase 1: Pink (timer 1000-501)**
- Base color: `#FF69B4` (Hot Pink)
- Top pixels: Lighter pink
- Bottom pixels: Darker pink
- Center pixels: Medium pink

**Phase 2: Green (timer 500-0)**
- Base color: `#2F4F2F` (Dark Green)
- Top pixels: Lighter green
- Bottom pixels: Darker green
- Center pixels: Medium green

**When timer reaches 500:**
```javascript
if (this.timer === 500) {
  this.baseColor = '#2F4F2F'; // Dark green for second phase
  return true;
}
```

The gradient calculation automatically applies to whichever `baseColor` is current.

### Bloom Integration

When bloom spawns flowers, it passes the center coordinates:

```javascript
// Bloom.js:62-73
spawnFlower(x, y, world) {
  // ... determine direction ...
  const pattern = this.generateFlowerPattern(x, y, direction);

  // Spawn flower pixels with center coordinates
  for (const pos of pattern) {
    // ...
    world.setMaterial(pos.x, pos.y, new Flower(x, y));
  }

  // Transform bloom itself to flower (center of the flower)
  world.setMaterial(x, y, new Flower(x, y));
}
```

**Visual Result:**
- Flowers have natural depth and dimension
- Bottom (near stem) appears darker
- Top (reaching upward) appears lighter
- Creates realistic, organic appearance
- Both pink and green phases use the same gradient system

---

## Water Source Enhancement

### Side Spawning
**File:** `js/materials/WaterSource.js:19-63`

**Problem:** Water sources placed on solid ground would stop producing water once the space below was filled or blocked.

**Solution:** Added fallback spawning on left/right sides when bottom is blocked.

**Logic Flow:**

```javascript
update(x, y, world) {
  // Decrement cooldown
  if (this.spawnCooldown > 0) {
    this.spawnCooldown--;
    return false;
  }

  // PRIORITY 1: Try to spawn below
  const yBelow = y + 1;
  if (yBelow < world.height) {
    const belowPixel = world.getPixel(x, yBelow);

    // Only spawn below if it's Air (not Water or solid)
    if (belowPixel && belowPixel.material instanceof Air) {
      world.setMaterial(x, yBelow, new Water());
      this.spawnCooldown = 16;
      return true;
    }
  }

  // PRIORITY 2: Try to spawn on sides
  const sides = [
    { x: x - 1, y: y }, // left
    { x: x + 1, y: y }  // right
  ];

  // Shuffle sides to randomize which one we try first
  if (Math.random() < 0.5) {
    sides.reverse();
  }

  for (const side of sides) {
    if (side.x >= 0 && side.x < world.width) {
      const sidePixel = world.getPixel(side.x, side.y);
      if (sidePixel && sidePixel.material instanceof Air) {
        world.setMaterial(side.x, side.y, new Water());
        this.spawnCooldown = 16;
        return true;
      }
    }
  }

  // Can't spawn anywhere (completely blocked)
  return false;
}
```

**Key Details:**
- **Below check:** Only spawns if Air (prevents spam when Water already present)
- **Side randomization:** 50% chance to check left first, 50% for right
- **Air-only spawning:** Won't overwrite existing Water pixels
- **Cooldown:** 16 ticks between spawns (same for all directions)

**Use Cases:**
1. **Water source on solid ground:** Spawns water sideways, creates horizontal flow
2. **Water source mid-air:** Spawns water below normally
3. **Water source in corner:** Spawns in available direction
4. **Completely surrounded:** Waits until space opens up

**Result:** Water sources are now much more versatile and useful for creating water features anywhere in the world.

---

## Display Configuration

### Screen Height Increase
**File:** `index.html:97`

**Change:** Increased world height for more vertical space

**Before:**
```javascript
const WIDTH = 120;
const HEIGHT = 80;
const PIXEL_SIZE = 6;
```

**After:**
```javascript
const WIDTH = 120;
const HEIGHT = 128; // 1.6x higher (was 80)
const PIXEL_SIZE = 6;
```

**Calculation:**
- Old height: 80 pixels
- New height: 128 pixels
- Multiplier: 128 / 80 = 1.6x
- Canvas size: 120 × 128 = 15,360 pixels
- Rendered size: 720px × 768px (at 6px per pixel)

**Benefit:** More vertical space for:
- Taller plants
- Multi-level building with Badrock platforms
- Deeper water features
- More complex cloud formations

---

## Summary of Impact

### Performance
- **Cloud system:** Natural lifecycle prevents infinite accumulation
- **Bloom detection:** Diagonal check allows proper water routing
- **Render efficiency:** Position-based colors calculated on-the-fly (no precomputation needed)

### Gameplay
- **Seed planting:** Precise placement for manual seeds, natural spreading for flower seeds
- **Flower aesthetics:** Beautiful gradients create visual depth
- **Water features:** Water sources can be placed anywhere and still function
- **Vertical space:** 60% more height for complex builds

### Code Quality
- **Removed debug spam:** Clean console output
- **Position-based rendering:** Extensible system for future gradient materials
- **Clear separation:** User seeds vs. flower seeds have distinct behaviors
- **Robust water detection:** Bloom watering works in all configurations

---

## Migration Notes

### For Existing Saves
- **Cloud behavior:** Existing clouds will use new disappearing logic on next duplication attempt
- **Seed falling:** Saved seeds will fall straight (default mode)
- **Flower colors:** Existing flowers will use gradient (centerX/Y default to 0, 0)
- **Water sources:** Will start using side-spawning immediately
- **Screen size:** Save files with old dimensions (120×80) will load into new dimensions (120×128), may have visual shifts

### Backward Compatibility
All changes are backward compatible with existing save files. New features activate automatically without requiring manual migration.

---

**Last Updated:** 2025-11-30
**Document Version:** 1.0
