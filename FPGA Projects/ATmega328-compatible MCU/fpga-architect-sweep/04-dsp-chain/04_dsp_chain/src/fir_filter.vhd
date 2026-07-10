library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

library work;
use work.dsp_chain_pkg.all;

entity fir_filter is
  generic (
    Width_Sample : positive := SAMPLE_WIDTH;
    Width_Prod   : positive := PROD_WIDTH
  );
  port (
    clk              : in  std_logic;
    reset            : in  std_logic;
    sample_in_valid  : in  std_logic;
    sample_in_data   : in  std_logic_vector(Width_Sample - 1 downto 0);
    filt_out_valid   : out std_logic;
    filt_out_data    : out std_logic_vector(Width_Prod - 1 downto 0)
  );
end entity fir_filter;

architecture rtl of fir_filter is

  signal delay_0_sig      : signed(Width_Sample - 1 downto 0);
  signal delay_1_sig      : signed(Width_Sample - 1 downto 0);
  signal delay_2_sig      : signed(Width_Sample - 1 downto 0);
  
  signal filt_acc_sig     : signed(Width_Prod - 1 downto 0);
  signal valid_out_int    : std_logic;

  constant c0             : signed(7 downto 0) := to_signed(-1, 8);
  constant c1             : signed(7 downto 0) := to_signed(4, 8);
  constant c2             : signed(7 downto 0) := to_signed(-1, 8);

begin

  proc_fir_pipe : process(clk)
    variable curr_sample : signed(Width_Sample - 1 downto 0);
    variable prod_0       : signed(Width_Prod - 1 downto 0);
    variable prod_1       : signed(Width_Prod - 1 downto 0);
    variable prod_2       : signed(Width_Prod - 1 downto 0);
    variable sum_res      : signed(Width_Prod - 1 downto 0);
  begin
    if rising_edge(clk) then
      if reset = '1' then
        delay_0_sig <= (others => '0');
        delay_1_sig <= (others => '0');
        delay_2_sig <= (others => '0');
        filt_acc_sig <= (others => '0');
        valid_out_int <= '0';
      else
        if sample_in_valid = '1' then
          curr_sample := signed(sample_in_data);
          
          -- Shift register stage
          delay_2_sig <= delay_1_sig;
          delay_1_sig <= delay_0_sig;
          delay_0_sig <= curr_sample;

          -- Compute FIR output: sum(coeff_i * x_delayed_i)
          prod_0 := resize(delay_0_sig, Width_Prod) * c0;
          prod_1 := resize(delay_1_sig, Width_Prod) * c1;
          prod_2 := resize(delay_2_sig, Width_Prod) * c2;
          
          sum_res := prod_0 + prod_1 + prod_2;
          
          filt_acc_sig <= sum_res;
          valid_out_int <= '1';
        else
          valid_out_int <= '0';
        end if;
      end if;
    end if;
  end process proc_fir_pipe;

  -- Drive outputs from internal signals to avoid readback issues
  filt_out_data <= std_logic_vector(filt_acc_sig);
  filt_out_valid <= valid_out_int;

end architecture rtl;