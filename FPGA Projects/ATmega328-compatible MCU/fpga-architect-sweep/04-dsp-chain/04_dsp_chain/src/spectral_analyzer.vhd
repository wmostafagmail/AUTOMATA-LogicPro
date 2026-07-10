library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity spectral_analyzer is
  generic (
    Width_In   : positive := 20;
    Width_Out  : positive := 38
  );
  port (
    clk               : in  std_logic;
    reset             : in  std_logic;
    data_in_valid     : in  std_logic;
    data_in_sig       : in  std_logic_vector(Width_In - 1 downto 0);
    result_out_valid  : out std_logic;
    result_out_mag    : out std_logic_vector(Width_Out - 1 downto 0)
  );
end entity spectral_analyzer;

architecture rtl of spectral_analyzer is

  signal data_in_reg_sig   : signed(Width_In - 1 downto 0);
  signal mag_out_int       : std_logic;
  signal mag_result_sig    : unsigned(Width_Out - 1 downto 0);

begin

  proc_analyze : process(clk)
    variable val_s      : signed(Width_In - 1 downto 0);
    variable mag_u      : unsigned(Width_Out - 1 downto 0);
  begin
    if rising_edge(clk) then
      if reset = '1' then
        data_in_reg_sig <= (others => '0');
        mag_out_int <= '0';
        mag_result_sig <= (others => '0');
      else
        if data_in_valid = '1' then
          val_s := signed(data_in_sig);
          
          -- Compute Magnitude Squared: |x|^2 = x * x
          mag_u := unsigned(val_s) * unsigned(val_s);
          
          data_in_reg_sig <= val_s;
          mag_out_int <= '1';
          mag_result_sig <= mag_u;
        else
          mag_out_int <= '0';
        end if;
      end if;
    end if;
  end process proc_analyze;

  -- Drive outputs from internal signals
  result_out_mag <= std_logic_vector(mag_result_sig);
  result_out_valid <= mag_out_int;

end architecture rtl;