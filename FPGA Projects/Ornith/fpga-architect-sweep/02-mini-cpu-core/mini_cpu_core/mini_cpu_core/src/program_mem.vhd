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
    -- Address 0x00: NOP r0, r0, r0 -> opcode=00000000 rs1=00 rs2=00 rd=00 imm=000000
    "00000000" & "00" & "00" & "00" & "000000",
    -- Address 0x01: ADD r1, r0, r0 -> opcode=00000011 rs1=00 rs2=00 rd=01 imm=000000
    "00000011" & "00" & "00" & "01" & "000000",
    -- Address 0x02: LOAD r2, [addr=4] -> opcode=00000001 rs1=00 rs2=00 rd=10 imm=000100
    "00000001" & "00" & "00" & "10" & "000100",
    -- Address 0x03: STORE r2, [addr=5] -> opcode=00000010 rs1=00 rs2=00 rd=10 imm=000101
    "00000010" & "00" & "00" & "10" & "000101",
    -- Address 0x04: ADD r3, r2, #7 -> opcode=00000011 rs1=10 rs2=00 rd=11 imm=000111
    "00000011" & "10" & "00" & "11" & "000111",
    -- Address 0x05: NOP (dead) -> opcode=00000000 rs1=00 rs2=00 rd=00 imm=000000
    "00000000" & "00" & "00" & "00" & "000000",
    -- Address 0x06: XOR r3, r1, r2 -> opcode=00000111 rs1=01 rs2=10 rd=11 imm=000000
    "00000111" & "01" & "10" & "11" & "000000",
    -- Address 0x07: BEQ r3, #8 -> opcode=00001001 rs1=11 rs2=00 rd=00 imm=001000
    "00001001" & "11" & "00" & "00" & "001000",
    -- Address 0x08: NOP (branch target) -> opcode=00000000 rs1=00 rs2=00 rd=00 imm=000000
    "00000000" & "00" & "00" & "00" & "000000",
    -- Address 0x09: NOP (dead) -> opcode=00000000 rs1=00 rs2=00 rd=00 imm=000000
    "00000000" & "00" & "00" & "00" & "000000",
    others => "00000000" & "00" & "00" & "00" & "000000"
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