import './RoomDetailLanding.css'

/** AQUAL 랜딩 히어로 아래 노출 영상 */
const ROOM_DETAIL_YOUTUBE_EMBED_ID = 'Cx1nu20HccI'

/** CSS 목업 — AQUAL 디바이스(흰 본체 + 하단 발광 버튼) */
function DeviceMock({ className = '', variant = 'single' }) {
  if (variant === 'triple') {
    return (
      <div className={`room-detail-landing__device-stack ${className}`.trim()} aria-hidden>
        <span className="room-detail-landing__device room-detail-landing__device--a" />
        <span className="room-detail-landing__device room-detail-landing__device--b" />
        <span className="room-detail-landing__device room-detail-landing__device--c" />
      </div>
    )
  }
  if (variant === 'cross') {
    return (
      <div className={`room-detail-landing__device-cross ${className}`.trim()} aria-hidden>
        <span className="room-detail-landing__device room-detail-landing__device--x1" />
        <span className="room-detail-landing__device room-detail-landing__device--x2" />
      </div>
    )
  }
  if (variant === 'v') {
    return (
      <div className={`room-detail-landing__device-v ${className}`.trim()} aria-hidden>
        <span className="room-detail-landing__device room-detail-landing__device--leg room-detail-landing__device--leg-l" />
        <span className="room-detail-landing__device room-detail-landing__device--leg room-detail-landing__device--leg-r" />
      </div>
    )
  }
  return <span className={`room-detail-landing__device ${className}`.trim()} aria-hidden />
}

/**
 * GLB 확대(제품 상세) 모드에서 히어로 아래로 스크롤 시 노출되는 랜딩형 콘텐츠
 * (AQUAL Water Quality Tester — 첨부 레퍼런스 레이아웃)
 */
export default function RoomDetailLanding({ product }) {
  if (!product?.copy) return null
  const { index } = product

  return (
    <section className="room-detail-landing" aria-label="제품 추가 소개">
      <div className="room-detail-landing__bg" aria-hidden />

      {/* —— 히어로: 타이틀 + 2컬럼 —— */}
      <header className="room-detail-landing__hero-header">
        <p className="room-detail-landing__product-tag">Product {index + 1}</p>
        <h1 className="room-detail-landing__brand">AQUAL(에이퀄)</h1>
        <p className="room-detail-landing__tagline-en">Water Quality Tester</p>
      </header>

      <div className="room-detail-landing__video-wrap">
        <div className="room-detail-landing__video-inner">
          <iframe
            title="AQUAL(에이퀄) 제품 소개 영상"
            src={`https://www.youtube.com/embed/${ROOM_DETAIL_YOUTUBE_EMBED_ID}?rel=0`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>

      <div className="room-detail-landing__hero-grid">
        <div className="room-detail-landing__hero-visual">
          <DeviceMock variant="triple" />
        </div>

        <aside className="room-detail-landing__info-card">
          <div className="room-detail-landing__info-card-head">
            <span className="room-detail-landing__drop-icon" aria-hidden>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="11" fill="#1d4ed8" />
                <path
                  d="M12 6.5c-2.2 3.1-4 5.6-4 8.2a4 4 0 1 0 8 0c0-2.6-1.8-5.1-4-8.2z"
                  fill="#fff"
                />
              </svg>
            </span>
            <h2 className="room-detail-landing__info-card-title">스마트 수질 관리 시스템</h2>
          </div>
          <p className="room-detail-landing__info-card-lead">
            최첨단 기술을 활용한 스마트 수질 관리 시스템으로 깨끗하고 안전한 물 환경을 만듭니다.
          </p>
          <ul className="room-detail-landing__feature-list">
            <li>
              <strong>유해물질 조기감지</strong>
              <span>수질 오염 물질을 신속하게 감지하여 사전 예방이 가능합니다.</span>
            </li>
            <li>
              <strong>간편한 휴대성과 사용성</strong>
              <span>직관적인 인터페이스와 휴대가 용이한 디자인으로 누구나 쉽게 사용할 수 있습니다.</span>
            </li>
            <li>
              <strong>스마트 데이터 관리</strong>
              <span>측정된 데이터를 실시간으로 분석하고 체계적으로 관리합니다.</span>
            </li>
            <li>
              <strong>안전한 물 제공</strong>
              <span>지속적인 모니터링으로 안전하고 깨끗한 물 공급을 보장합니다.</span>
            </li>
          </ul>
        </aside>
      </div>

      {/* —— SPEC —— */}
      <section className="room-detail-landing__spec-block" aria-labelledby="room-detail-spec-heading">
        <h2 id="room-detail-spec-heading" className="room-detail-landing__spec-title">
          SPEC
        </h2>
        <div className="room-detail-landing__table-wrap">
          <table className="room-detail-landing__table">
            <thead>
              <tr>
                <th scope="col">Feature</th>
                <th scope="col">Specification</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Product</th>
                <td>Water Strip Reader</td>
              </tr>
              <tr>
                <th scope="row">Measurement Principle</th>
                <td>Reflectometry</td>
              </tr>
              <tr>
                <th scope="row">Sample Type</th>
                <td>Water</td>
              </tr>
              <tr>
                <th scope="row">Sample Volume</th>
                <td>About 1mL</td>
              </tr>
              <tr>
                <th scope="row">Measurement Range</th>
                <td>
                  Total Alkalinity: 0~240ppm, Hardness: 0~425ppm, Iron: 0~5.0ppm, Copper: 0~5.0ppm,
                  Lead: 0~50ppb, Manganese: 0~5.0ppm, Total Chlorine: 0~20ppm, Free Chlorine: 0~20ppm,
                  Nitrate: 0~500ppm, Nitrite: 0~80ppm, Sulfate: 0~1,600ppm, Zinc: 0~100ppm, Sodium
                  Chloride: 0~2,000ppm, Fluoride: 0~100ppm, Hydrogen Sulfide: 0~10ppm, pH: 6.2~8.4
                </td>
              </tr>
              <tr>
                <th scope="row">Measurement Time</th>
                <td>30 seconds</td>
              </tr>
              <tr>
                <th scope="row">Memory</th>
                <td>1,000(App.)</td>
              </tr>
              <tr>
                <th scope="row">Indication</th>
                <td>LED indicator</td>
              </tr>
              <tr>
                <th scope="row">Operating Temp.</th>
                <td>4 ~ 40 °C</td>
              </tr>
              <tr>
                <th scope="row">Humidity</th>
                <td>{'< 85 %'}</td>
              </tr>
              <tr>
                <th scope="row">Battery</th>
                <td>2 AAA alkaline batteries(1.5V)</td>
              </tr>
              <tr>
                <th scope="row">Weight</th>
                <td>63g</td>
              </tr>
              <tr>
                <th scope="row">Size(W x D x H)</th>
                <td>57.8 × 203 × 23(mm)</td>
              </tr>
              <tr>
                <th scope="row">Function</th>
                <td>Button on/off</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* —— PRODUCT DETAILS (지그재그) —— */}
      <section className="room-detail-landing__details" aria-labelledby="room-detail-details-heading">
        <h2 id="room-detail-details-heading" className="room-detail-landing__section-kicker">
          PRODUCT DETAILS
        </h2>

        <div className="room-detail-landing__zigzag room-detail-landing__zigzag--img-left">
          <div className="room-detail-landing__zigzag-visual">
            <DeviceMock variant="v" />
          </div>
          <div className="room-detail-landing__zigzag-text">
            <h3 className="room-detail-landing__zigzag-h">탁월한 정확도와 신뢰성</h3>
            <p className="room-detail-landing__zigzag-ko">
              고급 디지털 센서를 통해 실험실 수준의 정밀도를 제공합니다. 불확실한 수동 판독과 불필요한
              과정을 없애고, 매번 믿을 수 있는 결과를 가져다 드립니다.
            </p>
            <p className="room-detail-landing__zigzag-en">
              LEEBIO WATER TESTER delivers laboratory-grade precision with its advanced digital sensors,
              providing highly accurate water quality analysis. Say goodbye to human error and unreliable
              manual readings—get trusted results every time.
            </p>
          </div>
        </div>

        <div className="room-detail-landing__zigzag room-detail-landing__zigzag--img-right">
          <div className="room-detail-landing__zigzag-text">
            <h3 className="room-detail-landing__zigzag-h">최상의 편리함과 휴대성</h3>
            <p className="room-detail-landing__zigzag-ko">
              휴대 가능하고 세련된 디자인으로 언제 어디서나 수질 검사가 가능합니다. 간단한 몇 단계만으로
              즉각적이고 신뢰할 수 있는 결과를 손에 넣을 수 있으며, 가정과 전문가용으로 모두 적합합니다.
            </p>
            <p className="room-detail-landing__zigzag-en">
              Designed with ease of use in mind, portable and sleek design allows you to test water quality
              anytime, anywhere. With just a few simple steps, you&apos;ll have immediate, reliable results at
              your fingertips—perfect for both home and professional use.
            </p>
          </div>
          <div className="room-detail-landing__zigzag-visual room-detail-landing__zigzag-visual--dual">
            <DeviceMock variant="single" />
            <DeviceMock variant="single" className="room-detail-landing__device--offset" />
          </div>
        </div>
      </section>

      {/* —— 추가 교차 섹션 —— */}
      <section className="room-detail-landing__alt-rows" aria-label="제품 특장점">
        <div className="room-detail-landing__zigzag room-detail-landing__zigzag--img-left">
          <div className="room-detail-landing__zigzag-visual">
            <DeviceMock variant="triple" />
          </div>
          <div className="room-detail-landing__zigzag-text">
            <h3 className="room-detail-landing__zigzag-h">실시간 검사와 신속한 다중 매개변수 결과</h3>
            <p className="room-detail-landing__zigzag-ko">
              스마트 모바일 앱은 테스트 결과를 자동으로 기록하고 저장하여 수질 상태를 시간에 따라
              모니터링할 수 있습니다. 데이터를 간편하게 저장하고 언제든지 접근 가능하여 수질 안전을 완벽하게
              관리할 수 있습니다.
            </p>
            <p className="room-detail-landing__zigzag-en">
              AQUAL&apos;s smart mobile app automatically tracks and stores all your test results, helping you
              monitor trends and water quality over time. Effortlessly archive your data and access it
              anytime, ensuring you&apos;re always in control of your water&apos;s safety.
            </p>
          </div>
        </div>

        <div className="room-detail-landing__zigzag room-detail-landing__zigzag--img-right">
          <div className="room-detail-landing__zigzag-text">
            <h3 className="room-detail-landing__zigzag-h">건강과 안전을 최우선으로</h3>
            <p className="room-detail-landing__zigzag-ko">
              납, 질산염, 염소 등 유해 물질을 조기에 감지하여 가족의 건강을 보호하세요. 물의 순도를
              신뢰하고, 모든 구성원이 안전하게 물을 섭취할 수 있는 안심을 제공합니다.
            </p>
            <p className="room-detail-landing__zigzag-en">
              With early detection of harmful contaminants like lead, nitrate, and chlorine, AQUAL helps
              safeguard your family&apos;s health. Trust in the purity of your water, ensuring peace of mind and
              safe water consumption for everyone.
            </p>
          </div>
          <div className="room-detail-landing__zigzag-visual">
            <DeviceMock variant="cross" />
          </div>
        </div>
      </section>
    </section>
  )
}
