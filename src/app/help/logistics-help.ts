import { Component, DestroyRef, ElementRef, effect, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { HelpAnswer, HelpService } from './help-service';

@Component({
  selector: 'app-logistics-help',
  imports: [FormsModule, RouterLink],
  templateUrl: './logistics-help.html',
  styleUrl: './logistics-help.css',
})
export class LogisticsHelp {
  private readonly help = inject(HelpService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly open = signal(false);
  protected readonly busy = signal(false);
  protected readonly answer = signal<HelpAnswer | null>(null);
  protected readonly error = signal('');
  protected readonly answeredQuestion = signal('');
  protected question = '';
  private readonly questionInput = viewChild<ElementRef<HTMLInputElement>>('questionInput');
  private readonly launcher = viewChild<ElementRef<HTMLButtonElement>>('launcher');
  protected readonly prompts = [
    { label: 'Create an account', question: 'How do I create an account?' },
    { label: 'Use the cart', question: 'How do I use the shopping cart?' },
    { label: 'Place an order', question: 'How do I place an order?' },
  ];

  constructor() {
    effect(() => {
      const input = this.questionInput();
      if (this.open() && input) input.nativeElement.focus();
    });
  }

  protected close() {
    this.open.set(false);
    this.launcher()?.nativeElement.focus();
  }

  protected ask(prompt?: string) {
    if (this.busy()) return;
    if (prompt !== undefined) this.question = prompt;
    const question = this.question.trim();
    if (question.length < 2 || question.length > 500) {
      this.error.set('Enter a question of 2 to 500 characters.');
      return;
    }
    this.busy.set(true);
    this.error.set('');
    this.answer.set(null);
    this.answeredQuestion.set(question);
    this.help.ask(question).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.busy.set(false)),
    ).subscribe({
      next: answer => this.answer.set(answer),
      error: (error: unknown) => {
        const status = error instanceof HttpErrorResponse ? error.status : 0;
        this.error.set(status === 429 ? 'Too many questions. Wait one minute and try again.'
          : status === 400 ? 'Please check your question and try again. If the problem continues, reload the page.'
          : 'The help service is unavailable. Please try again. Your account and cart have not been changed.');
      },
    });
  }

  protected clear() {
    if (this.busy()) return;
    this.question = '';
    this.answer.set(null);
    this.error.set('');
    this.answeredQuestion.set('');
  }
}
