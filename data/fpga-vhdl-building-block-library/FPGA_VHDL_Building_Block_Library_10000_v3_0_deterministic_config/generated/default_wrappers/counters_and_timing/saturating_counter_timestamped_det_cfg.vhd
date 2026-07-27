-- Deterministic generated wrapper. Do not edit manually.
-- Source block: saturating_counter_timestamped
-- Configuration ID: SATURATING_COUNTER_TIMESTAMPED_DB6C8D031EF882FB
-- Source: rtl/blocks/counters_and_timing/saturating_counter_timestamped.vhd
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity saturating_counter_timestamped_det_cfg is
  generic (
    COUNT_WIDTH : positive := 32;
    MODULUS : positive := 65536;
    STEP : positive := 1;
    SATURATING : boolean := true;
    DOWN_COUNT : boolean := false;
    G_CONFIG_SCHEMA : natural := 1;
    G_CONFIG_ID : string := "SATURATING_COUNTER_TIMESTAMPED_DB6C8D031EF882FB"
  );
  port (
    clk : in std_logic;
    rst_n : in std_logic;
    enable : in std_logic;
    load : in std_logic;
    clear : in std_logic;
    load_value : in std_logic_vector(COUNT_WIDTH-1 downto 0);
    count : out std_logic_vector(COUNT_WIDTH-1 downto 0);
    terminal_count : out std_logic;
    overflow : out std_logic
  );
end entity;

architecture deterministic_wrapper of saturating_counter_timestamped_det_cfg is
begin
  assert G_CONFIG_SCHEMA = 1 report "Unsupported deterministic configuration schema" severity failure;
  assert COUNT_WIDTH = 32 report "Locked deterministic configuration mismatch: COUNT_WIDTH" severity failure;
  assert MODULUS = 65536 report "Locked deterministic configuration mismatch: MODULUS" severity failure;
  assert STEP = 1 report "Locked deterministic configuration mismatch: STEP" severity failure;
  assert SATURATING = true report "Locked deterministic configuration mismatch: SATURATING" severity failure;
  assert DOWN_COUNT = false report "Locked deterministic configuration mismatch: DOWN_COUNT" severity failure;

  u_block : entity work.saturating_counter_timestamped
    generic map (
      COUNT_WIDTH => COUNT_WIDTH,
      MODULUS => MODULUS,
      STEP => STEP,
      SATURATING => SATURATING,
      DOWN_COUNT => DOWN_COUNT
    )
    port map (
      clk => clk,
      rst_n => rst_n,
      enable => enable,
      load => load,
      clear => clear,
      load_value => load_value,
      count => count,
      terminal_count => terminal_count,
      overflow => overflow
    );
end architecture;
