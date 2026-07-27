-- Deterministic generated wrapper. Do not edit manually.
-- Source block: nor_execute_in_place_cache_formally_instrumented
-- Configuration ID: NOR_EXECUTE_IN_PLACE_CACHE_FORMALLY_INSTRUMENTED_A67EEEE8B77FEFCB
-- Source: rtl/blocks/nonvolatile_memory/nor_execute_in_place_cache_formally_instrumented.vhd
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity nor_execute_in_place_cache_formally_instrumented_det_cfg is
  generic (
    ADDR_WIDTH : positive := 32;
    DATA_WIDTH : positive := 32;
    G_CONFIG_SCHEMA : natural := 1;
    G_CONFIG_ID : string := "NOR_EXECUTE_IN_PLACE_CACHE_FORMALLY_INSTRUMENTED_A67EEEE8B77FEFCB"
  );
  port (
    clk : in std_logic;
    rst_n : in std_logic;
    start : in std_logic;
    src_addr : in std_logic_vector(ADDR_WIDTH-1 downto 0);
    dst_addr : in std_logic_vector(ADDR_WIDTH-1 downto 0);
    data_in : in std_logic_vector(DATA_WIDTH-1 downto 0);
    data_out : out std_logic_vector(DATA_WIDTH-1 downto 0);
    busy : out std_logic;
    done : out std_logic;
    error : out std_logic
  );
end entity;

architecture deterministic_wrapper of nor_execute_in_place_cache_formally_instrumented_det_cfg is
begin
  assert G_CONFIG_SCHEMA = 1 report "Unsupported deterministic configuration schema" severity failure;
  assert ADDR_WIDTH = 32 report "Locked deterministic configuration mismatch: ADDR_WIDTH" severity failure;
  assert DATA_WIDTH = 32 report "Locked deterministic configuration mismatch: DATA_WIDTH" severity failure;

  u_block : entity work.nor_execute_in_place_cache_formally_instrumented
    generic map (
      ADDR_WIDTH => ADDR_WIDTH,
      DATA_WIDTH => DATA_WIDTH
    )
    port map (
      clk => clk,
      rst_n => rst_n,
      start => start,
      src_addr => src_addr,
      dst_addr => dst_addr,
      data_in => data_in,
      data_out => data_out,
      busy => busy,
      done => done,
      error => error
    );
end architecture;
