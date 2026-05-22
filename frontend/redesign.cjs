const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

const replacements = [
  ['Manager Command Center', 'Team Dashboard'],
  ['Admin Command Center', 'Overview'],
  ['Command Center', 'Dashboard'],
  ['Search Command Center...', 'Search anything...'],
  ['MEMBER HQ', 'Team Members'],
  ['Execute Provisioning', 'Add Member'],
  ['Network Email', 'Email Address'],
  ['Entity Name', 'Full Name'],
  ['Operational Team', 'Team'],
  ['Contact Protocol', 'Phone Number'],
  ['Access Password', 'Password'],
  ['Identity Hash', 'ID'],
  ['Security Identity', 'Name'],
  ['Payload Pending', 'Setup Pending'],
  ['Native Provision', 'Added Directly'],
  ['Awaiting Uplink', 'Pending Invites'],
  ['Outbound Invites', 'Invitations Sent'],
  ['Live Sessions', 'Active Now'],
  ['Verified Identities', 'Active Agents'],
  ['Generate Fiscal Entry', 'Create Invoice'],
  ['Neural Valuation', 'Amount'],
  ['Amortization', ''],
  ['Fiscal Entry', 'Invoice'],
  ['Cognitive Orchestration', ''],
  ['CRM Telemetry', ''],
  ['Orchestration Failed', 'Connection Error'],
  ['Simulation Mode', 'Demo Mode'],
  ['Intelligence Core', 'AI Assistant'],
  ['Protocol Unit', 'Team'],
  ['Target Sales Team', 'Assign to Team'],
  ['Provision Manually', 'Add Manually'],
  ['Invite Agents Center', 'Invite by Email'],
  ['Pending Queue', 'Pending Invites']
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;

  // Apply jargon replacements
  replacements.forEach(([oldText, newText]) => {
    const escapedOld = oldText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedOld, 'g');
    newContent = newContent.replace(regex, newText);
  });

  // Apply common CSS class replacements
  newContent = newContent.replace(/className="[^"]*bg-white[^"]*rounded-2xl[^"]*border-slate-200[^"]*shadow-sm[^"]*"/g, 'className="crm-card"');
  newContent = newContent.replace(/className="[^"]*bg-white[^"]*rounded-xl[^"]*border-slate-200[^"]*shadow-sm[^"]*"/g, 'className="crm-card"');
  newContent = newContent.replace(/className="[^"]*bg-white[^"]*rounded-3xl[^"]*border-slate-200[^"]*shadow-[^"]*overflow-hidden[^"]*"/g, 'className="crm-table-container"');
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Updated: ' + filePath);
  }
}

function traverseDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverseDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      processFile(fullPath);
    }
  }
}

traverseDirectory(directoryPath);
console.log('Done!');
