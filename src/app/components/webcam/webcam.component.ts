import * as blazeface from '@tensorflow-models/blazeface';
import * as tf from '@tensorflow/tfjs';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { WebcamService } from '../../services/webcam/webcam.service';
import { DetectedFace } from './detected-face.interface';

@Component({
  selector: 'app-webcam',
  templateUrl: './webcam.component.html',
  styleUrls: ['./webcam.component.css']
})
export class WebcamComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  public videoStream: MediaStream | null = null;
  public faces: DetectedFace[] = [];
  public isVideoRunning: boolean = false;
  private shouldDetectFaces: boolean = false;

  constructor(private webcamService: WebcamService) { }

  async ngOnInit(): Promise<void> {
    this.videoStream = await this.webcamService.initVideoStream();
    await this.webcamService.loadModels();
  }

  ngAfterViewInit(): void {
    this.initVideoElement();
  }

  ngOnDestroy(): void {
    this.stopVideo();
  }

  public async toggleVideo(): Promise<void> {
    if (this.isVideoRunning) {
      this.stopVideo();
    } else {
      await this.startVideo();
    }
  }

  private async startVideo(): Promise<void> {
    this.videoStream = await this.webcamService.initVideoStream();
    await this.webcamService.loadModels();
    if (this.videoStream && this.videoElement) {
      this.videoElement.nativeElement.srcObject = this.videoStream;
      this.videoElement.nativeElement.play();
    }
    this.isVideoRunning = true;
    this.shouldDetectFaces = true;
    this.detectFaces();
  }

  private stopVideo(): void {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
    }
    this.isVideoRunning = false;
    this.faces = [];
    if (this.videoElement) {
      this.videoElement.nativeElement.srcObject = null;
    }
  }

  private async detectFaces(): Promise<void> {
    while (this.shouldDetectFaces) {
      // Detect faces using the webcam service
      this.faces = await this.webcamService.detectFaces();
      
      // Iterate through each detected face
      for (let face of this.faces) {
        // Extract the face image tensor from the video element
        const faceImage = this.webcamService.extractFaceImage(face);
        
        // Check if faceImage is not null before proceeding
        if (faceImage) {
          try {
            // Extract embeddings using the FaceNet model
            const embedding = await this.webcamService.extractEmbedding(faceImage);
            
            // Predict age and gender using the custom model
            const ageGender = await this.webcamService.predictAgeGender(embedding);
  
            // Attach age and gender predictions to the face object
            face.age = ageGender.age;
            face.gender = ageGender.gender;
          } catch (error) {
            console.error('Error in age/gender prediction:', error);
          } finally {
            // Dispose the faceImage tensor to free memory
            faceImage.dispose();
          }
        } else {
          console.error('Failed to extract face image.');
        }
      }
  
      // Draw faces on the canvas with bounding boxes and overlays
      this.drawFaces();
  
      // Yield control to allow the browser to update the UI
      await tf.nextFrame();
    }
  }
  

  private extractFaceImage(face: blazeface.NormalizedFace): tf.Tensor {
    if (!this.videoElement) {
      throw new Error('Video element is not available');
    }
  
    const video = this.videoElement.nativeElement;
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    
    const topLeft = face.topLeft as [number, number];
    const bottomRight = face.bottomRight as [number, number];
    
    const scaleX = videoWidth / video.width;
    const scaleY = videoHeight / video.height;
  
    const x1 = topLeft[0] * scaleX;
    const y1 = topLeft[1] * scaleY;
    const x2 = bottomRight[0] * scaleX;
    const y2 = bottomRight[1] * scaleY;
  
    const faceCanvas = document.createElement('canvas');
    faceCanvas.width = x2 - x1;
    faceCanvas.height = y2 - y1;
    const ctx = faceCanvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context is not available');
    }
  
    ctx.drawImage(video, x1, y1, x2 - x1, y2 - y1, 0, 0, faceCanvas.width, faceCanvas.height);
  
    // Convert canvas to tensor
    const faceImage = tf.browser.fromPixels(faceCanvas).toFloat();
  
    // Resize to 160x160 for FaceNet and normalize
    const resizedImage = tf.image.resizeBilinear(faceImage, [160, 160]);
    const normalizedImage = resizedImage.div(127.5).sub(1);
  
    return normalizedImage;
  }
  

  private drawFaces(): void {
    const canvas = document.getElementById('overlay') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const videoElement = this.videoElement.nativeElement;
      const videoWidth = videoElement.videoWidth;
      const videoHeight = videoElement.videoHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      this.faces.forEach(face => {
        const topLeft = face.topLeft as [number, number];
        const bottomRight = face.bottomRight as [number, number];

        // Scale coordinates to match canvas size
        const scaleX = canvas.width / videoWidth;
        const scaleY = canvas.height / videoHeight;

        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'blue';
        ctx.rect(
          topLeft[0] * scaleX,
          topLeft[1] * scaleY,
          (bottomRight[0] - topLeft[0]) * scaleX,
          (bottomRight[1] - topLeft[1]) * scaleY
        );
        ctx.stroke();

        // Draw age and gender text
        if (face.age !== undefined && face.gender) {
          ctx.font = '16px Arial';
          ctx.fillStyle = 'yellow';
          ctx.fillText(
            `Age: ${face.age}, Gender: ${face.gender}`,
            topLeft[0] * scaleX,
            (topLeft[1] - 10) * scaleY
          );
        }
      });
    }
  }

  public async predictAgeGender(faceImage: tf.Tensor): Promise<{ age: number; gender: string }> {
    try {
      // Extract embeddings using FaceNet model
      const embeddings = await this.webcamService.extractEmbedding(faceImage);
  
      // Predict age and gender
      const ageGenderPredictions = await this.webcamService.predictAgeGender(embeddings);
  
      // Return the predicted values
      return ageGenderPredictions;
    } catch (error) {
      console.error('Error predicting age and gender:', error);
      return { age: -1, gender: 'unknown' }; // Default values in case of error
    }
  }
  
  

  private initVideoElement(): void {
    if (this.videoElement) {
      this.videoElement.nativeElement.autoplay = true;
      this.videoElement.nativeElement.playsInline = true;
    }
  }
}
