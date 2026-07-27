-- Deterministic generated wrapper. Do not edit manually.
-- Source block: pulse_synchronizer_fault_tolerant
-- Configuration ID: PULSE_SYNCHRONIZER_FAULT_TOLERANT_9B58B2D3027ED4BB
-- Source: rtl/blocks/clock_reset_cdc/pulse_synchronizer_fault_tolerant.vhd
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity pulse_synchronizer_fault_tolerant_det_cfg is
  generic (
    DATA_WIDTH : positive := 1;
    STAGES : positive := 2;
    G_CONFIG_SCHEMA : natural := 1;
    G_CONFIG_ID : string := "PULSE_SYNCHRONIZER_FAULT_TOLERANT_9B58B2D3027ED4BB"
  );
  port (
    dst_clk : in std_logic;
    dst_rst_n : in std_logic;
    async_in : in std_logic_vector(DATA_WIDTH-1 downto 0);
    sync_out : out std_logic_vector(DATA_WIDTH-1 downto 0)
  );
end entity;

architecture deterministic_wrapper of pulse_synchronizer_fault_tolerant_det_cfg is
begin
  assert G_CONFIG_SCHEMA = 1 report "Unsupported deterministic configuration schema" severity failure;
  assert DATA_WIDTH = 1 report "Locked deterministic configuration mismatch: DATA_WIDTH" severity failure;
  assert STAGES = 2 report "Locked deterministic configuration mismatch: STAGES" severity failure;

  u_block : entity work.pulse_synchronizer_fault_tolerant
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
