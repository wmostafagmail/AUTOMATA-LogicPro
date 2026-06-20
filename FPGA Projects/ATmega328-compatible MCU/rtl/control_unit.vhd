library ieee;
use ieee.std_logic_1164.all;

use work.cpu_pkg.all;

entity control_unit is
  port (
    clk          : in  std_logic;
    reset        : in  std_logic;
    instr_word   : in  word_t;
    opcode       : in  opcode_t;
    zero_flag    : in  std_logic;
    state_dbg    : out cpu_state_t;
    alu_op       : out alu_op_t;
    pc_we        : out std_logic;
    pc_sel_imm   : out std_logic;
    ir_we        : out std_logic;
    reg_we       : out std_logic;
    reg_src_mem  : out std_logic;
    reg_src_imm  : out std_logic;
    flags_we     : out std_logic;
    mem_we       : out std_logic;
    halted_set   : out std_logic
  );
end entity;

architecture rtl of control_unit is
  signal state_reg  : cpu_state_t := CPU_S_RESET;
  signal state_next : cpu_state_t := CPU_S_RESET;
  signal illegal    : std_logic;
begin
  illegal <= '1' when
    ((opcode = OP_NOP or opcode = OP_HALT) and instr_word(11 downto 0) /= x"000") or
    ((opcode = OP_LDI or opcode = OP_LD or opcode = OP_ST or opcode = OP_OUT) and instr_word(8) /= '0') or
    ((opcode = OP_JMP or opcode = OP_JZ or opcode = OP_JNZ) and instr_word(11 downto 8) /= "0000")
    else '0';

  process(clk)
  begin
    if rising_edge(clk) then
      if reset = '1' then
        state_reg <= CPU_S_RESET;
      else
        state_reg <= state_next;
      end if;
    end if;
  end process;

  process(state_reg, opcode, zero_flag, illegal)
  begin
    state_next   <= state_reg;
    alu_op       <= ALU_PASS_RS;
    pc_we        <= '0';
    pc_sel_imm   <= '0';
    ir_we        <= '0';
    reg_we       <= '0';
    reg_src_mem  <= '0';
    reg_src_imm  <= '0';
    flags_we     <= '0';
    mem_we       <= '0';
    halted_set   <= '0';

    case state_reg is
      when CPU_S_RESET =>
        state_next <= CPU_S_FETCH;

      when CPU_S_FETCH =>
        ir_we      <= '1';
        pc_we      <= '1';
        state_next <= CPU_S_DECODE;

      when CPU_S_DECODE =>
        if illegal = '1' then
          halted_set <= '1';
          state_next <= CPU_S_HALT;
        else
          case opcode is
            when OP_NOP =>
              state_next <= CPU_S_FETCH;
            when OP_MOV | OP_ADD | OP_SUB | OP_AND | OP_OR | OP_XOR | OP_CMP =>
              state_next <= CPU_S_EXEC_ALU;
            when OP_LDI =>
              state_next <= CPU_S_EXEC_IMM;
            when OP_LD =>
              state_next <= CPU_S_MEM_READ;
            when OP_ST | OP_OUT =>
              state_next <= CPU_S_MEM_WRITE;
            when OP_JMP | OP_JZ | OP_JNZ =>
              state_next <= CPU_S_BRANCH;
            when OP_HALT =>
              halted_set <= '1';
              state_next <= CPU_S_HALT;
            when others =>
              halted_set <= '1';
              state_next <= CPU_S_HALT;
          end case;
        end if;

      when CPU_S_EXEC_ALU =>
        case opcode is
          when OP_MOV =>
            alu_op <= ALU_PASS_RS;
            reg_we <= '1';
          when OP_ADD =>
            alu_op   <= ALU_ADD;
            reg_we   <= '1';
            flags_we <= '1';
          when OP_SUB =>
            alu_op   <= ALU_SUB;
            reg_we   <= '1';
            flags_we <= '1';
          when OP_AND =>
            alu_op   <= ALU_AND;
            reg_we   <= '1';
            flags_we <= '1';
          when OP_OR =>
            alu_op   <= ALU_OR;
            reg_we   <= '1';
            flags_we <= '1';
          when OP_XOR =>
            alu_op   <= ALU_XOR;
            reg_we   <= '1';
            flags_we <= '1';
          when OP_CMP =>
            alu_op   <= ALU_SUB;
            flags_we <= '1';
          when others =>
            null;
        end case;
        state_next <= CPU_S_FETCH;

      when CPU_S_EXEC_IMM =>
        reg_we      <= '1';
        reg_src_imm <= '1';
        state_next  <= CPU_S_FETCH;

      when CPU_S_MEM_READ =>
        state_next <= CPU_S_MEM_WRITEBACK;

      when CPU_S_MEM_WRITEBACK =>
        reg_we      <= '1';
        reg_src_mem <= '1';
        state_next  <= CPU_S_FETCH;

      when CPU_S_MEM_WRITE =>
        mem_we      <= '1';
        state_next  <= CPU_S_FETCH;

      when CPU_S_BRANCH =>
        if opcode = OP_JMP or
           (opcode = OP_JZ and zero_flag = '1') or
           (opcode = OP_JNZ and zero_flag = '0') then
          pc_we      <= '1';
          pc_sel_imm <= '1';
        end if;
        state_next <= CPU_S_FETCH;

      when CPU_S_HALT =>
        state_next <= CPU_S_HALT;
    end case;
  end process;

  state_dbg <= state_reg;
end architecture;
