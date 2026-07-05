library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.alu_pkg.all;

entity alu is
  generic (
    WIDTH : integer := 8
  );
  port (
    clk   : in  std_logic;
    rst   : in  std_logic;
    opcode : in  alu_op_t;
    a     : in  std_logic_vector(WIDTH-1 downto 0);
    b     : in  std_logic_vector(WIDTH-1 downto 0);
    result : out std_logic_vector(WIDTH-1 downto 0);
    flags  : out alu_flags_t
  );
end entity alu;

architecture rtl of alu is
begin
  process(clk)
    variable res : std_logic_vector(WIDTH-1 downto 0);
    variable c_flags : alu_flags_t;
  begin
    if rising_edge(clk) then
      if rst = '1' then
        -- Synchronous Reset
        res := (others => '0');
        c_flags.zero := '1';
        c_flags.carry := '0';
      else
        -- Combinational Logic
        case opcode is
          when OP_ADD =>
            res := a + b;
            c_flags.carry := '0';
            c_flags.zero := (res = (others => '0'));
            
          when OP_SUB =>
            res := a - b;
            c_flags.carry := '0';
            c_flags.zero := (res = (others => '0'));
            
          when OP_AND =>
            res := a and b;
            c_flags.zero := (res = (others => '0'));
            
          when OP_OR =>
            res := a or b;
            c_flags.zero := (res = (others => '0'));
            
          when OP_XOR =>
            res := a xor b;
            c_flags.zero := (res = (others => '0'));
            
          when OP_NOT =>
            res := not a;
            c_flags.zero := (res = (others => '0'));
            
          when OP_SLL =>
            res := a sll to_integer(unsigned(b(3 downto 0)));
            c_flags.zero := (res = (others => '0'));
            
          when OP_SRL =>
            res := a srl to_integer(unsigned(b(3 downto 0)));
            c_flags.zero := (res = (others => '0'));
            
          when others =>
            res := (others => '0');
            c_flags.zero := '1';
        end case;
        
        -- Output Assignment
        result <= res;
        flags <= c_flags;
      end if;
    end if;
  end process;
end architecture rtl;