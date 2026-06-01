import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Nations } from './nations';

describe('Nations', () => {
  let component: Nations;
  let fixture: ComponentFixture<Nations>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Nations],
    }).compileComponents();

    fixture = TestBed.createComponent(Nations);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
