library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.cpu_pkg.all;

entity regfile is
  port (
    clk   : in  std_logic;
    rst   : in  std_logic;
    we    : in  std_logic;
    addr  : in  addr_t;
    wdata : in  data_t;
    rdata : out data_t
  );
end entity regfile;

architecture rtl of regfile is
  signal regs : data_mem_t := (others => (others => '0'));
begin
  process(clk)
    variable idx : integer;
  begin
    if rising_edge(clk) then
      if rst = '1' then
        regs <= (others => (others => '0'));
      elsif we = '1' then
        idx := to_integer(addr);
        if idx >= 0 and idx < regs'length then
          regs(idx) <= wdata;
        end if;
      end if;
      idx := to_integer(addr);
      if idx >= 0 and idx < regs'length then
        rdata <= regs(idx);
      else
        rdata <= (others => '0');
      end if;
    end if;
  end process;
end architecture rtl;
