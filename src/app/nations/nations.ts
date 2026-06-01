import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';

interface Nation {
  name: string;
  capital: string;
  flagImage: string;
  mapImage: string;
  population: number;
  gdp: number;
  hdi: number;
}

@Component({
  selector: 'app-nations',
  imports: [],
  templateUrl: './nations.html',
  styleUrl: './nations.css',
})
export class Nations implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://wphr2101.runasp.net/api/nations';

  protected readonly currentIndex = signal(0);
  protected readonly nations = signal<Nation[]>([]);
  protected readonly errorMessage = signal('');
  protected readonly isLoading = signal(true);
  protected readonly searchTerm = signal('');

  protected readonly currentNation = computed(() => {
    return this.nations()[this.currentIndex()];
  });

  ngOnInit() {
    this.loadNations();
  }

  protected searchNations(event: Event) {
    const input = event.target as HTMLInputElement;
    const result = input.value.trim();

    this.searchTerm.set(input.value);
    this.loadNations(result);
  }

  private loadNations(result = '') {
    const url = result
      ? `${this.apiUrl}/search/${encodeURIComponent(result)}`
      : this.apiUrl;

    this.isLoading.set(true);

    this.http.get<Nation[]>(url).subscribe({
      next: (nations) => {
        this.nations.set(nations);
        this.currentIndex.set(0);
        this.errorMessage.set('');
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Unable to load nations from the API.', error);
        this.errorMessage.set('Unable to load nations from the API.');
        this.isLoading.set(false);
      },
    });
  }

  protected showPreviousNation() {
    const nations = this.nations();

    if (!nations.length) {
      return;
    }

    this.currentIndex.update((currentIndex) =>
      currentIndex === 0 ? nations.length - 1 : currentIndex - 1,
    );
  }

  protected showNextNation() {
    const nations = this.nations();

    if (!nations.length) {
      return;
    }

    this.currentIndex.update((currentIndex) =>
      currentIndex === nations.length - 1 ? 0 : currentIndex + 1,
    );
  }
}
