-- Deterministic generated wrapper. Do not edit manually.
-- Source block: axi_stream_fifo_clock_crossing
-- Configuration ID: AXI_STREAM_FIFO_CLOCK_CROSSING_F91DD09AFB1A665C
-- Source: rtl/blocks/amba_axi_stream/axi_stream_fifo_clock_crossing.vhd
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity axi_stream_fifo_clock_crossing_det_cfg is
  generic (
    DATA_WIDTH : positive := 32;
    DEPTH : positive := 16;
    G_CONFIG_SCHEMA : natural := 1;
    G_CONFIG_ID : string := "AXI_STREAM_FIFO_CLOCK_CROSSING_F91DD09AFB1A665C"
  );
  port (
    wr_clk : in std_logic;
    wr_rst_n : in std_logic;
    wr_en : in std_logic;
    wr_data : in std_logic_vector(DATA_WIDTH-1 downto 0);
    full : out std_logic;
    almost_full : out std_logic;
    rd_clk : in std_logic;
    rd_rst_n : in std_logic;
    rd_en : in std_logic;
    rd_data : out std_logic_vector(DATA_WIDTH-1 downto 0);
    empty : out std_logic;
    almost_empty : out std_logic
  );
end entity;

architecture deterministic_wrapper of axi_stream_fifo_clock_crossing_det_cfg is
begin
  assert G_CONFIG_SCHEMA = 1 report "Unsupported deterministic configuration schema" severity failure;
  assert DATA_WIDTH = 32 report "Locked deterministic configuration mismatch: DATA_WIDTH" severity failure;
  assert DEPTH = 16 report "Locked deterministic configuration mismatch: DEPTH" severity failure;

  u_block : entity work.axi_stream_fifo_clock_crossing
    generic map (
      DATA_WIDTH => DATA_WIDTH,
      DEPTH => DEPTH
    )
    port map (
      wr_clk => wr_clk,
      wr_rst_n => wr_rst_n,
      wr_en => wr_en,
      wr_data => wr_data,
      full => full,
      almost_full => almost_full,
      rd_clk => rd_clk,
      rd_rst_n => rd_rst_n,
      rd_en => rd_en,
      rd_data => rd_data,
      empty => empty,
      almost_empty => almost_empty
    );
end architecture;
