library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.bb_util_pkg.all;

entity bb_register_file_core is
  generic (
    XLEN          : positive := 32;
    REG_COUNT     : positive := 32;
    ZERO_REGISTER : boolean := true
  );
  port (
    clk       : in  std_logic;
    rst_n     : in  std_logic;
    rs1_addr  : in  std_logic_vector(clog2(REG_COUNT)-1 downto 0);
    rs2_addr  : in  std_logic_vector(clog2(REG_COUNT)-1 downto 0);
    rd_addr   : in  std_logic_vector(clog2(REG_COUNT)-1 downto 0);
    rd_wdata  : in  std_logic_vector(XLEN-1 downto 0);
    rd_we     : in  std_logic;
    rs1_rdata : out std_logic_vector(XLEN-1 downto 0);
    rs2_rdata : out std_logic_vector(XLEN-1 downto 0)
  );
end entity;

architecture rtl of bb_register_file_core is
  type regs_t is array (0 to REG_COUNT-1) of std_logic_vector(XLEN-1 downto 0);
  signal regs : regs_t := (others => (others => '0'));
  signal a1, a2, aw : natural range 0 to REG_COUNT-1;
begin
  a1 <= to_integer(unsigned(rs1_addr));
  a2 <= to_integer(unsigned(rs2_addr));
  aw <= to_integer(unsigned(rd_addr));
  rs1_rdata <= (others => '0') when ZERO_REGISTER and a1 = 0 else regs(a1);
  rs2_rdata <= (others => '0') when ZERO_REGISTER and a2 = 0 else regs(a2);

  process(clk)
  begin
    if rising_edge(clk) then
      if rst_n = '0' then
        regs <= (others => (others => '0'));
      elsif rd_we = '1' and not (ZERO_REGISTER and aw = 0) then
        regs(aw) <= rd_wdata;
      end if;
    end if;
  end process;
end architecture;
