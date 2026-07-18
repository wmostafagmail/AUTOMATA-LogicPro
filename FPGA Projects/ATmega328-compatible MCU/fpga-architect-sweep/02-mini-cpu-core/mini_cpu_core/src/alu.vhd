library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.cpu_pkg.all;

entity alu is
  port (
    clk    : in  std_logic;
    rst    : in  std_logic;
    op     : in  data_t;
    a      : in  data_t;
    b      : in  data_t;
    result : out data_t;
    zero   : out std_logic
  );
end entity;

architecture rtl of alu is
  signal res_i : data_t := (others => '0');
begin
  zero <= '1' when res_i = to_unsigned(0, DATA_WIDTH) else '0';

  process(clk)
  begin
    if rising_edge(clk) then
      if rst = '1' then
        res_i <= (others => '0');
      else
        case op is
          when OP_ADD => res_i <= a + b;
          when OP_SUB => res_i <= a - b;
          when OP_AND => res_i <= a and b;
          when OP_OR  => res_i <= a or b;
          when others => res_i <= (others => '0');
        end case;
      end if;
    end if;
  end process;

  result <= res_i;
end architecture;