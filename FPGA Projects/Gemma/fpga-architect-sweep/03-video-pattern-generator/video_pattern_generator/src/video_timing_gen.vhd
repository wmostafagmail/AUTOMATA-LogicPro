library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.video_types_pkg.all;

entity video_timing_gen is
    port (
        clk       : in  std_logic;
        reset     : in  std_logic;
        hsync_o   : out std_logic;
        vsync_o   : out std_logic;
        video_on_o : out std_logic;
        curr_x_o  : out unsigned(10 downto 0);
        curr_y_o  : out unsigned(10 downto 0)
    );
end entity video_timing_gen;

architecture rtl of video_timing_gen is
    signal h_count : unsigned(10 downto 0) := (others => '0');
    signal v_count : unsigned(10 downto 0) := (others => '0');
    
    signal hsync_int : std_logic := '1';
    signal vsync_int : std_logic := '1';
    signal video_on_int : std_logic := '0';
begin

    process(clk)
    begin
        if rising_edge(clk) then
            if reset = '1' then
                h_count <= (others => '0');
                v_count <= (others => '0');
            else
                if h_count = to_unsigned(H_TOTAL - 1, 11) then
                    h_count <= (others => '0');
                    if v_count = to_unsigned(V_TOTAL - 1, 11) then
                        v_count <= (others => '0');
                    else
                        v_count <= v_count + 1;
                    end if;
                else
                    h_count <= h_count + 1;
                end if;
            end if;
        end if;
    end process;

    -- Sync Generation (Active Low)
    hsync_int <= '0' when (h_count >= to_unsigned(H_ACTIVE + H_FRONT, 11) and 
                          h_count <  to_unsigned(H_ACTIVE + H_FRONT + H_SYNC, 11)) else '1';

    vsync_int <= '0' when (v_count >= to_unsigned(V_ACTIVE + V_FRONT, 11) and 
                          v_count <  to_unsigned(V_ACTIVE + V_FRONT + V_SYNC, 11)) else '1';

    -- Active Video Window
    video_on_int <= '1' when (h_count < to_unsigned(H_ACTIVE, 11) and 
                              v_count < to_unsigned(V_ACTIVE, 11)) else '0';

    -- Drive Outputs from internal mirrors
    hsync_o   <= hsync_int;
    vsync_o   <= vsync_int;
    video_on_o <= video_on_int;
    curr_x_o  <= h_count;
    curr_y_o  <= v_count;

end architecture rtl;