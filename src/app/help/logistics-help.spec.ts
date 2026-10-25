import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, Subject, throwError } from 'rxjs';
import { HelpAnswer, HelpService } from './help-service';
import { LogisticsHelp } from './logistics-help';

describe('LogisticsHelp dialog', () => {
  let fixture: ComponentFixture<LogisticsHelp>;
  const guide: HelpAnswer = { topic: 'cart', title: 'Use the shopping cart', text: 'Session draft only.', steps: ['Open Products.'], links: [{ label: 'Open Cart', path: '/cart' }], mode: 'guide' };
  const ask = vi.fn();
  beforeEach(async () => {
    ask.mockReset().mockReturnValue(of(guide));
    TestBed.configureTestingModule({ imports: [LogisticsHelp], providers: [provideRouter([]), { provide: HelpService, useValue: { ask } }] });
    fixture = TestBed.createComponent(LogisticsHelp);
    fixture.detectChanges();
    await fixture.whenStable();
  });
  const root = () => fixture.nativeElement as HTMLElement;
  async function open() {
    root().querySelector<HTMLButtonElement>('.help-toggle')!.click();
    fixture.detectChanges(); await fixture.whenStable();
  }
  async function submit(question = 'How do I use the cart?') {
    const input = root().querySelector<HTMLInputElement>('input')!;
    input.value = question; input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges(); await fixture.whenStable();
    root().querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges(); await fixture.whenStable();
  }

  it('starts closed and opens a labelled non-modal dialog with input focus', async () => {
    expect(root().querySelector('[role="dialog"]')).toBeNull();
    await open();
    expect(root().querySelector('[role="dialog"]')?.getAttribute('aria-modal')).toBe('false');
    expect(document.activeElement).toBe(root().querySelector('input'));
  });

  it('closes on Escape and returns focus to the launcher', async () => {
    await open();
    root().querySelector('input')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(root().querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(root().querySelector('.help-toggle'));
  });

  it('renders the verified guide, mode and safe related link', async () => {
    await open(); await submit();
    expect(ask).toHaveBeenCalledWith('How do I use the cart?');
    expect(root().textContent).toContain('Session draft only.');
    expect(root().querySelector('.mode')?.textContent).toContain('Guide');
    expect(root().querySelector('a')?.getAttribute('href')).toBe('/cart');
  });

  it('blocks duplicate requests while busy and restores controls after completion', async () => {
    const pending = new Subject<HelpAnswer>(); ask.mockReturnValue(pending);
    await open(); await submit();
    root().querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(ask).toHaveBeenCalledTimes(1);
    expect(root().querySelector<HTMLInputElement>('input')!.disabled).toBe(true);
    pending.next(guide); pending.complete(); fixture.detectChanges();
    await fixture.whenStable();
    expect(root().querySelector<HTMLInputElement>('input')!.disabled).toBe(false);
  });

  it('shows rate-limit feedback without claiming account changes', async () => {
    ask.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 429 })));
    await open(); await submit();
    expect(root().querySelector('[role="alert"]')?.textContent).toContain('Wait one minute');
  });

  it('displays policy and never renders answer text as HTML', async () => {
    ask.mockReturnValue(of({ ...guide, mode: 'policy', text: '<img src=x onerror=alert(1)>' }));
    await open(); await submit();
    expect(root().querySelector('.mode')?.textContent).toContain('Policy');
    expect(root().querySelector('img')).toBeNull();
    expect(root().textContent).toContain('<img src=x');
  });

  it('rejects whitespace and oversized questions before calling the service', async () => {
    await open(); await submit('  '); await submit('a'.repeat(501));
    expect(ask).not.toHaveBeenCalled();
  });
});
