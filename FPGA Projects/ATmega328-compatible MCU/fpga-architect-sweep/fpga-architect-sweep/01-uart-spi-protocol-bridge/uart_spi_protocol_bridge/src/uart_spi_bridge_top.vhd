library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.uart_spi_bridge_pkg.all;

entity uart_spi_bridge_top is
    port (
        clk_i             : in  std_logic;
        rst_i             : in  std_logic;
        uart_data_valid_i : in  std_logic;
        uart_data_i       : in  std_logic_vector(7 downto 0);
        spi_rx_valid_i    : in  std_logic;
        spi_rx_data_i     : in  std_logic_vector(7 downto 0);
        busy_o            : out std_logic;
        err_ovf_o         : out std_logic;
        err_uf_o          : out std_logic
    );
end entity uart_spi_bridge_top;

architecture rtl of uart_spi_bridge_top is
    signal tx_wr_en : std_logic := '0';
    signal tx_rd_en : std_logic := '0';
    signal tx_full  : std_logic := '0';
    signal tx_empty : std_logic := '1';
    signal tx_dout  : std_logic_vector(7 downto 0) := (others => '0');
    
    signal rx_wr_en : std_logic := '0';
    signal rx_rd_en : std_logic := '0';
    signal rx_full  : std_logic := '0';
    signal rx_empty : std_logic := '1';
    signal rx_dout  : std_logic_vector(7 downto 0) := (others => '0');
    
    signal state_idle : std_logic := '1';
    signal state_busy : std_logic := '0';
    signal phase_cnt  : integer range 0 to 3 := 0;
    
begin

    tx_fifo_proc : process(clk_i)
        variable mem : std_logic_vector(DATA_WIDTH*FIFO_DEPTH-1 downto 0) := (others => '0');
        variable w_ptr : integer range 0 to FIFO_DEPTH := 0;
        variable r_ptr : integer range 0 to FIFO_DEPTH := 0;
        variable cnt   : integer range 0 to FIFO_DEPTH := 0;
    begin
        if rising_edge(clk_i) then
            if rst_i = '1' then
                w_ptr := 0; r_ptr := 0; cnt := 0;
                tx_dout <= (others => '0');
                tx_full  <= '0'; tx_empty <= '1';
            else
                if tx_wr_en = '1' and cnt < FIFO_DEPTH then
                    mem(w_ptr * DATA_WIDTH + DATA_WIDTH - 1 downto w_ptr * DATA_WIDTH) <= uart_data_i;
                    w_ptr := (w_ptr + 1) mod FIFO_DEPTH;
                    cnt := cnt + 1;
                end if;
                if tx_rd_en = '1' and cnt > 0 then
                    tx_dout <= mem(r_ptr * DATA_WIDTH + DATA_WIDTH - 1 downto r_ptr * DATA_WIDTH);
                    r_ptr := (r_ptr + 1) mod FIFO_DEPTH;
                    cnt := cnt - 1;
                end if;
                if cnt = 0 then tx_empty <= '1'; else tx_empty <= '0'; end if;
                if cnt = FIFO_DEPTH then tx_full <= '1'; else tx_full <= '0'; end if;
            end if;
        end if;
    end process tx_fifo_proc;

    bridge_fsm_proc : process(clk_i)
    begin
        if rising_edge(clk_i) then
            if rst_i = '1' then
                tx_wr_en <= '0'; tx_rd_en <= '0';
                rx_wr_en <= '0'; rx_rd_en <= '0';
                state_idle <= '1'; state_busy <= '0'; phase_cnt <= 0;
            else
                if state_idle = '1' then
                    tx_wr_en <= '0';
                    if uart_data_valid_i = '1' and tx_full = '0' then
                        tx_wr_en <= '1';
                        state_busy <= '1'; state_idle <= '0'; phase_cnt <= 0;
                    end if;
                elsif state_busy = '1' then
                    tx_wr_en <= '0';
                    case phase_cnt is
                        when 0 =>
                            tx_rd_en <= '1';
                            if tx_empty = '0' then phase_cnt <= 1; end if;
                        when 1 =>
                            tx_rd_en <= '0';
                            if spi_rx_valid_i = '1' then phase_cnt <= 2; end if;
                        when 2 =>
                            rx_wr_en <= '1';
                            phase_cnt <= 3;
                        when 3 =>
                            rx_wr_en <= '0';
                            state_busy <= '0'; state_idle <= '1';
                        when others =>
                            phase_cnt <= 0;
                    end case;
                end if;
            end if;
        end if;
    end process bridge_fsm_proc;

    busy_o <= state_busy;
    err_ovf_o <= '0';
    err_uf_o <= '0';

end architecture rtl;
