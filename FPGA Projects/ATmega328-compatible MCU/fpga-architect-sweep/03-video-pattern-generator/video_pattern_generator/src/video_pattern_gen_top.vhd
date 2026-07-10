library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.video_pattern_gen_pkg.all;

entity video_pattern_gen_top is
    generic (
        G_H_TOTAL      : integer := H_TOTAL;
        G_V_TOTAL      : integer := V_TOTAL
    );
    port (
        clk_i          : in  std_logic;
        rst_i          : in  std_logic;
        h_sync_o       : out std_logic;
        v_sync_o       : out std_logic;
        pixel_data_o   : out std_logic_vector(PIXEL_DATA_WIDTH-1 downto 0)
    );
end entity video_pattern_gen_top;

architecture rtl of video_pattern_gen_top is

    signal h_cnt_sig  : unsigned(H_COUNTER_WIDTH-1 downto 0) := (others => '0');
    signal v_cnt_sig  : unsigned(V_COUNTER_WIDTH-1 downto 0) := (others => '0');
    
    signal h_sync_int : std_logic;
    signal v_sync_int : std_logic;
    
    signal px_x_sig   : unsigned(9 downto 0);
    signal px_y_sig   : unsigned(8 downto 0);
    signal active_sig : std_logic;

begin

    -- Horizontal Counter
    h_cnt_proc : process(clk_i)
    begin
        if rising_edge(clk_i) then
            if rst_i = '1' then
                h_cnt_sig <= to_unsigned(0, h_cnt_sig'length);
            else
                if h_cnt_sig < to_unsigned(G_H_TOTAL-1, h_cnt_sig'length) then
                    h_cnt_sig <= h_cnt_sig + 1;
                else
                    h_cnt_sig <= to_unsigned(0, h_cnt_sig'length);
                    -- Increment vertical counter on horizontal roll-over
                    if v_cnt_sig < to_unsigned(G_V_TOTAL-1, v_cnt_sig'length) then
                        v_cnt_sig <= v_cnt_sig + 1;
                    else
                        v_cnt_sig <= to_unsigned(0, v_cnt_sig'length);
                    end if;
                end if;
            end if;
        end if;
    end process h_cnt_proc;

    -- Vertical Counter (driven from horizontal roll-over logic above)
    
    sync_ctrl_inst : entity work.video_sync_ctrl
        generic map (
            H_SYNC_W         => 96,
            H_SYNC_START_VAL => 640,
            V_SYNC_W         => 2,
            V_SYNC_START_VAL => 480
        )
        port map (
            clk_i    => clk_i,
            rst_i    => rst_i,
            h_cnt_i  => h_cnt_sig,
            v_cnt_i  => v_cnt_sig,
            h_sync_o => h_sync_int,
            v_sync_o => v_sync_int
        );

    addr_gen_inst : entity work.video_pixel_addr_gen
        generic map (
            H_ACTIVE_VAL => 640,
            V_ACTIVE_VAL => 480
        )
        port map (
            clk_i          => clk_i,
            rst_i          => rst_i,
            h_cnt_i        => h_cnt_sig,
            v_cnt_i        => v_cnt_sig,
            pixel_x_o      => px_x_sig,
            pixel_y_o      => px_y_sig,
            active_video_o => active_sig
        );

    pattern_inst : entity work.video_pattern_logic
        generic map (
            PIXEL_DATA_WIDTH => PIXEL_DATA_WIDTH
        )
        port map (
            clk_i          => clk_i,
            rst_i          => rst_i,
            pixel_x_i      => px_x_sig,
            pixel_y_i      => px_y_sig,
            active_video_i => active_sig,
            pixel_data_o   => pixel_data_o
        );

    h_sync_o <= h_sync_int;
    v_sync_o <= v_sync_int;

end architecture rtl;