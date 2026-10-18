import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from './account/auth-service';
import { Router, NavigationEnd, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})

export class App implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  ngOnInit() { this.auth.refresh().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(); }
  private readonly router = inject(Router);
  protected readonly inLogistics = toSignal(this.router.events.pipe(
    filter(event => event instanceof NavigationEnd),
    map(() => {
      let route = this.router.routerState.snapshot.root.firstChild;
      while (route) {
        if (route.data['area'] === 'logistics') return true;
        route = route.firstChild;
      }
      return false;
    }),
  ), { initialValue: false });
  protected readonly currentYear = new Date().getFullYear();
}
