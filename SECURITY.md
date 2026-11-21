# Security

## Threat Model

| Threat | Attack surface or impact | Likelihood | Impact | Mitigation | Residual risk |
|---|---|---|---|---|---|
| Input injection | City names or coordinates submitted to APIs or displayed in UI | Medium | Medium | Zod schemas, Unicode city-name allow-list, coordinate bounds, React text rendering | Safe if schemas stay in sync with routes |
| SSRF | Manipulation of upstream destinations | Low | High | Exact allow-list for two Open-Meteo hosts, fixed URL construction, no user-provided schemes or hosts | Open-Meteo compromise remains outside application control |
| XSS | Injected city text or upstream values rendered by the browser | Low | High | No `dangerouslySetInnerHTML`, React escaping, CSP, generic error responses | Browser-plugin or dependency vulnerabilities remain possible |
| CORS abuse | Unapproved origins calling the API | Medium | Medium | Explicit origin allow-list and credential-free requests | Misconfigured deployment origin could increase exposure |
| Request flooding | CPU, bandwidth, or upstream exhaustion | Medium | High | 100 requests per minute rate limit, 16 KB JSON limit, timeouts | Distributed attacks require infrastructure controls |
| Denial of service | Slow upstream, cache churn, or malformed responses | Medium | Medium | 8-second abort timeout, bounded 10-minute caches | Sustained upstream failure may still delay responses |
| Secret exposure | API or environment keys committed or sent to browser | Low | High | `.env` ignored, example-only values, server-only variables | Operator environment misconfiguration remains possible |
| Dependency compromise | Vulnerable or malicious packages | Medium | High | Pinned versions, `npm audit --audit-level=high`, CI audit | Newly published advisories may predate the next audit |
| Data freshness abuse | Stale or incorrect cached readings | Low | Medium | 10-minute server and client cache TTLs | Cached readings may be at most 10 minutes old |
| Privacy exposure | Location or city data sent upstream | Medium | Medium | Coordinates only sent after an explicit action, browser-consent geolocation, no profile storage | Open-Meteo receives the selected location |

## Mitigations

- Zod validates city names and coordinate ranges; unsafe inputs return a generic 400.
- The server rejects upstream hosts outside an explicit two-host allow-list.
- Outbound requests use eight-second abort timeouts.
- Helmet sets security headers and a restrictive CSP.
- Permissions-Policy, Referrer-Policy, and X-Content-Type-Options are explicitly set.
- CORS uses an explicit origin allow-list.
- Express rate limiting limits repeated traffic.
- JSON requests are limited to 16 KB and secrets remain server-side.
- React text rendering is used; no HTML injection API is used.
- API and client caches are 10-minute TTL caches.
- Dependencies are pinned and audited with `npm run audit`.
- Client and upstream errors do not expose stack traces.
