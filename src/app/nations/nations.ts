import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { apiConfig, apiRequestOptions } from '../api.config';

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
export class Nations implements OnDestroy, OnInit {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = apiConfig.baseUrl + '/api/nations';
  private searchTimeoutId: ReturnType<typeof setTimeout> | undefined;

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

  ngOnDestroy() {
    if (this.searchTimeoutId) {
      clearTimeout(this.searchTimeoutId);
    }
  }

  protected searchNations(event: Event) {
    const input = event.target as HTMLInputElement;

    this.searchTerm.set(input.value);

    if (this.searchTimeoutId) {
      clearTimeout(this.searchTimeoutId);
    }

    this.searchTimeoutId = setTimeout(() => {
      this.loadNations(this.searchTerm().trim());
    }, 350);
  }

  protected clearSearch() {
    if (this.searchTimeoutId) {
      clearTimeout(this.searchTimeoutId);
    }

    this.searchTerm.set('');
    this.loadNations();
  }

  protected retryLoad() {
    this.loadNations(this.searchTerm().trim());
  }

  private loadNations(result = '') {
    const url = result
      ? `${this.apiUrl}/search/${encodeURIComponent(result)}`
      : this.apiUrl;

    this.isLoading.set(true);

    this.http.get<Nation[]>(url, apiRequestOptions).subscribe({
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
