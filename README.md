# Front end Technical Test

Angular single-page application that demonstrates a guarded auth flow, product selection, payment summary, and printable receipt.

## Tech Stack

- Angular 19 (standalone components + lazy-loaded routes)
- TypeScript (strict mode)
- RxJS + Angular `HttpClient`
- Browser `localStorage` for lightweight session persistence

## Functional Overview

1. User signs in from `/login` using a 2-step form (username then password).
2. App stores auth/user metadata in `localStorage`.
3. User enters `/dashboard`, browses paginated products, and selects line items.
4. Selection is passed to `/summary` via router navigation state.
5. User confirms payment and can open `/receipt` for printable output.

## Routing and Access Control

Routes are defined in `src/app/app.routes.ts`.

- `/login`: Public route.
- `/dashboard`: Protected by `AuthGuard`.
- `/summary`: Protected by `AuthGuard`.
- `/receipt`: Protected by `AuthGuard`.

`AuthGuard` currently checks only token presence (`auth_token`) in `localStorage` and redirects unauthenticated users to `/login`.

## Data Flow Notes

- Product and auth data are fetched from `https://dummyjson.com`.
- `dashboard -> summary -> receipt` uses router navigation state for selected items and totals.
- Navigation state is not persisted across hard refresh. Components defensively redirect to `/dashboard` when required state is missing.
- Receipt/customer fallbacks are generated when state/localStorage data is unavailable.

## Local Storage Keys

- `auth_token`: Access token used by route guard.
- `refresh_token`: Optional refresh token from auth response.
- `user`: Serialized user profile used for greetings and receipt labels.

## Development

Install dependencies:

```bash
npm install
```

Start dev server:

```bash
ng serve
```

App URL: `http://localhost:4200/`

## Build

```bash
ng build
```

Production artifacts are generated in `dist/`.


## Production Hardening Backlog

- Replace `localStorage` token checks with a proper auth service and token validation.
- Add HTTP interceptor for auth header injection and centralized error handling.
- Replace navigation-state passing with API-backed or store-backed payment state.
- Add unit tests for selection math, guard behavior, and login error handling.
- Add end-to-end coverage for login, checkout, and receipt print flows.
