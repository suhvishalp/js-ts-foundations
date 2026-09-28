/**
 * REFERENCE FILE (React 19). Not compiled by this project: see ../README.md.
 *
 * src/ui/render.ts builds this card with createElement. Here it is as a React component.
 * The props are an interface, so every place that renders <ProductCard> is checked.
 */
import type { ChangeEvent } from 'react';
import { categoryLabel, discountedPrice, formatPrice, STOCK_LABELS, stockLevel } from '../../src/lib/format';
import type { Product } from '../../src/types';

export interface ProductCardProps {
  product: Product;
  /** A callback prop: the parent decides what "add" means (dispatch to a cart, call an API…). */
  onAdd: (product: Product) => void;
  /** Optional, with a default below. */
  inCart?: number;
}

export function ProductCard({ product, onAdd, inCart = 0 }: ProductCardProps) {
  const level = stockLevel(product.stock); // 'ok' | 'low' | 'out'
  const sale = discountedPrice(product.price, product.discountPercentage);

  return (
    <article className="card">
      <div className="thumb">
        <img src={product.thumbnail} alt={product.title} loading="lazy" />
      </div>
      <div className="body">
        <span className="brand">{product.brand ?? categoryLabel(product.category)}</span>
        <h3>{product.title}</h3>
        <span className="price">
          {formatPrice(sale)}
          {product.discountPercentage > 0 && <s>{formatPrice(product.price)}</s>}
        </span>
        <div className="row">
          <span className={`badge ${level}`}>{STOCK_LABELS[level]}</span>
          <button type="button" className="btn primary" disabled={level === 'out'} onClick={() => onAdd(product)}>
            {inCart > 0 ? `Add another (${inCart})` : 'Add to cart'}
          </button>
        </div>
      </div>
    </article>
  );
}

/** A typed event handler: React.ChangeEvent<HTMLInputElement> means e.currentTarget.value is a string. */
export interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBox({ value, onChange }: SearchBoxProps) {
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    onChange(e.currentTarget.value);
  }
  return <input type="search" value={value} onChange={handleChange} placeholder="Search products" />;
}

/*
 * The mistakes these types catch at the call site:
 *
 *   <ProductCard product={p} />                        // error: property 'onAdd' is missing
 *   <ProductCard product={p} onAdd={(id: number) => …} // error: Product is not assignable to number
 *   <ProductCard product={{ title: 'Mug' }} onAdd={…}   // error: missing id, price, stock…
 */
