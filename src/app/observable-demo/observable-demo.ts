import { Component, OnDestroy, signal } from '@angular/core';
import { interval, map, Subscription } from 'rxjs';

interface StreamEvent {
  tick: number;
  message: string;
  createdAt: string;
}

@Component({
  selector: 'app-observable-demo',
  imports: [],
  templateUrl: './observable-demo.html',
  styleUrl: './observable-demo.css',
})
export class ObservableDemo implements OnDestroy {
  protected readonly isRunning = signal(false);
  protected readonly latestEvent = signal<StreamEvent | null>(null);
  protected readonly eventLog = signal<StreamEvent[]>([]);

  private streamSubscription: Subscription | undefined;

  protected readonly codeSample = `const stream$ = interval(1000).pipe(
  map((tick) => ({
    tick: tick + 1,
    message: 'Observable emitted a new value',
    createdAt: new Date().toLocaleTimeString(),
  })),
);

this.subscription = stream$.subscribe((event) => {
  this.latestEvent.set(event);
  this.eventLog.update((events) => [event, ...events].slice(0, 6));
});`;

  ngOnDestroy() {
    this.stopStream();
  }

  protected startStream() {
    if (this.streamSubscription) {
      return;
    }

    const stream$ = interval(1000).pipe(
      map((tick) => ({
        tick: tick + 1,
        message: 'Observable emitted a new value',
        createdAt: new Date().toLocaleTimeString(),
      })),
    );

    this.isRunning.set(true);
    this.streamSubscription = stream$.subscribe((event) => {
      this.latestEvent.set(event);
      this.eventLog.update((events) => [event, ...events].slice(0, 6));
    });
  }

  protected stopStream() {
    this.streamSubscription?.unsubscribe();
    this.streamSubscription = undefined;
    this.isRunning.set(false);
  }

  protected resetStream() {
    this.stopStream();
    this.latestEvent.set(null);
    this.eventLog.set([]);
  }
}
