library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

use work.alu_pkg.all;

entity alu is
  port (
    clk_i   : in  std_logic;
    rst_ni  : in  std_logic;
    op_i    : in  std_logic_vector(opcode_index_t'range);
    a_i     : in  std_logic_vector(ALU_DATA_WIDTH - 1 downto 0);
    b_i     : in  std_logic_vector(ALU_DATA_WIDTH - 1 downto 0);
    result_o : out std_logic_vector(ALU_DATA_WIDTH - 1 downto 0);
    zero_o   : out std_logic
  );
end entity alu;

architecture rtl of alu is

  signal op_internal   : std_logic_vector(opcode_index_t'range);
  signal a_internal    : std_logic_vector(ALU_DATA_WIDTH - 1 downto 0);
  signal b_internal    : std_logic_vector(ALU_DATA_WIDTH - 1 downto 0);
  signal result_internal : alu_data_t;
  signal zero_internal   : std_logic;

begin

  op_internal <= op_i;
  a_internal  <= a_i;
  b_internal  <= b_i;

  process(clk_i)
    variable a_u     : alu_data_t;
    variable b_u     : alu_data_t;
    variable result_v   : alu_data_t;
    variable zero_v       : std_logic;
    variable op_decoded : alu_opcode_t;
  begin
    if rst_ni = '0' then
      result_v := (others => '0');
      zero_v   := '1';
    else
      a_u     := unsigned(a_internal);
      b_u     := unsigned(b_internal);

      result_v := (others => '0');
      zero_v   := '0';

      case to_integer(unsigned(op_internal)) is
        when 0 => -- ADD
          result_v := a_u + b_u;

        when 1 => -- SUB
          result_v := a_u - b_u;

        when 2 => -- AND
          result_v := a_u and b_u;

        when 3 => -- OR
          result_v := a_u or b_u;

        when 4 => -- XOR
          result_v := a_u xor b_u;

        when 5 => -- NOT (operand A)
          result_v := not a_u;

        when 6 => -- Arithmetic Left Shift
          if to_integer(b_u) < ALU_DATA_WIDTH then
            result_v := shift_left(a_u, to_integer(b_u));
          end if;

        when 7 => -- Arithmetic Right Shift
          if to_integer(b_u) < ALU_DATA_WIDTH then
            result_v := shift_right(signed(a_internal), to_integer(b_u));
          end if;

        when others =>
          result_v := (others => '0');
      end case;

      zero_v := '1';
      for i in alu_data_t'range loop
        if result_v(i) = '1' then
          zero_v := '0';
          exit;
        end if;
      end loop;
    end if;

    result_internal <= result_v;
    zero_internal   <= zero_v;
  end process;

  result_o <= std_logic_vector(result_internal);
  zero_o   <= zero_internal;

end architecture rtl;