# M14 — Janani Production Release Gate

Status: **gate framework ready / release blocked**

M14 is the final evidence gate. It does not become green because the app compiles or because earlier milestones have code on branches. Every required gate below must reference evidence for the exact release candidate commit/build.

## Release rule

Janani may be marked production-release-ready only when:

- all mandatory gates are PASS,
- there are zero open P0/P1 defects,
- all safety/privacy P2 findings are resolved and re-tested,
- clinical content used by production has explicit approval/version evidence,
- production services are deployed from the reviewed release source,
- physical-device evidence references the release candidate build,
- rollback/support procedures exist.

A blocked external dependency remains a BLOCKED gate; it must never be silently converted to PASS because the corresponding source code exists.

## Current blocker summary

These blockers are known from the redesign branches and must be re-verified at release time:

| Gate | Current state | Why it blocks |
|---|---|---|
| Clinical production rules | BLOCKED | M6 infrastructure exists but there are no clinician-reviewed, source-backed active production clinical packs. |
| Report-reading production provider | BLOCKED / needs verification | Report extraction infrastructure exists, but representative production-provider validation is still required. |
| Ask Janani M11/M12 backend deployment | BLOCKED | Updated Edge Function source exists, but connected deployment permission is currently unavailable; live production version must be verified against release source. |
| Localized critical safety copy | BLOCKED | Telugu/Hindi general UI foundation exists; urgent/attention clinical wording still requires reviewed localized copy before full safety localization can be claimed. |
| Physical mother/partner validation | BLOCKED | M13 harness exists; required real two-device sessions have not yet been recorded. |
| Clinician UX/content review | BLOCKED | Release content and critical wording require version-specific clinician review evidence. |
| Final security/privacy review | PENDING | Must be re-run against release candidate, including auth/RLS, privacy cleanup, account lifecycle and production platform settings. |
| Signed release artifact | PENDING | Final release AAB/build/signing/versioning and installation/upgrade evidence must be tied to the release candidate. |

This table is a starting state, not a permanent source of truth. Update it only from evidence.

## Gate 1 — Source and branch integrity

- [ ] Release candidate commit SHA recorded.
- [ ] Intended redesign/clinical migrations are present in release history.
- [ ] No temporary one-off write workflows/scripts remain.
- [ ] No debug-only bypass, demo credential, test secret or disabled safety check is present.
- [ ] Repository quality workflow passes from the exact release candidate.
- [ ] Working tree/release branch contains no unreviewed generated changes.
- [ ] Release notes list material user-facing, privacy, AI and clinical-behaviour changes.

Evidence:

- Release SHA:
- Quality run:
- Review/PR references:

## Gate 2 — Clinical safety content

Mandatory before condition-specific production guidance is enabled.

- [ ] Every production clinical pack is immutable/versioned.
- [ ] Every active pack has verified sources and review dates.
- [ ] Qualified clinician reviewer/credentials are recorded in the approved clinical record.
- [ ] Effective/expiry dates are correct.
- [ ] Payload hash matches the approved version.
- [ ] Deterministic rule tests cover positive, negative and boundary cases.
- [ ] False-reassurance tests pass.
- [ ] Conflict policy has no unresolved production conflict.
- [ ] AI cannot retrieve/use draft, pending, rejected, expired or superseded rules.
- [ ] Emergency/red-flag rules have clinician-approved urgency/actions.
- [ ] No raw ultrasound-image diagnosis or unsupported fetal-abnormality interpretation is enabled.
- [ ] No autonomous medicine start/stop/dose change exists.

If there are **zero approved production packs**, Janani must remain fail-closed for condition-specific clinical recommendations and the release scope must state that limitation clearly.

Evidence:

- Clinical pack versions:
- Clinician approval record:
- Safety test run:

## Gate 3 — Reports and medical-document safety

- [ ] Production report storage bucket/privacy policies verified.
- [ ] Image/PDF size/type restrictions verified.
- [ ] Extraction provider configured with approved production credentials.
- [ ] Provider data handling/privacy review completed.
- [ ] Representative synthetic/consented reports tested across supported formats.
- [ ] Low-confidence/unreadable reports do not produce trusted guessed values.
- [ ] Proposed extraction remains untrusted until mother confirms/corrects it.
- [ ] Rejected values never enter trusted context.
- [ ] Unit/reference-range/provenance fields survive confirmation.
- [ ] Raw report files are not automatically sent through Ask Janani chat.
- [ ] Partner cannot access reports by UI, API or storage path unless a future explicit reviewed sharing feature exists.
- [ ] Raw ultrasound/prenatal image path does not independently diagnose abnormalities.
- [ ] Fetal-sex extraction/unsupported sensitive inference remains blocked.

Evidence:

- Provider/config version:
- Test corpus reference:
- Storage/RLS test:
- Device report-upload session:

## Gate 4 — Ask Janani production deployment

- [ ] Live `janani-ai` deployment source/version matches release candidate source.
- [ ] JWT verification is enabled.
- [ ] Provider URL/model/config are production-approved.
- [ ] API secret is server-side only and absent from app bundle/repo.
- [ ] Timeouts/upstream failures return safe unavailable responses.
- [ ] Mother personalization consent defaults OFF and is reversible.
- [ ] Partner cannot resolve mother-private personalization context.
- [ ] Server checks role and consent; client claims cannot bypass them.
- [ ] Context is minimized/sanitized and internal IDs/raw files are excluded.
- [ ] Clinical safety executes before any model call for mother requests.
- [ ] Urgent/care-contact paths bypass model reassurance.
- [ ] No approved clinical content means no model classification of labs/BP/glucose/report values.
- [ ] `janani-tone-v1` live behaviour matches reviewed source.
- [ ] Supported response-language handling matches reviewed source.
- [ ] Rate/cost/abuse limits appropriate for production scope are configured.
- [ ] Logs do not store unnecessary health prompt/context data.

Evidence:

- Live function version/deployment timestamp:
- Source commit:
- JWT status:
- Provider smoke tests:

## Gate 5 — Emotional tone and language

- [ ] Supportive copy is warm/natural without generic chatbot language.
- [ ] Uncertainty copy does not fill gaps with reassurance.
- [ ] Attention wording leads with care-contact action.
- [ ] Urgent wording is action-first and not softened.
- [ ] Sensitive/loss wording avoids clichés, blame, prediction and forced positivity.
- [ ] English high-impact copy reviewed.
- [ ] Telugu core UI/script rendering reviewed on device.
- [ ] Hindi core UI/script rendering reviewed on device.
- [ ] Missing translation keys fall back to English safely.
- [ ] Translation cannot change clinical thresholds/actions/medicine meaning.
- [ ] Critical urgent/attention translations are clinician/language reviewed before claiming those languages fully safety-localized.
- [ ] Mother and partner account language preferences remain independent.

Evidence:

- Translation catalog version:
- Language device sessions:
- Critical-copy approval reference:

## Gate 6 — Partner privacy

- [ ] Pregnancy progress sharing OFF hides progress in partner UI.
- [ ] Pregnancy progress sharing OFF also blocks direct partner pregnancy SELECT/API access as designed.
- [ ] Care timeline defaults OFF.
- [ ] Care timeline ON exposes only intended appointment fields.
- [ ] Turning sharing OFF while partner app is open removes data after invalidation/refresh.
- [ ] Partner has no mother Health/report/private-medication context access.
- [ ] Partner Ask Janani remains general-only.
- [ ] Mother-private realtime invalidations are not delivered over family channel.
- [ ] Disconnect/leave removes partner access and cached family state.

Evidence:

- RLS/API regression:
- Two-device M13 session:

## Gate 7 — Authentication and account lifecycle

- [ ] Fresh registration/sign-in works.
- [ ] Verification/deep-link routing works on release build.
- [ ] Invalid/expired session returns safely to auth.
- [ ] Account switching never shows previous account cache.
- [ ] Sign-out clears user-private cache/notification/widget state.
- [ ] Family loss/disconnect cleanup is verified.
- [ ] Data export works and warns about sensitive content.
- [ ] Account deletion requires strong deliberate confirmation.
- [ ] Mother deletion semantics and partner deletion semantics match product copy.
- [ ] Post-deletion relaunch shows no private cached family content.
- [ ] Password/leaked-password/auth-provider production settings are reviewed in Supabase dashboard for release.

Evidence:

- Auth test run:
- Account lifecycle session:
- Production auth configuration review:

## Gate 8 — Database/RLS/storage security

- [ ] Supabase security advisors reviewed against release database.
- [ ] New warnings are explained/resolved.
- [ ] Mother-private tables have intended RLS and grants only.
- [ ] SECURITY DEFINER functions have explicit auth/ownership checks and safe search paths.
- [ ] Anonymous access is denied where intended.
- [ ] Service-only clinical rule/version functions remain unavailable to authenticated clients.
- [ ] Immutable clinical version table cannot be UPDATE/DELETE mutated through normal service role path.
- [ ] Storage policies prevent cross-user report reads.
- [ ] Realtime private topic authorization is user-specific.
- [ ] Family realtime topic reveals entity invalidations only, not private medical payloads.
- [ ] Database backup/restore strategy is confirmed for production tier.

Evidence:

- Advisor output/date:
- RLS/grant regression tests:
- Backup/restore evidence:

## Gate 9 — Notification, reminder and widget behaviour

- [ ] Required Android notification channels exist after clean install.
- [ ] Medicine reminders behave alarm-like within platform constraints.
- [ ] Correct local time/timezone is used.
- [ ] Edit/delete/reschedule does not leave duplicate obsolete notifications.
- [ ] Notification tap routing works.
- [ ] Partner nudge notification/in-app fallback works.
- [ ] Widget content contains only approved minimal data.
- [ ] Sign-out/family loss clears private widget state.
- [ ] Physical-device notification tests reference release build.

Evidence:

- Device/reminder session:
- Notification permission states tested:

## Gate 10 — Offline/realtime/data consistency

- [ ] Existing cached Home/Journal behaviour verified offline.
- [ ] Offline queued mutations are idempotent and reconcile after reconnect.
- [ ] App foreground refreshes stale state.
- [ ] Family invalidation channel works on both devices.
- [ ] Mother-private invalidation channel refreshes mother-only data.
- [ ] No duplicate writes after reconnect/retry.
- [ ] Date/day rollover does not leave stale daily care snapshot.

Evidence:

- Offline/reconnect session:
- Two-device realtime session:

## Gate 11 — Accessibility and UI robustness

- [ ] Small-screen physical device tested.
- [ ] Larger OS text size tested.
- [ ] Telugu/Hindi long text does not hide important controls.
- [ ] Important icon-only controls have labels.
- [ ] Keyboard does not make form submission unreachable.
- [ ] Important state is not communicated by color alone.
- [ ] Loading/error/offline states remain understandable.
- [ ] Mother Home remains simple rather than becoming a feature grid.
- [ ] Partner Home remains clearly support-first.

Evidence:

- M13 accessibility/layout session:

## Gate 12 — Privacy/legal/store declarations

- [ ] Privacy policy matches actual data flows, including reports and AI provider processing.
- [ ] Terms/disclaimers match non-diagnostic product scope.
- [ ] Play Console Data Safety answers match current production behaviour.
- [ ] Permissions requested by the app are justified by current functionality.
- [ ] Account deletion/export paths match store/user expectations.
- [ ] AI/report processing disclosures and consent wording match actual provider flow.
- [ ] No marketing/store copy claims government, WHO or clinician approval beyond the actual evidence.

Evidence:

- Legal docs commit:
- Data Safety review:
- Store listing review:

## Gate 13 — Analytics/crash/performance readiness

- [ ] Production analytics uses non-sensitive event design.
- [ ] Crash reporting is enabled/configured as intended.
- [ ] No health values, report text, journal text, passwords or tokens are emitted as analytics properties.
- [ ] Startup/navigation/report upload/Ask flows do not have known release-blocking performance regressions.
- [ ] Crash-free smoke session completed on release build.

Evidence:

- Analytics event audit:
- Crash/performance smoke evidence:

## Gate 14 — Signed Android release candidate

- [ ] Release versionName/versionCode chosen and documented.
- [ ] Production package/application ID correct.
- [ ] Release signing configuration verified without exposing key material.
- [ ] Production AAB builds successfully.
- [ ] AAB/installable derived artifact tested through intended Play testing track or equivalent release path.
- [ ] Upgrade from previous installed Janani build preserves valid user data/session behaviour as intended.
- [ ] Fresh install tested.
- [ ] Deep links/notification links tested in release build.
- [ ] Release artifact SHA/Play version recorded.

Evidence:

- Build run:
- Version:
- Artifact reference:
- Install/upgrade test:

## Gate 15 — Operations and rollback

- [ ] Database migration order reviewed and production-compatible.
- [ ] Backup/restore available before risky production migration.
- [ ] Edge Function rollback target/version is known.
- [ ] AI/provider outage behaviour is safe without emergency code changes.
- [ ] Report provider outage behaviour is safe and understandable.
- [ ] Release owner knows how to disable a faulty optional AI/report feature without weakening deterministic safety.
- [ ] Monitoring/incident contact process exists.
- [ ] Post-release smoke checklist is prepared.

Evidence:

- Rollback plan:
- Backup evidence:
- Post-release smoke owner:

## Final release sign-off

Fill only after every mandatory gate above is PASS.

- Release candidate SHA:
- Android versionName/versionCode:
- Quality/native run:
- Clinical approval version(s):
- AI live function version:
- Report provider validation reference:
- M13 physical-device summary:
- Clinician review reference:
- Security/privacy review date:
- Legal/store review date:
- Open P0: 0 required
- Open P1: 0 required
- Open safety/privacy P2: 0 required unless explicitly resolved/re-tested
- Final disposition: PASS / BLOCKED

Until this section is evidence-backed, M14 contributes **0 points** and Janani must not be described as 100% production-ready.
