# Pulse AWS infrastructure

Deploy in **ap-south-1**, account **061525403372**. Do not create a backend
stack normally while its named resources already exist: use resource import.

## Stacks

| Stack | Template | Ownership |
| --- | --- | --- |
| pulse-artifacts | artifacts.json | Private, encrypted, versioned deployment ZIPs |
| pulse-dev-backend | backend.json | Dev API, execution role, logging policy |
| pulse-prod-backend | backend.json | Prod API, execution role, logging policy |
| pulse-dev-api-access | api-access.json | HTTP function URL and URL-only invocation permissions |
| pulse-web-storage | web-storage.json | Separate private dev/prod web buckets in Mumbai |
| pulse-dev-edge | edge.json | CloudFront, Free plan, certificate, S3 access policy and dev DNS |
| pulse-prod-edge | edge.json | CloudFront, Free plan, certificate and S3 access policy; legacy CNAME managed separately |

The API adapts Express HTTP events, connects to its environment's Atlas database,
and serves the application's `/api` routes. It does not start a web listener or
cron scheduler. Its role grants **only CloudWatch log creation/writes**; database
access uses the separate Atlas credential. There are no wildcard AWS service
permissions, public invocation permissions, or scheduled jobs in this template.

## Adopt the existing functions

1. Create `pulse-artifacts` using `artifacts.json` and termination protection.
2. Run `./infra/aws/package-api.ps1` with Node.js 24 on PATH to package
   `server/src/lambda.ts` as `index.cjs` at the root of a ZIP. Upload to
   a SHA-256-addressed key in the artifacts bucket. The bucket must be in Mumbai.
3. CloudFormation → Create stack → With existing resources (import resources).
   Upload `backend.json`; import the three resources below. No replacements or
   creates belong in the import change set.
4. Set the environment, existing names, artifact bucket/key, and existing
   MongoUri/JwtSecret through masked parameters. Never put secrets in a template,
   committed parameters file, shell command, output, or stack metadata.
5. Review the IMPORT change set, execute, then run drift detection and a Lambda
   `/api/health` invocation. Resolve drift before any configuration update.
6. Enable termination protection on each backend stack and apply `stack-policy.json`
   to block accidental function/role/policy replacement or removal during updates.

| Environment | Function | Role | Policy name |
| --- | --- | --- | --- |
| dev | pulse-dev-api | pulse-dev-api-role-5v6d6ml2 | AWSLambdaBasicExecutionRole-5a2993e9-2646-4f3a-8a9d-dab802d0fdf8 |
| prod | pulse-prod-api | pulse-prod-api-role-muuvln2w | AWSLambdaBasicExecutionRole-d9f99791-45a9-490d-8de8-8239da214bf3 |

Both IAM resources use `/service-role/`. Import logical IDs are `ApiFunction`,
`ApiExecutionRole`, and `ApiLoggingPolicy`. Use the existing policy ARN as the
managed policy identifier. All three have Retain deletion/replacement policies.

## Future releases and audit

Upload a new immutable ZIP; create an UPDATE change set changing `ApiCodeKey`,
using previous values for other parameters (especially secrets). Review that it
modifies only the intended function, then deploy dev and test before prod.
Rollback by deploying the previous artifact key. Never overwrite a deployed ZIP.

CloudFormation Resources shows function → role → policy, Events shows deployment
history, Change sets shows planned changes, and drift detection flags console
edits. CloudWatch shows runtime logs; CloudFormation is not runtime tracing.

`NoEcho` masks parameters but authorized Lambda configuration readers can still
read environment variables. Do not export stack/function configuration to Git.

## Edge deployment

`web-storage.json` belongs in Mumbai. `edge.json` belongs in **us-east-1** because
CloudFront certificates and global WAF resources require that region. API compute
and web assets remain in Mumbai. The edge template creates a FREE-tier pricing
subscription; verify it is ACTIVE before routing traffic. It has no paid-tier
parameter or automatic paid upgrade. Lambda/S3/log charges outside allowances
are still possible; this is not an account-wide spending cap.

Deploy edge with `PublishDns=false`, verify the CloudFront hostname and authenticated
API operations, then change it to true in a reviewed change set. This creates A
and AAAA aliases only. **Do not set it true for prod while the existing CNAME is
present**: retain the previous target for rollback and perform the cutover as a
separate reviewed operation. Production has used CloudFront since 2026-09-28;
its legacy CNAME remains outside CloudFormation. See the production record below.

The public API uses CachingDisabled and AllViewerExceptHostHeader to preserve
bearer tokens, request bodies, queries and cookies. Only versioned `/assets/*`
uses CachingOptimized. The SPA function rewrites navigation paths; it never
converts a missing JS asset or an API error into HTML. The WAF ACL currently has
no filtering rules; its presence alone is not application-level abuse protection.

Build web with `VITE_API_BASE_URL=/api` and a fresh output folder. Upload root
files plus the `assets/` and `fonts/` directories, preserving paths. Never upload
the source tree or environment files. Keep older hashed assets for open tabs.

`node infra/aws/check-edge.mjs` tests navigation and missing-asset routing.
`node infra/aws/smoke-dev.mjs https://habbit-dev.abuk.in` tests the verified dev
host only. It creates two disposable user records, removes its habits/expenses,
and does not print passwords or tokens. These original smoke scripts do not
delete their generated user records; reinspect cleanup before using them.

Production endpoint/edge deployment, cutover and shared authentication counters
were completed in the release below. Notification keys and reminder scheduling
remain separate work.

`api-access.json` prepares a public Lambda URL origin without API Gateway charges.
Do not execute its change set until public access is approved. It grants only
invocation through the function URL, not general Lambda API invocation. Express
continues to enforce JWT authorization on protected routes. Login, registration
and health remain public. The origin is also directly reachable, so CloudFront
alone cannot protect it against abusive traffic or enforce an absolute cost cap.
The initial production exposure gate was satisfied by shared throttling and
live authorization/isolation tests below. Do not configure duplicate CORS in Lambda;
the Express app owns CORS. CloudFront must forward Authorization and disable
API response caching.

## Verified adoption status (2026-09-28)

The artifact and web-storage stacks are CREATE_COMPLETE. Both backend stacks are IMPORT_COMPLETE,
with termination protection enabled. Drift detection reports all six imported
resources IN_SYNC. No functions were replaced. The optional stack policy is not
yet applied. The dev API-access stack is CREATE_COMPLETE after user approval.
The dev edge stack is UPDATE_COMPLETE on the Free plan, including A/AAAA DNS
publication. Public DNS resolves; local resolver negative caching can delay access.
Custom-domain HTTPS web/API checks passed using the published address.
Direct-origin and CloudFront smoke checks passed registration/login,
habit and expense operations, logging, and cross-user isolation.
The production API-access change set `review-prod-public-http-origin` was approved
and executed. See the production release record below.

## Production release, 2026-09-28

- URL: https://habbit.abuk.in. CloudFront `E18BA9FG2FNXAP`,
  `d1up414yht3ywx.cloudfront.net`; subscription ACTIVE / FREE.
- `pulse-prod-edge` CREATE_COMPLETE in us-east-1, termination protection enabled.
- `pulse-prod-api-access` created the public Function URL:
  `https://6wnjxic2jkyhmd2hmoimfxksze0wobsa.lambda-url.ap-south-1.on.aws/`.
- `pulse-prod-backend` UPDATE_COMPLETE. Release key:
  `0ac25e6b269be877225c307c7844f554954b05915ae313230b8824f781ce37ea.zip`.
  Only the Lambda code changed; IAM roles and secret parameters were retained.
- Authentication counters now use atomic MongoDB updates shared across instances
  with TTL cleanup. Login attempts, including successful ones, count toward the limit.
  Limits remain per source IP; CloudFront origins can aggregate clients behind edge
  addresses. A trusted viewer identity strategy is needed before high-volume use.
- Existing Route 53 CNAME was edited in place to the CloudFront hostname (TTL 300).
  This legacy production DNS record remains outside CloudFormation. Keep
  `PublishDns=false` for prod: creating A/AAAA records conflicts with this CNAME.
- DNS rollback: restore CNAME `habbit.abuk.in` to
  `iridescent-nougat-231045.netlify.app`. The previous site was not deleted.
- Backend rollback: update ApiCodeKey to
  `34c1b0b93967b2b8e6608485769929bf606d9f8c49ab16f09074d4eba56b88d5.zip`.
- Live smoke tests use `node infra/aws/smoke-prod.mjs <verified-url>` and create
  isolated test users. Habits/expenses are removed; the original smoke script
  does not delete generated users. Never reuse real users for this script.
- Scheduled notifications are not deployed. GitHub automation is deferred.

## Latest web release, 2026-10-03

Dev and prod now serve the build from master `661ab7c`, including updated web
branding. Lambda and infrastructure were unchanged. Both domains passed exact
asset, MIME, deep-link, API health and unauthenticated access checks; both browser
login screens loaded without console errors. See
[the release record](../../docs/releases/2026-10-03-aws-web.md) for artifact
identities, completed invalidations and rollback instructions. Backend artifact
keys above describe the initial release, not the current backend deployment.
