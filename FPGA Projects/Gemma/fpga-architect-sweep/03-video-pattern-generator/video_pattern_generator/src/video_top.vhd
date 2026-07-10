library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.video_types_pkg.all;

entity video_top is
    port (
        sys_clk    : in  std_logic; -- 100 MHz
        reset      : in  std_logic;
        hsync_o    : out std_logic;
        vsync_o    : out std_logic;
        video_on_o : out std_logic;
        rgb_r_o    : out std_logic_vector(7 downto 0);
        rgb_g_o    : out std_logic_vector(7 downto 0);
        rgb_b_o    : out std_logic_vector(7 downto 0)
    );
end entity video_top;

architecture rtl of video_top is
    -- Clock Divider for ~25 MHz (100 / 4)
    signal clk_div     : unsigned(1 downto 0) := (others => '0');
    signal pixel_clk   : std_logic := '0';

    -- Internal signals between modules
    signal hsync_int    : std_logic;
    signal vsync_int    : std_logic;
    signal video_on_int : std_logic;
    signal x_coord      : unsigned(10 downto 0);
    signal y_coord      : unsigned(10 downto 0);
    signal pixel_data   : rgb_pixel_t;

begin

    -- Clock Divider Process
    process(sys_clk)
    begin
        if rising_edge(sys_clk) then
            if reset = '1' then
                clk_div <= (others => '0');
                pixel_clk <= '0';
            else
                clk_div <= clk_div + 1;
                if clk_div = "01" then 
                    pixel_clk <= not pixel_clk;
                end if;
            end if;
        end if;
    end process;

    -- Timing Generator Instance
    u_timing : entity work.video_timing_gen
        port map (
            clk       => pixel_clk,
            reset     => reset,
            hsync_o   => hsync_int,
            vsync_o   => vsync_int,
            video_on_o => video_on_int,
            curr_x_o  => x_coord,
            curr_y_o  => y_coord
        );

    -- Pattern Generator Instance
    u_pattern : entity work.pattern_gen
        port map (
            curr_x   => x_coord,
            curr_y   => y_coord,
            pixel_o  => pixel_data
        );

    -- Map internal mirror signals to output ports
    hsync_o    <= hsync_int;
    vsync_o    <= vsync_int;
    video_on_o <= video_on_int;
    rgb_r_o    <= std_logic_vector(pixel_data.r);
    rgb_g_o    <= std_logic_vector(pixel_data.g);
    rgb_b_o    <= std_logic_vector(pixel_data.b);

end architecture rtl;