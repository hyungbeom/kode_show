import { useEffect } from 'react'
import Modal from './common/Modal'
import './CompanyQuickActionsModal.css'

function openOrNotify(url, emptyMessage) {
  const u = url?.trim()
  if (!u) {
    window.alert(emptyMessage)
    return
  }
  window.open(u, '_blank', 'noopener,noreferrer')
}

export function CompanyQuickActionsModal({ isOpen, onClose, company }) {
  const name = company?.name ?? ''

  useEffect(() => {
    if (!isOpen || !company) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, company, onClose])

  return (
    <Modal
      isOpen={isOpen && company != null}
      onClose={onClose}
      className="company-quick-actions-modal__dialog"
      overlayClassName="company-quick-actions-modal__overlay"
    >
      <div className="company-quick-actions-modal">
        <header className="company-quick-actions-modal__header">
          <h2 id="company-quick-actions-title" className="company-quick-actions-modal__title">
            {name}
          </h2>
          <button type="button" className="company-quick-actions-modal__close" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </header>
        <div
          className="company-quick-actions-modal__body"
          role="dialog"
          aria-modal="true"
          aria-labelledby="company-quick-actions-title"
        >
          <button
            type="button"
            className="company-quick-actions-modal__action"
            onClick={() => {
              window.alert('1:1 문의는 준비 중입니다.')
            }}
          >
            1:1 문의
          </button>
          <button
            type="button"
            className="company-quick-actions-modal__action"
            onClick={() => {
              window.alert('관심기업 등록은 준비 중입니다.')
            }}
          >
            관심기업 등록
          </button>
          <button
            type="button"
            className="company-quick-actions-modal__action"
            onClick={() => {
              openOrNotify(company?.brochureUrl, '브로슈어 다운로드 링크는 준비 중입니다.')
            }}
          >
            브로슈어 다운로드
          </button>
          <button
            type="button"
            className="company-quick-actions-modal__action"
            onClick={() => {
              openOrNotify(company?.websiteUrl, '회사 홈페이지 링크는 준비 중입니다.')
            }}
          >
            회사 홈페이지
          </button>
        </div>
      </div>
    </Modal>
  )
}
