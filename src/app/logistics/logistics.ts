import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../account/auth-service';
import { CartStore } from '../shopping/cart-store';
import { LogisticsHelp } from '../help/logistics-help';

@Component({
  selector: 'app-logistics',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, LogisticsHelp],
  templateUrl: './logistics.html',
  styleUrl: './logistics.css',
})
export class Logistics {
  protected readonly auth = inject(AuthService);
  protected readonly cart = inject(CartStore);
}
