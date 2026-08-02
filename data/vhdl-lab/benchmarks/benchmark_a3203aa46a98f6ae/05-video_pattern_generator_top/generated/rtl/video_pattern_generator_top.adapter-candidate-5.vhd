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
    constant H_FRONT  : integer := 16;
    constant H_SYNC   : integer := 96;
    constant H_BACK   : integer := 48;
    constant H_TOTAL  : integer := H_ACTIVE + H_FRONT + H_SYNC + H_BACK;

    constant V_ACTIVE : integer := 480;
    constant V_FRONT  : integer := 10;
    constant V_SYNC   : integer := 2;
    constant V_BACK   : integer := 338;
    constant V_TOTAL  : integer := V_ACTIVE + V_FRONT + V_SYNC + V_BACK;

    signal hcount : unsigned(9 downto 0);
    signal vcount : unsigned(9 downto 0);

begin

    process (clk, rst) is
    begin
        if rst = '1' then
            hcount <= to_unsigned(0, hcount'length);
            vcount <= to_unsigned(0, vcount'length);
        elsif rising_edge(clk) then
            if hcount < to_unsigned(H_TOTAL - 1, hcount'length) then
                hcount <= hcount + 1;
            else
                hcount <= to_unsigned(0, hcount'length);
                if vcount < to_unsigned(V_TOTAL - 1, vcount'length) then
                    vcount <= vcount + 1;
                else
                    vcount <= to_unsigned(0, vcount'length);
                end if;
            end if;
        end if;
    end process;

    hsync_o <= '1' when hcount < to_unsigned(H_FRONT, hcount'length) or hcount >= to_unsigned(H_ACTIVE + H_FRONT, hcount'length) else '0';
    vsync_o <= '1' when vcount < to_unsigned(V_FRONT, vcount'length) or vcount >= to_unsigned(V_ACTIVE + V_FRONT, vcount'length) else '0';

    de_o <= '1' when hcount < to_unsigned(H_ACTIVE, hcount'length) and vcount < to_unsigned(V_ACTIVE, vcount'length) else '0';

    pixel_addr_o <= resize(vcount * to_unsigned(H_TOTAL, vcount'length) + hcount, pixel_addr_o'length);

    pixel_o <= std_logic_vector(to_unsigned(0, pixel_o'length)) when de_o = '0' else
               std_logic_vector(to_unsigned(to_integer(hcount) mod 256, pixel_o'length)) & 
               std_logic_vector(to_unsigned(to_integer(vcount) mod 256, pixel_o'length)) & 
               std_logic_vector(to_unsigned(to_integer(hcount) mod 256, pixel_o'length));

end architecture rtl;
