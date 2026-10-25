import { ProductNamePipe } from './product-name-pipe';

describe('ProductNamePipe', () => {
  const pipe = new ProductNamePipe();

  it.each([
    ['Apples - 1 kg bag', 'Apples (1KG Bag)'],
    ['Whole Milk - 1 L', 'Whole Milk (1L)'],
    ['White Bread - 500 g', 'White Bread (500G)'],
    ['Eggs - 12 pack', 'Eggs (12 Pack)'],
    ['Strawberries - 454 g box', 'Strawberries (454G Box)'],
    ['Bananas - 1 kg bunch', 'Bananas (1KG Bunch)'],
    ['Lettuce - 1 head', 'Lettuce (1 Head)'],
    ['Juice - 250ml bottle', 'Juice (250ML Bottle)'],
    ['Rice - 1.5 KG BAG', 'Rice (1.5KG Bag)'],
    ['Organic - Apples - 1 kg bag', 'Organic - Apples (1KG Bag)'],
    ['  Apples - 1 kg bag  ', 'Apples (1KG Bag)'],
  ])('formats %s as %s', (name, expected) => {
    expect(pipe.transform(name)).toBe(expected);
  });

  it.each(['Parcel box', 'Sugar-free Cola', 'Apples (1KG Bag)', 'Apples - ', ' - 1 kg bag'])('preserves names without a complete package suffix: %s', name => {
    expect(pipe.transform(name)).toBe(name);
  });

  it.each([null, undefined, ''])('handles an empty value: %s', name => {
    expect(pipe.transform(name)).toBe('');
  });
});
