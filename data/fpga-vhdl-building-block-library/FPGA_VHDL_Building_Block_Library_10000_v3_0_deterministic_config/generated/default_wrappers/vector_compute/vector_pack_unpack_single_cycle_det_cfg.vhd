-- Deterministic generated wrapper. Do not edit manually.
-- Source block: vector_pack_unpack_single_cycle
-- Configuration ID: VECTOR_PACK_UNPACK_SINGLE_CYCLE_D8E6A6BA23AFE294
-- Source: rtl/blocks/vector_compute/vector_pack_unpack_single_cycle.vhd
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity vector_pack_unpack_single_cycle_det_cfg is
  generic (
    ELEM_WIDTH : positive := 8;
    LANES : positive := 4;
    ACC_WIDTH : positive := 32;
    G_CONFIG_SCHEMA : natural := 1;
    G_CONFIG_ID : string := "VECTOR_PACK_UNPACK_SINGLE_CYCLE_D8E6A6BA23AFE294"
  );
  port (
    clk : in std_logic;
    rst_n : in std_logic;
    vector_a : in std_logic_vector(LANES*ELEM_WIDTH-1 downto 0);
    vector_b : in std_logic_vector(LANES*ELEM_WIDTH-1 downto 0);
    in_valid : in std_logic;
    in_ready : out std_logic;
    result : out std_logic_vector(ACC_WIDTH-1 downto 0);
    out_valid : out std_logic;
    out_ready : in std_logic
  );
end entity;

architecture deterministic_wrapper of vector_pack_unpack_single_cycle_det_cfg is
begin
  assert G_CONFIG_SCHEMA = 1 report "Unsupported deterministic configuration schema" severity failure;
  assert ELEM_WIDTH = 8 report "Locked deterministic configuration mismatch: ELEM_WIDTH" severity failure;
  assert LANES = 4 report "Locked deterministic configuration mismatch: LANES" severity failure;
  assert ACC_WIDTH = 32 report "Locked deterministic configuration mismatch: ACC_WIDTH" severity failure;

  u_block : entity work.vector_pack_unpack_single_cycle
    generic map (
      ELEM_WIDTH => ELEM_WIDTH,
      LANES => LANES,
      ACC_WIDTH => ACC_WIDTH
    )
    port map (
      clk => clk,
      rst_n => rst_n,
      vector_a => vector_a,
      vector_b => vector_b,
      in_valid => in_valid,
      in_ready => in_ready,
      result => result,
      out_valid => out_valid,
      out_ready => out_ready
    );
end architecture;
