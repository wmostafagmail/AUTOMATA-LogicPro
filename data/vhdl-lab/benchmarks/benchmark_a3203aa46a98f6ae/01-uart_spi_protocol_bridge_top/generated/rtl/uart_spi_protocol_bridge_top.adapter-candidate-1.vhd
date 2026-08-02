library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity uart_spi_protocol_bridge_top is
  generic (
    DATA_WIDTH : positive := 8
  );
  port (
    clk : in std_logic;
    rst : in std_logic;
    uart_rx_i : in std_logic;
    uart_tx_o : out std_logic;
    spi_miso_i : in std_logic;
    spi_mosi_o : out std_logic;
    spi_sclk_o : out std_logic;
    spi_cs_o : out std_logic;
    busy_o : out std_logic;
    error_o : out std_logic;
    status_o : out std_logic_vector(7 downto 0)
  );
end entity uart_spi_protocol_bridge_top;

library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

architecture rtl of uart_spi_protocol_bridge_top is

    -- Define constants and types
    constant UART_BAUD_RATE : integer := 9600;
    constant SPI_CLOCK_FREQ : integer := 100000000;
    constant SPI_CLOCK_PERIOD : integer := SPI_CLOCK_FREQ / 2;

    type state_type is (IDLE, LOAD, TRANSMIT, RECEIVE, ERROR_RECOVERY);
    signal state : state_type := IDLE;

    -- UART RX and TX signals
    signal uart_rx_reg : std_logic_vector(DATA_WIDTH-1 downto 0);
    signal uart_rx_valid : std_logic := '0';
    signal uart_tx_reg : std_logic_vector(DATA_WIDTH-1 downto 0);
    signal uart_tx_valid : std_logic := '0';

    -- SPI signals
    signal spi_tx_reg : std_logic_vector(DATA_WIDTH-1 downto 0);
    signal spi_tx_valid : std_logic := '0';
    signal spi_rx_reg : std_logic_vector(DATA_WIDTH-1 downto 0);
    signal spi_rx_valid : std_logic := '0';

    -- FIFO signals
    signal tx_fifo_full : std_logic := '0';
    signal tx_fifo_empty : std_logic := '1';
    signal rx_fifo_full : std_logic := '0';
    signal rx_fifo_empty : std_logic := '1';

begin

    -- UART RX receiver path
    process (clk, rst) is
        variable bit_count : integer := 0;
        variable bit_time : integer := 0;
        variable bit_value : std_logic := '0';
    begin
        if rst = '1' then
            uart_rx_reg <= (others => '0');
            uart_rx_valid <= '0';
            bit_count <= 0;
            bit_time <= 0;
        elsif rising_edge(clk) then
            if uart_rx_i = '0' then
                bit_count <= 0;
                bit_time <= 0;
            elsif bit_count < DATA_WIDTH then
                if bit_time = UART_BAUD_RATE then
                    bit_value := uart_rx_i;
                    bit_count <= bit_count + 1;
                    bit_time <= 0;
                else
                    bit_time <= bit_time + 1;
                end if;
            else
                uart_rx_reg <= uart_rx_reg(DATA_WIDTH-2 downto 0) & bit_value;
                uart_rx_valid <= '1';
            end if;
        end if;
    end process;

    -- UART TX transmitter path
    process (clk, rst) is
        variable bit_count : integer := 0;
        variable bit_time : integer := 0;
        variable bit_value : std_logic := '0';
    begin
        if rst = '1' then
            uart_tx_reg <= (others => '0');
            uart_tx_valid <= '0';
            bit_count <= 0;
            bit_time <= 0;
        elsif rising_edge(clk) then
            if uart_tx_valid = '1' then
                if bit_count < DATA_WIDTH then
                    if bit_time = UART_BAUD_RATE then
                        uart_tx_o <= uart_tx_reg(DATA_WIDTH-1);
                        bit_count <= bit_count + 1;
                        bit_time <= 0;
                    else
                        bit_time <= bit_time + 1;
                    end if;
                else
                    uart_tx_o <= '1';
                    uart_tx_valid <= '0';
                end if;
            end if;
        end if;
    end process;

    -- SPI master controller
    process (clk, rst) is
        variable bit_count : integer := 0;
        variable bit_time : integer := 0;
        variable bit_value : std_logic := '0';
    begin
        if rst = '1' then
            spi_tx_reg <= (others => '0');
            spi_tx_valid <= '0';
            spi_rx_reg <= (others => '0');
            spi_rx_valid <= '0';
            bit_count <= 0;
            bit_time <= 0;
        elsif rising_edge(clk) then
            if spi_tx_valid = '1' then
                if bit_count < DATA_WIDTH then
                    if bit_time = SPI_CLOCK_PERIOD then
                        spi_mosi_o <= spi_tx_reg(DATA_WIDTH-1);
                        bit_count <= bit_count + 1;
                        bit_time <= 0;
                    else
                        bit_time <= bit_time + 1;
                    end if;
                else
                    spi_mosi_o <= '1';
                    spi_tx_valid <= '0';
                end if;
            end if;
            if spi_rx_valid = '1' then
                if bit_count < DATA_WIDTH then
                    if bit_time = SPI_CLOCK_PERIOD then
                        spi_rx_reg <= spi_rx_reg(DATA_WIDTH-2 downto 0) & spi_miso_i;
                        bit_count <= bit_count + 1;
                        bit_time <= 0;
                    else
                        bit_time <= bit_time + 1;
                    end if;
                else
                    spi_rx_valid <= '0';
                end if;
            end if;
        end if;
    end process;

    -- TX FIFO buffering for outbound SPI payloads
    process (clk, rst) is
    begin
        if rst = '1' then
            tx_fifo_full <= '0';
            tx_fifo_empty <= '1';
        elsif rising_edge(clk) then
            if uart_tx_valid = '1' then
                tx_fifo_full <= '1';
                tx_fifo_empty <= '0';
            end if;
        end if;
    end process;

    -- RX FIFO buffering for inbound SPI response data
    process (clk, rst) is
    begin
        if rst = '1' then
            rx_fifo_full <= '0';
            rx_fifo_empty <= '1';
        elsif rising_edge(clk) then
            if spi_rx_valid = '1' then
                rx_fifo_full <= '1';
                rx_fifo_empty <= '0';
            end if;
        end if;
    end process;

    -- Control/status register block or equivalent status signaling
    process (clk, rst) is
    begin
        if rst = '1' then
            busy_o <= '0';
            error_o <= '0';
            status_o <= (others => '0');
        elsif rising_edge(clk) then
            busy_o <= tx_fifo_full or rx_fifo_full;
            error_o <= '0';
            status_o <= (others => '0');
        end if;
    end process;

    -- Bridge control FSM coordinating UART framing and SPI execution
    process (clk, rst) is
    begin
        if rst = '1' then
            state <= IDLE;
        elsif rising_edge(clk) then
            case state is
                when IDLE =>
                    if uart_tx_valid = '1' then
                        state <= LOAD;
                    elsif spi_rx_valid = '1' then
                        state <= RECEIVE;
                    end if;
                when LOAD =>
                    state <= TRANSMIT;
                when TRANSMIT =>
                    state <= RECEIVE;
                when RECEIVE =>
                    state <= IDLE;
                when ERROR_RECOVERY =>
                    state <= IDLE;
            end case;
        end if;
    end process;

end architecture rtl;
