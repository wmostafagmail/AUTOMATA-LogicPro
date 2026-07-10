library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity reg_file is
    port (
        clk         : in  std_logic;
        reset       : in  std_logic;
        write_en    : in  std_logic;
        reg_addr_w  : in  std_logic_vector(1 downto 0);
        data_in     : in  std_logic_vector(7 downto 0);
        reg_addr_r  : in  std_logic_vector(1 downto 0);
        data_out    : out std_logic_vector(7 downto 0)
    );
end entity reg_file;

architecture rtl of reg_file is
    type reg_array is array (0 to 3) of std_logic_vector(7 downto 0);
    signal registers : reg_array := (others => (others => '0'));
begin
    -- Synchronous Write Process
    process(clk)
        variable idx_w : integer;
    begin
        if rising_edge(clk) then
            if reset = '1' then
                registers <= (others => (others => '0'));
            elsif write_en = '1' then
                idx_w := to_integer(unsigned(reg_addr_w));
                -- Bound check for array safety
                if idx_w >= 0 and idx_w <= 3 then
                    registers(idx_w) <= data_in;
                end if;
            end if;
        end if;
    end process;

    -- Asynchronous Read Process
    process(registers, reg_addr_r)
        variable idx_r : integer;
    begin
        idx_r := to_integer(unsigned(reg_addr_r));
        if idx_r >= 0 and idx_r <= 3 then
            data_out <= registers(idx_r);
        else
            data_out <= (others => '0');
        end if;
    end process;
end architecture rtl;