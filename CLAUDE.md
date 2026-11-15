# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

SNS 웹 서비스 "Gram" (Next.js App Router + Tailwind CSS v4 + Supabase). 요구사항은 `PRD.md`에 있으며, 기능 ID(F-x.x)와 마일스톤(M0~M7)이 정의되어 있다.

**현재 상태: UI + Supabase 연동 완료 (M1~M5).** 스키마·RLS·Storage·Realtime은 Supabase MCP 마이그레이션(`init_schema_rls_storage`, `comments_realtime`)으로 적용됨. 목업(`lib/mock.ts`)은 삭제됨.
- 조회는 `lib/queries.ts`(서버·브라우저 클라이언트 공용), 쓰기는 각 클라이언트 컴포넌트에서 브라우저 클라이언트로 직접 수행하고 RLS가 권한을 강제한다. 서버 페이지는 `lib/session.ts`의 `requireMe()`(Suspense 안에서 호출)로 현재 사용자를 얻는다.
- 비로그인 리다이렉트(F-1.5)는 `utils/supabase/middleware.ts`의 `updateSession`이 `proxy.ts`에서 수행. 새 공개 경로는 `PUBLIC` 배열에 추가.
- username은 DB 체크 제약으로 `^[a-z0-9_]{3,20}$` + 예약어 제한. 새 최상위 정적 경로를 만들면 `profiles` 체크 제약의 예약어 목록과 `signup/page.tsx`의 `RESERVED`에도 추가할 것.
- 스키마 변경 후 `lib/database.types.ts`를 MCP `generate_typescript_types`로 갱신.
- 이메일 인증 사용 여부는 Supabase 대시보드(Auth 설정)에서 결정 — 켜져 있으면 가입 후 인증 메일 안내 화면이 뜬다.

## 명령어

```bash
npm run dev     # 개발 서버 (http://localhost:3000)
npm run build   # 프로덕션 빌드 — 타입 검사 + 프리렌더 검증을 겸하므로 변경 후 확인용으로 유용
npm run lint    # ESLint
```

테스트 러너는 설정되어 있지 않다.

## Next.js 주의사항 (중요)

`AGENTS.md`에 명시된 대로 이 Next.js(16.x)는 학습 데이터와 다르다. 코드 작성 전 `node_modules/next/dist/docs/`의 관련 문서를 먼저 읽을 것. 이미 확인된 차이점:

- **`next.config.ts`에 `cacheComponents: true`, `partialPrefetching: true`**가 켜져 있다. 런타임 데이터(`params`, `usePathname()`, `cookies()` 등)를 쓰는 컴포넌트는 반드시 `<Suspense>`로 감싸야 하며, 아니면 `next build`가 프리렌더 단계에서 실패한다. (예: `app/(main)/layout.tsx`의 `SideNav`/`TabBar`, 동적 라우트 페이지의 `Content` 컴포넌트)
- `middleware`가 아니라 **`proxy.ts`**를 사용한다. 현재는 `utils/supabase/middleware.ts`의 세션 갱신 클라이언트를 그대로 반환할 뿐이며, 비로그인 리다이렉트(F-1.5)는 아직 구현되지 않았다.
- 페이지/레이아웃 props 타입은 전역 헬퍼 `PageProps<"/p/[id]">`, `LayoutProps<"/">`를 사용하고, `params`는 `Promise`다.

## 아키텍처

**라우트 그룹 두 개로 레이아웃을 분리한다.**
- `app/(auth)/` — 로그인·가입·비밀번호 재설정. 중앙 카드 레이아웃, 내비게이션 없음.
- `app/(main)/` — 피드(`/`), `/new`, `/p/[id]`, `/[username]`, `/settings/profile`. 모바일은 하단 `TabBar`, 데스크톱(`md:`)은 좌측 `SideNav` + 최대 470px 중앙 컬럼.
- `/[username]`은 최상위 동적 세그먼트이므로 `/login`, `/new` 등 정적 경로가 우선한다. **새 최상위 정적 경로를 추가하면 같은 이름의 username과 충돌**한다는 점에 유의.

**서버/클라이언트 경계.** 페이지(`page.tsx`)는 서버 컴포넌트로 두고 `Suspense` + `await params`만 담당하며, 상태가 있는 UI(좋아요, 댓글 편집, 폼)는 `components/`의 `"use client"` 컴포넌트에 있다.
- `components/post-card.tsx`가 좋아요 낙관적 업데이트 훅 `useLike`, `PostImage`(더블탭 좋아요), `PostMenu`를 export하며 `components/post-detail.tsx`가 재사용한다. 좋아요 동작을 바꾸면 피드와 상세 양쪽에 영향이 간다.
- `components/ui.tsx`에 `Avatar`, `Icon`(인라인 SVG), `ConfirmModal`, `EmptyState`, 공통 입력/버튼 클래스(`inputCls`, `primaryBtn`)가 모여 있다. 아이콘 라이브러리는 쓰지 않는다.
- 게시글 이미지는 Storage `posts` 버킷의 공개 URL(`Post.imageUrl`), 아바타는 `avatars` 버킷. 업로드 경로는 `{uid}/{uuid}.{ext}`, 업로드 전 `lib/image.ts`로 압축. `gradient()`는 아바타 폴백에만 쓴다.

**스타일링.** Tailwind v4(CSS-first, `tailwind.config` 없음). 디자인 토큰은 `app/globals.css`의 CSS 변수(`--bg`, `--fg`, `--accent`, `--like` …)로 정의하고 `@theme inline`으로 `bg-subtle`, `text-muted`, `border-line` 같은 유틸리티에 매핑한다. 다크 모드는 `prefers-color-scheme`로 변수 값만 바꾼다. 하드코딩 색상 대신 이 토큰을 쓸 것. 블러 배경은 `.glass` 클래스.

**Supabase.** `utils/supabase/{client,server,middleware}.ts`가 `@supabase/ssr` 클라이언트를 제공한다. 환경변수는 `.env.local`의 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. `.mcp.json`으로 Supabase MCP 서버가 프로젝트에 연결되어 있어 스키마·마이그레이션 작업에 쓸 수 있다. 스키마·RLS·Storage 정책 명세는 `PRD.md` 4.2~4.3절을 따른다.

## 기타

- 경로 별칭: `@/*` → 프로젝트 루트.
- UI 문구는 한국어, `<html lang="ko">`.
- 상위 폴더(`C:\Users\csb10`)에 `package-lock.json`이 있어 빌드 시 Turbopack root 경고가 뜬다. 무시해도 되며, 필요하면 `next.config.ts`에 `turbopack.root`를 지정한다.
