# 프로젝트 인계 문서

> 최종 업데이트: 2026-01-01 (Supabase Realtime 실시간 동기화 구현)
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
5. **고객 문의 시스템** - 프로필 변경/비밀번호 찾기 문의 → 관리자 알림
6. **Supabase Realtime 실시간 동기화** - 데이터 변경 시 앱 자동 갱신 (새로고침 불필요)
7. **mockData 제거** - Supabase 백엔드 전용으로 전환 (테스트 더미 데이터 제거)

### 🚧 삭제된 기능
- **Firebase Phone Auth SMS 인증** - 제거됨 (reCAPTCHA 설정 문제로 인해)
- **mockData / localStorage 폴백** - 제거됨 (Supabase 전용으로 전환)

---

## ✅ 완료: Supabase Realtime 실시간 동기화

### 배경
- 회원가입, 공지 등록 등 데이터 변경 시 앱 재시작 없이는 업데이트가 반영되지 않았음
- Supabase Realtime을 통해 WebSocket 기반 실시간 데이터 동기화 구현

### 구현 내용

#### App.tsx - Realtime 구독
```typescript
// 구독 테이블: customers, notifications, announcements, point_history
const customersChannel = supabase
  .channel('customers-changes')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'customers' },
    (payload) => {
      // INSERT/UPDATE/DELETE 이벤트 처리
    }
  ).subscribe();
```

#### AdminDashboard.tsx - Realtime 구독
```typescript
// 구독 테이블: admin_notifications, customers, announcements
// 관리자 알림 실시간 수신, 승인 대기 목록 자동 갱신
```

### 주요 변경 파일
| 파일 | 변경 내용 |
|------|----------|
| `api/client.ts` | 변환 함수 4개 export (`toCustomer`, `toNotification`, `toAnnouncement`, `toAdminNotification`) |
| `App.tsx` | Realtime 구독 useEffect 추가, mockData/localStorage 제거 |
| `pages/AdminDashboard.tsx` | admin_notifications, customers, announcements 구독 추가 |

### Supabase Realtime 설정 (DB)
```sql
-- 테이블을 Realtime publication에 등록 (이미 완료됨)
ALTER PUBLICATION supabase_realtime ADD TABLE customers;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE point_history;
ALTER PUBLICATION supabase_realtime ADD TABLE admin_notifications;
```

### 실시간 동기화 동작
| 이벤트 | 자동 반영 |
|--------|----------|
| 새 회원가입 | 관리자 "승인 대기" 탭에 즉시 표시 |
| 고객 승인 | 고객 목록 즉시 갱신 |
| 포인트 적립/차감 | 고객 포인트 즉시 반영 |
| 공지 등록/수정 | 고객 앱에 즉시 표시 |
| 관리자 알림 | 알림 뱃지 즉시 갱신 |

### Realtime 동시 접속 한계 (Free Plan)
| 항목 | 제한 |
|------|------|
| 동시 연결 | 200개 |
| 월간 메시지 | 2백만 |
| 대역폭 | 5GB/월 |

---

## ✅ 완료: 고객 문의 및 관리자 알림 시스템

### 테이블 추가
#### inquiries
| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| customer_id | UUID | FK → customers (NULL 허용) |
| type | TEXT | 'profile_change' / 'password_reset' |
| content | JSONB | 문의 내용 (field, currentValue 등) |
| status | TEXT | 'pending' / 'resolved' |
| created_at | TIMESTAMPTZ | 자동생성 |

#### admin_notifications
| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| type | TEXT | 'new_signup' / 'inquiry' / 'withdrawal' |
| reference_type | TEXT | 'customer' / 'inquiry' |
| reference_id | UUID | 참조 ID |
| title | TEXT | 알림 제목 |
| content | TEXT | 알림 내용 |
| is_read | BOOLEAN | 읽음 여부 |
| created_at | TIMESTAMPTZ | 자동생성 |

### 문의 플로우
```
[고객 프로필 변경 문의]
프로필 수정 → "관리자 문의" 클릭 → inquiries 생성 → admin_notifications 생성

[비밀번호 찾기 문의]
로그인 → "비밀번호 찾기" → 이름/전화번호 입력 → inquiries 생성 → admin_notifications 생성
```

### 관리자 알림 UI
- AdminDashboard "알림" 탭에서 확인
- 알림 타입별 색상: 가입(녹색), 문의(파란색), 탈퇴(빨간색)
- 개별/전체 읽음 처리 가능

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
| reason | TEXT | 사유 |
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

---

## ✅ 완료: 공지사항/알림 UI 분리

### CustomerDashboard 헤더
```
[←]  청담 파트너스VIP  [📢] [🔔]
                      공지  알림
```

- **📢 공지사항 아이콘**: `CUSTOMER_ANNOUNCEMENTS` 페이지로 이동
- **🔔 알림 아이콘**: `NOTIFICATIONS` 페이지로 이동 (개인 알림만)

### localStorage 키 (현재 사용 중)
| 키 | 용도 |
|----|------|
| `cp_last_announcement_check` | 마지막 공지사항 확인 시간 (새 공지 뱃지용) |

> **참고**: `cp_customers`, `cp_point_history`, `cp_notifications` 키는 더 이상 사용하지 않음 (오프라인 폴백 제거됨)

---

## 프로젝트 구조

```
project/
├── App.tsx                    # 메인 앱 (상태 관리, 라우팅, Realtime 구독)
├── types.ts                   # TypeScript 타입 정의
├── index.tsx                  # 엔트리 포인트
├── index.html                 # HTML 템플릿
├── api/
│   ├── supabase.ts            # Supabase 클라이언트 초기화
│   └── client.ts              # Supabase API 클라이언트 + 변환 함수
├── components/
│   └── UI.tsx                 # 공통 UI 컴포넌트
├── pages/
│   ├── Main.tsx               # 메인 화면
│   ├── Login.tsx              # 고객 로그인 (PENDING 체크, 비밀번호 찾기)
│   ├── Signup.tsx             # 회원가입 (약관동의 → 폼 → 완료)
│   ├── AdminLogin.tsx         # 관리자 로그인 (비밀번호만)
│   ├── AdminDashboard.tsx     # 관리자 대시보드 (Realtime 구독 포함)
│   ├── CustomerDashboard.tsx  # 고객 대시보드 (📢공지 + 🔔알림 아이콘)
│   ├── CustomerAnnouncements.tsx  # 공지사항 목록
│   ├── ProfileEdit.tsx        # 프로필 수정 (관리자 문의 기능)
│   ├── PasswordReset.tsx      # 비밀번호 재설정
│   ├── PointHistory.tsx       # 포인트 이력
│   └── NotificationList.tsx   # 알림 목록 (개인 알림만)
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
| `mockData.ts` | Supabase 전용 전환으로 더 이상 사용 안함 (import만 제거, 파일은 존재) |

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
5. **실시간 동기화 테스트**: 브라우저 탭 2개 → 한쪽에서 데이터 변경 → 다른 탭에서 자동 반영 확인
6. **공지사항/알림 테스트**: 고객 로그인 → 대시보드 헤더에서 📢/🔔 아이콘 확인

---

## 참고 문서

- `CLAUDE.md` - 개발 가이드 및 아키텍처 문서
- `BACKEND_MIGRATION.md` - Supabase 마이그레이션 상세 문서

---

*최종 업데이트: 2026-01-01 - Supabase Realtime 실시간 동기화 구현, mockData/localStorage 제거*
