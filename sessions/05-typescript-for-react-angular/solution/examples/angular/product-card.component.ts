/**
 * REFERENCE FILE (Angular 17+). Not compiled by this project: see ../README.md.
 *
 * The same card as examples/react/ProductCard.tsx. With strictTemplates on (the default in
 * new Angular projects), the template below is type-checked too: `product.titel` fails the build.
 */
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { categoryLabel, discountedPrice, STOCK_LABELS, stockLevel } from '../../src/lib/format';
import type { StockLevel } from '../../src/lib/format';
import type { Product } from '../../src/types';

@Component({
  selector: 'app-product-card',
  standalone: true, // the default from Angular 19; written out so this also reads right in 17 and 18
  imports: [CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="card">
      <div class="thumb">
        <img [src]="product.thumbnail" [alt]="product.title" loading="lazy" />
      </div>
      <div class="body">
        <span class="brand">{{ product.brand ?? categoryLabel(product.category) }}</span>
        <h3>{{ product.title }}</h3>
        <span class="price">
          {{ salePrice | currency: 'USD' }}
          @if (product.discountPercentage > 0) {
            <s>{{ product.price | currency: 'USD' }}</s>
          }
        </span>
        <div class="row">
          <span [class]="'badge ' + level">{{ labels[level] }}</span>
          <button type="button" class="btn primary" [disabled]="level === 'out'" (click)="add.emit(product)">
            Add to cart
          </button>
        </div>
      </div>
    </article>
  `,
})
export class ProductCardComponent {
  /**
   * `required: true` makes Angular's compiler reject <app-product-card> without [product].
   * The `!` tells TypeScript "Angular assigns this before I read it", because a class field
   * with no initialiser would otherwise fail strictPropertyInitialization.
   * Signal-based alternative (Angular 17.1+): `product = input.required<Product>();`, read as product().
   */
  @Input({ required: true }) product!: Product;

  /** A typed output: the parent's (add)="onAdd($event)" receives a Product. */
  @Output() readonly add = new EventEmitter<Product>();

  protected readonly labels = STOCK_LABELS;
  protected readonly categoryLabel = categoryLabel;

  protected get level(): StockLevel {
    return stockLevel(this.product.stock);
  }

  protected get salePrice(): number {
    return discountedPrice(this.product.price, this.product.discountPercentage);
  }
}
