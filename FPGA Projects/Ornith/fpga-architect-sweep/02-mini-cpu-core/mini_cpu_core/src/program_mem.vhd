library ieee;
use ieee.numeric_std.all;
use ieee.std_logic_1164.all;

entity program_mem is
  generic (
    ADDR_WIDTH : integer := 12;
    DATA_WIDTH : integer := 8
  );
  port (
    clk        : in  std_logic;
    read_addr  : in  std_logic_vector(ADDR_WIDTH - 1 downto 0);
    read_en    : in  std_logic;
    data_out   : out std_logic_vector(DATA_WIDTH - 1 downto 0)
  );
end entity program_mem;

architecture rtl of program_mem is
  type mem_array_t is array (0 to 2**ADDR_WIDTH - 1) of std_logic_vector(DATA_WIDTH - 1 downto 0);
  
  constant INIT_DATA : mem_array_t := (
    -- Address 0: LOAD r0, [0x100]
    x"40",
    -- Address 1: ADD r1, r0, #5
    x"C1",
    -- Address 2: STORE r1, [0x200]
    x"21",
    -- Address 3: LOAD r2, [0x200]
    x"42",
    -- Address 4: XOR r3, r1, r2
    x"F3",
    -- Address 5: BEQ r3, #0 (branch if zero)
    x"D3",
    -- Address 6: NOP
    x"00",
    -- Address 7: JMP 0x00
    x"80",
    -- Fill remaining with NOPs
    others => x"00"
  );
  
begin
  
  process(clk)
    variable addr_idx : integer;
  begin
    if rising_edge(clk) then
      if read_en = '1' then
        addr_idx := to_integer(unsigned(read_addr));
        data_out <= INIT_DATA(addr_idx);
      end if;
    end if;
  end process;

end architecture rtl;
