# AWS deployment status

Target region: `ap-south-1` (Mumbai). Budget target: no incremental charges.
Do not treat Free Tier allowances or billing alerts as a hard spending cap.

## Environments

| Setting | Dev | Prod |
| --- | --- | --- |
| Website | `habbit-dev.abuk.in` | `habbit.abuk.in` |
| API path | `/api/*` on dev domain | `/api/*` on prod domain |
| Database | `pulse_dev` | `pulse_prod` |
| Lambda functions | separate dev API/reminders | separate prod API/reminders |
| JWT and VAPID keys | unique dev keys | unique prod keys |

Use separate Atlas users restricted to their environment database. Set
`NODE_ENV=production` for both hosted environments to enforce HTTPS and secret
validation. Dev refers to the deployment environment, not weaker security.

## Existing DNS verified 2026-09-27

Route 53 zone `abuk.in`, ID `Z07756052FLIKFJDVDRZW`:
`habbit.abuk.in` is a CNAME to `iridescent-nougat-231045.netlify.app`, TTL 300.
Keep that record until dev and the prod CloudFront endpoint pass verification.
Do not modify unrelated domain/mail records.

## Backend preparation

`server/src/lambda.ts` adapts the Express API for Lambda HTTP events and reuses
MongoDB connections. `server/src/reminders.lambda.ts` is a separate scheduled
entry point. The ordinary Node server remains available through `server.ts`.

Deployment still requires:

- Tighten Atlas users to their environment database (currently user-created roles).
- Reminder packaging, configuration and schedule permissions.
- CloudFront/S3 infrastructure, certificate validation, and uncached API behavior.
- An explicit origin authentication design: Lambda OAC changes signing and body
  hash requirements; do not enable it without testing authenticated POST/PATCH
  requests from both web and mobile clients.
- A shared authentication rate-limit store: process-local rate limiting alone
  is insufficient when Lambda scales across instances.
- Verification of CloudFront Free plan eligibility, S3 request charges and
  schedule/logging allowances. No provisioned concurrency, NAT Gateway, load
  balancer, or paid database tier is authorized by the zero-cost constraint.

## Release gates

Test signup/login, unauthorized access, cross-user isolation, habit CRUD/logging,
expenses, achievements, health checks, reminder scheduling, and dev/prod isolation.
Check SPA deep links, missing JS assets returning an error rather than HTML,
no caching of authenticated API responses, HTTPS, and CORS. Use test accounts.
Only switch production DNS after the new deployment is healthy. Retain the
previous DNS target and build for rollback.

## Atlas resources created 2026-09-27

- Pulse Dev project: `6ab959c17130c8fd8f40cb96`, cluster `pulse-dev`.
- Pulse Prod project: `6ab95a95afe0953276518636`, cluster `pulse-prod`.
- Both selected the Free tier ($0/hour), AWS Mumbai, 512 MB, without sample data
  or automatic security setup. Project listing confirms one cluster in each.
- Existing Project 0 / Cluster0 (about 139 MB) was preserved.
- Credentials and user-approved IPv4 access are configured. Both APIs pass live
  Lambda health tests against their respective clusters. Cross-user isolation
  and full application workflows still need live deployment checks.

## Lambda resources created 2026-09-27

Created `pulse-dev-api` and `pulse-prod-api` in Mumbai using Node.js 24.x,
x86_64, default basic Lambda logging execution roles, and handler `index.handler`.
User explicitly approved both functions and logging roles. Uploaded the same
`output/pulse-api.zip` to each; AWS confirmed both code updates. Bundle import
was verified locally. No public URL or trigger was created.

2026-09-28: Both APIs use 256 MB, a 20-second timeout and NODE_ENV=production.
User replaced the JWT secrets; both pass validation. Production's Mongo hostname
was corrected to `pulse-prod.h8do7pr.mongodb.net`, preserving its credentials.
Both API health invocations return HTTP 200 and `{"status":"ok"}`.

## CloudFormation adoption, 2026-09-28

Source: `infra/aws/backend.json`, `infra/aws/artifacts.json` and the deployment
runbook in `infra/aws/README.md`. No credentials are stored in these files.

- `pulse-artifacts`: CREATE_COMPLETE, private encrypted versioned S3 bucket
  `pulse-artifacts-061525403372-ap-south-1`; termination protection enabled.
- `pulse-dev-backend`: IMPORT_COMPLETE for existing API, role and logging policy.
- `pulse-prod-backend`: IMPORT_COMPLETE for existing API, role and logging policy.
- Both backend stacks have termination protection; imports did not replace code
  or broaden IAM permissions. All resources use Retain deletion policies.
- Imported code object key:
  `34c1b0b93967b2b8e6608485769929bf606d9f8c49ab16f09074d4eba56b88d5.zip`.
- Backend drift detection completed: all three resources in each stack IN_SYNC.
- `infra/aws/stack-policy.json` is prepared but not yet applied to either stack.
- `pulse-dev-api-access`: CREATE_COMPLETE after explicit public-access approval.
  Endpoint: `https://qijwmuwdtiylhfdxbqk7offevy0ccfvp.lambda-url.ap-south-1.on.aws/`.
- Reusable package script executed successfully; local Lambda HTTP checks passed
  health, unauthenticated rejection, registration, bearer-token access, missing
  route, and database reconnection. Newly packaged ZIP is not deployed; the
  imported functions retain the previously tested `34c1...88d5` artifact.

## Dev edge deployment, 2026-09-28

- `pulse-web-storage` in Mumbai: CREATE_COMPLETE. Private, encrypted, versioned
  buckets `pulse-dev-web-061525403372-ap-south-1` and
  `pulse-prod-web-061525403372-ap-south-1`. Dev contains 60 frontend files.
- `pulse-dev-edge` in us-east-1: UPDATE_COMPLETE. CloudFront distribution
  `E2X2V70BU4EGGK`, hostname `d15g90nayqn9rk.cloudfront.net`, Free plan ($0/month).
- Certificate issued for `habbit-dev.abuk.in`; private S3 OAC access scoped to
  this distribution. API path forwards all viewer values except Host, no cache.
- Live smoke checks through both Lambda URL and CloudFront passed registration,
  login, bearer tokens, habit create/read/update/log/delete, expense create/update/
  delete, profile and cross-user isolation. Disposable habits/expenses removed;
  four generated smoke user records remain in dev only.
- Web root and deep link HTTP 200; absent JS asset HTTP 403 XML (not HTML).
- `publish-dev-domain` completed: dev A/AAAA aliases published. Public DNS resolves;
  local resolver still has negative caching. HTTPS web and API returned 200 using
  the published IP with the real domain and normal certificate validation.
- `pulse-prod-api-access` change set `review-prod-public-http-origin` executed
  after approval on 2026-09-28; public URL created.
- Client build passed after fixing an optional regex-capture TypeScript error.

## Production deployment, 2026-09-28

Production is served at https://habbit.abuk.in by CloudFront E18BA9FG2FNXAP
(`d1up414yht3ywx.cloudfront.net`). The edge stack is CREATE_COMPLETE, subscription
ACTIVE / FREE. The private production S3 bucket contains the 60 verified web files.
The existing CNAME now targets CloudFront, retaining TTL 300; this record is
managed separately from CloudFormation. See infra/aws/README.md for rollback.

The backend stack is UPDATE_COMPLETE with shared MongoDB authentication counters.
Build, lint, Lambda integration and concurrent counter/expiration/429 tests passed.
Live origin and CloudFront tests passed login, authenticated CRUD, logging and
cross-user isolation. The same smoke suite also passed through habbit.abuk.in;
HTTPS web and health checks returned 200 and the browser login page had no console
errors. Six isolated smoke users remain; their test habits and expenses were removed.

Scheduled reminders and GitHub deployment automation remain pending. AWS hosting
usage outside free allowances can still incur charges.
