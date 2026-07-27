-- Deterministic generated wrapper. Do not edit manually.
-- Source block: async_fifo
-- Configuration ID: ASYNC_FIFO_0A96F8A3C6DCA607
-- Source: rtl/blocks/memory/async_fifo.vhd
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity async_fifo_det_cfg is
  generic (
    DATA_WIDTH : positive := 32;
    DEPTH : positive := 16;
    G_CONFIG_SCHEMA : natural := 1;
    G_CONFIG_ID : string := "ASYNC_FIFO_0A96F8A3C6DCA607"
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

architecture deterministic_wrapper of async_fifo_det_cfg is
begin
  assert G_CONFIG_SCHEMA = 1 report "Unsupported deterministic configuration schema" severity failure;
  assert DATA_WIDTH = 32 report "Locked deterministic configuration mismatch: DATA_WIDTH" severity failure;
  assert DEPTH = 16 report "Locked deterministic configuration mismatch: DEPTH" severity failure;

  u_block : entity work.async_fifo
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
