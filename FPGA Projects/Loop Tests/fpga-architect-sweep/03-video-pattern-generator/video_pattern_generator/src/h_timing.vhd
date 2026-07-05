library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.video_pkg.all;

entity h_timing is
  port (
    clk : in std_logic;
    rst : in std_logic;
    h_en : out std_logic;
    h_cnt : out unsigned(9 downto 0);
    h_sync : out std_logic;
    h_active : out std_logic
  );
end entity h_timing;

architecture rtl of h_timing is
  signal h_cnt_sig : unsigned(9 downto 0) := (others => '0');
begin
  h_cnt <= h_cnt_sig;
  
  process(clk)
  begin
    if rising_edge(clk) then
      if rst = '1' then
        h_cnt_sig <= (others => '0');
      elsif h_cnt_sig = to_unsigned(H_TOTAL - 1, h_cnt_sig'length) then
        h_cnt_sig <= (others => '0');
      else
        h_cnt_sig <= h_cnt_sig + 1;
      end if;
    end if;
  end process;
  
  h_en <= '1';
  h_sync <= '0' when (h_cnt_sig >= to_unsigned(H_ACTIVE + H_FRONT, h_cnt_sig'length) and h_cnt_sig < to_unsigned(H_ACTIVE + H_FRONT + H_SYNC, h_cnt_sig'length)) else '1';
  h_active <= '1' when (h_cnt_sig < to_unsigned(H_ACTIVE, h_cnt_sig'length)) else '0';
end architecture rtl;