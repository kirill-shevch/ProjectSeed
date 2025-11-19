import { EarthBase } from './EarthBase.js';

/**
 * Dry Earth material - absorbs water, affected by gravity
 */
export class EarthDry extends EarthBase {
  constructor() {
    super('EarthDry', '#8b5a2b', 4);
  }
}

