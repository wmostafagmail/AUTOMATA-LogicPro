library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.bb_util_pkg.all;

entity bb_mmio_core is
  generic (
    ADDR_WIDTH : positive := 8;
    DATA_WIDTH : positive := 32;
    REG_COUNT  : positive := 16
  );
  port (
    clk       : in  std_logic;
    rst_n     : in  std_logic;
    addr      : in  std_logic_vector(ADDR_WIDTH-1 downto 0);
    write_en  : in  std_logic;
    read_en   : in  std_logic;
    wdata     : in  std_logic_vector(DATA_WIDTH-1 downto 0);
    wstrb     : in  std_logic_vector(DATA_WIDTH/8-1 downto 0);
    rdata     : out std_logic_vector(DATA_WIDTH-1 downto 0);
    ready     : out std_logic;
    error     : out std_logic;
    irq       : out std_logic
  );
end entity;

architecture rtl of bb_mmio_core is
  type regs_t is array (0 to REG_COUNT-1) of std_logic_vector(DATA_WIDTH-1 downto 0);
  signal regs : regs_t := (others => (others => '0'));
  signal index : natural range 0 to REG_COUNT := 0;
begin
  index <= to_integer(unsigned(addr(ADDR_WIDTH-1 downto 2)));
  ready <= write_en or read_en;
  error <= '1' when (write_en = '1' or read_en = '1') and index >= REG_COUNT else '0';
  rdata <= regs(index) when index < REG_COUNT else (others => '0');
  irq <= regs(0)(0);
  process(clk)
  begin
    if rising_edge(clk) then
      if rst_n = '0' then
        regs <= (others => (others => '0'));
      elsif write_en = '1' and index < REG_COUNT then
        for byte_index in 0 to DATA_WIDTH/8-1 loop
          if wstrb(byte_index) = '1' then
            regs(index)(8*byte_index+7 downto 8*byte_index) <= wdata(8*byte_index+7 downto 8*byte_index);
          end if;
        end loop;
      end if;
    end if;
  end process;
end architecture;
