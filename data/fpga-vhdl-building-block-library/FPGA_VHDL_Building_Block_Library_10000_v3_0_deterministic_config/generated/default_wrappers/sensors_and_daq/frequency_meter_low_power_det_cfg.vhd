-- Deterministic generated wrapper. Do not edit manually.
-- Source block: frequency_meter_low_power
-- Configuration ID: FREQUENCY_METER_LOW_POWER_3F0B8064DE8850DF
-- Source: rtl/blocks/sensors_and_daq/frequency_meter_low_power.vhd
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity frequency_meter_low_power_det_cfg is
  generic (
    COUNT_WIDTH : positive := 32;
    MODULUS : positive := 65536;
    STEP : positive := 1;
    SATURATING : boolean := false;
    DOWN_COUNT : boolean := false;
    G_CONFIG_SCHEMA : natural := 1;
    G_CONFIG_ID : string := "FREQUENCY_METER_LOW_POWER_3F0B8064DE8850DF"
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

architecture deterministic_wrapper of frequency_meter_low_power_det_cfg is
begin
  assert G_CONFIG_SCHEMA = 1 report "Unsupported deterministic configuration schema" severity failure;
  assert COUNT_WIDTH = 32 report "Locked deterministic configuration mismatch: COUNT_WIDTH" severity failure;
  assert MODULUS = 65536 report "Locked deterministic configuration mismatch: MODULUS" severity failure;
  assert STEP = 1 report "Locked deterministic configuration mismatch: STEP" severity failure;
  assert SATURATING = false report "Locked deterministic configuration mismatch: SATURATING" severity failure;
  assert DOWN_COUNT = false report "Locked deterministic configuration mismatch: DOWN_COUNT" severity failure;

  u_block : entity work.frequency_meter_low_power
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
