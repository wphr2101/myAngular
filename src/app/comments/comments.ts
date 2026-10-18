import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { apiConfig, apiRequestOptions } from '../api.config';

interface VisitorComment {
  name: string;
  comments: string;
}

@Component({
  selector: 'app-comments',
  imports: [],
  templateUrl: './comments.html',
  styleUrl: './comments.css',
})
export class Comments implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = apiConfig.baseUrl + '/api/inputform';
  private readonly pageSize = 3;

  protected readonly comments = signal<VisitorComment[]>([]);
  protected readonly currentPage = signal(1);
  protected readonly errorMessage = signal('');
  protected readonly isLoading = signal(true);
  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.comments().length / this.pageSize)),
  );
  protected readonly pagedComments = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.pageSize;

    return this.comments().slice(startIndex, startIndex + this.pageSize);
  });

  ngOnInit() {
    this.http.get<VisitorComment[]>(this.apiUrl, apiRequestOptions).subscribe({
      next: (comments) => {
        this.comments.set(comments);
        this.currentPage.set(1);
        this.errorMessage.set('');
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Unable to load visitor comments.', error);
        this.errorMessage.set('Unable to load visitor comments.');
        this.isLoading.set(false);
      },
    });
  }

  protected showPreviousPage() {
    this.currentPage.update((page) => Math.max(1, page - 1));
  }

  protected showNextPage() {
    this.currentPage.update((page) => Math.min(this.totalPages(), page + 1));
  }
}
