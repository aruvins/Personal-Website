import * as blazeface from '@tensorflow-models/blazeface';
import * as tf from '@tensorflow/tfjs';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { WebcamService } from '../../services/webcam/webcam.service';

@Component({
  selector: 'app-webcam',
  templateUrl: './webcam.component.html',
  styleUrls: ['./webcam.component.css']
})
export class WebcamComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  public videoStream: MediaStream | null = null;
  public faces: blazeface.NormalizedFace[] = [];
  public isVideoRunning: boolean = false;
  private shouldDetectFaces: boolean = false;

  constructor(private webcamService: WebcamService) { }

  async ngOnInit(): Promise<void> {
    this.videoStream = await this.webcamService.initVideoStream();
    // await this.webcamService.loadModel();
    // this.detectFaces();
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
    await this.webcamService.loadModel();
    if (this.videoStream && this.videoElement) {
      this.videoElement.nativeElement.srcObject = this.videoStream;
      this.videoElement.nativeElement.play();
    }
    this.isVideoRunning = true;
    this.shouldDetectFaces = true;
    this.detectFaces();
  }

  private stopVideo(): void {
    // this.shouldDetectFaces = false; // Stop face detection
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
    }
    this.isVideoRunning = false;
    // this.faces = [];

    if (this.videoElement) {
      this.videoElement.nativeElement.srcObject = null;
    }
  }

  private async detectFaces(): Promise<void> {
    while (this.videoStream) {
      this.faces = await this.webcamService.detectFaces();
      this.drawFaces();
      await tf.nextFrame();
    }
    this.updateCanvasSize();
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
  
        // Calculate adjusted dimensions
        const boxWidth = (bottomRight[0] - topLeft[0]) * scaleX;
        const boxHeight = (bottomRight[1] - topLeft[1]) * scaleY;
        const marginWidth = 70;
        const marginHeight = -20; // Margin to make box narrower
        const adjustedWidth = boxWidth - marginWidth;
        const adjustedHeight = boxHeight - marginHeight;
  
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'blue';
        ctx.rect(
          topLeft[0] * scaleX + marginWidth / 2,
          topLeft[1] * scaleY + marginHeight / 2,
          adjustedWidth,
          adjustedHeight
        );
        ctx.stroke();
      });
    }
  }
  


  private updateCanvasSize(): void {
  const canvas = document.getElementById('overlay') as HTMLCanvasElement;
  if (canvas && this.videoElement) {
    canvas.width = this.videoElement.nativeElement.videoWidth;
    canvas.height = this.videoElement.nativeElement.videoHeight;
  }
}

  
  private initVideoElement(): void {
    if (this.videoElement) {
      this.videoElement.nativeElement.autoplay = true;
      this.videoElement.nativeElement.playsInline = true;
    }
  }
}
