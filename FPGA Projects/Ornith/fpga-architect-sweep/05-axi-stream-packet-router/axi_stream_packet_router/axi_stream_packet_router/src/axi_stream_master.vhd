library ieee;
use ieee.std_logic_1164.all;

entity axi_stream_master is
  generic (
    G_DATA_WIDTH : natural := 32
  );
  port (
    clk_i   : in  std_logic;
    rst_ni  : in  std_logic;
    valid_o : out std_logic;
    ready_i : in  std_logic;
    data_o  : out std_logic_vector(G_DATA_WIDTH - 1 downto 0);
    last_o  : out std_logic
  );
end entity axi_stream_master;

architecture rtl of axi_stream_master is

  signal internal_valid : std_logic := '0';
  signal internal_data  : std_logic_vector(31 downto 0) := (others => '0');
  signal internal_last  : std_logic := '0';

begin

  valid_o <= internal_valid;
  data_o  <= internal_data;
  last_o  <= internal_last;

  process(clk_i)
  begin
    if rising_edge(clk_i) then
      if rst_ni = '0' then
        internal_valid <= '0';
        internal_last  <= '0';
      else
        if ready_i = '1' then
          internal_valid <= '1';
        else
          internal_valid <= '0';
        end if;

        if internal_valid = '0' then
          internal_last <= '0';
        end if;
      end if;
    end if;
  end process;

end architecture rtl;