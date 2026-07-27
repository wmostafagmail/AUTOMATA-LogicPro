-- Deterministic generated wrapper. Do not edit manually.
-- Source block: safe_state_controller_continuous
-- Configuration ID: SAFE_STATE_CONTROLLER_CONTINUOUS_AF4187F2AE3481EB
-- Source: rtl/blocks/safety_and_reliability/safe_state_controller_continuous.vhd
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity safe_state_controller_continuous_det_cfg is
  generic (
    MON_WIDTH : positive := 16;
    COUNT_WIDTH : positive := 32;
    G_CONFIG_SCHEMA : natural := 1;
    G_CONFIG_ID : string := "SAFE_STATE_CONTROLLER_CONTINUOUS_AF4187F2AE3481EB"
  );
  port (
    clk : in std_logic;
    rst_n : in std_logic;
    monitored_signals : in std_logic_vector(MON_WIDTH-1 downto 0);
    clear_faults : in std_logic;
    fault_detected : out std_logic_vector(MON_WIDTH-1 downto 0);
    safe_state_req : out std_logic;
    irq : out std_logic;
    error_count : out std_logic_vector(COUNT_WIDTH-1 downto 0)
  );
end entity;

architecture deterministic_wrapper of safe_state_controller_continuous_det_cfg is
begin
  assert G_CONFIG_SCHEMA = 1 report "Unsupported deterministic configuration schema" severity failure;
  assert MON_WIDTH = 16 report "Locked deterministic configuration mismatch: MON_WIDTH" severity failure;
  assert COUNT_WIDTH = 32 report "Locked deterministic configuration mismatch: COUNT_WIDTH" severity failure;

  u_block : entity work.safe_state_controller_continuous
    generic map (
      MON_WIDTH => MON_WIDTH,
      COUNT_WIDTH => COUNT_WIDTH
    )
    port map (
      clk => clk,
      rst_n => rst_n,
      monitored_signals => monitored_signals,
      clear_faults => clear_faults,
      fault_detected => fault_detected,
      safe_state_req => safe_state_req,
      irq => irq,
      error_count => error_count
    );
end architecture;
