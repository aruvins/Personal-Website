import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import * as faceapi from 'face-api.js';
import * as tf from '@tensorflow/tfjs';

@Component({
  selector: 'app-webcam',
  templateUrl: './webcam.component.html',
  styleUrls: ['./webcam.component.css']
})
export class WebcamComponent implements AfterViewInit {

  @ViewChild('video') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvasElement!: ElementRef<HTMLCanvasElement>;
  private videoStream: MediaStream | null = null;
  public isVideoRunning: boolean = false;

  constructor() {}

  async ngAfterViewInit() {
    await tf.setBackend('webgl');

    await faceapi.nets.tinyFaceDetector.loadFromUri('/assets/models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('/assets/models');
    await faceapi.nets.faceRecognitionNet.loadFromUri('/assets/models');
    await faceapi.nets.faceExpressionNet.loadFromUri('/assets/models');
    await faceapi.nets.ageGenderNet.loadFromUri('/assets/models');
  }

  async toggleVideo() {
    if (this.isVideoRunning) {
      this.stopVideo();
    } else {
      await this.startVideo();
      this.isVideoRunning = true;
      this.onPlay();
    }
  }

  stopVideo() {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
      this.videoStream = null;
      this.videoElement.nativeElement.srcObject = null;
      this.isVideoRunning = false;

      const canvas = this.canvasElement.nativeElement;
      const context = canvas.getContext('2d');
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }

  setupCanvas(video: HTMLVideoElement) {
    const canvas = this.canvasElement.nativeElement;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  }

  async startVideo() {
    try {
      this.videoStream = await navigator.mediaDevices.getUserMedia({ video: {} });
      const video = this.videoElement.nativeElement;
      video.srcObject = this.videoStream;

      // Ensure canvas is setup correctly when video metadata is loaded
      video.onloadedmetadata = () => {
        video.play();
        this.setupCanvas(video);
      };
    } catch (err) {
      console.error('Error accessing webcam: ', err);
    }
  }

  async onPlay() {
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;

    // Wait for the video metadata to be loaded
    video.onloadedmetadata = () => {
      const displaySize = { width: video.videoWidth, height: video.videoHeight };

      // Set canvas dimensions
      canvas.width = displaySize.width;
      canvas.height = displaySize.height;

      // Match dimensions
      faceapi.matchDimensions(canvas, displaySize);

      // Process video frames
      setInterval(async () => {
        if (this.isVideoRunning) {
          // Ensure dimensions are valid before proceeding
          if (displaySize.width > 0 && displaySize.height > 0) {
            const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
              .withFaceLandmarks()
              .withFaceDescriptors()
              .withFaceExpressions()
              .withAgeAndGender();

            const resizedDetections = faceapi.resizeResults(detections, displaySize);

            // Clear the canvas before drawing
            const context = canvas.getContext('2d');
            if (context) {
              context.clearRect(0, 0, canvas.width, canvas.height);
            }

            // Draw results
            faceapi.draw.drawDetections(canvas, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
            faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

            // Draw bounding boxes with age and gender information
            resizedDetections.forEach((detection: any) => {
              const box = detection.detection.box;
              const drawBox = new faceapi.draw.DrawBox(box, { label: `${Math.round(detection.age)} year old ${detection.gender}` });
              drawBox.draw(canvas);
            });
          } else {
            console.warn('Invalid video dimensions:', displaySize);
          }
        }
      }, 100);
    };

    // Handle any potential errors in video loading
    video.onerror = (err) => {
      console.error('Video error:', err);
    };
  }
}
