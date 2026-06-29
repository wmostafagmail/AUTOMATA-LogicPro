export const generateVhdlTbGood = `## Selected Skills
- Primary: VHDL-skill-orchestrator
- Supporting: vhdl-language - generate VHDL artifact code

## Assumptions
The DUT uses a synchronous active-high reset and a single rising-edge clock.

## Generated Artifacts
### demo.vhd
\`\`\`vhdl
library ieee;
use ieee.std_logic_1164.all;

entity demo is
  port (
    clk : in std_logic;
    rst : in std_logic
  );
end entity;
\`\`\`

### demo_tb.vhd
\`\`\`vhdl
library ieee;
use ieee.std_logic_1164.all;

entity demo_tb is
end entity;

architecture sim of demo_tb is
  signal clk : std_logic := '0';
  signal rst : std_logic := '1';
begin
  clk <= not clk after 5 ns;
  stimulus : process
  begin
    wait for 20 ns;
    rst <= '0';
    wait for 40 ns;
    assert rst = '0' report "reset released" severity note;
    wait;
  end process;
end architecture;
\`\`\`

## Verification Notes
Run the testbench for at least 200 ns and confirm reset and first active cycle behavior.`;

export const generateVhdlTbBad = `Here is a rough testbench idea without sections.
\`\`\`
entity broken is
\`\`\``;

export const inspectRaceHazardsGood = `## Selected Skills
- Primary: VHDL-skill-orchestrator
- Supporting: rtl-verification - inspect timing and hazard evidence

## Hazard Summary
The deterministic scan shows a setup/hold risk near clk and a narrow pulse on data_valid.

## Suspected Root Causes
The data_valid transition is within one tick of the clk active edge, which matches the setup/hold warning from the deterministic hazard scan.

## Recommended Fixes
Register the source signal one cycle earlier and add synchronizer staging for the asynchronous crossing.`;

export const inspectRaceHazardsBad = `## Selected Skills
- Primary: VHDL-skill-orchestrator

## Hazard Summary
The waveform feels unstable.

## Suspected Root Causes
The issue may come from a generic bus timing problem.

## Recommended Fixes
Debounce the path and review the logic.`;

export const protocolDecoderGood = `## Selected Skills
- Primary: VHDL-skill-orchestrator
- Supporting: vhdl-language - reason about protocol behavior

## Decoded Frames
The deterministic pre-decode found SPI frame 0xA5 on spi_decoder via MOSI and a second frame 0x3C.

## Protocol Interpretation
SPI traffic appears to write a command byte followed by a payload byte.

## Anomalies / Uncertainty
Frame spacing is consistent, but chip select deassertion between bytes is short, so timing margin should be reviewed.`;

export const protocolDecoderBad = `## Selected Skills
- Primary: VHDL-skill-orchestrator

## Decoded Frames
There may be traffic, but I cannot tell much from this waveform.

## Protocol Interpretation
The link may be carrying command traffic.

## Anomalies / Uncertainty
The decode is still unclear.`;

export const verifyClockResetGood = `## Selected Skills
- Primary: VHDL-skill-orchestrator
- Supporting: fpga-architecture - review startup sequencing

## Observed Sequence
The primary clock is toggling with a stable cadence before reset deasserts, and reset remains asserted through the initial startup window.

## Risks
The deterministic hazard scan shows a setup/hold risk near clk during reset release, so the reset handoff should stay synchronized.

## Recommendations
Startup sequencing looks clean. Keep reset release aligned to the stable clock domain.`;

export const explainFsmGood = `## Selected Skills
- Primary: VHDL-skill-orchestrator
- Supporting: fpga-architecture - infer likely FSM structure

## Likely States
The waveform suggests an IDLE phase, an active TRANSFER phase, and a short COMPLETE phase.

## Transition Evidence
The control outputs change in a repeatable order that indicates a transition from IDLE to TRANSFER when chip-select asserts, then COMPLETE when the byte finishes.

## State Diagram
\`\`\`mermaid
stateDiagram-v2
  [*] --> IDLE
  IDLE --> TRANSFER: chip_select asserted
  TRANSFER --> COMPLETE: byte_done
  COMPLETE --> IDLE: return idle
\`\`\`

## Uncertainty
The exact state encoding is not visible, so the labels are inferred from behavior rather than from internal state bits.`;

export const summarizeProtocolTimelineGood = `## Selected Skills
- Primary: VHDL-skill-orchestrator
- Supporting: rtl-verification - summarize decoded protocol activity

## Timeline Summary
Protocol activity starts with an SPI command byte followed by a payload byte, then the bus returns idle.

## Decoded Transactions
The deterministic pre-decode reports SPI byte 0xA5 followed by SPI byte 0x3C in time order.

## Anomalies / Uncertainty
Chip-select spacing is short between frames, so the inter-frame boundary should be reviewed.`;

export const generateAssertionsGood = `## Selected Skills
- Primary: VHDL-skill-orchestrator
- Supporting: rtl-verification - generate assertion checks

## Assumptions
Assertions target a single synchronous SPI receive path and a stable active-low chip select.

## Assertions
The deterministic protocol pre-decode reports SPI byte 0xA5, and the deterministic hazard scan highlights a setup/hold-sensitive sampling window, so these assertions focus on protecting that observed behavior.
\`\`\`vhdl
assert not (cs_n = '0' and sck'event and sck = '1' and mosi = 'X')
  report "Unexpected unknown MOSI value during active SPI sampling"
  severity error;
\`\`\`

## Verification Notes
Place the assertions in the testbench or checker process and review failures around active transfers.`;

export const draftRtlSkeletonGood = `## Selected Skills
- Primary: VHDL-skill-orchestrator
- Supporting: vhdl-language - draft entity and architecture skeleton

## Assumptions
The interface appears to contain a clock, reset, chip select, serial clock, data in, and a valid output.

## Entity Skeleton
### spi_receiver.vhd
\`\`\`vhdl
library ieee;
use ieee.std_logic_1164.all;

entity spi_receiver is
  port (
    clk      : in  std_logic;
    rst      : in  std_logic;
    cs_n     : in  std_logic;
    sck      : in  std_logic;
    mosi     : in  std_logic;
    data_out : out std_logic_vector(7 downto 0);
    valid    : out std_logic
  );
end entity;
architecture rtl of spi_receiver is
  signal shift_reg : std_logic_vector(7 downto 0) := (others => '0');
  signal bit_count : integer range 0 to 7 := 0;
begin
  process (clk)
  begin
    if rising_edge(clk) then
      if rst = '1' then
        shift_reg <= (others => '0');
        bit_count <= 0;
        valid <= '0';
      else
        valid <= '0';
      end if;
    end if;
  end process;
end architecture;
\`\`\`

## Architecture Outline
Use a shift register for serial capture and a byte-complete pulse when eight bits have been observed.

## Verification Notes
Compare the generated byte timing against the loaded waveform before filling in the full internals.`;

export const suggestDebugProbesGood = `## Selected Skills
- Primary: VHDL-skill-orchestrator
- Supporting: rtl-verification - recommend probes and capture plan

## Blind Spots
The current capture does not expose the internal byte counter or state transition markers, and the deterministic protocol pre-decode plus hazard scan point to a short framing gap that is not fully explained.

## Recommended Probes
Add the internal shift counter, byte-complete pulse, FSM state bits, and synchronized reset release flag.

## Capture Plan
Trigger on chip-select assertion, capture two full transactions, and keep the added state and counter signals visible alongside MOSI/SCK/CS.`;
