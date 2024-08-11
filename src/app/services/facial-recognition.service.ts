import { Injectable } from '@angular/core';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';

@Injectable({
  providedIn: 'root'
})
export class FacialRecognitionService {
  private model: blazeface.BlazeFaceModel | null = null;

  constructor() { }

  async loadModel(): Promise<void> {
    this.model = await blazeface.load();
    console.log('BlazeFace model loaded');
  }

  async detectFaces(video: HTMLVideoElement): Promise<blazeface.NormalizedFace[]> {
    if (!this.model) {
      throw new Error('Model not loaded');
    }

    const predictions = await this.model.estimateFaces(video, false);
    return predictions;
  }
}
