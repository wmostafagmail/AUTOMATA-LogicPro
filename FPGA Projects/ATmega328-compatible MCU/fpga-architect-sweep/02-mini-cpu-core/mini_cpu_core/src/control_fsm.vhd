library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.cpu_pkg.all;

entity control_fsm is
  port (
    clk     : in  std_logic;
    rst     : in  std_logic;
    instr   : in  instr_t;
    pc_inc : out std_logic;
    pc_jmp : out std_logic;
    pc_jmp_addr : out addr_t;
    reg_we : out std_logic;
    alu_op : out data_t;
    halt    : out std_logic
   );
end entity;

architecture rtl of control_fsm is
  signal pc_next : addr_t := (others => '0');
  signal pc_en    : std_logic := '0';
  signal pc_jmp_en : std_logic := '0';
  signal pc_jmp_addr_i : addr_t := (others => '0');
begin
  pc_inc <= pc_en;
  pc_jmp <= pc_jmp_en;
  pc_jmp_addr <= pc_jmp_addr_i;

  process(clk)
  begin
    if rising_edge(clk) then
      if rst = '1' then
        pc_next <= (others => '0');
        pc_en <= '0';
        pc_jmp_en <= '0';
        pc_jmp_addr_i <= (others => '0');
      else
        pc_next <= pc_next;
        pc_en <= '1';
        pc_jmp_en <= '0';
        pc_jmp_addr_i <= (others => '0');

        case instr.op_code is
          when OP_ADD | OP_SUB | OP_AND | OP_OR =>
            reg_we <= '1';
            alu_op <= instr.op_code;
            halt <= '0';
          when OP_JMP =>
            pc_jmp_en <= '1';
            pc_jmp_addr_i <= instr.imm;
            pc_en <= '0';
            reg_we <= '0';
            alu_op <= (others => '0');
            halt <= '0';
          when OP_HALT =>
            pc_en <= '0';
            reg_we <= '0';
            alu_op <= (others => '0');
            halt <= '1';
          when others =>
            reg_we <= '0';
            alu_op <= (others => '0');
            halt <= '0';
        end case;
      end if;
    end if;
  end process;
end architecture;
