library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity router_arbiter is
  generic (
    G_NUM_IN : natural := 2
  );
  port (
    clk_i        : in  std_logic;
    rst_ni       : in  std_logic;
    request_i    : in  std_logic_vector(G_NUM_IN - 1 downto 0);
    grant_o      : out std_logic_vector(G_NUM_IN - 1 downto 0);
    grant_index_o: out integer range 0 to G_NUM_IN - 1
  );
end entity router_arbiter;

architecture rtl of router_arbiter is

begin

  process(clk_i)
    variable found_grant : boolean := false;
  begin
    if rising_edge(clk_i) then
      if rst_ni = '0' then
        grant_o         <= (others => '0');
        grant_index_o   <= 0;
      else
        found_grant := false;
        for i in G_NUM_IN - 1 downto 0 loop
          if not found_grant and request_i(i) = '1' then
            grant_o         <= std_logic_vector(to_unsigned(i, G_NUM_IN));
            grant_index_o   <= i;
            found_grant     := true;
          end if;
        end loop;

        if not found_grant then
          grant_o         <= (others => '0');
          grant_index_o   <= 0;
        end if;
      end if;
    end if;
  end process;

end architecture rtl;