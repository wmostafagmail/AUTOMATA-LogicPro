library ieee;
use ieee.numeric_std.all;
use ieee.std_logic_1164.all;

entity data_mem is
  generic (
    ADDR_WIDTH : integer := 12;
    DATA_WIDTH : integer := 8
  );
  port (
    clk        : in  std_logic;
    addr       : in  std_logic_vector(ADDR_WIDTH - 1 downto 0);
    write_en   : in  std_logic;
    read_en    : in  std_logic;
    write_data : in  std_logic_vector(DATA_WIDTH - 1 downto 0);
    data_out   : out std_logic_vector(DATA_WIDTH - 1 downto 0)
  );
end entity data_mem;

architecture rtl of data_mem is
  type mem_array_t is array (0 to 2**ADDR_WIDTH - 1) of std_logic_vector(DATA_WIDTH - 1 downto 0);
  signal memory : mem_array_t := (others => (others => '0'));
begin
  
  process(clk)
    variable addr_idx : integer;
  begin
    if rising_edge(clk) then
      if write_en = '1' then
        addr_idx := to_integer(unsigned(addr));
        memory(addr_idx) <= write_data;
      end if;
      
      if read_en = '1' then
        addr_idx := to_integer(unsigned(addr));
        data_out <= memory(addr_idx);
      else
        data_out <= (others => 'Z');
      end if;
    end if;
  end process;

end architecture rtl;
