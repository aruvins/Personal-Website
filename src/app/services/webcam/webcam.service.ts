import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import * as tf from '@tensorflow/tfjs';
import { FaceLandmarksDetection, FaceLandmarksDetectionModel } from '@tensorflow-models/face-landmarks-detection';

@Injectable({
  providedIn: 'root'
})
export class WebcamService {
  private videoElement: HTMLVideoElement | null = null;
  private streamSubject = new BehaviorSubject<MediaStream | null>(null);
  private model: FaceLandmarksDetectionModel | null = null;

  constructor() { }

  public async initVideoStream(): Promise<Observable<MediaStream | null>> {
    await tf.ready(); // Ensure TensorFlow.js is ready
    this.model = await FaceLandmarksDetection.load(
      FaceLandmarksDetection.SupportedPackages.mediapipeFacemesh
    );

    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        this.videoElement = document.createElement('video');
        this.videoElement.srcObject = stream;
        this.videoElement.autoplay = true;
        this.streamSubject.next(stream);
        this.detectFaces();
      })
      .catch(error => {
        console.error('Error accessing webcam: ', error);
        this.streamSubject.next(null);
      });

    return this.streamSubject.asObservable();
  }

  private async detectFaces() {
    if (!this.videoElement || !this.model) return;

    const video = this.videoElement;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return;

    video.addEventListener('loadeddata', async () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      while (true) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const predictions = await this.model.estimateFaces({
          input: canvas
        });

        if (predictions.length > 0) {
          this.drawFaceBoxes(predictions, context);
        }

        await new Promise(r => setTimeout(r, 100)); // Adjust the frame rate as needed
      }
    });
  }

  private drawFaceBoxes(predictions: any[], context: CanvasRenderingContext2D) {
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    context.strokeStyle = 'red';
    context.lineWidth = 2;

    predictions.forEach(prediction => {
      prediction.boundingBox.forEach((point: any, index: number) => {
        context.strokeRect(point.x, point.y, prediction.boundingBox.width, prediction.boundingBox.height);
      });
    });
  }

  public stopVideoStream(): void {
    if (this.videoElement && this.videoElement.srcObject) {
      const stream = this.videoElement.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      this.videoElement.srcObject = null;
      this.streamSubject.next(null);
    }
  }
}
