library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity uart_spi_bridge_top is
    generic (
        g_clk_hz    : natural := 100_000_000;
        g_baud_div  : natural := 83;
        g_spi_div   : natural := 4
     );
    port (
        sysclk      : in  std_logic;
        reset_i     : in  std_logic;
        uart_rx     : in  std_logic;
        uart_tx_o   : out std_logic;
        spi_sclk_o  : out std_logic;
        spi_mosi_o  : out std_logic;
        spi_miso    : in  std_logic;
        spi_csn_o   : out std_logic;
        status_err_o: out std_logic
     );
end entity uart_spi_bridge_top;

architecture rtl of uart_spi_bridge_top is

    constant c_data_width      : natural := 8;
    constant c_fifo_depth_log2 : natural := 2;
    constant c_fifo_size       : natural := 4;

    type t_spi_state is (S_IDLE, S_TX_START, S_TX_SHIFT, S_RX_WAIT);

    -- Output Mirror Signals
    signal s_uart_tx_o_i    : std_logic;
    signal s_spi_sclk_o_i   : std_logic;
    signal s_spi_mosi_o_i   : std_logic;
    signal s_spi_csn_o_i    : std_logic;
    signal s_status_err_i   : std_logic;

    -- UART RX Logic
    signal rx_bit_cnt      : unsigned(7 downto 0);
    signal rx_shift_reg    : std_logic_vector(c_data_width - 1 downto 0);
    signal rx_valid_pulse  : std_logic;
    signal rx_framing_err  : std_logic;

    -- SPI Control Logic
    signal spi_state       : t_spi_state;
    signal spi_cnt         : unsigned(7 downto 0);
    signal spi_tx_data     : std_logic_vector(c_data_width - 1 downto 0);

    -- TX FIFO (UART -> SPI)
    signal tx_wr_ptr       : unsigned(c_fifo_depth_log2 - 1 downto 0);
    signal tx_rd_ptr       : unsigned(c_fifo_depth_log2 - 1 downto 0);
    signal tx_cnt          : unsigned(c_fifo_depth_log2 downto 0);
    signal tx_full_i       : std_logic;
    signal tx_empty_i      : std_logic;

begin

    -- Output Drivers
    uart_tx_o    <= s_uart_tx_o_i;
    spi_sclk_o   <= s_spi_sclk_o_i;
    spi_mosi_o   <= s_spi_mosi_o_i;
    spi_csn_o    <= s_spi_csn_o_i;
    status_err_o <= s_status_err_i;

    -- UART Receiver Process
    uart_rx_ctrl : process (sysclk)
        variable v_next_bit_idx : unsigned(7 downto 0);
    begin
        if rising_edge(sysclk) then
            if reset_i = '1' then
                rx_bit_cnt     <= to_unsigned(0, 8);
                rx_shift_reg   <= (others => '1');
                rx_valid_pulse <= '0';
                rx_framing_err <= '0';
            else
                case rx_bit_cnt is
                    when "00000000" =>
                        if uart_rx = '0' then
                            rx_bit_cnt <= to_unsigned(1, 8); -- Start bit detected
                        end if;

                    when others =>
                        if unsigned(rx_bit_cnt) = to_unsigned(g_baud_div - 1, 8) then
                             -- Sample every baud cycle
                            v_next_bit_idx := resize(rx_bit_cnt, c_data_width + 1);

                            if v_next_bit_idx(0) = '1' and unsigned(v_next_bit_idx(7 downto 1)) < to_unsigned(c_data_width, 7) then
                                 -- Shifting in data bit
                                rx_shift_reg <= std_logic_vector(shift_left(unsigned(rx_shift_reg), 1));
                                rx_shift_reg(0) <= uart_rx;
                            elsif unsigned(v_next_bit_idx(7 downto 1)) = to_unsigned(c_data_width, 7) then
                                 -- Stop bit sampling (expect '1')
                                if uart_rx = '0' then
                                    rx_framing_err <= '1';
                                else
                                    rx_framing_err <= '0';
                                end if;
                                rx_valid_pulse <= '1';
                            else
                                rx_valid_pulse <= '0';
                            end if;

                             -- Increment counter with wrap to trigger next logic
                            rx_bit_cnt <= to_unsigned(0, 8);
                        else
                            rx_bit_cnt <= resize(rx_bit_cnt + 1, 8);
                            rx_valid_pulse <= '0';
                        end if;
                end case;
            end if;
        end if;
    end process uart_rx_ctrl;

    -- FIFO Write Logic (UART -> SPI Buffer)
    fifo_tx_wr : process (sysclk)
    begin
        if rising_edge(sysclk) then
            if reset_i = '1' then
                tx_cnt   <= to_unsigned(0, c_fifo_depth_log2);
                tx_full_i <= '0';
            elsif rx_valid_pulse = '1' and tx_full_i = '0' then
                 -- Write data into FIFO (conceptual representation via counter increment)
                tx_cnt   <= resize(tx_cnt + 1, c_fifo_depth_log2);
                if unsigned(tx_cnt) >= to_unsigned(c_fifo_size - 1, c_fifo_depth_log2) then
                    tx_full_i <= '1';
                else
                    tx_full_i <= '0';
                end if;
            else
                 -- Maintain full flag consistency when not writing
                if tx_cnt = to_unsigned(0, c_fifo_depth_log2) then
                     tx_full_i <= '0';
                end if;
            end if;
        end if;
    end process fifo_tx_wr;

    -- SPI Master Transmitter Process
    spi_tx_ctrl : process (sysclk)
        variable v_spi_half_cycle : boolean := false;
        variable v_next_state     : t_spi_state := S_IDLE;
    begin
        if rising_edge(sysclk) then
            if reset_i = '1' then
                s_spi_csn_o_i   <= '1';
                s_spi_sclk_o_i  <= '0';
                spi_state       <= S_IDLE;
                spi_cnt         <= to_unsigned(0, 8);
            else
                case spi_state is
                    when S_IDLE =>
                        s_spi_csn_o_i <= '1';
                        if tx_empty_i = '0' then -- Check logic simplified for compact mode
                            v_next_state := S_TX_START;
                            s_spi_csn_o_i <= '0';
                        end if;

                    when S_TX_START =>
                        v_next_state := S_TX_SHIFT;
                        spi_cnt      <= to_unsigned(1, 8); -- Start shifting

                    when S_TX_SHIFT =>
                        v_spi_half_cycle := false; -- Toggle logic simulated via counter steps

                        if unsigned(spi_cnt) = to_unsigned(g_spi_div - 1, 8) then
                            s_spi_sclk_o_i <= not s_spi_sclk_o_i; -- Clock toggle on edge
                        else
                            spi_cnt <= resize(spi_cnt + 1, 8);
                        end if;

                         -- Shift data on rising edge transition conceptualization
                        if v_spi_half_cycle = false then
                              -- Shift out bit (LSB first)
                             s_spi_mosi_o_i <= spi_tx_data(to_integer(resize(spi_cnt(2 downto 0), c_data_width)));
                        end if;

                    when others =>
                        null;
                end case;
            end if;
        end if;
    end process spi_tx_ctrl;

end architecture rtl;