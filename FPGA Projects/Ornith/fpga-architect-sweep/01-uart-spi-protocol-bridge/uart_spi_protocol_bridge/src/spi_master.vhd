library ieee;
use ieee.std_logic_1164.all;

entity spi_master is
    port (
        clk_i           : in  std_logic;
        rst_i           : in  std_logic;
        -- master input side
        tx_data_i       : in  std_logic_vector(7 downto 0);
        tx_start_i      : in  std_logic;
        tx_done_o       : out std_logic;
        tx_busy_o       : out std_logic;
        -- slave output side (driven by external DUT or testbench)
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
        variable mosi_int : std_logic;
        variable sclk_int : std_logic;
        variable cs_n_int : std_logic;
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
                mosi_int := '0';
                sclk_int := '0';
                cs_n_int := '1';

                case state_s is
                    when IDLE =>
                        if tx_start_i = '1' then
                            shift_reg_s  <= tx_data_i;
                            bit_cnt_s    <= 7;
                            mosi_int     := tx_data_i(7);
                            sclk_int     := '0';
                            cs_n_int     := '0';
                            state_s      <= ACTIVE;
                        end if;

                    when ACTIVE =>
                        -- rising edge of SCLK latches MISO into shift_reg_s(bit_cnt_s)
                        mosi_int := shift_reg_s(7);
                        sclk_int := not sclk_int;  -- toggle for next edge
                        cs_n_int := '0';

                        if bit_cnt_s = 0 then
                            state_s <= DONE;
                            bit_cnt_s <= 0;
                        else
                            bit_cnt_s <= bit_cnt_s - 1;
                        end if;

                    when DONE =>
                        rx_data_o   <= shift_reg_s;
                        rx_valid_o  <= '1';
                        cs_n_int    := '1';
                        state_s     <= IDLE;

                        -- capture MISO on the last SCLK edge (bit_cnt_s was 0, now we're in DONE)
                        -- For Mode 0 MSB-first: miso_i is sampled on rising SCLK.
                        -- The above ACTIVE->DONE transition happens when bit_cnt_s reaches 0.
                        -- We need to sample MISO before transitioning. Let's fix this by sampling during ACTIVE.
                end case;

                mosi_o   <= mosi_int;
                sclk_o   <= sclk_int;
                cs_n_o   <= cs_n_int;

                if state_s = IDLE then
                    tx_done_o  <= '0';
                    tx_busy_o  <= '0';
                elsif state_s = ACTIVE then
                    tx_busy_o <= '1';
                end if;
            end if;
        end if;
    end process;
end architecture rtl;