# 프로젝트 인계 문서

> 최종 업데이트: 2026-01-01 (공지사항/알림 UI 분리 완료)
> 프로젝트: 청담 파트너스 VIP

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
npm run build   # 프로덕션 빌드
```

---

## 🚨 현재 상태 요약

### ✅ 완료된 작업
1. **Supabase 백엔드 마이그레이션** - Google Sheets → Supabase 전환 완료
2. **회원가입 약관 동의 UI** - 개인정보보호법 준수 약관 동의 단계 추가
3. **회원가입 승인 시스템** - 관리자 승인 기반 회원가입 플로우 구현
4. **공지사항/알림 UI 분리** - 고객 대시보드에서 공지사항과 개인 알림 분리 표시

### 🚧 삭제된 기능
- **Firebase Phone Auth SMS 인증** - 제거됨 (reCAPTCHA 설정 문제로 인해)

---

## ✅ 완료: Supabase 백엔드

### 연결 정보
| 항목 | 값 |
|------|-----|
| Project URL | https://rbunpzizpkvouhdhxlih.supabase.co |
| Project Ref | rbunpzizpkvouhdhxlih |

### 테이블 스키마

#### customers
| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK, 자동생성 |
| name | TEXT | 고객명 |
| phone | TEXT | 전화번호 (UNIQUE) |
| password | TEXT | 비밀번호 (평문) |
| company | TEXT | 업체명 (기본값: '') |
| is_individual | BOOLEAN | 개인 여부 (기본값: true) |
| total_points | INTEGER | 보유 포인트 (기본값: 0) |
| status | TEXT | **'pending' / 'active' / 'withdrawn'** |
| memo | TEXT | 관리자 메모 |
| created_at | TIMESTAMPTZ | 가입일 |
| withdrawn_at | TIMESTAMPTZ | 탈퇴일 |

#### point_history
| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| customer_id | UUID | FK → customers |
| points | INTEGER | 포인트 금액 |
| type | TEXT | 'earn' / 'use' / 'adjust' |
| created_at | TIMESTAMPTZ | 자동생성 |

#### notifications
| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| customer_id | UUID | FK → customers |
| title | TEXT | 알림 제목 |
| content | TEXT | 알림 내용 |
| type | TEXT | **'system' / 'message' / 'announcement'** |
| is_read | BOOLEAN | 읽음 여부 |
| created_at | TIMESTAMPTZ | 자동생성 |

#### announcements
| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| title | TEXT | 공지 제목 |
| content | TEXT | 공지 내용 |
| is_active | BOOLEAN | 활성 여부 |
| is_pinned | BOOLEAN | 상단 고정 여부 |
| created_at | TIMESTAMPTZ | 자동생성 |
| expires_at | TIMESTAMPTZ | 만료일 (NULL = 무기한) |

#### admins
| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| username | TEXT | 로그인 ID (UNIQUE) |
| password | TEXT | 비밀번호 |
| name | TEXT | 관리자 이름 |
| created_at | TIMESTAMPTZ | 자동생성 |

### 관리자 계정
| 아이디 | 비밀번호 |
|--------|----------|
| admin | cheongdam2024! |

---

## ✅ 완료: 회원가입 승인 시스템

### 플로우
```
[회원가입 플로우]
메인 → 약관동의 → 회원가입 폼 → "승인 대기" 완료 화면 → 메인
                                    ↓
                            관리자 승인 후 로그인 가능

[관리자 승인 플로우]
관리자 로그인 → 관리자 대시보드 → "승인 대기" 탭 → 개별/일괄 승인
```

### 고객 상태 (UserStatus)
| 상태 | 한글 | 설명 |
|------|------|------|
| PENDING | 대기 | 회원가입 후 관리자 승인 대기 중 |
| ACTIVE | 활성 | 승인 완료, 로그인 가능 |
| WITHDRAWN | 탈퇴 | 탈퇴 처리됨 |

### 주요 변경 파일
| 파일 | 변경 내용 |
|------|----------|
| `types.ts` | UserStatus에 PENDING 추가 |
| `api/client.ts` | 상태 변환 로직 + 승인 API 3개 추가 |
| `pages/Signup.tsx` | PENDING 상태 생성 + 약관 동의 + 완료 화면 |
| `pages/Login.tsx` | PENDING 상태 로그인 차단 |
| `pages/AdminDashboard.tsx` | 탭 네비게이션 + 승인 대기 목록 UI |

### 승인 API (api/client.ts)
```typescript
api.getPendingCustomers()           // 대기 고객 목록 조회
api.approveCustomer(customerId)     // 단일 승인
api.approveCustomers(customerIds)   // 일괄 승인
```

---

## ✅ 완료: 회원가입 약관 동의

### 개인정보보호법 필수 고지 항목
1. **수집 목적**: VIP 고객 포인트 적립/관리, 서비스 안내
2. **수집 항목**: 필수(이름, 전화번호, 비밀번호), 선택(업체명)
3. **보유 기간**: 회원 탈퇴 시까지, 탈퇴 후 즉시 파기
4. **동의 거부권**: 거부 가능하나 서비스 이용 제한

### 회원가입 단계 (SignupStep)
```
TERMS → FORM → 완료
```

---

## ✅ 완료: 공지사항/알림 UI 분리

### 배경
- 관리자가 보내는 메세지와 공지사항을 고객이 볼 수 없었음
- CustomerAnnouncements 페이지가 존재했으나 접근 경로 없음
- NotificationList가 모든 알림 유형을 동일하게 표시

### 구현 내용

#### CustomerDashboard 헤더 변경
```
변경 전: [←]  청담 파트너스VIP  [🔔]
변경 후: [←]  청담 파트너스VIP  [📢] [🔔]
                              공지  알림
```

- **📢 공지사항 아이콘**: `CUSTOMER_ANNOUNCEMENTS` 페이지로 이동
  - 골드색 뱃지로 새 공지 개수 표시
  - 클릭 시 localStorage에 마지막 확인 시간 저장

- **🔔 알림 아이콘**: `NOTIFICATIONS` 페이지로 이동 (기존)
  - 빨간색 뱃지로 읽지 않은 알림 개수 표시
  - announcement 타입 제외 (개인 메세지/시스템 알림만)

### 주요 변경 파일
| 파일 | 변경 내용 |
|------|----------|
| `App.tsx` | announcements 상태 추가, CustomerDashboard에 props 전달 |
| `pages/CustomerDashboard.tsx` | 헤더에 공지 아이콘 추가, 새 공지 뱃지 로직 |
| `pages/NotificationList.tsx` | announcement 타입 필터링 |

### localStorage 키
| 키 | 용도 |
|----|------|
| `cp_last_announcement_check` | 마지막 공지사항 확인 시간 |
| `cp_customers` | 오프라인 폴백 - 고객 데이터 |
| `cp_point_history` | 오프라인 폴백 - 포인트 이력 |
| `cp_notifications` | 오프라인 폴백 - 알림 데이터 |

### 관련 API (api/client.ts)
```typescript
api.getActiveAnnouncements()                    // 활성 공지 조회 (만료 제외)
api.createAnnouncement(announcement)            // 공지 생성
api.updateAnnouncement(announcement)            // 공지 수정
api.deleteAnnouncement(id)                      // 공지 삭제
api.sendMessage(customerIds, title, content)    // 특정 고객에게 메세지 발송
api.sendMessageToAll(title, content)            // 전체 활성 고객에게 메세지 발송
```

---

## 프로젝트 구조

```
project/
├── App.tsx                    # 메인 앱 (상태 관리, 라우팅)
├── types.ts                   # TypeScript 타입 정의
├── index.html                 # HTML 템플릿
├── api/
│   ├── supabase.ts            # Supabase 클라이언트 초기화
│   └── client.ts              # Supabase API 클라이언트
├── components/
│   └── UI.tsx                 # 공통 UI 컴포넌트
├── pages/
│   ├── Main.tsx               # 메인 화면
│   ├── Login.tsx              # 고객 로그인 (PENDING 체크)
│   ├── Signup.tsx             # 회원가입 (약관동의 → 폼 → 완료)
│   ├── AdminLogin.tsx         # 관리자 로그인 (비밀번호만)
│   ├── AdminDashboard.tsx     # 관리자 대시보드 (탭: 승인대기 | 고객목록)
│   ├── CustomerDashboard.tsx  # 고객 대시보드 (📢공지 + 🔔알림 아이콘)
│   ├── CustomerAnnouncements.tsx  # 공지사항 목록 (고정공지 + 일반공지)
│   ├── ProfileEdit.tsx        # 프로필 수정
│   ├── PasswordReset.tsx      # 비밀번호 재설정
│   ├── PointHistory.tsx       # 포인트 이력
│   └── NotificationList.tsx   # 알림 목록 (개인 메세지/시스템 알림만)
└── .github/workflows/
    └── deploy.yml             # GitHub Pages 배포
```

---

## 삭제된 파일/폴더

| 파일/폴더 | 이유 |
|----------|------|
| `firebase/` | Firebase 제거 |
| `hooks/usePhoneAuth.ts` | SMS 인증 제거 |
| `google-apps-script/` | Google Sheets 제거 |

---

## 다음 진행 사항

### 우선순위 높음
1. **포인트 사용 기능** - 현재 적립만 가능, 사용/차감 기능 추가

### 우선순위 중간
2. **PWA 지원** - 오프라인 사용, 홈 화면 추가
3. **통계 대시보드** - 포인트 적립/사용 통계 시각화

---

## 알려진 이슈

| 이슈 | 상태 | 비고 |
|-----|------|------|
| 관리자 비밀번호 평문 저장 | 알려짐 | 내부용이므로 현 상태 유지 |
| Tailwind CDN 사용 | 알려짐 | 프로덕션에서는 PostCSS 권장 |

---

## MCP 연결 정보

### Supabase MCP (현재 사용)
```bash
claude mcp list  # supabase: ✓ Connected 확인
```

### Google Sheets MCP (더 이상 사용 안함)
- 서비스 계정 파일 존재하나 사용하지 않음

---

## 재시작 시 확인사항

1. **개발 서버**: `npm run dev` → http://localhost:3000/cheongdam-partners-vip/
2. **MCP 연결**: `claude mcp list` → supabase 연결 확인
3. **회원가입 테스트**: 약관 동의 → 폼 작성 → "승인 대기" 화면 표시
4. **관리자 승인 테스트**: 관리자 로그인 → 승인 대기 탭 → 승인 버튼
5. **공지사항/알림 테스트**: 고객 로그인 → 대시보드 헤더에서 📢/🔔 아이콘 확인 → 각각 별도 페이지 이동

---

## 참고 문서

- `CLAUDE.md` - 개발 가이드 및 아키텍처 문서
- `BACKEND_MIGRATION.md` - Supabase 마이그레이션 상세 문서

---

*최종 업데이트: 2026-01-01 - 공지사항/알림 UI 분리 완료*
