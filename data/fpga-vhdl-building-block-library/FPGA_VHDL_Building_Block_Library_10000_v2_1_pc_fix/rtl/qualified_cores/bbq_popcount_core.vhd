library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.bb_util_pkg.all;
entity bbq_popcount_core is
  generic (WIDTH : positive := 32);
  port (data_in:in std_logic_vector(WIDTH-1 downto 0); count_out:out std_logic_vector(clog2(WIDTH+1)-1 downto 0));
end entity;
architecture rtl of bbq_popcount_core is
begin count_out <= std_logic_vector(to_unsigned(popcount(data_in), count_out'length)); end architecture;
