library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.video_pkg.all;

entity pixel_gen is
  port (
    clk : in std_logic;
    rst : in std_logic;
    v_active : in std_logic;
    h_active : in std_logic;
    h_cnt : in unsigned(9 downto 0);
    v_cnt : in unsigned(9 downto 0);
    pixel_out : out pixel_t;
    pixel_valid : out std_logic
  );
end entity pixel_gen;

architecture rtl of pixel_gen is
begin
  pixel_valid <= v_active and h_active;
  
  process(clk)
    variable h_val : unsigned(9 downto 0);
    variable v_val : unsigned(9 downto 0);
  begin
    if rising_edge(clk) then
      if rst = '1' then
        pixel_out <= (others => '0');
      elsif v_active = '1' and h_active = '1' then
        h_val := h_cnt;
        v_val := v_cnt;
        if h_val < 160 then
          pixel_out <= "1111100000000000";
        elsif h_val < 320 then
          pixel_out <= "0000011111100000";
        elsif h_val < 480 then
          pixel_out <= "0000000000011111";
        else
          pixel_out <= "1111111111111111";
        end if;
      end if;
    end if;
  end process;
end architecture rtl;