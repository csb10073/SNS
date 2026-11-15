# PRD: SNS 웹 서비스 (가칭 "Gram")

- 버전: v0.1 (초안)
- 작성일: 2026-11-15
- 플랫폼: 웹 (반응형, 모바일 우선)
- 백엔드: Supabase (Auth / Postgres / Storage / Realtime)

---

## 1. 개요

### 1.1 목적
사용자가 사진과 글을 공유하고, 댓글·좋아요로 소통할 수 있는 가볍고 아름다운 SNS 웹 서비스를 만든다.

### 1.2 목표
- 가입부터 첫 게시글 작성까지 **3분 이내**에 완료할 수 있는 단순한 온보딩
- 핵심 소셜 루프(게시 → 좋아요/댓글 → 프로필)를 완성
- 인스타그램의 피드 경험 + 애플의 절제된 미니멀 디자인

### 1.3 범위
**In scope (MVP)**: 로그인/회원가입, 게시글 CRUD, 내 프로필, 댓글 CRUD, 좋아요
**Out of scope (추후)**: 팔로우/팔로워, DM, 스토리, 알림, 해시태그 검색, 신고/관리자 기능, 소셜 로그인

### 1.4 타깃 사용자
- 친구·지인과 일상을 공유하려는 10~30대
- 복잡한 기능보다 빠르고 보기 좋은 UI를 선호하는 사용자

---

## 2. 기능 요구사항

### 2.1 로그인 / 회원가입
| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| F-1.1 | 이메일 + 비밀번호로 회원가입 (비밀번호 8자 이상) | P0 |
| F-1.2 | 회원가입 시 사용자명(username, 고유값)과 표시 이름 입력 | P0 |
| F-1.3 | 이메일 + 비밀번호 로그인 / 로그아웃 | P0 |
| F-1.4 | 세션 유지 (새로고침 후에도 로그인 상태 유지) | P0 |
| F-1.5 | 비로그인 상태에서 보호된 페이지 접근 시 로그인 페이지로 리다이렉트 | P0 |
| F-1.6 | 비밀번호 재설정 (이메일 링크) | P1 |
| F-1.7 | 유효성 검사 및 오류 메시지 (중복 이메일, 잘못된 비밀번호 등) | P0 |

**수용 기준**
- 가입 완료 시 `profiles` 레코드가 자동 생성된다.
- 중복된 username으로는 가입할 수 없다.

### 2.2 게시글 쓰기 / 수정 / 삭제
| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| F-2.1 | 이미지(1장, 최대 5MB) + 본문(최대 2,200자)으로 게시글 작성 | P0 |
| F-2.2 | 이미지 없이 텍스트만 작성 가능 | P1 |
| F-2.3 | 본인 게시글의 본문 수정 (이미지 교체는 P2) | P0 |
| F-2.4 | 본인 게시글 삭제 (확인 모달, 연관 댓글·좋아요 함께 삭제) | P0 |
| F-2.5 | 메인 피드: 최신순 목록, 무한 스크롤(페이지당 10개) | P0 |
| F-2.6 | 게시글 상세 보기 (이미지, 본문, 작성자, 작성 시간, 좋아요/댓글 수) | P0 |
| F-2.7 | 수정됨 표시 (`edited`) | P2 |

**수용 기준**
- 타인의 게시글에는 수정/삭제 메뉴가 노출되지 않으며, API 레벨(RLS)에서도 차단된다.
- 이미지 업로드 실패 시 게시글이 생성되지 않는다.

### 2.3 내 프로필 페이지
| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| F-3.1 | 프로필 정보 표시: 아바타, username, 표시 이름, 소개글(bio), 게시글 수 | P0 |
| F-3.2 | 내가 쓴 게시글 그리드(3열 썸네일) 표시, 클릭 시 상세 이동 | P0 |
| F-3.3 | 프로필 편집: 아바타, 표시 이름, 소개글(최대 150자) | P0 |
| F-3.4 | 다른 사용자 프로필 조회 (`/[username]`) — 읽기 전용 | P1 |
| F-3.5 | 로그아웃 버튼 | P0 |

### 2.4 댓글 쓰기 / 수정 / 삭제
| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| F-4.1 | 게시글에 댓글 작성 (최대 500자) | P0 |
| F-4.2 | 본인 댓글 수정 | P0 |
| F-4.3 | 본인 댓글 삭제 (확인 후 삭제) | P0 |
| F-4.4 | 게시글 작성자는 자기 게시글의 모든 댓글 삭제 가능 | P1 |
| F-4.5 | 댓글 목록 시간순 정렬, 작성자 아바타·username 표시 | P0 |
| F-4.6 | 댓글 수 실시간 반영 | P1 |
| F-4.7 | 대댓글(답글) | Out of scope |

### 2.5 좋아요
| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| F-5.1 | 게시글 좋아요 / 취소 토글 (한 사용자당 게시글당 1회) | P0 |
| F-5.2 | 좋아요 수 표시, 내가 좋아요한 게시글은 하트 채움 상태로 표시 | P0 |
| F-5.3 | 낙관적 업데이트(Optimistic UI): 클릭 즉시 UI 반영, 실패 시 롤백 | P0 |
| F-5.4 | 이미지 더블탭으로 좋아요 (하트 애니메이션) | P1 |
| F-5.5 | 댓글 좋아요 | Out of scope |

---

## 3. 디자인 요구사항

### 3.1 컨셉
**"Instagram의 구조 × Apple의 절제미"**
- 인스타그램에서: 이미지 중심 카드형 피드, 하단 탭바(모바일), 3열 프로필 그리드, 하트 인터랙션
- 애플에서: 넉넉한 여백, 부드러운 라운드, 반투명 블러(glassmorphism), 얇고 선명한 타이포, 과하지 않은 색 사용

### 3.2 디자인 토큰
| 항목 | 규칙 |
|------|------|
| 폰트 | `-apple-system`, SF Pro 계열 → fallback Pretendard / Inter |
| 색상 | 배경 `#FFFFFF` / `#F5F5F7`, 텍스트 `#1D1D1F`, 보조 `#86868B`, 포인트 `#0071E3`, 좋아요 `#FF3B30` |
| 라운드 | 카드 16~20px, 버튼 12px / pill, 아바타 원형 |
| 그림자 | 아주 약하게(`0 1px 3px rgba(0,0,0,.06)`), 테두리는 `1px #E5E5EA` |
| 블러 | 상단 내비게이션·하단 탭바에 `backdrop-filter: blur(20px)` + 반투명 배경 |
| 모션 | 150~250ms ease-out, 좋아요 하트 스프링 애니메이션 |
| 다크 모드 | 시스템 설정 연동 (P1) |

### 3.3 화면 구성
| 화면 | 경로 | 설명 |
|------|------|------|
| 로그인 | `/login` | 중앙 카드, 이메일/비밀번호, 가입 링크 |
| 회원가입 | `/signup` | 이메일, 비밀번호, username, 이름 |
| 피드(홈) | `/` | 게시글 카드 리스트, 무한 스크롤 |
| 게시글 작성 | 모달 (`/` 위) 또는 `/new` | 이미지 업로드 + 본문 |
| 게시글 상세 | `/p/[id]` | 이미지, 본문, 좋아요, 댓글 목록/입력 |
| 프로필 | `/[username]` | 정보 + 게시글 그리드 |
| 프로필 편집 | `/settings/profile` | 아바타/이름/소개 |

### 3.4 반응형
- **모바일(< 768px)**: 단일 컬럼, 하단 탭바(홈 · 작성 · 프로필)
- **데스크톱**: 중앙 정렬 피드(최대 폭 ~470px) + 좌측 사이드 내비게이션

### 3.5 UX 원칙
- 로딩은 스켈레톤 UI, 빈 상태(empty state)에는 안내 문구 + CTA
- 삭제 등 파괴적 동작은 확인 모달
- 접근성: 키보드 포커스 표시, 이미지 alt, 명도 대비 WCAG AA

---

## 4. 기술 요구사항

### 4.1 스택
| 영역 | 선택 |
|------|------|
| 프론트엔드 | Next.js (App Router) + TypeScript |
| 스타일링 | Tailwind CSS |
| 백엔드/DB | Supabase (PostgreSQL) |
| 인증 | Supabase Auth (이메일/비밀번호) |
| 파일 저장 | Supabase Storage (`avatars`, `posts` 버킷) |
| 실시간 | Supabase Realtime (댓글·좋아요 수, P1) |
| 배포 | Vercel (프론트) + Supabase Cloud |

> **주의**: 이 프로젝트의 Next.js는 학습 데이터와 다른 breaking change가 있을 수 있다. 구현 전 `node_modules/next/dist/docs/`의 가이드를 확인한다. (`AGENTS.md` 참고)

### 4.2 데이터 모델

```sql
-- 프로필 (auth.users 1:1)
profiles (
  id          uuid primary key references auth.users on delete cascade,
  username    text unique not null check (char_length(username) between 3 and 20),
  display_name text,
  bio         text check (char_length(bio) <= 150),
  avatar_url  text,
  created_at  timestamptz default now()
)

-- 게시글
posts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  content     text check (char_length(content) <= 2200),
  image_url   text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
)

-- 댓글
comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references posts(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  content     text not null check (char_length(content) between 1 and 500),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
)

-- 좋아요
likes (
  post_id     uuid references posts(id) on delete cascade,
  user_id     uuid references profiles(id) on delete cascade,
  created_at  timestamptz default now(),
  primary key (post_id, user_id)
)
```

**인덱스**: `posts(created_at desc)`, `posts(user_id, created_at desc)`, `comments(post_id, created_at)`, `likes(user_id)`
**트리거**: `auth.users` 가입 시 `profiles` 자동 생성, `updated_at` 자동 갱신
**집계**: 좋아요/댓글 수는 view 또는 RPC로 조회 (MVP), 규모 확대 시 카운터 컬럼 도입

### 4.3 보안 (Row Level Security — 모든 테이블 활성화)
| 테이블 | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| profiles | 인증 사용자 전체 | 본인(트리거) | 본인만 | 본인만 |
| posts | 인증 사용자 전체 | `user_id = auth.uid()` | 본인만 | 본인만 |
| comments | 인증 사용자 전체 | `user_id = auth.uid()` | 본인만 | 본인 **또는** 게시글 작성자 |
| likes | 인증 사용자 전체 | `user_id = auth.uid()` | — | 본인만 |

**Storage 정책**: 업로드는 `{auth.uid()}/` 경로에만 허용, 읽기는 공개, 삭제는 본인 폴더만.
**기타**: `service_role` 키는 클라이언트에 노출 금지, 환경변수로 관리. 입력값은 서버/DB 양쪽에서 길이 검증, XSS 방지를 위해 텍스트는 이스케이프 렌더링.

### 4.4 비기능 요구사항
| 항목 | 기준 |
|------|------|
| 성능 | 피드 첫 로딩 LCP 2.5초 이내, 이미지는 최적화(리사이즈/lazy loading) |
| 반응성 | 좋아요 등 상호작용은 낙관적 UI로 즉시 반응 |
| 호환성 | 최신 Chrome / Safari / Edge / Firefox, iOS Safari, Android Chrome |
| 접근성 | WCAG 2.1 AA 지향 |
| 이미지 | 업로드 전 클라이언트 압축(최대 1080px), 허용 형식 jpg/png/webp |

---

## 5. 성공 지표 (MVP 이후 측정)
- 가입 → 첫 게시글 작성 전환율
- DAU / 1인당 일평균 좋아요·댓글 수
- 7일 재방문율
- 피드 LCP, 오류율

---

## 6. 개발 마일스톤

| 단계 | 내용 | 산출물 |
|------|------|--------|
| M0 | 프로젝트 세팅: Next.js, Tailwind, Supabase 연결, 디자인 토큰 | 빈 레이아웃 + 환경 구성 |
| M1 | DB 스키마·RLS·Storage 마이그레이션 | SQL 마이그레이션 |
| M2 | 인증: 회원가입/로그인/로그아웃/라우트 보호 | F-1.x |
| M3 | 게시글 CRUD + 피드 + 이미지 업로드 | F-2.x |
| M4 | 좋아요 + 댓글 CRUD | F-4.x, F-5.x |
| M5 | 프로필 페이지·편집 | F-3.x |
| M6 | 디자인 폴리싱(애니메이션, 다크 모드, 반응형), 접근성·성능 점검 | 릴리스 후보 |
| M7 | 배포 (Vercel + Supabase) | 프로덕션 |

---

## 7. 리스크 및 오픈 이슈
| 항목 | 내용 | 대응 |
|------|------|------|
| Next.js 버전 차이 | 최신 버전의 API 변경 가능성 | 구현 전 번들 문서 확인 |
| 이미지 비용/용량 | Storage 용량 증가 | 클라이언트 압축, 용량 제한 |
| 스팸·악성 콘텐츠 | MVP에 신고 기능 없음 | 추후 신고/관리자 기능 도입 |
| 이메일 인증 | 가입 이메일 확인 여부 | **결정 필요**: MVP에선 인증 생략 vs 필수 |
| 공개 범위 | 비로그인 사용자의 열람 허용 여부 | **결정 필요**: 현재는 로그인 필수로 가정 |
| 게시글 이미지 수 | 단일 vs 다중(캐러셀) | **결정 필요**: MVP는 1장, 이후 확장 |
