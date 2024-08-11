import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebcamComponent } from '../app/components/webcam/webcam.component';

@NgModule({
  declarations: [WebcamComponent],
  imports: [
    CommonModule
  ],
  exports: [WebcamComponent]  // Export if needed in other modules
})
export class WebcamModule { }
