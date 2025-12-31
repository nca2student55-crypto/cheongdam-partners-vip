# 백엔드 마이그레이션 완료 문서

> 완료일: 2026-01-01
> 작업: Google Sheets + Firebase → Supabase 전환

---

## ✅ 마이그레이션 완료

### 완료된 작업

1. **Supabase 테이블 생성 (4개)**
   - `customers` - 고객 정보
   - `point_history` - 포인트 이력
   - `notifications` - 알림
   - `admins` - 관리자 계정

2. **프론트엔드 코드 수정**
   - `api/supabase.ts` - 신규 생성
   - `api/client.ts` - Supabase 로직으로 전면 교체
   - `types.ts` - SignupStep 제거, Admin 타입 추가
   - `pages/Signup.tsx` - SMS 인증 제거, 단순 회원가입
   - `pages/Login.tsx` - Supabase API 연동
   - `pages/AdminLogin.tsx` - admins 테이블 조회
   - `pages/AdminDashboard.tsx` - 비밀번호 초기화 버튼 추가

3. **불필요한 파일 삭제**
   - `firebase/` 폴더 삭제
   - `hooks/usePhoneAuth.ts` 삭제
   - `google-apps-script/` 폴더 삭제
   - `index.html`에서 recaptcha-container 제거
   - firebase 패키지 삭제

---

## Supabase 연결 정보

```
Project URL: https://rbunpzizpkvouhdhxlih.supabase.co
Project Ref: rbunpzizpkvouhdhxlih
```

---

## 관리자 계정

| 아이디 | 비밀번호 |
|--------|----------|
| admin | cheongdam2024! |

---

## 테이블 스키마

### customers
| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK, 자동생성 |
| name | TEXT | 고객명 |
| phone | TEXT | 전화번호 (UNIQUE) |
| password | TEXT | 비밀번호 (평문) |
| company | TEXT | 업체명 (기본값: '') |
| is_individual | BOOLEAN | 개인 여부 (기본값: true) |
| total_points | INTEGER | 보유 포인트 (기본값: 0) |
| status | TEXT | 'active' / 'withdrawn' |
| memo | TEXT | 관리자 메모 |
| created_at | TIMESTAMPTZ | 가입일 |
| withdrawn_at | TIMESTAMPTZ | 탈퇴일 |

### point_history
| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| customer_id | UUID | FK → customers |
| points | INTEGER | 포인트 금액 |
| type | TEXT | 'earn' / 'use' / 'adjust' |
| created_at | TIMESTAMPTZ | 자동생성 |

### notifications
| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| customer_id | UUID | FK → customers |
| title | TEXT | 알림 제목 |
| content | TEXT | 알림 내용 |
| is_read | BOOLEAN | 읽음 여부 |
| created_at | TIMESTAMPTZ | 자동생성 |

### admins
| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| username | TEXT | 로그인 ID (UNIQUE) |
| password | TEXT | 비밀번호 |
| name | TEXT | 관리자 이름 |
| created_at | TIMESTAMPTZ | 자동생성 |

---

## 변경 사항 요약

| 항목 | 이전 | 이후 |
|------|------|------|
| 백엔드 | Google Sheets + Apps Script | Supabase (PostgreSQL) |
| SMS 인증 | Firebase Phone Auth | 제거 |
| 관리자 인증 | 하드코딩 | admins 테이블 조회 |
| 비밀번호 재설정 | OTP 방식 | 관리자 직접 초기화 |

---

*마지막 업데이트: 2026-01-01*
