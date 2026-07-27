library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity bb_media_pipe_core is
  generic (DATA_WIDTH : positive := 24; GAIN_SHIFT : natural := 0);
  port (clk, rst_n : in std_logic; sample_in : in std_logic_vector(DATA_WIDTH-1 downto 0);
        in_valid : in std_logic; in_ready : out std_logic;
        sample_out : out std_logic_vector(DATA_WIDTH-1 downto 0);
        out_valid : out std_logic; out_ready : in std_logic);
end entity;
architecture rtl of bb_media_pipe_core is
  signal d : std_logic_vector(DATA_WIDTH-1 downto 0) := (others=>'0'); signal v : std_logic := '0';
begin
  in_ready <= (not v) or out_ready; sample_out <= d; out_valid <= v;
  process(clk) begin if rising_edge(clk) then
    if rst_n='0' then d <= (others=>'0'); v<='0';
    elsif ((not v) or out_ready)='1' then v<=in_valid; if in_valid='1' then d<=std_logic_vector(shift_left(unsigned(sample_in), GAIN_SHIFT)); end if; end if;
  end if; end process;
end architecture;
