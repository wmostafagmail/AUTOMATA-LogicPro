library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.bb_util_pkg.all;

entity bbq_barrel_shifter_core is
  generic (WIDTH : positive := 32);
  port (
    data_in     : in  std_logic_vector(WIDTH-1 downto 0);
    shift_amt   : in  std_logic_vector(clog2(WIDTH+1)-1 downto 0);
    direction   : in  std_logic;
    arithmetic  : in  std_logic;
    rotate      : in  std_logic;
    data_out    : out std_logic_vector(WIDTH-1 downto 0)
  );
end entity;

architecture rtl of bbq_barrel_shifter_core is
begin
  process(all)
    variable n : natural range 0 to WIDTH;
    variable x : std_logic_vector(WIDTH-1 downto 0);
  begin
    n := to_integer(unsigned(shift_amt));
    if WIDTH > 0 then n := n mod WIDTH; end if;
    x := data_in;
    if rotate='1' then
      if n=0 then x:=data_in;
      elsif direction='0' then x := data_in(WIDTH-n-1 downto 0) & data_in(WIDTH-1 downto WIDTH-n);
      else x := data_in(n-1 downto 0) & data_in(WIDTH-1 downto n);
      end if;
    elsif direction='0' then
      x := std_logic_vector(shift_left(unsigned(data_in), n));
    elsif arithmetic='1' then
      x := std_logic_vector(shift_right(signed(data_in), n));
    else
      x := std_logic_vector(shift_right(unsigned(data_in), n));
    end if;
    data_out <= x;
  end process;
end architecture;
