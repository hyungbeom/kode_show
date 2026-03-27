import './ProductDetailPanel.css'

/**
 * 제품 상세 — 캔버스 오른쪽 고정 패널
 * @param {{ copy: import('../data/productDetailCopy').ProductDetailCopy; index: number } | null} product
 */
export default function ProductDetailPanel({ product, onClose }) {
  if (!product) return null
  const { copy, index } = product

  return (
    <aside className="product-detail-panel" aria-label="제품 설명">
      <div className="product-detail-panel__inner" style={{ position: 'relative' }}>
        <button type="button" className="product-detail-panel__close" onClick={onClose} aria-label="닫기">
          ×
        </button>
        <p className="product-detail-panel__subtitle">
          Product {index + 1} / 5
        </p>
        <h2 className="product-detail-panel__title">{copy.title}</h2>
        <p className="product-detail-panel__subtitle" style={{ textTransform: 'none', letterSpacing: 'normal', color: '#a5b4fc' }}>
          {copy.subtitle}
        </p>
        <p className="product-detail-panel__desc">{copy.description}</p>
        <ul className="product-detail-panel__specs">
          {copy.specs.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <p className="product-detail-panel__hint">닫기 후 다시 캐러셀에서 다른 제품을 선택할 수 있습니다.</p>
      </div>
    </aside>
  )
}
