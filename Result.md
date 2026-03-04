# User Management Module — 종합 평가 보고서

> 작성일: 2026년 3월 5일  
> 평가 대상: Next.js 15 App Router + Auth.js v5 + Prisma + UploadThing + shadcn/ui 기반 유저 관리 모듈 (40개 파일)

---

## 1. 종합 평가 테이블

| 평가 기준                                                | 점수 (1-10) | 상세 이유 및 실제 발견된 문제 예시                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **가독성 (Readability)**                                 | **8 / 10**  | Server Component / Client Component 경계가 명확하게 분리되어 있고, 파일명·함수명이 역할을 잘 나타낸다. 단, `components/profile-form.tsx`의 `ProfileData`와 `components/admin-user-form.tsx`의 `UserData`가 거의 동일한 구조임에도 각 파일 내 지역 타입으로 중복 정의되어 있다. 또한 두 타입 모두 `role: string`으로 선언하여 실제 Prisma enum(`"USER" \| "ADMIN"`)보다 약한 타입을 사용하고 있다.                                                      |
| **작성 용이성 / 확장성 (Extensibility)**                 | **7 / 10**  | Zod 스키마를 단일 진실 공급원으로 사용하고 Server Actions를 한 곳에 집중한 구조는 탁월하다. 그러나 `lib/actions.ts` 한 파일에 auth·profile·admin 로직이 모두 혼재해 있어, 기능이 추가될수록 빠르게 비대해진다. 또한 Admin 유저 목록에 페이지네이션이 없어 유저 수가 많아지면 `db.user.findMany()` 전체 로드가 문제가 된다. 폼 에러도 첫 번째 필드 에러만 표시되어, 향후 필드별 인라인 에러로 전환 시 구조 변경이 필요하다.                             |
| **장기 안정성 / 드리프트 방지 (Long-running Stability)** | **7 / 10**  | Prisma 싱글턴 패턴으로 핫 리로드 연결 누수를 막은 점은 좋다. 단, JWT 세션 전략 특성상 **관리자가 다른 유저의 역할을 변경해도, 해당 유저가 재로그인하기 전까지 세션의 `role`이 갱신되지 않는다**. 이는 권한 상승/강등 즉시 반영이 안 되는 실질적 보안 드리프트다. 또한 인증 엔드포인트(`credentialsSignIn`, `registerUser`)에 레이트 리미팅이 없어 브루트포스에 취약하다.                                                                               |
| **소규모 실수 발생률 (Small Mistake Rate)**              | **6 / 10**  | 디버깅 리뷰에서 총 **8개 이슈** 발견. 심각도별 분류: **Critical 1건** — `callbackUrl`이 미들웨어에서 URL에 기록됐으나 로그인 액션이 `redirectTo: "/profile"`로 하드코딩되어 redirect-back-after-login이 완전히 동작하지 않음. **Important 3건** — DB 뮤테이션 4곳 전체에 try/catch 누락, 관리자 자기 역할 변경 서버사이드 가드 누락, `adminDeleteUser` await 누락. **Minor 4건** — 미사용 임포트 2건, `isDeletingAccount` finally 누락, dead code 1건. |
| **전반적 만족도 (Overall Satisfaction)**                 | **8 / 10**  | 계획된 18개 핵심 파일 + 필요 보조 파일을 모두 정확히 구현했고, shadcn/ui 컴포넌트 11개를 CLI 없이 직접 작성했음에도 표준 패턴을 유지했다. Auth.js v5 미들웨어·콜백·타입 증강 구조가 공식 권장 방식을 정확히 따랐다. 디버깅 리뷰 후 모든 이슈가 수정되었고 린터 오류 0건으로 마무리됐다.                                                                                                                                                                |

---

## 2. .cursorrules 에 추가할 5가지 규칙

```md
# .cursorrules

## Rule 1 — DB 뮤테이션은 반드시 try/catch로 감싼다

Prisma의 create/update/delete는 항상 try/catch로 감싸고,
catch 블록에서 사용자 친화적 메시지를 반환하거나 throw한다.
"Record to update not found" 같은 P2025 에러가 unhandled 500으로
노출되지 않도록 한다.

## Rule 2 — useSearchParams()는 항상 <Suspense>로 감싼다

useSearchParams()를 사용하는 컴포넌트는 반드시 별도의 named inner
component로 분리하고, export하는 페이지 컴포넌트에서 <Suspense>로
감싼다. 페이지 직접 사용은 금지한다.

## Rule 3 — Server Action의 동적 파라미터는 .bind() + 서버사이드 검증

userId 같은 동적 파라미터를 Server Action에 전달할 때는
.bind(null, param) 패턴만 사용한다. 서버 액션 내부에서도
해당 파라미터를 독립적으로 권한 검증해야 하며, UI에서만 검사하는
것으로 충분하지 않다 (예: 관리자 자기 역할 변경 방지).

## Rule 4 — onClick에서 Server Action 호출 시 반드시 async/await

onClick={() => someServerAction()} 패턴은 금지한다.
항상 onClick={async () => { await someServerAction(); }} 형태로
작성하고, 에러가 사용자에게 노출될 수 있도록 try/catch를 추가한다.
finally 블록에서 로딩 상태를 항상 리셋한다.

## Rule 5 — 컴포넌트 로컬 타입은 types/index.ts의 공유 타입을 우선한다

컴포넌트 파일 내부에 로컬 type alias를 선언하기 전에,
동일하거나 유사한 형태가 types/index.ts에 존재하는지 먼저 확인한다.
특히 DB 쿼리 결과 형태의 타입은 Prisma가 추론한 타입 또는
공유 타입을 재사용한다. role 필드는 string이 아닌
"USER" | "ADMIN" 리터럴 유니온으로 선언한다.
```

---

## 3. 다음 유사 규모 작업에서 개선할 3가지

### ① `lib/actions.ts` 도메인별 분리

현재 auth·profile·admin 로직이 단일 파일에 혼재해 있다.
다음 작업에서는 처음부터 `lib/actions/auth.ts`, `lib/actions/profile.ts`,
`lib/actions/admin.ts`로 분리하고 `lib/actions/index.ts`에서 re-export한다.
197줄짜리 단일 파일은 기능 추가 시 merge conflict와 가독성 저하를 유발한다.

### ② Admin 목록에 서버사이드 페이지네이션 + 검색 추가

현재 `db.user.findMany()` 전체 로드 + 클라이언트 필터 구조는
유저 1,000명 초과 시 쿼리 성능이 급격히 저하된다.
처음부터 `skip/take` 파라미터와 `where: { OR: [email, name] }` 검색을
서버에서 처리하도록 설계해야 한다. URL 쿼리 파라미터(`?page=2&q=john`)
기반으로 Server Component가 페이지를 수신하는 패턴이 적합하다.

### ③ JWT 역할 즉시 반영 전략 수립

JWT 세션 전략은 역할 변경 후 재로그인 전까지 세션이 갱신되지 않는다.
다음 작업에서는 이를 해결하기 위해 두 가지 옵션 중 하나를 선택해야 한다:

- **옵션 A**: Auth.js `jwt` 콜백에서 `trigger === "update"` 분기를 구현해
  `session.update()`로 클라이언트에서 즉시 갱신 트리거
- **옵션 B**: 중요한 권한 판단이 있는 라우트는 DB 세션(`strategy: "database"`)
  전략으로 전환해 매 요청마다 최신 role을 읽도록 설계

---

## 4. 가장 잘 유지된 한 가지

### ✦ Server Action / Client Component 경계의 완벽한 준수

전체 40개 파일에 걸쳐 단 한 곳도 Client Component에서 `fetch("/api/...")`를
호출해 뮤테이션을 수행하는 코드가 없다. 모든 데이터 변경은
`"use server"` 디렉티브가 선언된 `lib/actions.ts`를 통해서만 흐른다.
`useActionState` + form `action` 패턴, `.bind(null, param)` 패턴,
그리고 Server Component에서 직접 `auth()` / DB 쿼리를 처리하는 패턴이
18개 파일 전체에서 일관되게 유지됐다. 이는 데이터 흐름 추적을 단순화하고,
"뮤테이션이 어디서 일어나는지"를 명확히 정의하는 이 프로젝트의
가장 중요한 아키텍처 원칙으로, 처음부터 끝까지 단 한 번도 어긴 적이 없다.

---

_Report generated after full module review and 8-issue debug pass._
