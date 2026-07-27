import type { FpgaArchitectureComponentContract } from './fpgaArchitectureContract';
import type { GoldenLeafInterfaceItem } from './fpgaGoldenLeafLibrary';

export type VerifiedPortRole =
  | 'clock'
  | 'reset'
  | 'enable'
  | 'serial_rx'
  | 'serial_tx'
  | 'payload_in'
  | 'payload_out'
  | 'valid'
  | 'ready'
  | 'error'
  | 'status'
  | 'address'
  | 'control'
  | 'data'
  | 'unknown';

export type VerifiedPortRoleEvidence = {
  role: VerifiedPortRole;
  activeLowReset: boolean;
  optional: boolean;
  confidence: number;
  evidence: string[];
};

function normalize(value: string | null | undefined) {
  return String(value || '').trim().toLowerCase();
}

function baseName(value: string) {
  return normalize(value)
    .replace(/^(?:i_|o_)/, '')
    .replace(/_(?:i|o|in|out)$/, '')
    .replace(/^(?:in|out)_/, '');
}

function componentText(component: FpgaArchitectureComponentContract) {
  return [
    component.id,
    component.name,
    component.file,
    component.responsibility,
    ...(component.implements || []),
  ].join(' ').toLowerCase();
}

export function isReceiverLikeComponent(component: FpgaArchitectureComponentContract) {
  return /\b(?:rx|receive|receiver|ingress|input|capture)\b/i.test(componentText(component));
}

export function isTransmitterLikeComponent(component: FpgaArchitectureComponentContract) {
  return /\b(?:tx|transmit|transmitter|egress|output|emit)\b/i.test(componentText(component));
}

function isVector(type: string) {
  return /\b(?:std_logic_vector|std_ulogic_vector|unsigned|signed)\b/i.test(type);
}

function isScalarLogic(type: string) {
  return /\bstd_(?:u)?logic\b/i.test(type) && !isVector(type);
}

export function classifyVerifiedPortRole(
  port: GoldenLeafInterfaceItem,
  component: FpgaArchitectureComponentContract,
): VerifiedPortRoleEvidence {
  const name = normalize(port.name);
  const base = baseName(port.name);
  const type = normalize(port.type);
  const mode = normalize(port.mode);
  const evidence: string[] = [];
  let role: VerifiedPortRole = 'unknown';
  let confidence = 0;
  let optional = false;

  const set = (nextRole: VerifiedPortRole, score: number, reason: string) => {
    if (score > confidence) {
      role = nextRole;
      confidence = score;
    }
    evidence.push(reason);
  };

  if (/^(?:clk|clock|aclk|sclk|mclk|pclk)$/.test(base)) set('clock', 100, `name ${port.name} is clock-like`);
  if (/^(?:rst|reset|rstn|resetn|rst_n|reset_n|aresetn|reset_b)$/.test(base) || /rst_n|reset_n|aresetn|resetn/.test(name)) {
    set('reset', 100, `name ${port.name} is reset-like`);
  }
  if (/^(?:en|enable|ce|clock_enable|cke)$/.test(base)) {
    set('enable', 88, `name ${port.name} is enable-like`);
    optional = true;
  }
  if (/^(?:ready|tready|rdy)$/.test(base)) set('ready', 84, `name ${port.name} is ready-like`);
  if (/^(?:valid|tvalid|rx_valid|tx_valid|data_valid|pc_valid)$/.test(base)) set('valid', 88, `name ${port.name} is valid-like`);
  if (/error|err|fault|framing_error|overflow|underflow|parity_error/.test(name)) {
    set('error', 88, `name ${port.name} is error-like`);
    optional = mode === 'out' || mode === 'buffer';
  }
  if (/status|state|flags?/.test(name)) set('status', 80, `name ${port.name} is status-like`);
  if (/addr|address|pc(?:_|$)|index/.test(name)) set('address', 78, `name ${port.name} is address-like`);
  if (/ctrl|control|cmd|opcode|op_/.test(name)) set('control', 74, `name ${port.name} is control-like`);

  if (mode === 'in' && /(?:^|_)uart_rx$|(?:^|_)rx$|serial_rx|rxd|miso|mosi/.test(name) && isScalarLogic(type)) {
    set('serial_rx', 92, `input ${port.name} is serial receive-like`);
  }
  if ((mode === 'out' || mode === 'buffer') && /(?:^|_)uart_tx$|(?:^|_)tx$|serial_tx|txd|miso|mosi/.test(name) && isScalarLogic(type)) {
    set('serial_tx', 92, `output ${port.name} is serial transmit-like`);
  }
  if (isVector(type) && mode === 'in' && /data|payload|din|input|sample|word/.test(name)) {
    set('payload_in', 82, `input vector ${port.name} is payload-like`);
  }
  if (isVector(type) && (mode === 'out' || mode === 'buffer') && /data|payload|dout|output|sample|word/.test(name)) {
    set('payload_out', 82, `output vector ${port.name} is payload-like`);
  }
  if (role === 'unknown' && /data/.test(name)) {
    set('data', 50, `name ${port.name} is generic data-like`);
  }

  if (role === 'payload_in' && isReceiverLikeComponent(component) && /data_i|payload_i|din/.test(name)) {
    optional = true;
    evidence.push(`payload input ${port.name} is optional/suspicious on receiver-like component ${component.id}`);
  }

  return {
    role,
    activeLowReset: role === 'reset' && /(?:_n$|n$|_b$|aresetn|resetn)/i.test(name),
    optional,
    confidence,
    evidence,
  };
}

export function rolesCompatible(verified: VerifiedPortRoleEvidence, approved: VerifiedPortRoleEvidence) {
  if (verified.role === approved.role && verified.role !== 'unknown') return true;
  if (verified.role === 'payload_out' && approved.role === 'data') return true;
  if (verified.role === 'data' && approved.role === 'payload_out') return true;
  if (verified.role === 'payload_in' && approved.role === 'data') return true;
  if (verified.role === 'data' && approved.role === 'payload_in') return true;
  if (verified.role === 'error' && approved.role === 'status') return true;
  return false;
}

