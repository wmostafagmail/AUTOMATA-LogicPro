library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.cpu_pkg.all;

entity ram is
  port (
    clk   : in  std_logic;
    we    : in  std_logic;
    addr  : in  addr_t;
    wdata : in  data_t;
    rdata : out data_t
  );
end entity ram;

architecture rtl of ram is
  signal mem : data_mem_t := (others => (others => '0'));
begin
  process(clk)
    variable idx : integer;
  begin
    if rising_edge(clk) then
      idx := to_integer(addr);
      if idx >= 0 and idx < mem'length then
        if we = '1' then
          mem(idx) <= wdata;
        end if;
        rdata <= mem(idx);
      else
        rdata <= (others => '0');
      end if;
    end if;
  end process;
end architecture rtl;
