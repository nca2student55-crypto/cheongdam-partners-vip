# 프로젝트 인계 문서

> 작성일: 2025-12-28
> 프로젝트: 청담 파트너 VIP

---

## 프로젝트 현황

### 배포 상태
- **라이브 URL**: https://nca2student55-crypto.github.io/cheongdam-partners-vip/
- **GitHub 저장소**: https://github.com/nca2student55-crypto/cheongdam-partners-vip
- **배포 방식**: GitHub Actions 자동 배포 (main 브랜치 push 시)

### 로컬 개발 환경
```bash
npm install     # 의존성 설치
npm run dev     # 개발 서버 실행 (http://localhost:3000)
```

---

## 완료된 작업 내역

### 1. 초기 프로젝트 설정
- React 19 + TypeScript + Vite 기반 프로젝트 구성
- Tailwind CSS (CDN) 스타일링 설정
- 커스텀 브랜드 색상 정의 (navy, gold)

### 2. 핵심 기능 구현
- **고객 관리**: 회원가입, 로그인, 비밀번호 재설정
- **포인트 시스템**: 포인트 적립, 이력 조회
- **알림 시스템**: 포인트 적립 알림
- **관리자 기능**: 고객 목록, 포인트 일괄 적립, 고객 정보 수정/삭제

### 3. UI/UX 개선 (최근 작업)
| 작업 내용 | 파일 | 상세 |
|----------|------|------|
| 관리자 버튼 위치 변경 | `pages/Main.tsx` | 하단 → 우측 상단으로 이동 |
| 브랜드명 수정 | 전체 | "청담 파트너스 VIP" → "청담 파트너 VIP" |
| 내 정보 수정 카드 추가 | `pages/CustomerDashboard.tsx` | 포인트 카드 아래에 프로필 수정 진입점 추가 |
| 로그아웃 확인 모달 | `pages/CustomerDashboard.tsx` | 뒤로가기 시 로그아웃 경고 팝업 |
| Card 컴포넌트 onClick 지원 | `components/UI.tsx` | 클릭 가능한 카드 지원 |

### 4. 배포 설정
- GitHub Pages 배포 워크플로우 구성 (`.github/workflows/deploy.yml`)
- Vite base path 설정 (`/cheongdam-partners-vip/`)
- importmap 충돌 해결 (Vite 번들 호환)

---

## 현재 프로젝트 구조

```
project/
├── App.tsx                 # 메인 앱 (상태 관리, 라우팅)
├── types.ts                # TypeScript 타입 정의
├── mockData.ts             # 초기 테스트 데이터
├── components/
│   └── UI.tsx              # 공통 UI 컴포넌트 (Button, Input, Card)
├── pages/
│   ├── Main.tsx            # 메인 화면
│   ├── Login.tsx           # 고객 로그인
│   ├── Signup.tsx          # 회원가입
│   ├── AdminLogin.tsx      # 관리자 로그인
│   ├── AdminDashboard.tsx  # 관리자 대시보드
│   ├── CustomerDashboard.tsx # 고객 대시보드
│   ├── ProfileEdit.tsx     # 프로필 수정
│   ├── PasswordReset.tsx   # 비밀번호 재설정
│   ├── PointHistory.tsx    # 포인트 이력
│   └── NotificationList.tsx # 알림 목록
└── .github/workflows/
    └── deploy.yml          # GitHub Pages 배포
```

---

## 데이터 저장 방식

현재 **localStorage** 사용 (백엔드 없음):
- `cp_customers` - 고객 목록
- `cp_point_history` - 포인트 이력
- `cp_notifications` - 알림 목록

---

## 다음 진행 사항 (제안)

### 우선순위 높음
1. **백엔드 연동**: 현재 localStorage → 실제 DB/API 연동 필요
2. **인증 강화**: 현재 평문 비밀번호 → 암호화 적용
3. **관리자 인증**: 하드코딩된 관리자 계정 → 보안 인증 시스템

### 우선순위 중간
4. **포인트 사용 기능**: 현재 적립만 가능, 사용/차감 기능 추가
5. **고객 검색/필터**: 관리자 대시보드에서 고객 검색 기능
6. **포인트 만료 시스템**: 포인트 유효기간 관리

### 우선순위 낮음
7. **PWA 지원**: 오프라인 사용, 홈 화면 추가
8. **푸시 알림**: 실시간 알림 기능
9. **통계 대시보드**: 포인트 적립/사용 통계 시각화

---

## 알려진 이슈

| 이슈 | 상태 | 비고 |
|-----|------|------|
| localStorage 데이터 브라우저별 분리 | 예상됨 | 백엔드 연동 시 해결 |
| 관리자 비밀번호 하드코딩 | 알려짐 | `pages/AdminLogin.tsx` 참조 |

---

## 참고 문서

- `CLAUDE.md` - 개발 가이드 및 아키텍처 문서
- `README.md` - 프로젝트 실행 방법

---

*이 문서는 프로젝트 인계를 위해 작성되었습니다.*
