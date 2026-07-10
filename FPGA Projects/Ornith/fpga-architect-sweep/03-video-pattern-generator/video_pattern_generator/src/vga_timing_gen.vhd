-- ============================================================
-- Entity: vga_timing_gen
-- Purpose: Generate h_cnt, v_cnt, hs_o, vs_o, and active_video_o
--          for VGA 640x480 @ 60 Hz from a single pixel clock.
-- Standard: VHDL-2008
-- ============================================================

library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

use work.vga_timing_pkg.all;

entity vga_timing_gen is
  port (
    clk_i       : in  std_logic;
    rst_ni      : in  std_logic;
    h_cnt_o     : out h_cnt_t;
    v_cnt_o     : out v_cnt_t;
    hs_o        : out std_logic;
    vs_o        : out std_logic;
    active_o    : out std_logic
  );
end entity vga_timing_gen;

architecture rtl of vga_timing_gen is

  signal h_cnt_s : h_cnt_t := 0;
  signal v_cnt_s : v_cnt_t := 0;
  signal hs_s    : std_logic := '0';
  signal vs_s    : std_logic := '0';
  signal act_s   : std_logic := '0';

begin

  process(clk_i)
  begin
    if rising_edge(clk_i) then
      if rst_ni = '0' then
        h_cnt_s <= 0;
        v_cnt_s <= 0;
        hs_s    <= '0';
        vs_s    <= '0';
        act_s   <= '0';
      else

        -- Horizontal counter
        if h_cnt_s = H_TOTAL - 1 then
          h_cnt_s <= 0;
        else
          h_cnt_s <= h_cnt_s + 1;
        end if;

        -- Vertical counter (increments on horizontal blank-to-active transition)
        if h_cnt_s = H_ACTIVE - 1 then
          if v_cnt_s = V_TOTAL - 1 then
            v_cnt_s <= 0;
          else
            v_cnt_s <= v_cnt_s + 1;
          end if;
        end if;

        -- Horizontal sync: active during the H_SYNC window
        if h_cnt_s >= H_ACTIVE and h_cnt_s < H_ACTIVE + H_SYNC then
          hs_s <= '1';
        else
          hs_s <= '0';
        end if;

        -- Vertical sync: active during the V_SYNC window
        if v_cnt_s >= V_ACTIVE and v_cnt_s < V_ACTIVE + V_SYNC then
          vs_s <= '1';
        else
          vs_s <= '0';
        end if;

        -- Active video flag
        if h_cnt_s < H_ACTIVE and v_cnt_s < V_ACTIVE then
          act_s <= '1';
        else
          act_s <= '0';
        end if;

      end if;
    end if;
  end process;

  h_cnt_o <= h_cnt_s;
  v_cnt_o <= v_cnt_s;
  hs_o    <= hs_s;
  vs_o    <= vs_s;
  active_o<= act_s;

end architecture rtl;
