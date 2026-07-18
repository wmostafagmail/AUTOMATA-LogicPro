library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.video_pkg.all;

entity timing_gen is
  port (
    clk      : in  std_logic;
    rst      : in  std_logic;
    h_sync_o : out std_logic;
    v_sync_o : out std_logic;
    active_o : out std_logic
  );
end entity;

architecture rtl of timing_gen is
  signal h_cnt : h_cnt_t := (others => '0');
  signal v_cnt : v_cnt_t := (others => '0');
begin
  h_sync_o <= '0' when h_cnt < to_unsigned(H_ACTIVE_PIXELS, h_cnt'length) else '1';
  v_sync_o <= '0' when v_cnt < to_unsigned(V_ACTIVE_LINES, v_cnt'length) else '1';
  active_o <= '1' when h_cnt < to_unsigned(H_ACTIVE_PIXELS, h_cnt'length) and v_cnt < to_unsigned(V_ACTIVE_LINES, v_cnt'length) else '0';

  process(clk)
  begin
    if rising_edge(clk) then
      if rst = '1' then
        h_cnt <= (others => '0');
        v_cnt <= (others => '0');
      else
        if h_cnt = to_unsigned(H_ACTIVE_PIXELS + H_BLANK_PIXELS - 1, h_cnt'length) then
          h_cnt <= (others => '0');
          if v_cnt = to_unsigned(V_ACTIVE_LINES + V_BLANK_LINES - 1, v_cnt'length) then
            v_cnt <= (others => '0');
          else
            v_cnt <= v_cnt + 1;
          end if;
        else
          h_cnt <= h_cnt + 1;
        end if;
      end if;
    end if;
  end process;
end architecture;