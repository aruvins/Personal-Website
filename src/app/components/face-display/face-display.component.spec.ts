import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FaceDisplayComponent } from './face-display.component';

describe('FaceDisplayComponent', () => {
  let component: FaceDisplayComponent;
  let fixture: ComponentFixture<FaceDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FaceDisplayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FaceDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
