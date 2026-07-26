library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.bb_util_pkg.all;

entity bb_sync_ram_core is
  generic (
    DATA_WIDTH : positive := 32;
    DEPTH      : positive := 256
  );
  port (
    clk      : in  std_logic;
    rst_n    : in  std_logic;
    wr_en    : in  std_logic;
    wr_addr  : in  std_logic_vector(clog2(DEPTH)-1 downto 0);
    wr_data  : in  std_logic_vector(DATA_WIDTH-1 downto 0);
    rd_en    : in  std_logic;
    rd_addr  : in  std_logic_vector(clog2(DEPTH)-1 downto 0);
    rd_data  : out std_logic_vector(DATA_WIDTH-1 downto 0);
    rd_valid : out std_logic
  );
end entity;

architecture rtl of bb_sync_ram_core is
  type mem_t is array (0 to DEPTH-1) of std_logic_vector(DATA_WIDTH-1 downto 0);
  signal mem : mem_t := (others => (others => '0'));
  signal rd_reg : std_logic_vector(DATA_WIDTH-1 downto 0) := (others => '0');
  signal valid_reg : std_logic := '0';
begin
  rd_data <= rd_reg;
  rd_valid <= valid_reg;
  process(clk)
  begin
    if rising_edge(clk) then
      if rst_n = '0' then
        rd_reg <= (others => '0');
        valid_reg <= '0';
      else
        valid_reg <= rd_en;
        if wr_en = '1' then
          mem(to_integer(unsigned(wr_addr))) <= wr_data;
        end if;
        if rd_en = '1' then
          rd_reg <= mem(to_integer(unsigned(rd_addr)));
        end if;
      end if;
    end if;
  end process;
end architecture;
