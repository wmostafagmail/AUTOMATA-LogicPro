-- Deterministic generated wrapper. Do not edit manually.
-- Source block: alu
-- Configuration ID: ALU_DDDD39B0603133E7
-- Source: rtl/blocks/compute/alu.vhd
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity alu_det_cfg is
  generic (
    DATA_WIDTH : positive := 32;
    RESULT_WIDTH : positive := 32;
    OP_WIDTH : positive := 4;
    SIGNED_MODE : boolean := false;
    G_CONFIG_SCHEMA : natural := 1;
    G_CONFIG_ID : string := "ALU_DDDD39B0603133E7"
  );
  port (
    clk : in std_logic;
    rst_n : in std_logic;
    op : in std_logic_vector(OP_WIDTH-1 downto 0);
    in_a : in std_logic_vector(DATA_WIDTH-1 downto 0);
    in_b : in std_logic_vector(DATA_WIDTH-1 downto 0);
    in_valid : in std_logic;
    in_ready : out std_logic;
    result : out std_logic_vector(RESULT_WIDTH-1 downto 0);
    flags : out std_logic_vector(3 downto 0);
    out_valid : out std_logic;
    out_ready : in std_logic
  );
end entity;

architecture deterministic_wrapper of alu_det_cfg is
begin
  assert G_CONFIG_SCHEMA = 1 report "Unsupported deterministic configuration schema" severity failure;
  assert DATA_WIDTH = 32 report "Locked deterministic configuration mismatch: DATA_WIDTH" severity failure;
  assert RESULT_WIDTH = 32 report "Locked deterministic configuration mismatch: RESULT_WIDTH" severity failure;
  assert OP_WIDTH = 4 report "Locked deterministic configuration mismatch: OP_WIDTH" severity failure;
  assert SIGNED_MODE = false report "Locked deterministic configuration mismatch: SIGNED_MODE" severity failure;

  u_block : entity work.alu
    generic map (
      DATA_WIDTH => DATA_WIDTH,
      RESULT_WIDTH => RESULT_WIDTH,
      OP_WIDTH => OP_WIDTH,
      SIGNED_MODE => SIGNED_MODE
    )
    port map (
      clk => clk,
      rst_n => rst_n,
      op => op,
      in_a => in_a,
      in_b => in_b,
      in_valid => in_valid,
      in_ready => in_ready,
      result => result,
      flags => flags,
      out_valid => out_valid,
      out_ready => out_ready
    );
end architecture;
