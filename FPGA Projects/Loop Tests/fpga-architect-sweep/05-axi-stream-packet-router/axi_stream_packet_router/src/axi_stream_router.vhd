library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.axi_stream_pkg.all;

entity axi_stream_router is
  generic (
    NUM_IN : integer := 1
  );
  port (
    clk   : in  std_logic;
    rst   : in  std_logic;
    -- Input (Sink)
    in_data  : in  std_logic_vector(DATA_WIDTH-1 downto 0);
    in_valid : in  std_logic;
    in_ready : out std_logic;
    -- Output (Source)
    out_data  : out std_logic_vector(NUM_OUT*DATA_WIDTH-1 downto 0);
    out_valid : out std_logic_vector(NUM_OUT-1 downto 0);
    out_ready : in  std_logic_vector(NUM_OUT-1 downto 0)
  );
end entity axi_stream_router;

architecture rtl of axi_stream_router is
  signal active_out_idx : unsigned(NUM_OUT-1 downto 0) := (others => '0');
begin
  process (clk)
  begin
    if rising_edge(clk) then
      if rst = '1' then
        active_out_idx <= (others => '0');
      elsif in_valid = '1' and in_ready = '1' then
        active_out_idx <= resize(active_out_idx + 1, NUM_OUT);
      end if;
    end if;
  end process;

  in_ready <= '1' when out_ready(to_integer(active_out_idx)) = '1' else '0';

  out_valid <= (others => '0');
  out_valid(to_integer(active_out_idx)) <= in_valid when in_ready = '1' else '0';

  out_data <= (others => '0');
  out_data(to_integer(active_out_idx)*DATA_WIDTH-1 downto 0) <= in_data when in_ready = '1' else (others => '0');

end architecture rtl;