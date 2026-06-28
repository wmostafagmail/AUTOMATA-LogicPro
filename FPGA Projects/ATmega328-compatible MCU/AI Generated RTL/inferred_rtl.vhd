library IEEE;
use IEEE.std_logic_1164.all;
use IEEE.numeric_std.all;

entity cpu_top is
    generic (
        ADDR_WIDTH : integer := 16;
        DATA_WIDTH : integer := 8
    );
    port (
        clk        : in  std_logic;
        rst_n      : in  std_logic;
        uart_tx    : out std_logic;
        debug_zero : out std_logic;
        addr       : out std_logic_vector(ADDR_WIDTH-1 downto 0);
        data       : inout std_logic_vector(DATA_WIDTH-1 downto 0);
        mem_rd     : out std_logic;
        mem_wr     : out std_logic;
        mem_cs     : out std_logic
    );
end entity cpu_top;

architecture rtl of cpu_top is
    signal addr_reg    : std_logic_vector(ADDR_WIDTH-1 downto 0);
    signal data_out_reg: std_logic_vector(DATA_WIDTH-1 downto 0);
    signal mem_rd_reg  : std_logic;
    signal mem_wr_reg  : std_logic;
    signal mem_cs_reg  : std_logic;
    signal debug_zero_reg : std_logic;
    
    signal core_addr    : std_logic_vector(ADDR_WIDTH-1 downto 0);
    signal core_data_in : std_logic_vector(DATA_WIDTH-1 downto 0);
    signal core_data_out: std_logic_vector(DATA_WIDTH-1 downto 0);
    signal core_mem_rd  : std_logic;
    signal core_mem_wr  : std_logic;
    signal core_mem_cs  : std_logic;
    signal core_debug_zero : std_logic;
    
begin
    process(clk, rst_n)
    begin
        if rst_n = '0' then
            addr_reg       <= (others => '0');
            data_out_reg   <= (others => '0');
            mem_rd_reg     <= '0';
            mem_wr_reg     <= '0';
            mem_cs_reg     <= '0';
            debug_zero_reg <= '0';
        elsif rising_edge(clk) then
            addr_reg       <= core_addr;
            data_out_reg   <= core_data_out;
            mem_rd_reg     <= core_mem_rd;
            mem_wr_reg     <= core_mem_wr;
            mem_cs_reg     <= core_mem_cs;
            debug_zero_reg <= core_debug_zero;
        end if;
    end process;
    
    data <= core_data_out when core_mem_wr = '1' and core_mem_cs = '1' else (others => 'Z');
    
    addr       <= addr_reg;
    mem_rd     <= mem_rd_reg;
    mem_wr     <= mem_wr_reg;
    mem_cs     <= mem_cs_reg;
    debug_zero <= debug_zero_reg;
    
    uart_tx_driver : entity work.uart_tx
        port map (
            clk     => clk,
            rst_n   => rst_n,
            tx_req  => '0',
            tx_data => (others => '0'),
            tx_done => open,
            tx_out  => uart_tx
        );
        
    avr_core_inst : entity work.avr_core
        port map (
            clk       => clk,
            rst_n     => rst_n,
            addr      => core_addr,
            data_in   => core_data_in,
            data_out  => core_data_out,
            mem_rd    => core_mem_rd,
            mem_wr    => core_mem_wr,
            mem_cs    => core_mem_cs,
            debug_zero => core_debug_zero
        );
        
    core_data_in <= (others => '0');
    
end architecture rtl;
