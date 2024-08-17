import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebcamComponent } from '../app/webcam/webcam.component';

@NgModule({
  declarations: [WebcamComponent],
  imports: [
    CommonModule
  ],
  exports: [WebcamComponent]
})
export class WebcamModule { }