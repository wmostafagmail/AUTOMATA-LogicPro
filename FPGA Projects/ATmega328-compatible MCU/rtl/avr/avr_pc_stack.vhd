library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

use work.avr_pkg.all;

entity avr_pc_stack is
  port (
    clk             : in  std_logic;
    reset           : in  std_logic;
    pc_op_i         : in  pc_op_t;
    sp_op_i         : in  sp_op_t;
    abs_target_i    : in  addr16_t;
    rel_target_i    : in  addr16_t;
    irq_target_i    : in  addr16_t;
    sp_write_data_i : in  addr16_t;
    pc_q_o          : out addr16_t;
    sp_q_o          : out addr16_t
  );
end entity;

architecture rtl of avr_pc_stack is
  signal pc_q : addr16_t := (others => '0');
  signal sp_q : addr16_t := AVR_RESET_SP;
begin
  process(clk)
  begin
    if rising_edge(clk) then
      if reset = '1' then
        pc_q <= (others => '0');
        sp_q <= AVR_RESET_SP;
      else
        case pc_op_i is
          when PC_INC1 =>
            pc_q <= std_logic_vector(unsigned(pc_q) + 1);
          when PC_INC2 =>
            pc_q <= std_logic_vector(unsigned(pc_q) + 2);
          when PC_LOAD_ABS =>
            pc_q <= abs_target_i;
          when PC_LOAD_REL =>
            pc_q <= rel_target_i;
          when PC_LOAD_IRQ =>
            pc_q <= irq_target_i;
          when others =>
            null;
        end case;

        case sp_op_i is
          when SP_DEC =>
            sp_q <= std_logic_vector(unsigned(sp_q) - 1);
          when SP_INC =>
            sp_q <= std_logic_vector(unsigned(sp_q) + 1);
          when SP_WRITE =>
            sp_q <= sp_write_data_i;
          when others =>
            null;
        end case;
      end if;
    end if;
  end process;

  pc_q_o <= pc_q;
  sp_q_o <= sp_q;
end architecture;
