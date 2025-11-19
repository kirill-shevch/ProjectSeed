/**
 * Engine - manages the simulation loop
 */
export class Engine {
  constructor(world, renderer) {
    this.world = world;
    this.renderer = renderer;
    this.running = true;
    this.animationFrameId = null;
  }

  /**
   * Start the engine loop
   */
  start() {
    const loop = () => {
      if (this.running) {
        this.world.step();
      }
      this.renderer.render(this.world);
      this.animationFrameId = requestAnimationFrame(loop);
    };
    
    loop();
  }

  /**
   * Stop the engine loop
   */
  stop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Toggle pause/resume
   */
  togglePause() {
    this.running = !this.running;
    return this.running;
  }

  /**
   * Check if the engine is running
   * @returns {boolean}
   */
  isRunning() {
    return this.running;
  }
}

