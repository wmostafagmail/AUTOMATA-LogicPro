library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity video_pattern_generator_top is
  generic (
    DATA_WIDTH : positive := 8
  );
  port (
    clk : in std_logic;
    rst : in std_logic;
    hsync_o : out std_logic;
    vsync_o : out std_logic;
    de_o : out std_logic;
    pixel_o : out std_logic_vector(23 downto 0);
    pixel_addr_o : out unsigned(18 downto 0)
  );
end entity video_pattern_generator_top;

library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

architecture rtl of video_pattern_generator_top is
    constant H_ACTIVE : integer := 640;
    constant H_FRONT : integer := 16;
    constant H_SYNC : integer := 96;
    constant H_BACK : integer := 48;
    constant V_ACTIVE : integer := 480;
    constant V_FRONT : integer := 10;
    constant V_SYNC : integer := 2;
    constant V_BACK : integer := 338;

    signal h_count : integer range 0 to H_ACTIVE + H_FRONT + H_SYNC + H_BACK - 1 := 0;
    signal v_count : integer range 0 to V_ACTIVE + V_FRONT + V_SYNC + V_BACK - 1 := 0;
    signal hsync : std_logic := '1';
    signal vsync : std_logic := '1';
    signal de : std_logic := '0';
    signal pixel_addr : unsigned(18 downto 0) := (others => '0');
    signal pixel : std_logic_vector(23 downto 0) := (others => '0');

    function get_pixel_address(h : integer; v : integer) return unsigned is
    begin
        return unsigned(to_slv(h * V_ACTIVE + v, 19));
    end function get_pixel_address;

    function get_pixel_color(h : integer; v : integer) return std_logic_vector is
    begin
        if h < H_ACTIVE and v < V_ACTIVE then
            return std_logic_vector(to_unsigned(h, 8)) & std_logic_vector(to_unsigned(v, 8)) & std_logic_vector(to_unsigned((h + v) mod 256, 8));
        else
            return (others => '0');
        end if;
    end function get_pixel_color;

begin
    hsync_o <= hsync;
    vsync_o <= vsync;
    de_o <= de;
    pixel_o <= pixel;
    pixel_addr_o <= pixel_addr;

    process(clk, rst)
    begin
        if rst = '1' then
            h_count <= 0;
            v_count <= 0;
            hsync <= '1';
            vsync <= '1';
            de <= '0';
            pixel_addr <= (others => '0');
            pixel <= (others => '0');
        elsif rising_edge(clk) then
            if h_count < H_ACTIVE + H_FRONT + H_SYNC + H_BACK - 1 then
                h_count <= h_count + 1;
                if h_count < H_ACTIVE + H_FRONT - 1 then
                    hsync <= '0';
                elsif h_count < H_ACTIVE + H_FRONT + H_SYNC - 1 then
                    hsync <= '1';
                end if;
                if h_count = H_ACTIVE + H_FRONT + H_SYNC - 1 then
                    h_count <= 0;
                end if;
            end if;

            if h_count = 0 and v_count < V_ACTIVE + V_FRONT + V_SYNC + V_BACK - 1 then
                v_count <= v_count + 1;
                if v_count < V_ACTIVE + V_FRONT - 1 then
                    vsync <= '0';
                elsif v_count < V_ACTIVE + V_FRONT + V_SYNC - 1 then
                    vsync <= '1';
                end if;
                if v_count = V_ACTIVE + V_FRONT + V_SYNC - 1 then
                    v_count <= 0;
                end if;
            end if;

            if h_count < H_ACTIVE and v_count < V_ACTIVE then
                de <= '1';
                pixel_addr <= get_pixel_address(h_count, v_count);
                pixel <= get_pixel_color(h_count, v_count);
            else
                de <= '0';
                pixel_addr <= (others => '0');
                pixel <= (others => '0');
            end if;
        end if;
    end process;
end architecture rtl;
