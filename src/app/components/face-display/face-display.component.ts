import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-face-display',
  standalone: true,
  templateUrl: './face-display.component.html',
  styleUrls: ['./face-display.component.css']
})
export class FaceDisplayComponent implements OnInit {
  @Input() faces: any[] = [];

  constructor() { }

  ngOnInit(): void {
  }
}
