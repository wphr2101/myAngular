import { TitleCasePipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'productName', standalone: true, pure: true })
export class ProductNamePipe implements PipeTransform {
  private readonly titleCase = new TitleCasePipe();

  transform(name: string | null | undefined): string {
    if (!name) return '';
    const separator = name.lastIndexOf(' - ');
    if (separator < 0) return name;

    const product = name.slice(0, separator).trim();
    const packaging = name.slice(separator + 3).trim();
    if (!product || !packaging) return name;

    const formatted = this.titleCase.transform(packaging).replace(
      /(\d)\s*(kg|ml|g|l)\b/gi,
      (_match: string, quantity: string, unit: string) => quantity + unit.toUpperCase(),
    );
    return `${product} (${formatted})`;
  }
}
