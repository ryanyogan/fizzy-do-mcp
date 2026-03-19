/**
 * Webhook Setup Wizard
 *
 * Interactive CLI wizard for configuring webhook secrets.
 * Walks users through the Fizzy webhook setup process and stores
 * the secret in Cloudflare KV via the hosted API.
 */

import { password, confirm } from '@inquirer/prompts';
import open from 'open';
import { HOSTED_URLS, type WebhookStatusResponse } from '@fizzy-do-mcp/shared';
import { colors, box, keyValue, listItem } from '../ui/branding.js';
import { showSuccess, showWarning, showInfo } from '../ui/spinner.js';

/** URL for Fizzy webhooks settings page */
const FIZZY_WEBHOOKS_URL = 'https://app.fizzy.do/settings/webhooks';

/**
 * Check if webhook is configured for the current account.
 *
 * @param token - Fizzy API token
 * @returns Webhook status or null if request failed
 */
export async function checkWebhookStatus(token: string): Promise<WebhookStatusResponse | null> {
  try {
    const response = await fetch(HOSTED_URLS.webhookSecret, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as WebhookStatusResponse;
  } catch {
    return null;
  }
}

/**
 * Store webhook secret via the hosted API.
 *
 * @param token - Fizzy API token
 * @param secret - Webhook secret from Fizzy
 * @returns Webhook status after storing, or null if failed
 */
export async function storeWebhookSecret(
  token: string,
  secret: string,
): Promise<WebhookStatusResponse | null> {
  try {
    const response = await fetch(HOSTED_URLS.webhookSecret, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ secret }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('Failed to store webhook secret:', error);
      return null;
    }

    return (await response.json()) as WebhookStatusResponse;
  } catch (error) {
    console.error('Error storing webhook secret:', error);
    return null;
  }
}

/**
 * Delete webhook secret via the hosted API.
 *
 * @param token - Fizzy API token
 * @returns True if deleted, false otherwise
 */
export async function deleteWebhookSecret(token: string): Promise<boolean> {
  try {
    const response = await fetch(HOSTED_URLS.webhookSecret, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Display the webhook setup instructions box.
 */
function displaySetupInstructions(): void {
  const content = [
    colors.text('To receive work automatically, set up a Fizzy webhook.'),
    '',
    `${colors.primary('1.')} Open your Fizzy account settings ${colors.muted('→')} Integrations ${colors.muted('→')} Webhooks`,
    '',
    `${colors.primary('2.')} Add a new webhook:`,
    `   ${keyValue('URL', HOSTED_URLS.webhooks)}`,
    '',
    `${colors.primary('3.')} Enable these events:`,
    `   ${listItem('Card column changed', colors.success('✓'))}   ${listItem('Comment added', colors.success('✓'))}`,
    `   ${listItem('Card added', colors.success('✓'))}            ${listItem('Card moved to "Done"', colors.success('✓'))}`,
    '',
    `${colors.primary('4.')} Copy the webhook secret Fizzy generates.`,
  ].join('\n');

  console.error(box(content, { title: 'Webhook Setup' }));
}

/**
 * Run the interactive webhook setup wizard.
 *
 * @param token - Fizzy API token
 * @returns True if setup completed successfully, false otherwise
 */
export async function runWebhookSetup(token: string): Promise<boolean> {
  displaySetupInstructions();

  // Ask if user wants to open the browser
  try {
    const openBrowser = await confirm({
      message: 'Open Fizzy webhooks page in browser?',
      default: true,
    });

    if (openBrowser) {
      await open(FIZZY_WEBHOOKS_URL);
      showInfo('Opening Fizzy webhooks page...');
      console.error('');
    }
  } catch {
    // User cancelled
    return false;
  }

  // Prompt for the webhook secret (masked input)
  let secret: string;
  try {
    secret = await password({
      message: 'Paste your webhook secret:',
      mask: '*',
      validate: (value) => {
        if (!value || value.length < 8) {
          return 'Webhook secret must be at least 8 characters';
        }
        return true;
      },
    });
  } catch {
    // User cancelled
    return false;
  }

  // Store the secret
  showInfo('Saving webhook secret...');
  const result = await storeWebhookSecret(token, secret);

  if (result) {
    showSuccess('Webhook secret saved!');
    console.error('');
    return true;
  } else {
    showWarning('Failed to save webhook secret. Please try again.');
    return false;
  }
}

/**
 * Display webhook status in a nice box.
 *
 * @param status - Webhook status from the API
 */
export function displayWebhookStatus(status: WebhookStatusResponse): void {
  const statusIcon = status.configured ? colors.success('✓') : colors.warning('✗');
  const statusText = status.configured ? 'Configured' : 'Not configured';
  const createdAt = status.created_at ? new Date(status.created_at).toLocaleDateString() : 'N/A';

  const content = [
    keyValue('Account', `${status.account_name} ${colors.muted(`(${status.account_slug})`)}`),
    `${colors.muted('Status:')}  ${statusIcon} ${statusText}`,
    keyValue('URL', HOSTED_URLS.webhooks),
    keyValue('Created', createdAt),
  ].join('\n');

  const borderColor = status.configured ? '#22c55e' : '#f59e0b';
  console.error(box(content, { title: 'Webhook Configuration', borderColor }));
}
