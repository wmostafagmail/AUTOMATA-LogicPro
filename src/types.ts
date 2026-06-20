export type SignalType = 'wire' | 'bus' | 'clock' | 'gate' | 'decoder';

export interface Signal {
  id: string;
  name: string;
  type: SignalType;
  color: string; // Hex color for the rendering trace
  visible: boolean;
  pinned: boolean;
  
  // Waveform data of length equal to simulation ticks (e.g., 100 or 200)
  // For 'wire', 'clock', 'gate': values are 0 (Low), 1 (High), -1 (High-Z)
  // For 'bus': number index or hex string
  // For 'decoder': string value representing decoded packet (e.g., "0x53", "S", "ACK", "[START]")
  values: (number | string)[]; 

  // Generator configuration for automatic computation
  config?: {
    // For Clock signals
    frequency?: number;     // Ticks per period (e.g., 8 ticks)
    dutyCycle?: number;     // Ratio high:low (e.g., 0.5)
    phase?: number;         // Phase offset in ticks (e.g., 0)

    // For Counters / custom patterns
    bitWidth?: number;      // e.g., 4 or 8 bits
    step?: number;          // Ticks before incrementing

    // For Logics (Gate)
    gateType?: 'AND' | 'OR' | 'NOT' | 'XOR' | 'NAND' | 'NOR' | 'XNOR';
    inputA?: string;        // Signal ID A
    inputB?: string;        // Signal ID B (null for NOT)

    // For Protocol Decoders
    decoderType?: 'SPI' | 'I2C' | 'UART';
    clkSignalId?: string;   // Clock signal ID for synchronous SPI/I2C
    dataSignalId?: string;  // Data/SDA/MOSI signal ID
    csSignalId?: string;    // SPI Chip Select ID
    rxSignalId?: string;    // UART RX Signal ID
    baudTicks?: number;     // Ticks per bit for UART (e.g., 8 ticks)
  };

  format?: 'hex' | 'dec' | 'bin' | 'ascii';
}

export interface SimulationState {
  length: number;           // Total ticks in simulation timeline (default: 100)
  timeUnit: 'ns' | 'us' | 'ms' | 's'; // Time base
  tickDuration: number;     // Scale of one tick in units (e.g., 5 ns)
  signals: Signal[];
  zoom: number;             // Zoom level (0.5 to 4.0)
  pan: number;              // Pan offset in pixels
  cursorA: number | null;   // Cursor A position (tick floating)
  cursorB: number | null;   // Cursor B position (tick floating)
  activeMarker: string | null; // ID of signal that acts as trigger
}

export interface ProjectFileEntry {
  path: string;
  name: string;
  extension: string;
  size: number;
  type: string;
  lastModified: number;
  file?: File;
  handle?: FileSystemFileHandle;
}

export interface ProjectContextPayload {
  name: string;
  fileCount: number;
  filePaths: string[];
  excerpts: Array<{
    path: string;
    content: string;
  }>;
}

export interface GhdlStatus {
  installed: boolean;
  version?: string;
  platform: string;
  installer?: string | null;
  installCommand?: string[] | null;
  reason?: string;
}

export interface GhdlSourceFile {
  path: string;
  name: string;
  entities: string[];
  packages: string[];
  packageBodies: string[];
  dependencies: string[];
  isTestbench: boolean;
}

export interface GhdlProjectInfo {
  sources: GhdlSourceFile[];
  topCandidates: string[];
  defaultTopEntity: string;
  defaultSourcePaths: string[];
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  signals: Signal[];
  length: number;
  tickDuration: number;
  timeUnit: 'ns' | 'us' | 'ms' | 's';
}
