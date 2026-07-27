-- Deterministic generated wrapper. Do not edit manually.
-- Source block: softmax_engine_pipelined
-- Configuration ID: SOFTMAX_ENGINE_PIPELINED_1BA62CE2A8849EEC
-- Source: rtl/blocks/machine_learning/softmax_engine_pipelined.vhd
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity softmax_engine_pipelined_det_cfg is
  generic (
    ELEM_WIDTH : positive := 8;
    LANES : positive := 4;
    ACC_WIDTH : positive := 32;
    G_CONFIG_SCHEMA : natural := 1;
    G_CONFIG_ID : string := "SOFTMAX_ENGINE_PIPELINED_1BA62CE2A8849EEC"
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

architecture deterministic_wrapper of softmax_engine_pipelined_det_cfg is
begin
  assert G_CONFIG_SCHEMA = 1 report "Unsupported deterministic configuration schema" severity failure;
  assert ELEM_WIDTH = 8 report "Locked deterministic configuration mismatch: ELEM_WIDTH" severity failure;
  assert LANES = 4 report "Locked deterministic configuration mismatch: LANES" severity failure;
  assert ACC_WIDTH = 32 report "Locked deterministic configuration mismatch: ACC_WIDTH" severity failure;

  u_block : entity work.softmax_engine_pipelined
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
