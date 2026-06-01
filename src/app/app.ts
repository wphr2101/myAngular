import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink} from '@angular/router';
import { Nations } from "./nations/nations";
import { Inputform } from './inputform/inputform';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.css'
})

export class App {
  protected readonly title = signal('myAngular');
}

const routes = [
  { path: 'nation', component: Nations },
  { path: 'inputform', component: Inputform }
];