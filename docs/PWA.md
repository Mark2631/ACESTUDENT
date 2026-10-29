# Progressive Web App behavior

Ace Student uses `public/manifest.webmanifest` and the `/icon.svg` app icon. In production, `app/pwa-register.tsx` registers `public/sw.js`.

The service worker deliberately has a narrow cache policy:

- Pre-caches only the static offline page, app icon and manifest.
- Caches versioned `/_next/static/` assets after successful requests.
- Uses the network for navigation and shows `/offline.html` only when navigation fails.
- Does not cache Supabase responses, authentication routes, API responses, user uploads, quiz attempts or personalised pages.

This is an offline fallback, not a promise that the full learning experience works without a connection. Authentication, live course data, quizzes, discussion spaces and signed downloads require connectivity.

## Release checks

1. Open the production site over HTTPS and confirm the app can be installed from the browser menu.
2. In browser DevTools → Application, confirm the manifest loads and the service worker activates.
3. Disable the network and navigate/reload: the offline page should appear without showing personal data.
4. Re-enable the network and reload; sign-in, course data and quiz retrieval should work normally.
5. Confirm no authenticated or Supabase response is stored in Cache Storage.

The Playwright smoke suite checks production service-worker registration and the manifest's app name/display mode. The offline navigation check should also be performed in a real browser before a broad release.
