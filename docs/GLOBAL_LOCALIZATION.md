# Janani Global Localization Architecture

Janani treats language preference, UI translation availability, and clinically reviewed content as separate concerns.

## Locale registry

`src/i18n/localeRegistry.ts` is the source of truth for locale metadata. Each locale records:

- locale code
- native and English names
- LTR/RTL direction
- UI translation status
- health-content review status
- clinical/safety review status

The registry can grow without changing database schema or Care+ request contracts.

## Preferred language versus UI pack

A mother may save any validated locale code as her preferred language. Care+ receives that locale code in its context and may respond in that language when the configured provider supports it.

The native Janani UI currently has reviewed/native resource packs for English, Telugu, and Hindi. Other registry locales explicitly fall back to English UI until a native pack is added. The product must never claim fallback English is a completed translation.

## Medical and safety content

Translation status is tiered:

1. ordinary UI copy may be translated and QA-reviewed normally;
2. health education requires content/clinical review;
3. urgent medical, medication, legal, privacy, destructive-account, and condition-specific wording requires explicit reviewed translations before activation.

Unreviewed safety copy falls back to a reviewed source language.

## RTL

The registry marks RTL locales such as Arabic, Persian, Hebrew, Urdu, and Pashto. Full mirrored layout activation must be enabled only after screen-level RTL QA; metadata is available now so components can be migrated without redesigning the locale model.

## Device locale

`detectDeviceLocale()` can suggest the device locale during onboarding. A user choice should always override detection.

## Server pushes

Per-device locale should be persisted with push-token registration before server-originated notifications are localized. Until then, generic server pushes remain in the reviewed source language rather than guessing a recipient language.
