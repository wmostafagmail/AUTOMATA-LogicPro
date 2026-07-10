library ieee;
use ieee.std_logic_1164.all;

entity uart_rx is
    port (
        clk_i       : in  std_logic;
        rst_i       : in  std_logic;
        rx_data_i   : in  std_logic;
        byte_o      : out std_logic_vector(7 downto 0);
        valid_o     : out std_logic;
        err_frame_o : out std_logic
    );
end entity uart_rx;

architecture rtl of uart_rx is
    type rx_state_t is (IDLE, START, BIT_0, BIT_1, BIT_2, BIT_3, BIT_4, BIT_5, BIT_6, BIT_7, STOP);
    signal state_s      : rx_state_t := IDLE;
    signal shift_reg_s  : std_logic_vector(7 downto 0) := (others => '0');
    signal bit_cnt_s    : integer range 0 to 8 := 0;
    signal sample_s     : std_logic;
begin
    process(clk_i)
    begin
        if rising_edge(clk_i) then
            if rst_i = '1' then
                state_s      <= IDLE;
                shift_reg_s  <= (others => '0');
                bit_cnt_s    <= 0;
                byte_o       <= (others => '0');
                valid_o      <= '0';
                err_frame_o  <= '0';
            else
                valid_o   <= '0';
                err_frame_o <= '0';

                case state_s is
                    when IDLE =>
                        if rx_data_i = '0' then
                            shift_reg_s <= (others => '0');
                            bit_cnt_s   <= 0;
                            state_s     <= START;
                        end if;

                    when START =>
                        sample_s <= rx_data_i;
                        if rx_data_i = '1' then
                            err_frame_o <= '1';
                            state_s     <= IDLE;
                        else
                            bit_cnt_s   <= 0;
                            state_s     <= BIT_0;
                        end if;

                    when BIT_0 =>
                        shift_reg_s(0) <= rx_data_i;
                        bit_cnt_s      <= 1;
                        state_s        <= BIT_1;

                    when BIT_1 =>
                        shift_reg_s(1) <= rx_data_i;
                        bit_cnt_s      <= 2;
                        state_s        <= BIT_2;

                    when BIT_2 =>
                        shift_reg_s(2) <= rx_data_i;
                        bit_cnt_s      <= 3;
                        state_s        <= BIT_3;

                    when BIT_3 =>
                        shift_reg_s(3) <= rx_data_i;
                        bit_cnt_s      <= 4;
                        state_s        <= BIT_4;

                    when BIT_4 =>
                        shift_reg_s(4) <= rx_data_i;
                        bit_cnt_s      <= 5;
                        state_s        <= BIT_5;

                    when BIT_5 =>
                        shift_reg_s(5) <= rx_data_i;
                        bit_cnt_s      <= 6;
                        state_s        <= BIT_6;

                    when BIT_6 =>
                        shift_reg_s(6) <= rx_data_i;
                        bit_cnt_s      <= 7;
                        state_s        <= BIT_7;

                    when BIT_7 =>
                        shift_reg_s(7) <= rx_data_i;
                        bit_cnt_s      <= 8;
                        state_s        <= STOP;

                    when STOP =>
                        if rx_data_i = '1' then
                            byte_o       <= shift_reg_s;
                            valid_o      <= '1';
                        else
                            err_frame_o <= '1';
                        end if;
                        state_s <= IDLE;
                end case;
            end if;
        end if;
    end process;
end architecture rtl;