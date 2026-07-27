-- Deterministic generated wrapper. Do not edit manually.
-- Source block: pulse_synchronizer_multi_channel
-- Configuration ID: PULSE_SYNCHRONIZER_MULTI_CHANNEL_91E83A6D14E99BE9
-- Source: rtl/blocks/clock_reset_cdc/pulse_synchronizer_multi_channel.vhd
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity pulse_synchronizer_multi_channel_det_cfg is
  generic (
    DATA_WIDTH : positive := 1;
    STAGES : positive := 2;
    G_CONFIG_SCHEMA : natural := 1;
    G_CONFIG_ID : string := "PULSE_SYNCHRONIZER_MULTI_CHANNEL_91E83A6D14E99BE9"
  );
  port (
    dst_clk : in std_logic;
    dst_rst_n : in std_logic;
    async_in : in std_logic_vector(DATA_WIDTH-1 downto 0);
    sync_out : out std_logic_vector(DATA_WIDTH-1 downto 0)
  );
end entity;

architecture deterministic_wrapper of pulse_synchronizer_multi_channel_det_cfg is
begin
  assert G_CONFIG_SCHEMA = 1 report "Unsupported deterministic configuration schema" severity failure;
  assert DATA_WIDTH = 1 report "Locked deterministic configuration mismatch: DATA_WIDTH" severity failure;
  assert STAGES = 2 report "Locked deterministic configuration mismatch: STAGES" severity failure;

  u_block : entity work.pulse_synchronizer_multi_channel
    generic map (
      DATA_WIDTH => DATA_WIDTH,
      STAGES => STAGES
    )
    port map (
      dst_clk => dst_clk,
      dst_rst_n => dst_rst_n,
      async_in => async_in,
      sync_out => sync_out
    );
end architecture;
