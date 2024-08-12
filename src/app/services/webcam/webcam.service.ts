import { Injectable } from '@angular/core';
import * as blazeface from '@tensorflow-models/blazeface';
import * as tf from '@tensorflow/tfjs';

@Injectable({
  providedIn: 'root'
})
export class WebcamService {
  private videoElement: HTMLVideoElement | null = null;
  private model: blazeface.BlazeFaceModel | null = null;

  constructor() { }

  public async initVideoStream(): Promise<MediaStream | null> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.videoElement = document.createElement('video');
      this.videoElement.srcObject = stream;
      this.videoElement.autoplay = true;
      this.videoElement.playsInline = true;  // For iOS Safari
      return stream;
    } catch (error) {
      console.error('Error accessing webcam: ', error);
      return null;
    }
  }

  public stopVideoStream(): void {
    if (this.videoElement && this.videoElement.srcObject) {
      const stream = this.videoElement.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      this.videoElement.srcObject = null;
    }
  }

  public async loadModel(): Promise<void> {
    this.model = await blazeface.load();
    console.log('BlazeFace model loaded');
  }

  public async detectFaces(): Promise<blazeface.NormalizedFace[]> {
    if (this.model && this.videoElement) {
      const predictions = await this.model.estimateFaces(this.videoElement, false);
      return predictions;
    }
    return [];
  }
}
