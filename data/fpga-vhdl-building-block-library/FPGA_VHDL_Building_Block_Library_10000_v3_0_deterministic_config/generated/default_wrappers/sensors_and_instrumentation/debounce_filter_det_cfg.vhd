-- Deterministic generated wrapper. Do not edit manually.
-- Source block: debounce_filter
-- Configuration ID: DEBOUNCE_FILTER_DD0D461B92F5EFCF
-- Source: rtl/blocks/sensors_and_instrumentation/debounce_filter.vhd
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity debounce_filter_det_cfg is
  generic (
    STABLE_CYCLES : positive := 16;
    G_CONFIG_SCHEMA : natural := 1;
    G_CONFIG_ID : string := "DEBOUNCE_FILTER_DD0D461B92F5EFCF"
  );
  port (
    clk : in std_logic;
    rst_n : in std_logic;
    noisy_in : in std_logic;
    clean_out : out std_logic;
    rise_pulse : out std_logic;
    fall_pulse : out std_logic
  );
end entity;

architecture deterministic_wrapper of debounce_filter_det_cfg is
begin
  assert G_CONFIG_SCHEMA = 1 report "Unsupported deterministic configuration schema" severity failure;
  assert STABLE_CYCLES = 16 report "Locked deterministic configuration mismatch: STABLE_CYCLES" severity failure;

  u_block : entity work.debounce_filter
    generic map (
      STABLE_CYCLES => STABLE_CYCLES
    )
    port map (
      clk => clk,
      rst_n => rst_n,
      noisy_in => noisy_in,
      clean_out => clean_out,
      rise_pulse => rise_pulse,
      fall_pulse => fall_pulse
    );
end architecture;
