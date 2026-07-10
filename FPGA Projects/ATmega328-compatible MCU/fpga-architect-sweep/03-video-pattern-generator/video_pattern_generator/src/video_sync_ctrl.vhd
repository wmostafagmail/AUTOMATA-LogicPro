library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity video_sync_ctrl is
    generic (
        H_SYNC_W         : integer := 96;
        H_SYNC_START_VAL : integer := 640;
        V_SYNC_W         : integer := 2;
        V_SYNC_START_VAL : integer := 480
    );
    port (
        clk_i           : in  std_logic;
        rst_i           : in  std_logic;
        h_cnt_i         : in  unsigned(9 downto 0);
        v_cnt_i         : in  unsigned(8 downto 0);
        h_sync_o        : out std_logic;
        v_sync_o        : out std_logic
    );
end entity video_sync_ctrl;

architecture rtl of video_sync_ctrl is

    signal h_sync_sig   : std_logic := '0';
    signal v_sync_sig   : std_logic := '0';

begin

    sync_proc : process(clk_i)
    begin
        if rising_edge(clk_i) then
            if rst_i = '1' then
                h_sync_sig <= '1';
                v_sync_sig <= '1';
            else
                -- Horizontal sync: low during active + front porch, high during sync + back porch? 
                -- Standard VGA: Sync is HIGH for active period, LOW for sync pulse. 
                -- Let's use Active-Low Sync (common).
                -- H_SYNC_START_VAL = 640. Duration = 96. So 640 to 735 is '0', else '1'.
                if h_cnt_i >= to_unsigned(H_SYNC_START_VAL, h_cnt_i'length) and 
                   h_cnt_i < to_unsigned(H_SYNC_START_VAL + H_SYNC_W, h_cnt_i'length) then
                    h_sync_sig <= '0';
                else
                    h_sync_sig <= '1';
                end if;

                -- Vertical sync: similar logic. V_SYNC_START_VAL = 480. Duration = 2. 
                if v_cnt_i >= to_unsigned(V_SYNC_START_VAL, v_cnt_i'length) and 
                   v_cnt_i < to_unsigned(V_SYNC_START_VAL + V_SYNC_W, v_cnt_i'length) then
                    v_sync_sig <= '0';
                else
                    v_sync_sig <= '1';
                end if;
            end if;
        end if;
    end process sync_proc;

    h_sync_o <= h_sync_sig;
    v_sync_o <= v_sync_sig;

end architecture rtl;