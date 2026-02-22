# 청담 파트너스 VIP - 프로젝트 현황 보고서

> **작성일**: 2026-02-22
> **목적**: 현재 프로젝트 구현 상태 파악 및 기록

---

## 1. 프로젝트 개요

**청담 파트너스 VIP**는 VIP 고객의 로열티 포인트를 관리하는 내부 운영 시스템입니다.

| 항목 | 내용 |
|------|------|
| 서비스명 | 청담 파트너스 VIP (Cheongdam Partners VIP) |
| 목적 | VIP 고객 포인트 적립/차감, 고객 정보 관리, 관리자 운영 |
| 타겟 | 내부 직원(관리자) + VIP 고객 |
| 라이브 URL | https://nca2student55-crypto.github.io/cheongdam-partners-vip/ |
| 저장소 | GitHub (nca2student55-crypto/cheongdam-partners-vip) |

---

## 2. 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | React 19 + TypeScript |
| 빌드 도구 | Vite 6 |
| 스타일 | Tailwind CSS (CDN 방식) |
| 백엔드/DB | Supabase (PostgreSQL) |
| 실시간 동기화 | Supabase Realtime (WebSocket) |
| 배포 | GitHub Actions → GitHub Pages |
| 폰트 | Google Fonts (Inter, Noto Sans KR) |

### 주요 의존성
```
react: 19.2.3
react-dom: 19.2.3
@supabase/supabase-js: 2.89.0
vite: 6.2.0
typescript: 5.8.2
```

---

## 3. 아키텍처

### 3-1. 파일 구조 (비표준)

소스 파일이 일반적인 `src/` 폴더가 아닌 **프로젝트 루트**에 위치합니다.

```
cheongdam_project/
├── App.tsx                      ← 전체 상태 관리 + 뷰 라우팅 + Realtime 구독
├── types.ts                     ← TypeScript 타입 정의 전체
├── index.tsx                    ← React 진입점
├── index.html                   ← HTML 템플릿 (Tailwind CDN 포함)
│
├── api/
│   ├── supabase.ts             ← Supabase 클라이언트 초기화
│   └── client.ts               ← 모든 CRUD 함수 + DB↔프론트 변환 (~859줄)
│
├── components/
│   └── UI.tsx                  ← 공통 UI 컴포넌트 (Button, Input, Card, AlertModal)
│
├── pages/ (페이지 컴포넌트 11개)
│   ├── Main.tsx                ← 시작 화면 (로그인/회원가입 버튼)
│   ├── Login.tsx               ← 고객 로그인 + 비밀번호 찾기
│   ├── Signup.tsx              ← 고객 회원가입 (약관→정보 입력)
│   ├── AdminLogin.tsx          ← 관리자 로그인
│   ├── AdminDashboard.tsx      ← 관리자 대시보드 (~1,500줄)
│   ├── CustomerDashboard.tsx   ← 고객 메인 화면
│   ├── ProfileEdit.tsx         ← 고객 프로필 수정
│   ├── PointHistory.tsx        ← 포인트 이용 내역
│   ├── NotificationList.tsx    ← 고객 알림 목록
│   ├── CustomerAnnouncements.tsx ← 공지사항 목록
│   └── PasswordReset.tsx       ← 비밀번호 재설정
│
├── .github/workflows/deploy.yml ← GitHub Pages 자동 배포
├── vite.config.ts              ← Vite 설정 (base: '/cheongdam-partners-vip/')
├── tsconfig.json               ← TypeScript 설정
├── CLAUDE.md                   ← 개발 가이드라인
└── HANDOVER.md                 ← 인수인계 문서
```

### 3-2. 상태 관리

```
라우터 없음 → ViewState union type으로 페이지 전환 (App.tsx의 renderView() 함수)

ViewState 목록:
  MAIN, CUSTOMER_LOGIN, SIGNUP, ADMIN_LOGIN, ADMIN_DASHBOARD,
  CUSTOMER_DASHBOARD, PASSWORD_RESET, POINT_HISTORY,
  PROFILE_EDIT, NOTIFICATIONS, CUSTOMER_ANNOUNCEMENTS

모든 상태는 App.tsx에 집중 (Context, Redux 미사용)
```

### 3-3. 실시간 동기화 (Realtime)

Supabase WebSocket을 통해 DB 변경 사항이 UI에 자동 반영됩니다.

| 위치 | 구독 테이블 | 용도 |
|------|------------|------|
| App.tsx | customers | 고객 목록 자동 갱신 |
| App.tsx | notifications | 알림 자동 갱신 |
| App.tsx | announcements | 공지사항 자동 갱신 |
| App.tsx | point_history | 포인트 내역 자동 갱신 |
| AdminDashboard.tsx | admin_notifications | 관리자 알림 자동 갱신 |
| AdminDashboard.tsx | customers | 승인 대기 목록 자동 갱신 |
| AdminDashboard.tsx | announcements | 공지사항 관리 자동 갱신 |

---

## 4. 데이터베이스 구조 (Supabase)

**프로젝트**: rbunpzizpkvouhdhxlih.supabase.co
**전체 테이블 7개**, 모두 Realtime 퍼블리케이션 등록

### 테이블 상세

| 테이블 | 주요 컬럼 | 용도 |
|--------|----------|------|
| `customers` | id, name, phone, password, company, is_individual, total_points, **status**, memo, withdrawn_at | VIP 고객 정보 |
| `point_history` | id, customer_id, points, **type** (earn/use/adjust), reason | 포인트 거래 내역 |
| `notifications` | id, customer_id, title, content, **type** (system/message/announcement), is_read | 고객 알림 |
| `announcements` | id, title, content, is_active, is_pinned, expires_at | 공지사항 |
| `admins` | id, username, password, name | 관리자 계정 |
| `inquiries` | id, customer_id, **type** (profile_change/password_reset), content (JSONB), **status** (pending/resolved) | 고객 문의 |
| `admin_notifications` | id, **type** (new_signup/inquiry/withdrawal), reference_type, reference_id, is_read | 관리자 알림 |

### 고객 상태(status) 값

| DB 값 | 한국어 | 의미 |
|-------|--------|------|
| `pending` | 대기 | 가입 후 관리자 승인 대기 중 |
| `active` | 활성 | 정상 이용 가능 |
| `withdrawn` | 탈퇴 | 탈퇴 처리된 계정 |

---

## 5. 구현된 기능 목록

### 5-1. 고객 기능

| 기능 | 구현 여부 | 설명 |
|------|----------|------|
| 회원가입 | ✅ 완료 | 약관 동의 → 정보 입력 → 승인 대기 |
| 로그인 | ✅ 완료 | 전화번호 + 비밀번호 |
| 대시보드 | ✅ 완료 | 포인트 잔액, 고객 수, 알림 배지 |
| 프로필 조회/수정 | ✅ 완료 | 회사명/개인 여부 수정 가능, 이름/전화번호는 문의 필요 |
| 포인트 이용 내역 | ✅ 완료 | 시간순 거래 내역 조회 |
| 알림 수신 | ✅ 완료 | 메시지/시스템 알림 읽음 처리 |
| 공지사항 조회 | ✅ 완료 | 고정/일반 공지사항, 배지 표시 |
| 비밀번호 찾기 | ✅ 완료 | 관리자에게 초기화 문의 생성 |
| 프로필 변경 문의 | ✅ 완료 | 이름/전화번호 변경 시 관리자 문의 |
| 회원 탈퇴 | ✅ 완료 | 탈퇴 신청 → WITHDRAWN 상태로 변경 |

### 5-2. 관리자 기능

| 기능 | 구현 여부 | 설명 |
|------|----------|------|
| 관리자 로그인 | ✅ 완료 | admin / cheongdam2024! |
| 가입 승인 | ✅ 완료 | 대기 고객 개별/일괄 승인 |
| 고객 목록 조회 | ✅ 완료 | 이름/전화번호/회사 검색, 상태 필터 |
| 포인트 적립 | ✅ 완료 | 단일/복수 고객 선택 후 적립 |
| 포인트 차감 | ✅ 완료 | 단일/복수 고객 선택 후 차감(사유 입력) |
| 고객 정보 수정 | ✅ 완료 | 이름, 전화번호, 회사, 개인여부, 메모 |
| 고객 탈퇴/복구 | ✅ 완료 | 탈퇴 처리 및 복구 |
| 고객 삭제 | ✅ 완료 | 이름 확인 후 영구 삭제 |
| 메시지 발송 | ✅ 완료 | 전체/선택 고객에게 알림 발송 |
| 공지사항 관리 | ✅ 완료 | 작성/수정/삭제, 고정/만료일 설정 |
| 관리자 알림 | ✅ 완료 | 신규가입/문의/탈퇴 알림, 읽음 처리 |
| 문의 처리 | ✅ 완료 | 알림 탭에서 문의 내용 확인 및 메모 |

---

## 6. 주요 비즈니스 플로우

### 6-1. 회원가입 → 승인 플로우

```
고객: [약관 동의] → [정보 입력] → status: PENDING 생성
                                   ↓
                              관리자 알림 자동 생성 (new_signup)
                                   ↓
관리자: [알림 확인] → [승인 대기 탭] → [승인 클릭]
                                   ↓
                              status: ACTIVE 변경 (고객 로그인 가능)
```

### 6-2. 고객 로그인 플로우

```
전화번호 + 비밀번호 입력
      ↓
  상태 확인
  ├── PENDING  → "관리자 승인 대기 중" 안내
  ├── WITHDRAWN → "탈퇴된 계정" 안내
  └── ACTIVE   → CustomerDashboard 이동
```

### 6-3. 포인트 관리 플로우

```
관리자: [고객 선택] → [포인트 적립/차감/조정]
                           ↓
              point_history 레코드 자동 생성
              customers.total_points 업데이트
              고객에게 알림(notification) 발송
                           ↓
고객: [포인트 내역] 에서 내역 확인 가능
```

### 6-4. 고객 문의 플로우

```
고객: [프로필 수정 페이지] → "관리자 문의" 링크
   또는 [로그인 페이지] → "비밀번호 찾기"
              ↓
       inquiries 테이블에 레코드 생성 (status: pending)
       admin_notifications에 알림 생성 (type: inquiry)
              ↓
관리자: [알림 탭] → 문의 내용 확인 → 고객 직접 연락
       → [문의 해결] 클릭 시 status: resolved 처리
```

---

## 7. UI/디자인 시스템

### 브랜드 색상

| 이름 | 헥스코드 | 용도 |
|------|---------|------|
| navy-800 | #1A237E | 주요 브랜드 색상, 버튼, 헤더 |
| navy-900 | #151B60 | 더 어두운 네이비, 호버 상태 |
| gold-400 | #FFD700 | 강조 색상, 배지, 포인트 표시 |
| gold-500 | #E6C200 | 더 어두운 골드 |

### 공통 컴포넌트

| 컴포넌트 | 변형 | 설명 |
|----------|------|------|
| `Button` | primary, secondary, gold, danger, ghost | 5가지 스타일의 버튼 |
| `Input` | - | 레이블 + 에러 메시지 포함 입력 필드 |
| `Card` | - | 모든 콘텐츠 섹션에 사용되는 카드 래퍼 |
| `AlertModal` | success, error, warning, info | 모든 성공/에러 메시지 표시용 모달 |

### AlertModal 패턴 (전 페이지 공통)

모든 페이지에서 아래 패턴으로 사용자 피드백 제공:
```typescript
const [alertModal, setAlertModal] = useState<AlertModalState>(initialAlertState);
const showAlert = (type, title, message) => setAlertModal({ isOpen: true, type, title, message });
```

---

## 8. 현재 알려진 이슈

| 이슈 | 심각도 | 내용 |
|------|--------|------|
| 비밀번호 평문 저장 | 중간 | 내부용으로 허용 상태, 해싱 미적용 |
| Tailwind CSS CDN | 낮음 | 빌드 최적화 미적용 (개발 편의상 CDN 사용) |
| 미사용 환경변수 | 낮음 | .env에 Firebase/Google Sheets 잔재 설정 |
| 비밀번호 재설정 OTP | 중간 | PasswordReset.tsx의 OTP가 고정값(123456), 실제 SMS 미연동 |
| 관리자 계정 단일 | 낮음 | admin 계정 하나만 존재 (다중 관리자 미지원) |

---

## 9. 잠재적 추가 개발 사항

HANDOVER.md 및 코드 분석을 바탕으로 한 개선 가능 항목:

| 우선순위 | 항목 | 설명 |
|----------|------|------|
| 높음 | 실제 SMS/OTP 연동 | 비밀번호 재설정 시 실제 본인인증 구현 |
| 중간 | PWA 지원 | 오프라인 모드, 홈화면 추가 설치 가능 |
| 중간 | 통계 대시보드 | 포인트 이용 현황, 고객 추이 시각화 |
| 중간 | 비밀번호 해싱 | bcrypt 등을 통한 보안 강화 |
| 낮음 | Tailwind 빌드 최적화 | CDN 대신 PostCSS 빌드 방식으로 전환 |
| 낮음 | 다중 관리자 지원 | 관리자 계정 추가/권한 관리 |

---

## 10. 관리자 접속 정보

| 항목 | 값 |
|------|-----|
| 접속 URL | 라이브 URL에서 우상단 "관리자" 버튼 |
| 아이디 | admin |
| 비밀번호 | cheongdam2024! |

---

## 11. 개발 환경 실행

```bash
npm install     # 의존성 설치
npm run dev     # 개발 서버 실행 (http://localhost:3000/cheongdam-partners-vip/)
npm run build   # 프로덕션 빌드
npm run preview # 빌드 결과물 미리보기
```

main 브랜치에 push 시 GitHub Actions가 자동으로 GitHub Pages에 배포합니다.

---

*최종 업데이트: 2026-02-22*
