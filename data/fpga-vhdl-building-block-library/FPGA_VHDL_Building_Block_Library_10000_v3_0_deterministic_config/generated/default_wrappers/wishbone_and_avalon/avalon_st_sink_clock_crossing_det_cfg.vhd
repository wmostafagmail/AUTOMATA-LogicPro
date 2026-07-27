-- Deterministic generated wrapper. Do not edit manually.
-- Source block: avalon_st_sink_clock_crossing
-- Configuration ID: AVALON_ST_SINK_CLOCK_CROSSING_753A8B8C61A14065
-- Source: rtl/blocks/wishbone_and_avalon/avalon_st_sink_clock_crossing.vhd
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity avalon_st_sink_clock_crossing_det_cfg is
  generic (
    DATA_WIDTH : positive := 1;
    STAGES : positive := 2;
    G_CONFIG_SCHEMA : natural := 1;
    G_CONFIG_ID : string := "AVALON_ST_SINK_CLOCK_CROSSING_753A8B8C61A14065"
  );
  port (
    dst_clk : in std_logic;
    dst_rst_n : in std_logic;
    async_in : in std_logic_vector(DATA_WIDTH-1 downto 0);
    sync_out : out std_logic_vector(DATA_WIDTH-1 downto 0)
  );
end entity;

architecture deterministic_wrapper of avalon_st_sink_clock_crossing_det_cfg is
begin
  assert G_CONFIG_SCHEMA = 1 report "Unsupported deterministic configuration schema" severity failure;
  assert DATA_WIDTH = 1 report "Locked deterministic configuration mismatch: DATA_WIDTH" severity failure;
  assert STAGES = 2 report "Locked deterministic configuration mismatch: STAGES" severity failure;

  u_block : entity work.avalon_st_sink_clock_crossing
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
