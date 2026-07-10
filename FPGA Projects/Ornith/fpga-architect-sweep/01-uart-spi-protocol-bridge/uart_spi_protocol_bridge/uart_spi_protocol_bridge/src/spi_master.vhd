library ieee;
use ieee.std_logic_1164.all;

entity spi_master is
    port (
        clk_i           : in  std_logic;
        rst_i           : in  std_logic;
        tx_data_i       : in  std_logic_vector(7 downto 0);
        tx_start_i      : in  std_logic;
        tx_done_o       : out std_logic;
        tx_busy_o       : out std_logic;
        mosi_o          : out std_logic;
        sclk_o          : out std_logic;
        cs_n_o          : out std_logic;
        miso_i          : in  std_logic;
        rx_data_o       : out std_logic_vector(7 downto 0);
        rx_valid_o      : out std_logic
    );
end entity spi_master;

architecture rtl of spi_master is
    type spi_state_t is (IDLE, ACTIVE, DONE);
    signal state_s     : spi_state_t := IDLE;
    signal shift_reg_s : std_logic_vector(7 downto 0) := (others => '0');
    signal bit_cnt_s   : integer range 0 to 8 := 0;

begin
    process(clk_i)
        variable mosi_int_v   : std_logic;
        variable sclk_int_v   : std_logic;
        variable cs_n_int_v   : std_logic;
        variable rx_data_v    : std_logic_vector(7 downto 0);
    begin
        if rising_edge(clk_i) then
            if rst_i = '1' then
                state_s     <= IDLE;
                shift_reg_s <= (others => '0');
                bit_cnt_s   <= 0;
                mosi_o      <= '0';
                sclk_o      <= '0';
                cs_n_o      <= '1';
                rx_data_o   <= (others => '0');
                rx_valid_o  <= '0';
                tx_done_o   <= '0';
                tx_busy_o   <= '0';
            else
                mosi_int_v := '0';
                sclk_int_v := '0';
                cs_n_int_v := '1';

                case state_s is
                    when IDLE =>
                        if tx_start_i = '1' then
                            shift_reg_s  <= tx_data_i;
                            bit_cnt_s    <= 7;
                            mosi_int_v   := tx_data_i(7);
                            sclk_int_v   := '0';
                            cs_n_int_v   := '0';
                            state_s      <= ACTIVE;
                        end if;

                    when ACTIVE =>
                        -- Sample MISO on the rising SCLK edge.
                        rx_data_v := miso_i & shift_reg_s(7 downto 1);

                        if bit_cnt_s = 0 then
                            sclk_int_v := '1';
                            state_s    <= DONE;
                            bit_cnt_s  <= 0;
                        else
                            sclk_int_v := '1';
                            shift_reg_s <= rx_data_v;
                            bit_cnt_s   <= bit_cnt_s - 1;
                        end if;

                    when DONE =>
                        cs_n_int_v := '1';
                        state_s    <= IDLE;
                end case;

                mosi_o   <= mosi_int_v;
                sclk_o   <= sclk_int_v;
                cs_n_o   <= cs_n_int_v;

                if state_s = ACTIVE then
                    tx_busy_o  <= '1';
                    tx_done_o  <= '0';
                    rx_valid_o <= '0';
                elsif state_s = DONE then
                    tx_busy_o  <= '0';
                    tx_done_o  <= '1';
                    rx_data_o  <= shift_reg_s;
                    rx_valid_o <= '1';
                else
                    tx_busy_o  <= '0';
                    tx_done_o  <= '0';
                    rx_valid_o <= '0';
                end if;
            end if;
        end if;
    end process;

end architecture rtl;