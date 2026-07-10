library ieee;
use ieee.std_logic_1164.all;

entity axi_stream_slave is
  generic (
    G_DATA_WIDTH : natural := 32
  );
  port (
    clk_i   : in  std_logic;
    rst_ni  : in  std_logic;
    valid_i : in  std_logic;
    ready_o : out std_logic;
    data_i  : in  std_logic_vector(G_DATA_WIDTH - 1 downto 0);
    last_i  : in  std_logic
  );
end entity axi_stream_slave;

architecture rtl of axi_stream_slave is

  signal internal_ready : std_logic := '0';

begin

  ready_o <= internal_ready;

  process(clk_i)
  begin
    if rising_edge(clk_i) then
      if rst_ni = '0' then
        internal_ready <= '0';
      else
        if valid_i = '1' then
          internal_ready <= '1';
        else
          internal_ready <= '0';
        end if;
      end if;
    end if;
  end process;

end architecture rtl;