/**
 * Configuration flow for auto-configuring AI agents.
 *
 * This module handles the interactive flow for detecting and
 * configuring AI agents after successful authentication.
 */

import * as readline from 'node:readline';
import {
  type AgentInfo,
  getAvailableAgents,
  configureAgent,
  isAgentConfigured,
} from './agents.js';
import {
  colors,
  box,
  success,
  warning,
  info,
  listItem,
} from '../ui/branding.js';
import { showSuccess, showWarning, showInfo } from '../ui/spinner.js';

/**
 * Prompts the user for a yes/no answer.
 */
async function promptYesNo(question: string, defaultYes = true): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stderr,
  });

  const hint = defaultYes ? '[Y/n]' : '[y/N]';
  const prompt = `${question} ${colors.muted(hint)} `;

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      if (normalized === '') {
        resolve(defaultYes);
      } else {
        resolve(normalized === 'y' || normalized === 'yes');
      }
    });
  });
}

/**
 * Prompts the user to select agents to configure.
 */
async function promptAgentSelection(agents: AgentInfo[]): Promise<AgentInfo[]> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stderr,
  });

  console.error('');
  console.error(colors.primaryBright('Which agents would you like to configure?'));
  console.error(colors.muted('Enter numbers separated by spaces, or "all" for all agents'));
  console.error('');

  agents.forEach((agent, index) => {
    const configured = isAgentConfigured(agent);
    const status = configured ? colors.muted(' (already configured)') : '';
    console.error(`  ${colors.primary(`${index + 1}.`)} ${agent.name}${status}`);
    console.error(`     ${colors.muted(agent.description)}`);
  });

  console.error('');

  return new Promise((resolve) => {
    rl.question(`${colors.muted('Selection:')} `, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();

      if (normalized === '' || normalized === 'all' || normalized === 'a') {
        resolve(agents);
        return;
      }

      if (normalized === 'none' || normalized === 'n' || normalized === '0') {
        resolve([]);
        return;
      }

      // Parse number selections
      const selections = normalized
        .split(/[\s,]+/)
        .map((s) => parseInt(s, 10) - 1)
        .filter((n) => !isNaN(n) && n >= 0 && n < agents.length);

      resolve(selections.map((i) => agents[i]!));
    });
  });
}

/**
 * Runs the agent configuration flow.
 *
 * This is called after successful authentication to offer
 * auto-configuration of detected AI agents.
 *
 * @returns true if any agents were configured
 */
export async function runConfigureFlow(): Promise<boolean> {
  // Detect available agents
  const availableAgents = getAvailableAgents();

  if (availableAgents.length === 0) {
    console.error('');
    showInfo('No AI agents detected on this system');
    console.error(colors.muted('You can manually configure MCP servers later.'));
    return false;
  }

  // Check how many are already configured
  const unconfiguredAgents = availableAgents.filter((a) => !isAgentConfigured(a));

  if (unconfiguredAgents.length === 0) {
    console.error('');
    showSuccess('All detected AI agents are already configured');
    return false;
  }

  // Show detected agents
  console.error('');
  const agentList = availableAgents
    .map((agent) => {
      const configured = isAgentConfigured(agent);
      const status = configured ? colors.success(' ✓') : '';
      return listItem(`${agent.name}${status}`);
    })
    .join('\n');

  console.error(box(agentList, { title: 'Detected AI Agents' }));

  // Ask if user wants to configure
  const shouldConfigure = await promptYesNo(
    'Would you like to configure Fizzy for these agents?',
    true,
  );

  if (!shouldConfigure) {
    console.error('');
    showInfo('Skipping agent configuration');
    console.error(colors.muted('You can run "fizzy-mcp configure" later to set up agents.'));
    return false;
  }

  // If there's only one unconfigured agent, configure it directly
  let agentsToConfigure: AgentInfo[];
  if (unconfiguredAgents.length === 1) {
    agentsToConfigure = unconfiguredAgents;
  } else {
    agentsToConfigure = await promptAgentSelection(unconfiguredAgents);
  }

  if (agentsToConfigure.length === 0) {
    showInfo('No agents selected');
    return false;
  }

  // Configure selected agents
  console.error('');
  let configuredCount = 0;

  for (const agent of agentsToConfigure) {
    try {
      const wasConfigured = configureAgent(agent);
      if (wasConfigured) {
        showSuccess(`Configured ${agent.name}`);
        console.error(colors.muted(`  → ${agent.configPath}`));
        configuredCount++;
      } else {
        showWarning(`${agent.name} is already configured`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showWarning(`Failed to configure ${agent.name}: ${message}`);
    }
  }

  if (configuredCount > 0) {
    console.error('');
    console.error(
      box(
        [
          colors.success(`Successfully configured ${configuredCount} agent(s)!`),
          '',
          colors.muted('Restart your AI agents to start using Fizzy.'),
        ].join('\n'),
        { borderColor: '#4ade80' },
      ),
    );
  }

  return configuredCount > 0;
}
