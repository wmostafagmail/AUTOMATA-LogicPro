-- Generated deterministic wrapper. Do not edit manually.
-- Configuration ID: PROGRAM_COUNTER_AAD86D1164F22FDC
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity program_counter_64bit_cfg is
  generic (
    PC_WIDTH : positive := 64;
    RESET_VECTOR : natural := 4096;
    INSTR_BYTES : positive := 4;
    G_CONFIG_SCHEMA : natural := 1;
    G_CONFIG_ID : string := "PROGRAM_COUNTER_AAD86D1164F22FDC"
  );
  port (
    clk : in std_logic;
    rst_n : in std_logic;
    stall : in std_logic;
    sequential_advance : in std_logic;
    redirect_valid : in std_logic;
    redirect_pc : in std_logic_vector(PC_WIDTH-1 downto 0);
    pc_current : out std_logic_vector(PC_WIDTH-1 downto 0);
    pc_next : out std_logic_vector(PC_WIDTH-1 downto 0);
    pc_valid : out std_logic
  );
end entity;

architecture deterministic_wrapper of program_counter_64bit_cfg is
begin
  assert G_CONFIG_SCHEMA = 1 report "Unsupported deterministic configuration schema" severity failure;
  assert PC_WIDTH = 64 report "Locked configuration mismatch: PC_WIDTH" severity failure;
  assert RESET_VECTOR = 4096 report "Locked configuration mismatch: RESET_VECTOR" severity failure;
  assert INSTR_BYTES = 4 report "Locked configuration mismatch: INSTR_BYTES" severity failure;
  u_block : entity work.program_counter
    generic map (
      PC_WIDTH => PC_WIDTH,
      RESET_VECTOR => RESET_VECTOR,
      INSTR_BYTES => INSTR_BYTES
    )
    port map (
      clk => clk,
      rst_n => rst_n,
      stall => stall,
      sequential_advance => sequential_advance,
      redirect_valid => redirect_valid,
      redirect_pc => redirect_pc,
      pc_current => pc_current,
      pc_next => pc_next,
      pc_valid => pc_valid
    );
end architecture;
