library ieee;
use ieee.std_logic_1164.all;

entity uart_tx is
    port (
        clk_i      : in  std_logic;
        rst_i      : in  std_logic;
        tx_data_i  : in  std_logic_vector(7 downto 0);
        start_i    : in  std_logic;
        busy_o     : out std_logic;
        tx_data_o  : out std_logic
    );
end entity uart_tx;

architecture rtl of uart_tx is
    type tx_state_t is (IDLE, START, BIT_0, BIT_1, BIT_2, BIT_3, BIT_4, BIT_5, BIT_6, BIT_7, STOP);
    signal state_s     : tx_state_t := IDLE;
    signal shift_reg_s : std_logic_vector(7 downto 0) := (others => '0');
begin
    process(clk_i)
    begin
        if rising_edge(clk_i) then
            if rst_i = '1' then
                state_s     <= IDLE;
                shift_reg_s <= (others => '0');
                tx_data_o   <= '1';
                busy_o      <= '0';
            else
                case state_s is
                    when IDLE =>
                        if start_i = '1' then
                            shift_reg_s  <= tx_data_i;
                            tx_data_o    <= '0';
                            busy_o       <= '1';
                            state_s      <= START;
                        end if;

                    when START =>
                        tx_data_o   <= '0';
                        state_s     <= BIT_0;

                    when BIT_0 =>
                        tx_data_o   <= shift_reg_s(7);
                        state_s     <= BIT_1;

                    when BIT_1 =>
                        tx_data_o   <= shift_reg_s(6);
                        state_s     <= BIT_2;

                    when BIT_2 =>
                        tx_data_o   <= shift_reg_s(5);
                        state_s     <= BIT_3;

                    when BIT_3 =>
                        tx_data_o   <= shift_reg_s(4);
                        state_s     <= BIT_4;

                    when BIT_4 =>
                        tx_data_o   <= shift_reg_s(3);
                        state_s     <= BIT_5;

                    when BIT_5 =>
                        tx_data_o   <= shift_reg_s(2);
                        state_s     <= BIT_6;

                    when BIT_6 =>
                        tx_data_o   <= shift_reg_s(1);
                        state_s     <= BIT_7;

                    when BIT_7 =>
                        tx_data_o   <= shift_reg_s(0);
                        state_s     <= STOP;

                    when STOP =>
                        tx_data_o   <= '1';
                        busy_o      <= '0';
                        state_s     <= IDLE;
                end case;
            end if;
        end if;
    end process;
end architecture rtl;