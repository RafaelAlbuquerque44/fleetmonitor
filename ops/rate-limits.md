# Edge rate limits

The application does not implement IP-based throttling. Apply these limits at the public reverse proxy, API gateway, or WAF before traffic reaches FleetMonitor:

| Method and path | Limit | Key |
| --- | --- | --- |
| `POST /api/auth/login` | 5 requests per IP per rolling minute | Client IP resolved by the trusted edge |
| `POST /api/contact` | 5 requests per IP per rolling hour | Client IP resolved by the trusted edge |

Return HTTP `429 Too Many Requests` and a useful `Retry-After` header when a limit is exceeded. Do not apply these low limits to all API routes or to authenticated users globally.

The edge must be the only public path to the application. Keep the API and PostgreSQL on private networks; otherwise clients can bypass edge rules. If a trusted upstream load balancer sits in front of the edge, configure its exact source addresses and real-IP handling explicitly. Never trust arbitrary client-supplied `Forwarded`, `X-Forwarded-For`, or `X-Real-IP` values as the rate-limit key.

Monitor 429 counts and adjust only after reviewing legitimate shared-NAT traffic. Do not log request bodies, passwords, cookies, or session tokens while investigating abuse.
