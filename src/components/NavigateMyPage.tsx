import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Modal from './common/Modal'
import { ExhibitionFloorMapModal } from './ExhibitionFloorMapModal'
import { useMapStore } from '../store/useMapStore'
import { COMPANY_NAMES } from '../utils/constants'
import './NavigateMyPage.css'

const ENVEX_ONLINE_ENTERPRISE_DEFAULT =
  'https://envex.or.kr/online/kor/enterprise.asp?cd=3426'

type FavoriteRow = {
  id: string
  name: string
  booth: string
  mapFocusX: number
  mapFocusY: number
}

const SAMPLE_FAVORITES: FavoriteRow[] = [
  { id: 'f1', name: '글로벌테크 파트너스', booth: 'F21', mapFocusX: 3300, mapFocusY: 950 },
  { id: 'f2', name: '한빛 정수기술', booth: 'C12', mapFocusX: 3050, mapFocusY: 890 },
  { id: 'f3', name: '그린캐노피', booth: 'H07', mapFocusX: 2200, mapFocusY: 1800 },
]

type SeminarScheduleRow = {
  id: string
  day: string
  time: string
  room: string
  title: string
  note: string
}

const SEMINAR_SCHEDULE: SeminarScheduleRow[] = [
  { id: 'sx', day: '4월 8일', time: '11:00–12:00', room: '홀 B', title: '탄소회계·CBAM 입문', note: '현장 등록' },
  {
    id: 's1',
    day: '4월 8일',
    time: '14:00–15:30',
    room: '컨퍼런스룸 302',
    title: '2026 친환경 제품 해외 진출 실무 세미나',
    note: '신청완료',
  },
  { id: 'sy', day: '4월 9일', time: '09:30–10:15', room: '로비 무대', title: '전시장 안내 브리핑', note: '자유 참여' },
  {
    id: 's2',
    day: '4월 9일',
    time: '10:30–12:00',
    room: '세미나홀 A',
    title: '산업 폐수 고도처리·재이용 사례 워크숍',
    note: '신청완료',
  },
  {
    id: 's3',
    day: '4월 9일',
    time: '16:00–17:00',
    room: '미팅룸 5',
    title: '측정·인증 대응 라운드테이블',
    note: '신청완료',
  },
  { id: 'sz', day: '4월 10일', time: '13:00–14:30', room: '301호', title: 'EU 규제·CSRD 업데이트', note: '잔여석' },
]

const SAMPLE_SEMINARS = [
  { id: 's1', title: '2026 친환경 제품 해외 진출 실무 세미나', when: '4월 8일 14:00 · 컨퍼런스룸 302' },
  { id: 's2', title: '산업 폐수 고도처리·재이용 사례 워크숍', when: '4월 9일 10:30 · 세미나홀 A' },
  { id: 's3', title: '측정·인증 대응 라운드테이블', when: '4월 9일 16:00 · 미팅룸 5' },
]

type InquiryRow = {
  id: string
  name: string
  note: string
  when: string
  companyId: number
  has3dRoom: boolean
  envexOnlineUrl?: string
}

const SAMPLE_INQUIRIES: InquiryRow[] = [
  {
    id: 'q1',
    name: '에코솔루션랩',
    note: '맞춤 필터 견적 문의',
    when: '4월 7일',
    companyId: 42,
    has3dRoom: false,
  },
  {
    id: 'q2',
    name: '스마트워터코리아',
    note: 'IoT 계측 연동 상담',
    when: '4월 7일',
    companyId: 2,
    has3dRoom: false,
  },
  {
    id: 'q3',
    name: '리사이클팩토리',
    note: '재활용 장비 도입 문의',
    when: '4월 6일',
    companyId: 32,
    has3dRoom: true,
  },
]

const SAMPLE_EVENTS = [
  { id: 'e1', title: '부스 방문 스탬프 미션', detail: '5곳 방문 시 기념품', status: '진행 중' },
  { id: 'e2', title: '현장 퀴즈 이벤트', detail: '매일 15:30 중앙 무대', status: '응모 완료' },
  { id: 'e3', title: '친환경 키워드 릴레이', detail: 'SNS 해시태그 참여', status: '참여 예정' },
]

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M5.5 19.25c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

export type NavigateMyPageProps = {
  navigateModeActive: boolean
}

export function NavigateMyPage({ navigateModeActive }: NavigateMyPageProps) {
  const [open, setOpen] = useState(false)
  const [mapFocus, setMapFocus] = useState<{ nx: number; ny: number } | null>(null)
  const [seminarModalOpen, setSeminarModalOpen] = useState(false)
  const setSelectedCompany = useMapStore((s) => s.setSelectedCompany)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (seminarModalOpen) {
        setSeminarModalOpen(false)
        return
      }
      if (mapFocus != null) {
        setMapFocus(null)
        return
      }
      setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prev
    }
  }, [open, seminarModalOpen, mapFocus])

  useEffect(() => {
    if (!navigateModeActive) setOpen(false)
  }, [navigateModeActive])

  const openFloorMap = useCallback((row: FavoriteRow) => {
    setMapFocus({ nx: row.mapFocusX, ny: row.mapFocusY })
  }, [])

  const openInquiryCompany = useCallback(
    (row: InquiryRow) => {
      const officialName = COMPANY_NAMES[row.companyId] ?? row.name
      if (row.has3dRoom) {
        setSelectedCompany(row.companyId, officialName)
        window.history.pushState({}, '', `/room/${row.companyId}`)
        setOpen(false)
        return
      }
      const url = row.envexOnlineUrl?.trim() || ENVEX_ONLINE_ENTERPRISE_DEFAULT
      window.open(url, '_blank', 'noopener,noreferrer')
    },
    [setSelectedCompany],
  )

  if (!navigateModeActive) return null

  const stackOpen = mapFocus != null || seminarModalOpen

  const modal =
    open &&
    createPortal(
      <div
        className="navigate-mypage__backdrop"
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) setOpen(false)
        }}
      >
        <div
          className="navigate-mypage__panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="navigate-mypage-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="navigate-mypage__panel-head">
            <h2 id="navigate-mypage-title" className="navigate-mypage__title">
              마이페이지
            </h2>
            <button type="button" className="navigate-mypage__close" onClick={() => setOpen(false)} aria-label="닫기">
              ×
            </button>
          </div>
          <div className="navigate-mypage__scroll">
            <section className="navigate-mypage__card" aria-labelledby="mypage-fav">
              <h3 id="mypage-fav" className="navigate-mypage__card-title">
                찜한 기업
              </h3>
              <ul className="navigate-mypage__list">
                {SAMPLE_FAVORITES.map((row) => (
                  <li key={row.id}>
                    <button
                      type="button"
                      className="navigate-mypage__row navigate-mypage__row--clickable"
                      onClick={() => openFloorMap(row)}
                    >
                      <span className="navigate-mypage__row-main">{row.name}</span>
                      <span className="navigate-mypage__row-meta">{row.booth}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <section className="navigate-mypage__card" aria-labelledby="mypage-seminar">
              <h3 id="mypage-seminar" className="navigate-mypage__card-title">
                신청 세미나
              </h3>
              <ul className="navigate-mypage__list">
                {SAMPLE_SEMINARS.map((row) => (
                  <li key={row.id}>
                    <button
                      type="button"
                      className="navigate-mypage__row navigate-mypage__row--block navigate-mypage__row--clickable"
                      onClick={() => setSeminarModalOpen(true)}
                    >
                      <span className="navigate-mypage__row-main">{row.title}</span>
                      <span className="navigate-mypage__row-sub">{row.when}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <section className="navigate-mypage__card" aria-labelledby="mypage-inquiry">
              <h3 id="mypage-inquiry" className="navigate-mypage__card-title">
                문의한 기업
              </h3>
              <ul className="navigate-mypage__list">
                {SAMPLE_INQUIRIES.map((row) => (
                  <li key={row.id}>
                    <button
                      type="button"
                      className="navigate-mypage__row navigate-mypage__row--block navigate-mypage__row--clickable"
                      onClick={() => openInquiryCompany(row)}
                    >
                      <span className="navigate-mypage__row-main">{row.name}</span>
                      <span className="navigate-mypage__row-sub">
                        {row.note} · {row.when}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <section className="navigate-mypage__card" aria-labelledby="mypage-event">
              <h3 id="mypage-event" className="navigate-mypage__card-title">
                참여 이벤트
              </h3>
              <ul className="navigate-mypage__list">
                {SAMPLE_EVENTS.map((row) => (
                  <li key={row.id} className="navigate-mypage__row navigate-mypage__row--block">
                    <span className="navigate-mypage__row-main">{row.title}</span>
                    <span className="navigate-mypage__row-sub">{row.detail}</span>
                    <span className="navigate-mypage__badge">{row.status}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>,
      document.body,
    )

  return (
    <>
      <button
        type="button"
        className="navigate-mypage__fab"
        onClick={() => setOpen(true)}
        aria-label="마이페이지 열기"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <UserIcon />
      </button>
      {modal}

      <ExhibitionFloorMapModal
        isOpen={mapFocus != null}
        onClose={() => setMapFocus(null)}
        focusNaturalX={mapFocus?.nx}
        focusNaturalY={mapFocus?.ny}
        elevated
      />

      <Modal
        isOpen={seminarModalOpen}
        onClose={() => setSeminarModalOpen(false)}
        className="navigate-mypage-seminar__dialog"
        overlayClassName="navigate-mypage-seminar__overlay"
      >
        <div className="navigate-mypage-seminar">
          <div className="navigate-mypage-seminar__head">
            <h2 className="navigate-mypage-seminar__title">세미나 일정표</h2>
            <button
              type="button"
              className="navigate-mypage-seminar__close"
              onClick={() => setSeminarModalOpen(false)}
              aria-label="닫기"
            >
              ×
            </button>
          </div>
          <div className="navigate-mypage-seminar__table-wrap">
            <table className="navigate-mypage-seminar__table">
              <thead>
                <tr>
                  <th scope="col">일자</th>
                  <th scope="col">시간</th>
                  <th scope="col">장소</th>
                  <th scope="col">세션</th>
                  <th scope="col">비고</th>
                </tr>
              </thead>
              <tbody>
                {SEMINAR_SCHEDULE.map((r) => (
                  <tr key={r.id}>
                    <td>{r.day}</td>
                    <td>{r.time}</td>
                    <td>{r.room}</td>
                    <td>{r.title}</td>
                    <td>{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" className="navigate-mypage-seminar__btn" onClick={() => setSeminarModalOpen(false)}>
            닫기
          </button>
        </div>
      </Modal>
    </>
  )
}
