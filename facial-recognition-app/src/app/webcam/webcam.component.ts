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

  constructor() {}

  async ngAfterViewInit() {
    await tf.setBackend('webgl');

    await faceapi.nets.tinyFaceDetector.loadFromUri('/assets/models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('/assets/models');
    await faceapi.nets.faceRecognitionNet.loadFromUri('/assets/models');
    await faceapi.nets.faceExpressionNet.loadFromUri('/assets/models');
    await faceapi.nets.ageGenderNet.loadFromUri('/assets/models');
    this.startVideo();
  }

  startVideo() {
    navigator.mediaDevices.getUserMedia({ video: {} })
      .then(stream => {
        const video = this.videoElement.nativeElement;
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          video.play();
          this.onPlay();
        };
      })
      .catch(err => console.error('Error accessing webcam: ', err));
  }

  async onPlay() {
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;

    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
      const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks().withFaceDescriptors().withFaceExpressions().withAgeAndGender();

      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
      faceapi.draw.drawDetections(canvas, resizedDetections);
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
      faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

      resizedDetections.forEach((detection: { detection?: any; age?: any; gender?: any; }) => {
        const { age, gender } = detection;
        const box = detection.detection.box;
        const drawBox = new faceapi.draw.DrawBox(box, {
          label: `${Math.round(age)} years old ${gender}`
        });
        drawBox.draw(canvas);
      });
    }, 100);
  }
}
