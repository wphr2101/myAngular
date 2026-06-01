import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';

interface VisitorComment {
  name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  phoneNumber: string;
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
  private readonly apiUrl = 'https://wphr2101.runasp.net/api/inputform';

  protected readonly comments = signal<VisitorComment[]>([]);
  protected readonly errorMessage = signal('');
  protected readonly isLoading = signal(true);

  ngOnInit() {
    this.http.get<VisitorComment[]>(this.apiUrl).subscribe({
      next: (comments) => {
        this.comments.set(comments);
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
}
