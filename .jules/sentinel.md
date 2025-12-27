## 2024-07-25 - Incomplete Data Sanitization
**Vulnerability:** Found a Stored XSS vulnerability in the `Contact` data type. The optional `Full Name` field was being rendered without sanitization.
**Learning:** The application uses a central sanitization function (`sanitizeParsedData` in `lib/store.ts`), but it was not being applied to all fields in the data types it processes. When new fields are added to types, they must also be added to the sanitization logic.
**Prevention:** Whenever a data type in `types/index.ts` is modified, the `sanitizeParsedData` function in `lib/store.ts` must be audited to ensure all string-based fields that could contain user-provided data are being properly sanitized with `sanitizeHTML`.
