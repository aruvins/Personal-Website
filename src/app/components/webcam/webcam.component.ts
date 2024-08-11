import { Component, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { WebcamService } from '../../services/webcam/webcam.service';

@Component({
  selector: 'app-webcam',
  standalone: true,
  templateUrl: './webcam.component.html',
  styleUrls: ['./webcam.component.css']
})
export class WebcamComponent implements OnInit, OnDestroy {
  public videoStream: MediaStream | null = null;
  private streamSubscription: any;

  @ViewChild('videoElement', { static: false }) videoElementRef!: ElementRef<HTMLVideoElement>;

  constructor(private webcamService: WebcamService) { }

  async ngOnInit(): Promise<void> {
    this.streamSubscription = (await this.webcamService.initVideoStream()).subscribe(stream => {
      this.videoStream = stream;
    });
  }

  ngOnDestroy(): void {
    this.stopStream();
    if (this.streamSubscription) {
      this.streamSubscription.unsubscribe();
    }
  }

  async startStream(): Promise<void> {
    this.streamSubscription = (await this.webcamService.initVideoStream()).subscribe(stream => {
      this.videoStream = stream;
      if (this.videoElementRef && this.videoElementRef.nativeElement) {
        this.videoElementRef.nativeElement.srcObject = stream;
      }
    });
  }

  stopStream(): void {
    this.webcamService.stopVideoStream();
    if (this.videoElementRef && this.videoElementRef.nativeElement) {
      this.videoElementRef.nativeElement.srcObject = null;
    }
  }
}
