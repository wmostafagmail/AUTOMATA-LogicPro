library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.video_pkg.all;

entity v_timing is
  port (
    clk : in std_logic;
    rst : in std_logic;
    h_en : in std_logic;
    v_cnt : out unsigned(9 downto 0);
    v_sync : out std_logic;
    v_active : out std_logic
  );
end entity v_timing;

architecture rtl of v_timing is
  signal v_cnt_sig : unsigned(9 downto 0) := (others => '0');
begin
  v_cnt <= v_cnt_sig;
  
  process(clk)
  begin
    if rising_edge(clk) then
      if rst = '1' then
        v_cnt_sig <= (others => '0');
      elsif h_en = '1' and v_cnt_sig = to_unsigned(V_TOTAL - 1, v_cnt_sig'length) then
        v_cnt_sig <= (others => '0');
      elsif h_en = '1' then
        v_cnt_sig <= v_cnt_sig + 1;
      end if;
    end if;
  end process;
  
  v_sync <= '0' when (v_cnt_sig >= to_unsigned(V_ACTIVE + V_FRONT, v_cnt_sig'length) and v_cnt_sig < to_unsigned(V_ACTIVE + V_FRONT + V_SYNC, v_cnt_sig'length)) else '1';
  v_active <= '1' when (v_cnt_sig < to_unsigned(V_ACTIVE, v_cnt_sig'length)) else '0';
end architecture rtl;