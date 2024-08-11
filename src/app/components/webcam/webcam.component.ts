import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { WebcamService } from '../../services/webcam/webcam.service';
import { FacialRecognitionService } from '../../services/facial-recognition.service';

@Component({
  selector: 'app-webcam',
  templateUrl: './webcam.component.html',
  styleUrls: ['./webcam.component.css']
})
export class WebcamComponent implements AfterViewInit {
  @ViewChild('videoElement', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;
  public videoStream: MediaStream | null = null;
  streamSubscription: any;

  constructor(
    private webcamService: WebcamService,
    private facialRecognitionService: FacialRecognitionService
  ) { }

  async ngAfterViewInit(): Promise<void> {
    const stream = await this.webcamService.initVideoStream().toPromise();
  
    if (stream) {
      this.videoStream = stream;
      this.videoElement.nativeElement.srcObject = stream;
  
      // Wait for video to be ready
      this.videoElement.nativeElement.onloadedmetadata = async () => {
        await this.facialRecognitionService.loadModel();
        this.setupCanvas(); // Add this line to initialize canvas size
        this.detectFaces();
      };
    } else {
      this.videoStream = null;
      console.error('Failed to initialize video stream');
    }
  }
  
  setupCanvas(): void {
    const video = this.videoElement.nativeElement;
    const canvas = document.getElementById('overlay') as HTMLCanvasElement;
  
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  }
  
  async startStream(): Promise<void> {
    this.streamSubscription = (await this.webcamService.initVideoStream()).subscribe(stream => {
      this.videoStream = stream;
      if (this.videoElement && this.videoElement.nativeElement) {
        this.videoElement.nativeElement.srcObject = stream;
      }
    });
  }

  stopStream(): void {
    this.webcamService.stopVideoStream();
    if (this.videoElement && this.videoElement.nativeElement) {
      this.videoElement.nativeElement.srcObject = null;
    }
  }

  async detectFaces(): Promise<void> {
    const video = this.videoElement.nativeElement;
    if (video.readyState === 4) {
      const faces = await this.facialRecognitionService.detectFaces(video);
      this.drawFaces(faces);
    }
    requestAnimationFrame(() => this.detectFaces());
  }

  drawFaces(faces: any): void {
    const canvas = document.getElementById('overlay') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
  
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
  
      // Draw a test rectangle
      ctx.beginPath();
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.rect(50, 50, 100, 100);
      ctx.stroke();
  
      // Now draw detected faces
      faces.forEach((face: any) => {
        const start = face.topLeft;
        const end = face.bottomRight;
        const size = [end[0] - start[0], end[1] - start[1]];
  
        ctx.beginPath();
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.rect(start[0], start[1], size[0], size[1]);
        ctx.stroke();
  
        // Display additional information (if any)
        ctx.font = '18px Arial';
        ctx.fillStyle = 'red';
        ctx.fillText('Face', start[0], start[1] - 10);
      });
    } else {
      console.error('Unable to get canvas context');
    }
  }
  
  
}
