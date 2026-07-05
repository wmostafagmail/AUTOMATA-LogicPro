library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
library work;
use work.timing_pkg.all;

entity sync_gen is
    port (
        clk    : in  std_logic;
        rst    : in  std_logic;
        h_cnt  : in  integer range 0 to H_TOTAL_C-1;
        v_cnt  : in  integer range 0 to V_TOTAL_C-1;
        h_sync : out std_logic;
        v_sync : out std_logic;
        active : out std_logic
    );
end entity sync_gen;

architecture rtl of sync_gen is
begin
    h_sync <= '0' when h_cnt < H_SYNC_C else '1';
    v_sync <= '0' when v_cnt < V_SYNC_C else '1';
    active <= '1' when (h_cnt >= H_SYNC_C + H_BACK_C and h_cnt < H_SYNC_C + H_BACK_C + H_ACTIVE_C) and
                        (v_cnt >= V_SYNC_C + V_BACK_C and v_cnt < V_SYNC_C + V_BACK_C + V_ACTIVE_C) else '0';
end architecture rtl;