entity cpu_top is
    Port (
        clk        : in  std_logic;
        reset      : in  std_logic;
        uart_tx    : out std_logic;
        debug_zero : out std_logic;
        addr       : out std_logic_vector(7 downto 0);
        data_in    : in  std_logic_vector(7 downto 0);
        data_out   : out std_logic_vector(7 downto 0);
        instr_valid: in  std_logic;
        mem_read   : out std_logic;
        mem_write  : out std_logic
    );
end cpu_top;
