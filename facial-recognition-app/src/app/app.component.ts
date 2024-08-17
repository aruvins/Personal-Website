import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WebcamModule } from './app.module';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, WebcamModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'facial-recognition-app';
}
