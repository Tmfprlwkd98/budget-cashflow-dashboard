# Budget Dashboard (무서버 가계부 · 현금흐름 대시보드)

## 개요
서버/DB 없이 **브라우저만**으로 사용하는 가계부·현금흐름 대시보드입니다.  
CSV 가져오기/내보내기를 지원하고, 데이터는 브라우저 **localStorage**에 저장됩니다.

---

## 주요 기능
- 거래 입력/삭제: 날짜 · 설명 · 카테고리 · 유형(수입/지출) · 금액
- 월별 필터/이동: 이전달 · 다음달 · 이번달 · 직접 선택
- 요약 지표: 총 수입 · 총 지출 · 순현금흐름 · 저축률
- 시각화: 카테고리별 지출 파이 차트, 일자별 순현금흐름 라인 차트
- CSV 입·출력: 전체 내보내기 / CSV 병합 가져오기
- 설정: 통화 코드(KRW 기본), 기본 카테고리 편집
- 무서버: 모든 데이터는 내 브라우저에만 저장

---

## 디렉터리
budget-dashboard/
├─ index.html # 마크업
├─ styles.css # 스타일
└─ app.js # 동작(로직/렌더링/CSV)

## 실행 방법
### 방법 A) 파일로 바로 열기 (권장: 간단)
1. 위 구조로 저장한 뒤 `index.html`을 브라우저에서 직접 엽니다(더블클릭 또는 Ctrl+O).
2. 인터넷 연결 시 CDN(Chart.js) 로드 → 차트 표시.

### 방법 B) 완전 오프라인(차트 로컬 파일 사용)
1. `vendor/chart.umd.js`를 프로젝트에 추가합니다.
2. `index.html`의 `<head>`에서 스크립트를 아래로 교체합니다:
   ```html
   <script src="./vendor/chart.umd.js"></script>
   VS Code 확장을 쓰고 싶다면 Live Server/Live Preview로 index.html을 띄워도 됩니다(선택).


## CSV 스키마
헤더(컬럼)는 아래와 같습니다. UTF-8 인코딩 권장.
`id`,`date`,`desc`,`category`,`type`,`amount`
`id`: 고유 식별자(비워도 됨 → 자동 생성)
`date`: YYYY-MM-DD
`desc`: 설명(문자열)
`category`: 카테고리(예: 식비, 교통, 급여 등)
`type`: income 또는 expense
`amount`: 숫자(쉼표 없이)

### 예시
id,date,desc,category,type,amount
a1b2c3d4,2025-11-01,급여,급여,income,2500000
a1b2c3d5,2025-11-01,스타벅스,카페,expense,5600
a1b2c3d6,2025-11-02,지하철,교통,expense,1450


## 기술 스택
**HTML**, **CSS**, **JavaScript (Vanilla)**
localStorage (브라우저 저장)
Chart.js (파이/라인 차트, CDN 또는 로컬 파일)

## 개인정보/보안
- 모든 데이터는 브라우저(localStorage) 에만 저장되며 서버 전송 없음.
- 다른 기기/브라우저에서는 데이터가 보이지 않을 수 있습니다 → CSV로 주기적 백업 권장.

## 참고/제한 사항
- CSV 인코딩은 UTF-8로 저장하세요(엑셀: “CSV UTF-8(쉼표로 분리)”).
- 시크릿(인프라이빗) 모드에서는 localStorage가 지워질 수 있습니다.
- 일부 환경에서 외부 CDN이 차단되면 차트가 보이지 않습니다(로컬 차트 파일 권장).