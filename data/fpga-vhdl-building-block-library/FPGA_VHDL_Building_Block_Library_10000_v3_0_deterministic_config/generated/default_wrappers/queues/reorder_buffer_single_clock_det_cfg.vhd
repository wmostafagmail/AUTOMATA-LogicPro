-- Deterministic generated wrapper. Do not edit manually.
-- Source block: reorder_buffer_single_clock
-- Configuration ID: REORDER_BUFFER_SINGLE_CLOCK_005F8AA3D2DE81B6
-- Source: rtl/blocks/queues/reorder_buffer_single_clock.vhd
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity reorder_buffer_single_clock_det_cfg is
  generic (
    DATA_WIDTH : positive := 32;
    DEPTH : positive := 16;
    G_CONFIG_SCHEMA : natural := 1;
    G_CONFIG_ID : string := "REORDER_BUFFER_SINGLE_CLOCK_005F8AA3D2DE81B6"
  );
  port (
    clk : in std_logic;
    rst_n : in std_logic;
    wr_en : in std_logic;
    wr_data : in std_logic_vector(DATA_WIDTH-1 downto 0);
    full : out std_logic;
    almost_full : out std_logic;
    rd_en : in std_logic;
    rd_data : out std_logic_vector(DATA_WIDTH-1 downto 0);
    empty : out std_logic;
    almost_empty : out std_logic;
    level : out std_logic_vector(clog2(DEPTH+1)-1 downto 0)
  );
end entity;

architecture deterministic_wrapper of reorder_buffer_single_clock_det_cfg is
begin
  assert G_CONFIG_SCHEMA = 1 report "Unsupported deterministic configuration schema" severity failure;
  assert DATA_WIDTH = 32 report "Locked deterministic configuration mismatch: DATA_WIDTH" severity failure;
  assert DEPTH = 16 report "Locked deterministic configuration mismatch: DEPTH" severity failure;

  u_block : entity work.reorder_buffer_single_clock
    generic map (
      DATA_WIDTH => DATA_WIDTH,
      DEPTH => DEPTH
    )
    port map (
      clk => clk,
      rst_n => rst_n,
      wr_en => wr_en,
      wr_data => wr_data,
      full => full,
      almost_full => almost_full,
      rd_en => rd_en,
      rd_data => rd_data,
      empty => empty,
      almost_empty => almost_empty,
      level => level
    );
end architecture;
