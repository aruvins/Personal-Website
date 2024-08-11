import { Component, NgModule } from '@angular/core';
import { RouterOutlet } from '@angular/router';
// import { WebcamComponent } from './components/webcam/webcam.component';
import { WebcamModule } from './app.module';
import { BrowserModule } from '@angular/platform-browser';
// import { AppModule } from './app.module';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, WebcamModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'webcam-facial-recognition';
}
