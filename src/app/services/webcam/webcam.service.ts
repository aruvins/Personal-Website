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
      this.videoElement.playsInline = true;
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
    try {
      this.model = await blazeface.load();
      console.log('BlazeFace model loaded');
    } catch (error) {
      console.error('Error loading BlazeFace model: ', error);
    }
  }

  public async detectFaces(): Promise<blazeface.NormalizedFace[]> {
    if (this.model && this.videoElement) {
      try {
        const predictions = await this.model.estimateFaces(this.videoElement, false);
        return predictions;
      } catch (error) {
        console.error('Error detecting faces: ', error);
        return [];
      }
    }
    console.warn('BlazeFace model or video element not available');
    return [];
  }
}
