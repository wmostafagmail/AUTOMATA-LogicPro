-- Deterministic generated wrapper. Do not edit manually.
-- Source block: capacitance_measurement_engine_multi_channel
-- Configuration ID: CAPACITANCE_MEASUREMENT_ENGINE_MULTI_CHANNEL_5B0F41DEB899A4D6
-- Source: rtl/blocks/advanced_sensor_interfaces/capacitance_measurement_engine_multi_channel.vhd
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity capacitance_measurement_engine_multi_channel_det_cfg is
  generic (
    SENSOR_WIDTH : positive := 16;
    DATA_WIDTH : positive := 32;
    THRESHOLD : natural := 100;
    G_CONFIG_SCHEMA : natural := 1;
    G_CONFIG_ID : string := "CAPACITANCE_MEASUREMENT_ENGINE_MULTI_CHANNEL_5B0F41DEB899A4D6"
  );
  port (
    clk : in std_logic;
    rst_n : in std_logic;
    trigger : in std_logic;
    sensor_in : in std_logic_vector(SENSOR_WIDTH-1 downto 0);
    sample_out : out std_logic_vector(DATA_WIDTH-1 downto 0);
    sample_valid : out std_logic;
    event_irq : out std_logic
  );
end entity;

architecture deterministic_wrapper of capacitance_measurement_engine_multi_channel_det_cfg is
begin
  assert G_CONFIG_SCHEMA = 1 report "Unsupported deterministic configuration schema" severity failure;
  assert SENSOR_WIDTH = 16 report "Locked deterministic configuration mismatch: SENSOR_WIDTH" severity failure;
  assert DATA_WIDTH = 32 report "Locked deterministic configuration mismatch: DATA_WIDTH" severity failure;
  assert THRESHOLD = 100 report "Locked deterministic configuration mismatch: THRESHOLD" severity failure;

  u_block : entity work.capacitance_measurement_engine_multi_channel
    generic map (
      SENSOR_WIDTH => SENSOR_WIDTH,
      DATA_WIDTH => DATA_WIDTH,
      THRESHOLD => THRESHOLD
    )
    port map (
      clk => clk,
      rst_n => rst_n,
      trigger => trigger,
      sensor_in => sensor_in,
      sample_out => sample_out,
      sample_valid => sample_valid,
      event_irq => event_irq
    );
end architecture;
