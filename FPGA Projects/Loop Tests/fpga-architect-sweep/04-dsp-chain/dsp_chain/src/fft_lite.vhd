library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.dsp_chain_pkg.all;

entity fft_lite is
  port (
    clk      : in  std_logic;
    rst      : in  std_logic;
    in_valid : in  std_logic;
    in_data  : in  signed(ACC_W-1 downto 0);
    out_valid: out std_logic;
    out_mag  : out unsigned(2*ACC_W-1 downto 0)
  );
end entity fft_lite;

architecture rtl of fft_lite is
  signal reg_valid : std_logic;
  signal reg_data  : signed(ACC_W-1 downto 0);
begin
  process(clk)
  begin
    if rising_edge(clk) then
      if rst = '1' then
        reg_valid <= '0';
        reg_data  <= (others => '0');
      else
        reg_valid <= in_valid;
        reg_data  <= in_data;
      end if;
    end if;
  end process;
  
  out_valid <= reg_valid;
  out_mag   <= compute_mag_sq(reg_data);
end architecture rtl;