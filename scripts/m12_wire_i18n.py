from pathlib import Path


def wire_screen(path: str, component_marker: str, replacements: list[tuple[str, str]]) -> None:
    p = Path(path)
    s = p.read_text()
    s = s.replace("import { JANANI_COPY } from '@/features/tone/toneSystem';\n", "")
    provider_import = "import { useLanguage } from '@/providers/LanguageProvider';\n"
    if provider_import not in s:
        anchor = "import { useAuth } from '@/providers/AuthProvider';\n"
        if anchor in s:
            s = s.replace(anchor, anchor + provider_import, 1)
        else:
            anchor = "import { supabase } from '@/lib/supabase';\n"
            if anchor not in s:
                raise SystemExit(f'import anchor missing in {path}')
            s = s.replace(anchor, anchor + provider_import, 1)
    if "const { t } = useLanguage();" not in s:
        if component_marker not in s:
            raise SystemExit(f'component marker missing in {path}')
        s = s.replace(component_marker, component_marker + "\n  const { t } = useLanguage();", 1)
    for old, new in replacements:
        if old not in s:
            raise SystemExit(f'replacement target missing in {path}: {old}')
        s = s.replace(old, new)
    p.write_text(s)


wire_screen('app/main/home.tsx', 'export default function HomeScreen() {', [
    ('JANANI_COPY.home.motherSubtitle', "t('tone.home.motherSubtitle')"),
    ('JANANI_COPY.home.partnerSubtitle', "t('tone.home.partnerSubtitle')"),
    ('JANANI_COPY.home.motherPriorityCaption', "t('tone.home.motherPriorityCaption')"),
    ('JANANI_COPY.home.partnerPriorityCaption', "t('tone.home.partnerPriorityCaption')"),
])

wire_screen('app/main/health.tsx', 'export default function HealthScreen() {', [
    ('JANANI_COPY.health.partnerTitle', "t('tone.health.partnerTitle')"),
    ('JANANI_COPY.health.partnerSubtitle', "t('tone.health.partnerSubtitle')"),
    ('JANANI_COPY.health.motherTitle', "t('tone.health.motherTitle')"),
    ('JANANI_COPY.health.motherSubtitle', "t('tone.health.motherSubtitle')"),
    ('JANANI_COPY.health.completionCaption', "t('tone.health.completionCaption')"),
])

wire_screen('app/main/reports.tsx', 'export default function ReportsScreen() {', [
    ('JANANI_COPY.reports.partnerTitle', "t('tone.reports.partnerTitle')"),
    ('JANANI_COPY.reports.partnerSubtitle', "t('tone.reports.partnerSubtitle')"),
    ('JANANI_COPY.reports.motherTitle', "t('tone.reports.motherTitle')"),
    ('JANANI_COPY.reports.motherSubtitle', "t('tone.reports.motherSubtitle')"),
    ('JANANI_COPY.reports.reviewFlow', "t('tone.reports.reviewFlow')"),
])

wire_screen('app/main/journey.tsx', 'export default function JourneyScreen() {', [
    ('JANANI_COPY.journey.motherTitle', "t('tone.journey.motherTitle')"),
    ('JANANI_COPY.journey.partnerTitle', "t('tone.journey.partnerTitle')"),
    ('JANANI_COPY.journey.motherSubtitle', "t('tone.journey.motherSubtitle')"),
    ('JANANI_COPY.journey.partnerSubtitle', "t('tone.journey.partnerSubtitle')"),
])

wire_screen('app/partner-family.tsx', 'export default function PartnerFamilyScreen() {', [
    ('JANANI_COPY.partner.title', "t('tone.partner.title')"),
    ('JANANI_COPY.partner.subtitle', "t('tone.partner.subtitle')"),
])

p = Path('src/i18n/catalog.ts')
s = p.read_text()

def add_after(anchor: str, addition: str) -> None:
    global s
    if addition in s:
        return
    if anchor not in s:
        raise SystemExit(f'catalog anchor missing: {anchor}')
    s = s.replace(anchor, anchor + addition, 1)

add_after("  'common.tryAgain': 'Try again',\n", """  'menu.more': 'More options',
  'menu.partner': 'Partner & family',
  'menu.partnerCaption': 'Invite, connect and choose what your partner can see',
  'menu.language': 'Language',
  'menu.languageCaption': 'Choose the language Janani uses for your account',
  'menu.reminders': 'Reminders',
  'menu.remindersCaption': 'Medicines, supplements and care reminders',
  'menu.safety': 'Safety & privacy',
  'menu.safetyCaption': 'Understand Janani’s safety and privacy choices',
  'menu.settings': 'Settings',
  'menu.settingsCaption': 'Account, data export and family controls',
""")
add_after("  'common.tryAgain': 'మళ్లీ ప్రయత్నించండి',\n", """  'menu.more': 'మరిన్ని ఎంపికలు',
  'menu.partner': 'భాగస్వామి & కుటుంబం',
  'menu.partnerCaption': 'భాగస్వామిని ఆహ్వానించండి, కలపండి, ఏమి చూడాలో ఎంచుకోండి',
  'menu.language': 'భాష',
  'menu.languageCaption': 'మీ ఖాతాలో జనని ఉపయోగించే భాషను ఎంచుకోండి',
  'menu.reminders': 'రిమైండర్లు',
  'menu.remindersCaption': 'మందులు, సప్లిమెంట్లు మరియు సంరక్షణ రిమైండర్లు',
  'menu.safety': 'భద్రత & గోప్యత',
  'menu.safetyCaption': 'జనని భద్రత మరియు గోప్యత ఎంపికలను తెలుసుకోండి',
  'menu.settings': 'సెట్టింగ్స్',
  'menu.settingsCaption': 'ఖాతా, డేటా ఎగుమతి మరియు కుటుంబ నియంత్రణలు',
""")
add_after("  'common.tryAgain': 'फिर कोशिश करें',\n", """  'menu.more': 'और विकल्प',
  'menu.partner': 'साथी और परिवार',
  'menu.partnerCaption': 'साथी को आमंत्रित करें, जोड़ें और तय करें कि वे क्या देख सकते हैं',
  'menu.language': 'भाषा',
  'menu.languageCaption': 'अपने खाते के लिए जननी की भाषा चुनें',
  'menu.reminders': 'रिमाइंडर्स',
  'menu.remindersCaption': 'दवाइयाँ, सप्लीमेंट और देखभाल रिमाइंडर्स',
  'menu.safety': 'सुरक्षा और निजता',
  'menu.safetyCaption': 'जननी की सुरक्षा और निजता के विकल्प समझें',
  'menu.settings': 'सेटिंग्स',
  'menu.settingsCaption': 'खाता, डेटा एक्सपोर्ट और परिवार नियंत्रण',
""")
p.write_text(s)

p = Path('src/components/navigation/JananiOverflowMenu.tsx')
s = p.read_text()
provider_import = "import { useLanguage } from '@/providers/LanguageProvider';\n"
if provider_import not in s:
    anchor = "import { colors, radius, spacing } from '@/theme/tokens';\n"
    if anchor not in s:
        raise SystemExit('overflow import anchor missing')
    s = s.replace(anchor, provider_import + anchor, 1)
marker = "export function JananiOverflowMenu() {"
if "const { t } = useLanguage();" not in s:
    s = s.replace(marker, marker + "\n  const { t } = useLanguage();", 1)
replacements = [
    ('<Text style={styles.menuCaption}>More options</Text>', "<Text style={styles.menuCaption}>{t('menu.more')}</Text>"),
    ('caption="Invite, connect and choose what your partner can see"', "caption={t('menu.partnerCaption')}"),
    ('label="Partner & family"', "label={t('menu.partner')}"),
    ('caption="Choose the language Janani uses for your account"', "caption={t('menu.languageCaption')}"),
    ('label="Language"', "label={t('menu.language')}"),
    ('caption="Medicines, supplements and care reminders"', "caption={t('menu.remindersCaption')}"),
    ('label="Reminders"', "label={t('menu.reminders')}"),
    ('caption="Understand Janani\'s safety and privacy choices"', "caption={t('menu.safetyCaption')}"),
    ('label="Safety & privacy"', "label={t('menu.safety')}"),
    ('caption="Account, data export and family controls"', "caption={t('menu.settingsCaption')}"),
    ('label="Settings"', "label={t('menu.settings')}"),
]
for old, new in replacements:
    if old not in s:
        raise SystemExit(f'overflow target missing: {old}')
    s = s.replace(old, new, 1)
p.write_text(s)
