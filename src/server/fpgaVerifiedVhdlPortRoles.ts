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
  | 'tx_request_valid'
  | 'tx_request_ready'
  | 'register_read_address'
  | 'register_write_address'
  | 'register_read_data'
  | 'register_write_data'
  | 'register_write_enable'
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

export function isUartTransmitterComponent(component: FpgaArchitectureComponentContract) {
  return /\b(?:uart_tx|uart_transmitter|serial_transmitter|tx_uart)\b/i.test(componentText(component));
}

export function isRegisterFileComponent(component: FpgaArchitectureComponentContract) {
  return /\b(?:register_file|regfile|register\s+file|cpu\s+register)\b/i.test(componentText(component));
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

  if (/^(?:clk|clock|aclk|sclk|mclk|pclk|pixel_clk|pix_clk|video_clk)$/.test(base)) set('clock', 100, `name ${port.name} is clock-like`);
  if (/^(?:rst|reset|rstn|resetn|rst_n|reset_n|aresetn|reset_b)$/.test(base) || /rst_n|rst_ni|reset_n|reset_ni|aresetn|resetn/.test(name)) {
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

  if (mode === 'in' && /(?:^|_)uart_rx$|(?:^|_)rx$|rx_i$|serial_rx|rxd|miso|mosi/.test(name) && isScalarLogic(type)) {
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

  if (isUartTransmitterComponent(component)) {
    if (mode === 'in' && /^(?:valid|valid_i|tx_valid|tx_valid_i|data_valid|data_valid_i|request_valid|req_valid)$/i.test(base)) {
      set('tx_request_valid', 96, `UART TX input ${port.name} is transmit-request valid`);
    }
    if ((mode === 'out' || mode === 'buffer') && /^(?:ready|ready_o|tx_ready|tx_ready_o|request_ready|req_ready)$/i.test(base)) {
      set('tx_request_ready', 96, `UART TX output ${port.name} is transmit-request ready`);
    }
    if ((mode === 'out' || mode === 'buffer') && /^(?:tx|tx_o|uart_tx|uart_tx_o|serial_tx|serial_tx_o|txd)$/i.test(base) && isScalarLogic(type)) {
      set('serial_tx', 98, `UART TX output ${port.name} is serial TX`);
    }
    if (mode === 'in' && isVector(type) && /^(?:data|data_i|tx_data|tx_data_i|payload|payload_i|byte_i)$/i.test(base)) {
      set('payload_in', 94, `UART TX input ${port.name} is transmit payload`);
    }
  }

  if (isRegisterFileComponent(component)) {
    if (mode === 'in' && /^(?:src_addr|src_addr_i|read_addr|read_addr_i|rd_addr|rd_addr_i|rs1_addr|rs2_addr|raddr|raddr_i)$/i.test(base)) {
      set('register_read_address', 98, `register-file input ${port.name} is read-address`);
    }
    if (mode === 'in' && /^(?:dst_addr|dst_addr_i|write_addr|write_addr_i|wr_addr|wr_addr_i|rdst_addr|waddr|waddr_i)$/i.test(base)) {
      set('register_write_address', 98, `register-file input ${port.name} is write-address`);
    }
    if ((mode === 'out' || mode === 'buffer') && isVector(type) && /^(?:data|data_out|data_o|read_data|read_data_o|rd_data|rd_data_o|src_data|src_data_o|rdata|rdata_o)$/i.test(base)) {
      set('register_read_data', 96, `register-file output ${port.name} is read-data`);
    }
    if (mode === 'in' && isVector(type) && /^(?:data|data_in|data_i|write_data|write_data_i|wr_data|wr_data_i|dst_data|dst_data_i|wdata|wdata_i)$/i.test(base)) {
      set('register_write_data', 96, `register-file input ${port.name} is write-data`);
    }
    if (mode === 'in' && /^(?:we|we_i|wr_en|wr_en_i|write_enable|write_enable_i|reg_write|reg_write_i)$/i.test(base)) {
      set('register_write_enable', 96, `register-file input ${port.name} is write-enable`);
    }
  }

  if (role === 'payload_in' && isReceiverLikeComponent(component) && /data_i|payload_i|din/.test(name)) {
    optional = true;
    evidence.push(`payload input ${port.name} is optional/suspicious on receiver-like component ${component.id}`);
  }

  return {
    role,
    activeLowReset: role === 'reset' && /(?:_n$|_ni$|n$|_b$|aresetn|resetn)/i.test(name),
    optional,
    confidence,
    evidence,
  };
}

export function rolesCompatible(verified: VerifiedPortRoleEvidence, approved: VerifiedPortRoleEvidence) {
  if (verified.role === approved.role && verified.role !== 'unknown') return true;
  if (verified.role.startsWith('register_') || approved.role.startsWith('register_')) return false;
  if (verified.role.startsWith('tx_request_') || approved.role.startsWith('tx_request_')) return false;
  if (verified.role === 'payload_out' && approved.role === 'data') return true;
  if (verified.role === 'data' && approved.role === 'payload_out') return true;
  if (verified.role === 'payload_in' && approved.role === 'data') return true;
  if (verified.role === 'data' && approved.role === 'payload_in') return true;
  if (verified.role === 'error' && approved.role === 'status') return true;
  return false;
}
