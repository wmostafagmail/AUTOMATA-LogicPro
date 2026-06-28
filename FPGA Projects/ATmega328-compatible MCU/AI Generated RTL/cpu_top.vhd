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
        
        -- UART Interface
        uart_tx    : out std_logic;
        
        -- Debug Interface
        debug_zero : out std_logic;
        
        -- Memory Interface
        addr       : out std_logic_vector(ADDR_WIDTH-1 downto 0);
        data       : inout std_logic_vector(DATA_WIDTH-1 downto 0);
        mem_rd     : out std_logic;
        mem_wr     : out std_logic;
        mem_cs     : out std_logic
    );
end entity cpu_top;
