-- Deterministic generated wrapper. Do not edit manually.
-- Source block: diagnostic_test_sequencer_self_testing
-- Configuration ID: DIAGNOSTIC_TEST_SEQUENCER_SELF_TESTING_68A635887652E936
-- Source: rtl/blocks/advanced_functional_safety/diagnostic_test_sequencer_self_testing.vhd
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity diagnostic_test_sequencer_self_testing_det_cfg is
  generic (
    MON_WIDTH : positive := 16;
    COUNT_WIDTH : positive := 32;
    G_CONFIG_SCHEMA : natural := 1;
    G_CONFIG_ID : string := "DIAGNOSTIC_TEST_SEQUENCER_SELF_TESTING_68A635887652E936"
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

architecture deterministic_wrapper of diagnostic_test_sequencer_self_testing_det_cfg is
begin
  assert G_CONFIG_SCHEMA = 1 report "Unsupported deterministic configuration schema" severity failure;
  assert MON_WIDTH = 16 report "Locked deterministic configuration mismatch: MON_WIDTH" severity failure;
  assert COUNT_WIDTH = 32 report "Locked deterministic configuration mismatch: COUNT_WIDTH" severity failure;

  u_block : entity work.diagnostic_test_sequencer_self_testing
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
