# Architecture rules
- This standalone application uses Next App Router; browser UI never imports privileged clients.
- All board changes use a server API and a service-only database RPC that authorizes the actor and serializes quota checks.
- Storage access is mediated by the API; the private bucket has no browser upload policies.
- Every feature component owns an index.tsx and styles.css; shared tokens live in app/globals.css.
- Auth admission is enforced by a before-user-created database hook, not by profile counts in the UI.
- Attachments are reserved before upload and committed only after Storage succeeds; failed uploads release their reservation.
