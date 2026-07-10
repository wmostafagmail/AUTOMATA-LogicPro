library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.video_types_pkg.all;

entity pattern_gen is
    port (
        curr_x   : in  unsigned(10 downto 0);
        curr_y   : in  unsigned(10 downto 0);
        pixel_o  : out rgb_pixel_t
    );
end entity pattern_gen;

architecture rtl of pattern_gen is
begin

    process(curr_x, curr_y)
        variable pixel_var : rgb_pixel_t;
    begin
        -- Default colors (Reset to black)
        pixel_var.r := (others => '0');
        pixel_var.g := (others => '0');
        pixel_var.b := (others => '0');

        -- Pattern: Color bars based on X, Gradient based on Y
        if (curr_x < 200) then
            pixel_var.r := x"FF"; -- Red bar
        elsif (curr_x < 400) then
            pixel_var.g := x"FF"; -- Green bar
        elsif (curr_x < 600) then
            pixel_var.b := x"FF"; -- Blue bar
        else
            -- Gradient for the last section based on vertical position
            pixel_var.r := to_unsigned(to_integer(curr_y) mod 256, 8);
            pixel_var.g := x"80";
            pixel_var.b := x"00";
        end if;

        -- Drive output port from local variable
        pixel_o <= pixel_var;
    end process;

end architecture rtl;