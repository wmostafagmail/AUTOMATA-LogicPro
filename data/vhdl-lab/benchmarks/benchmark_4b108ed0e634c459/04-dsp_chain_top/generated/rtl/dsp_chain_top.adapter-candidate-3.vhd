library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity dsp_chain_top is
  generic (
    DATA_WIDTH : positive := 16
  );
  port (
    clk : in std_logic;
    rst : in std_logic;
    sample_i : in signed(15 downto 0);
    sample_valid_i : in std_logic;
    sample_ready_o : out std_logic;
    result_o : out signed(31 downto 0);
    result_valid_o : out std_logic
  );
end entity dsp_chain_top;

library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

architecture rtl of dsp_chain_top is
begin
  sample_ready_o <= '1';
  result_o <= (others => '0');
  result_valid_o <= '0';
end architecture rtl;
