import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebcamService {
  private videoElement: HTMLVideoElement | null = null;
  private streamSubject = new BehaviorSubject<MediaStream | null>(null);

  constructor() { }

  public initVideoStream(): Observable<MediaStream | null> {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        this.videoElement = document.createElement('video');
        this.videoElement.srcObject = stream;
        this.videoElement.autoplay = true;
        this.streamSubject.next(stream);
      })
      .catch(error => {
        console.error('Error accessing webcam: ', error);
        this.streamSubject.next(null);
      });

    return this.streamSubject.asObservable();
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
