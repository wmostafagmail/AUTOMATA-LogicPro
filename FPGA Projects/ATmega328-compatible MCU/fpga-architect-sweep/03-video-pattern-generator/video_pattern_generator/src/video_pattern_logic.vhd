library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity video_pattern_logic is
    generic (
        PIXEL_DATA_WIDTH : integer := 8
    );
    port (
        clk_i          : in  std_logic;
        rst_i          : in  std_logic;
        pixel_x_i      : in  unsigned(9 downto 0);
        pixel_y_i      : in  unsigned(8 downto 0);
        active_video_i : in  std_logic;
        pixel_data_o   : out std_logic_vector(PIXEL_DATA_WIDTH-1 downto 0)
    );
end entity video_pattern_logic;

architecture rtl of video_pattern_logic is

    signal pixel_data_sig : std_logic_vector(PIXEL_DATA_WIDTH-1 downto 0) := (others => '0');

begin

    pattern_proc : process(clk_i)
        variable x_u : unsigned(pixel_x_i'length-1 downto 0);
        variable y_u : unsigned(pixel_y_i'length-1 downto 0);
        variable sum_u : unsigned(9 downto 0); -- Wide enough for X+Y max
        variable even_bit : std_logic;
    begin
        if rising_edge(clk_i) then
            x_u := pixel_x_i;
            y_u := pixel_y_i;

            if rst_i = '1' then
                pixel_data_sig <= (others => '0');
            elsif active_video_i = '1' then
                -- Simple diagonal pattern: White if (X+Y) is even, Black otherwise
                sum_u := resize(x_u + y_u, 9);
                if sum_u(0) = '0' then
                    pixel_data_sig <= (others => '1'); -- White/On
                else
                    pixel_data_sig <= (others => '0'); -- Black/Off
                end if;
            else
                pixel_data_sig <= (others => '0'); -- Blank when not active
            end if;
        end if;
    end process pattern_proc;

    pixel_data_o <= pixel_data_sig;

end architecture rtl;