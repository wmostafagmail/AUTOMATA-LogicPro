-- Deterministic generated wrapper. Do not edit manually.
-- Source block: single_port_ram_single_clock
-- Configuration ID: SINGLE_PORT_RAM_SINGLE_CLOCK_A56F53B04114BA6C
-- Source: rtl/blocks/memory/single_port_ram_single_clock.vhd
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity single_port_ram_single_clock_det_cfg is
  generic (
    DATA_WIDTH : positive := 32;
    DEPTH : positive := 256;
    G_CONFIG_SCHEMA : natural := 1;
    G_CONFIG_ID : string := "SINGLE_PORT_RAM_SINGLE_CLOCK_A56F53B04114BA6C"
  );
  port (
    clk : in std_logic;
    rst_n : in std_logic;
    wr_en : in std_logic;
    wr_addr : in std_logic_vector(clog2(DEPTH)-1 downto 0);
    wr_data : in std_logic_vector(DATA_WIDTH-1 downto 0);
    rd_en : in std_logic;
    rd_addr : in std_logic_vector(clog2(DEPTH)-1 downto 0);
    rd_data : out std_logic_vector(DATA_WIDTH-1 downto 0);
    rd_valid : out std_logic
  );
end entity;

architecture deterministic_wrapper of single_port_ram_single_clock_det_cfg is
begin
  assert G_CONFIG_SCHEMA = 1 report "Unsupported deterministic configuration schema" severity failure;
  assert DATA_WIDTH = 32 report "Locked deterministic configuration mismatch: DATA_WIDTH" severity failure;
  assert DEPTH = 256 report "Locked deterministic configuration mismatch: DEPTH" severity failure;

  u_block : entity work.single_port_ram_single_clock
    generic map (
      DATA_WIDTH => DATA_WIDTH,
      DEPTH => DEPTH
    )
    port map (
      clk => clk,
      rst_n => rst_n,
      wr_en => wr_en,
      wr_addr => wr_addr,
      wr_data => wr_data,
      rd_en => rd_en,
      rd_addr => rd_addr,
      rd_data => rd_data,
      rd_valid => rd_valid
    );
end architecture;
