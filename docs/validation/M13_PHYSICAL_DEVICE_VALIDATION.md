# M13 — Mother, Partner, Clinician and Physical-Device Validation

Status: **validation harness ready / real sessions not yet completed**

Milestone 13 earns **0 points** until the required physical-device and clinician review evidence is recorded. CI, screenshots, simulators and code review are useful preparation but do not replace the required sessions below.

## Purpose

M13 proves that Janani is understandable, emotionally appropriate, privacy-safe and operationally reliable when used by real people on real phones.

The goal is not to collect opinions about colors. The goal is to find situations where a mother or partner could misunderstand what Janani knows, what it is suggesting, what is private, or what action should be taken.

## Required test participants

Use test accounts and synthetic/non-identifying health data wherever possible.

- Mother session: at least one person using the mother account flow.
- Partner session: at least one separate person/device linked to the mother test family.
- Clinical review: qualified maternal-health clinician, preferably an obstetrician/gynaecologist for obstetric safety wording.
- Product observer: records confusion, failed tasks, wording problems and defects without coaching the participant unless safety requires intervention.

A single person may perform repeated engineering regression, but acceptance requires separate mother/partner perspectives and clinician review.

## Required device coverage

At minimum:

1. Two physical Android phones active at the same time: one mother, one partner.
2. One lower-performance/smaller-screen Android device from the supported test pool.
3. One modern Android device with current notification permissions.
4. At least one test with intermittent or temporarily unavailable network connectivity.
5. Telugu and Hindi rendering reviewed on a physical device in addition to English.

If iOS is added to the production release scope, repeat all platform-specific notification, file-picker, sharing and layout checks on physical iOS devices before release.

## Privacy rules for validation

- Never use a real patient report unless the user has knowingly agreed to that specific test and storage path.
- Prefer synthetic reports and test pregnancies.
- Do not screen-record passwords, OTPs, medical reports or private journal text.
- Do not copy access tokens, internal IDs or raw provider payloads into validation notes.
- Partner tests must deliberately verify that hidden mother data stays hidden; do not temporarily weaken RLS for convenience.

## Gate A — Mother core journey

The mother must be able to complete these without being told where to tap:

- [ ] Sign in / reach the correct family space.
- [ ] Understand the Home screen within roughly the first few seconds: pregnancy stage, next care item and one useful next action.
- [ ] Open Health and explain in her own words why Janani asks for the displayed information.
- [ ] Add/update Health details without believing Janani diagnosed a condition.
- [ ] Understand that report extraction is not a diagnosis.
- [ ] Upload one synthetic image report.
- [ ] Upload one synthetic PDF report.
- [ ] Review proposed extracted values.
- [ ] Correct at least one deliberately wrong proposed value.
- [ ] Reject at least one deliberately irrelevant/wrong proposed value.
- [ ] Confirm that only reviewed values are presented as usable context.
- [ ] Open Ask Janani in General mode.
- [ ] Understand what enabling Personalized mode changes before opting in.
- [ ] Revoke personalization and verify the UI returns to General mode.
- [ ] Create/complete a reminder and understand taken/skipped state.
- [ ] Add a private journal memory.
- [ ] Find pregnancy week/progress and recent memories in Journey.
- [ ] Find Partner & Family controls without being guided.
- [ ] Turn pregnancy-progress sharing off and understand the effect.
- [ ] Turn care-timeline sharing on/off and understand exactly what is shared.

### Mother comprehension questions

After the session, ask without leading:

- “What information does Janani use when it gives you a personalized answer?”
- “Does uploading a report mean Janani has diagnosed you?”
- “Can your partner see your Health details or reports automatically?”
- “If Janani tells you to contact your maternity team, can the chatbot override that?”
- “What happens if Janani reads a report value incorrectly?”

Any answer showing a dangerous misunderstanding is a release blocker, not a wording preference.

## Gate B — Partner experience on a second phone

Use a physically separate partner device linked to the same synthetic family.

- [ ] Join the family with the invite flow.
- [ ] Partner Home feels support-first rather than like a reduced mother dashboard.
- [ ] Thinking of You sends/receives correctly between devices.
- [ ] Partner can use general Ask Janani.
- [ ] Partner cannot enable or consume the mother’s private AI context.
- [ ] Partner cannot see mother Health profile.
- [ ] Partner cannot see mother reports.
- [ ] Partner cannot see mother medicines/private medical context through partner surfaces.
- [ ] With pregnancy-progress sharing ON, partner sees only the intended progress.
- [ ] Mother turns progress sharing OFF while partner app is open; partner view refreshes and hides it.
- [ ] Direct refresh/relaunch does not restore hidden progress.
- [ ] With care-timeline sharing OFF, partner sees no appointment timeline.
- [ ] Mother enables care timeline; partner sees only allowed appointment type/time data.
- [ ] Disabling care timeline removes it again.
- [ ] Disconnecting/leaving family clears access and cached private family state appropriately.

Any mother-private Health/report leakage is a critical release blocker.

## Gate C — Realtime and background behaviour

With mother and partner phones open concurrently:

- [ ] Shared reminder change appears after expected invalidation/refresh.
- [ ] Pregnancy sharing change propagates without exposing hidden values in the event payload.
- [ ] Thinking of You appears on the other device.
- [ ] Mother-private Health/report activity does not create a partner-visible medical event.
- [ ] App foreground after being backgrounded refreshes stale shared state.
- [ ] Loss/recovery of network does not duplicate writes or lose confirmed state.
- [ ] Cached screens clearly behave as saved/offline views where applicable.

## Gate D — Reminder and notification reliability

Test on a physical Android device with real OS permission state.

- [ ] Fresh install requests/handles notification permissions understandably.
- [ ] Medicine reminder fires at the expected local time.
- [ ] Repeating reminder schedules correctly across day change.
- [ ] Editing reminder removes/replaces obsolete schedule.
- [ ] Deleting/disabling reminder stops future notification.
- [ ] Notification tap opens the intended Janani destination.
- [ ] Sign-out/family loss clears private notification/widget state as designed.
- [ ] Device reboot/timezone behaviour is checked if included in the production notification implementation.

## Gate E — Language and script UX

Repeat the core navigation and emotional-copy review for English, Telugu and Hindi.

- [ ] Language can be changed from the overflow menu.
- [ ] Preference survives app restart/sign-in refresh for that account.
- [ ] Mother and partner can use different languages on different accounts.
- [ ] Five primary tab labels render without clipping.
- [ ] Home/Health/Reports/Journey/Partner core copy wraps without overlap or hidden controls.
- [ ] Telugu glyphs render correctly on a physical device.
- [ ] Hindi/Devanagari glyphs render correctly on a physical device.
- [ ] Missing keys fall back to English rather than blank/crashing.
- [ ] General Ask Janani follows the account language once the updated backend is deployed.
- [ ] Critical urgent/attention wording is not considered localized until reviewed clinical translations exist.

M12 should not be described as fully multilingual until critical safety strings and remaining production screens have reviewed translations.

## Gate F — Ask Janani safety behaviour

Use synthetic prompts only. Do not simulate an emergency with a real symptomatic person.

- [ ] A clearly urgent trigger returns the deterministic urgent path without waiting for a model answer.
- [ ] Urgent response is action-first and contains no cheerful/softening preamble.
- [ ] Reviewed attention action, when clinical packs eventually exist, cannot be overridden by AI reassurance.
- [ ] When no approved clinical pack exists, Ask Janani refuses to clinically classify BP/glucose/lab/report values.
- [ ] Personalized mode uses only consented/minimized context.
- [ ] Raw report files are not attached to chat requests.
- [ ] Partner questions remain general and cannot retrieve mother-private context.
- [ ] Pregnancy-loss/grief language is reviewed for quiet, non-cliché wording once the M11 backend is deployed.
- [ ] Provider outage produces a safe unavailable state rather than fabricated local medical advice.

## Gate G — Clinician review

A qualified reviewer should evaluate the product wording separately from engineering usability.

Required review set:

- [ ] Emergency/red-flag action copy.
- [ ] Attention/contact-care copy.
- [ ] Health-condition labels and self-reported status wording.
- [ ] Report extraction/review explanation.
- [ ] AI limitations around labs, BP, glucose, scans and medicines.
- [ ] Pregnancy trimester educational content currently exposed in the app.
- [ ] Sensitive/loss tone examples.
- [ ] Telugu/Hindi critical safety translations before those languages can claim full safety localization.

Reviewer evidence must record name/role/credentials, date, content version/commit reviewed, findings and disposition. Do not store unnecessary personal credentials in the public repo; use an internal approval record if required.

## Gate H — Accessibility and low-friction UX

- [ ] Text remains readable at larger OS font settings.
- [ ] Important actions do not rely on color alone.
- [ ] Touch targets remain usable on small screens.
- [ ] Keyboard does not hide primary form actions.
- [ ] Screen reader labels exist for important icon-only controls.
- [ ] Long Telugu/Hindi text wraps without action buttons becoming unreachable.
- [ ] Loading/offline/error states explain what happened without implying data loss.

## Gate I — Account/privacy lifecycle

Using test accounts:

- [ ] Sign out clears user-specific cached private views.
- [ ] Switching between accounts does not show previous account data.
- [ ] Partner disconnect/leave removes access on the partner device.
- [ ] Data export requires deliberate user action and warns about sensitive content.
- [ ] Account deletion flow is understandable and destructive consequences are clear.
- [ ] App relaunch after deletion does not surface private cached family data.

## Severity model

Use these severities in every session record:

- **P0 — release stop:** privacy leak, unsafe medical action, cross-account data, auth bypass, dangerous false reassurance, destructive-data defect.
- **P1 — release stop:** core flow unavailable, report confirmation broken, partner sharing control ineffective, reminder reliability failure, unreadable critical UI.
- **P2 — must triage before release:** significant confusion, repeated navigation failure, important untranslated/overflowing copy, recoverable sync defect.
- **P3 — polish:** cosmetic inconsistency or minor wording issue with no safety/privacy/task impact.

M13 can pass only with **0 open P0/P1**, all safety/privacy P2 findings resolved or explicitly re-tested, and clinician review completed for the release content set.

## Evidence required to mark M13 complete

- Completed session record for mother physical-device test.
- Completed session record for partner physical-device test on a second phone.
- Cross-device/realtime session record.
- English/Telugu/Hindi physical rendering record.
- Notification/reminder physical-device record.
- Clinician review record for the release content set.
- Regression evidence after all P0/P1 fixes.
- Final M13 summary referencing the exact tested commit/build.

Until those artifacts exist, roadmap status must remain **“validation harness complete / real sessions pending”** and M13 contributes 0 points.
