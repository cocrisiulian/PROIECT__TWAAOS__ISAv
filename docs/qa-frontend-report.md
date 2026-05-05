# Frontend QA Report

Date: 2026-04-30

## Summary

I ran the frontend Vitest suite and validated the main organizer and admin flows. The full suite is green after fixing test selectors and one over-mocked AuthGuard test.

## Findings

### 1. Stale test selectors in EventForm and UserManagementPage

- Severity: Low
- Type: Test maintenance issue
- Status: Fixed

The existing Vitest tests used older Romanian or mismatched labels that no longer matched the rendered English UI. This caused false failures in the test suite, not an application defect.

### 2. AuthGuard test over-mocked authStore

- Severity: Low
- Type: Test isolation issue
- Status: Fixed

The AuthGuard test mocked `authStore` too aggressively and hid the `isTokenExpired` and `getRoleFromToken` exports used by the component. That made the test fail even though the application code path was valid.

### 3. React Router future warnings in test output

- Severity: Informational
- Type: Environment warning
- Status: Observed

Vitest prints React Router v7 future-flag warnings during render-based tests. These are not failures, but they are worth tracking for a future dependency or router migration.

## Security / Functional Review

- No reproducible security vulnerability was confirmed in the flows exercised during this QA pass.
- Event creation validation works, including the end-date-after-start-date guard.
- User management creation validation works, and active users cannot be deleted from the UI.

## Test Cases Executed Successfully

- `src/__tests__/EventForm.test.jsx` - 4 tests passed
- `src/__tests__/UserManagementPage.test.jsx` - 3 tests passed
- `src/__tests__/AuthGuard.test.jsx` - 9 tests passed
- `src/__tests__/authStore.test.js` - 15 tests passed
- `src/__tests__/smoke.test.js` - 3 tests passed

## Validation

- Command: `npx vitest run`
- Result: 5 test files passed, 34 tests passed
