-- Deterministic generated wrapper. Do not edit manually.
-- Source block: memory_initializer_programmable
-- Configuration ID: MEMORY_INITIALIZER_PROGRAMMABLE_102F7FCE006E7355
-- Source: rtl/blocks/dma_and_memory_services/memory_initializer_programmable.vhd
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity memory_initializer_programmable_det_cfg is
  generic (
    DATA_WIDTH : positive := 32;
    DEPTH : positive := 256;
    G_CONFIG_SCHEMA : natural := 1;
    G_CONFIG_ID : string := "MEMORY_INITIALIZER_PROGRAMMABLE_102F7FCE006E7355"
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

architecture deterministic_wrapper of memory_initializer_programmable_det_cfg is
begin
  assert G_CONFIG_SCHEMA = 1 report "Unsupported deterministic configuration schema" severity failure;
  assert DATA_WIDTH = 32 report "Locked deterministic configuration mismatch: DATA_WIDTH" severity failure;
  assert DEPTH = 256 report "Locked deterministic configuration mismatch: DEPTH" severity failure;

  u_block : entity work.memory_initializer_programmable
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
