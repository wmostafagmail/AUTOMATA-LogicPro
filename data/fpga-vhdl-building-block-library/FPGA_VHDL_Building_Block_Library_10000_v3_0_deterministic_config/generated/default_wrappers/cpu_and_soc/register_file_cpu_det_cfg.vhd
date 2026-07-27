-- Deterministic generated wrapper. Do not edit manually.
-- Source block: register_file_cpu
-- Configuration ID: REGISTER_FILE_CPU_D0E11087D6EA60D6
-- Source: rtl/blocks/cpu_and_soc/register_file_cpu.vhd
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity register_file_cpu_det_cfg is
  generic (
    XLEN : positive := 32;
    REG_COUNT : positive := 32;
    ZERO_REGISTER : boolean := true;
    G_CONFIG_SCHEMA : natural := 1;
    G_CONFIG_ID : string := "REGISTER_FILE_CPU_D0E11087D6EA60D6"
  );
  port (
    clk : in std_logic;
    rst_n : in std_logic;
    rs1_addr : in std_logic_vector(clog2(REG_COUNT)-1 downto 0);
    rs2_addr : in std_logic_vector(clog2(REG_COUNT)-1 downto 0);
    rd_addr : in std_logic_vector(clog2(REG_COUNT)-1 downto 0);
    rd_wdata : in std_logic_vector(XLEN-1 downto 0);
    rd_we : in std_logic;
    rs1_rdata : out std_logic_vector(XLEN-1 downto 0);
    rs2_rdata : out std_logic_vector(XLEN-1 downto 0)
  );
end entity;

architecture deterministic_wrapper of register_file_cpu_det_cfg is
begin
  assert G_CONFIG_SCHEMA = 1 report "Unsupported deterministic configuration schema" severity failure;
  assert XLEN = 32 report "Locked deterministic configuration mismatch: XLEN" severity failure;
  assert REG_COUNT = 32 report "Locked deterministic configuration mismatch: REG_COUNT" severity failure;
  assert ZERO_REGISTER = true report "Locked deterministic configuration mismatch: ZERO_REGISTER" severity failure;

  u_block : entity work.register_file_cpu
    generic map (
      XLEN => XLEN,
      REG_COUNT => REG_COUNT,
      ZERO_REGISTER => ZERO_REGISTER
    )
    port map (
      clk => clk,
      rst_n => rst_n,
      rs1_addr => rs1_addr,
      rs2_addr => rs2_addr,
      rd_addr => rd_addr,
      rd_wdata => rd_wdata,
      rd_we => rd_we,
      rs1_rdata => rs1_rdata,
      rs2_rdata => rs2_rdata
    );
end architecture;
