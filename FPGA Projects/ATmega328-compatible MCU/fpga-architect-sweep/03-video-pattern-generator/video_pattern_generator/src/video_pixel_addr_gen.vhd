library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity video_pixel_addr_gen is
    generic (
        H_ACTIVE_VAL : integer := 640;
        V_ACTIVE_VAL : integer := 480
    );
    port (
        clk_i          : in  std_logic;
        rst_i          : in  std_logic;
        h_cnt_i        : in  unsigned(9 downto 0);
        v_cnt_i        : in  unsigned(8 downto 0);
        pixel_x_o      : out unsigned(9 downto 0);
        pixel_y_o      : out unsigned(8 downto 0);
        active_video_o : out std_logic
    );
end entity video_pixel_addr_gen;

architecture rtl of video_pixel_addr_gen is

    signal active_video_sig : std_logic := '0';
    signal pixel_x_sig      : unsigned(9 downto 0) := (others => '0');
    signal pixel_y_sig      : unsigned(8 downto 0) := (others => '0');

begin

    addr_proc : process(clk_i)
    begin
        if rising_edge(clk_i) then
            if rst_i = '1' then
                active_video_sig <= '0';
                pixel_x_sig      <= to_unsigned(0, pixel_x_sig'length);
                pixel_y_sig      <= to_unsigned(0, pixel_y_sig'length);
            else
                -- Active video window check
                if h_cnt_i < to_unsigned(H_ACTIVE_VAL, h_cnt_i'length) and 
                   v_cnt_i < to_unsigned(V_ACTIVE_VAL, v_cnt_i'length) then
                    active_video_sig <= '1';
                    pixel_x_sig      <= h_cnt_i;
                    pixel_y_sig      <= v_cnt_i;
                else
                    active_video_sig <= '0';
                    -- Keep last valid or zero? Usually zero or hold. Let's zero out for simplicity in testbench.
                    pixel_x_sig      <= to_unsigned(0, pixel_x_sig'length);
                    pixel_y_sig      <= to_unsigned(0, pixel_y_sig'length);
                end if;
            end if;
        end if;
    end process addr_proc;

    active_video_o <= active_video_sig;
    pixel_x_o      <= pixel_x_sig;
    pixel_y_o      <= pixel_y_sig;

end architecture rtl;