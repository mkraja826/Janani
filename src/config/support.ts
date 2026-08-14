import { Linking } from 'react-native';

import { productionConfig } from './production';

export function hasConfiguredSupportChannel() {
  return Boolean(productionConfig.supportEmail);
}

export async function openJananiSupport(subject = 'Janani support request') {
  const email = productionConfig.supportEmail;
  if (!email) throw new Error('Janani support is not configured for this build.');

  const url = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}`;
  const supported = await Linking.canOpenURL(url);
  if (!supported) throw new Error('No email app is available on this device.');
  await Linking.openURL(url);
}
