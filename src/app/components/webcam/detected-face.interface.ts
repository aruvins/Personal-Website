import { NormalizedFace } from '@tensorflow-models/blazeface';

export interface DetectedFace extends NormalizedFace {
  age?: number;
  gender?: string;
}
