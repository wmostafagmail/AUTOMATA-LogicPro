library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.dsp_chain_pkg.all;

entity fft_lite is
  
  generic (
    DATA_WIDTH : positive := 8
  );
port (
    clk_i     : in  std_logic;
    rst_ni    : in  std_logic;
    in_valid_i: in  std_logic;
    in_data_i : in  std_logic_vector(DATA_WIDTH-1 downto 0);
    out_valid_o: out std_logic;
    out_data_o: out std_logic_vector(DATA_WIDTH-1 downto 0)
  );
end entity;

architecture rtl of fft_lite is
  signal out_valid_i : std_logic := '0';
  signal count_reg   : integer range 0 to FFT_POINT_COUNT-1 := 0;
  signal acc_reg     : signed(DATA_WIDTH-1 downto 0) := (others => '0');
begin
  out_valid_o <= out_valid_i;

  process(clk_i)
  begin
    if rising_edge(clk_i) then
      if rst_ni = '0' then
        count_reg <= 0;
        acc_reg   <= (others => '0');
        out_valid_i <= '0';
      elsif in_valid_i = '1' then
        acc_reg <= acc_reg + resize(signed(in_data_i), DATA_WIDTH);
        if count_reg = FFT_POINT_COUNT-1 then
          out_valid_i <= '1';
          out_data_o  <= std_logic_vector(acc_reg);
          count_reg   <= 0;
        else
          out_valid_i <= '0';
          count_reg   <= count_reg + 1;
        end if;
      else
        out_valid_i <= '0';
      end if;
    end if;
  end process;
end architecture;