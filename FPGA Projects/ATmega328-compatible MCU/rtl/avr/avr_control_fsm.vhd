library ieee;
use ieee.std_logic_1164.all;

use work.avr_pkg.all;

entity avr_control_fsm is
  port (
    clk          : in  std_logic;
    reset        : in  std_logic;
    dec_i        : in  avr_decode_t;
    sts_i        : in  avr_status_t;
    irq_vector_i : in  addr16_t;
    state_o      : out core_state_t;
    ctrl_o       : out avr_ctrl_t
  );
end entity;

architecture rtl of avr_control_fsm is
  signal state_reg  : core_state_t := CORE_S_RESET;
  signal state_next : core_state_t := CORE_S_RESET;
  signal ctrl_s     : avr_ctrl_t   := avr_ctrl_init;
begin
  process(clk)
  begin
    if rising_edge(clk) then
      if reset = '1' then
        state_reg <= CORE_S_RESET;
      else
        state_reg <= state_next;
      end if;
    end if;
  end process;

  process(state_reg, dec_i, sts_i, irq_vector_i)
    variable ctrl_v : avr_ctrl_t;
  begin
    ctrl_v   := avr_ctrl_init;
    state_next <= state_reg;

    case state_reg is
      when CORE_S_RESET =>
        state_next <= CORE_S_FETCH0;

      when CORE_S_FETCH0 =>
        ctrl_v.pmem_req := '1';
        if sts_i.pmem_valid = '1' then
          state_next <= CORE_S_FETCH1;
        end if;

      when CORE_S_FETCH1 =>
        ctrl_v.ir0_we := '1';
        if dec_i.is_32bit = '1' then
          state_next <= CORE_S_FETCH2_32;
        else
          ctrl_v.pc_op := PC_INC1;
          state_next <= CORE_S_DECODE;
        end if;

      when CORE_S_FETCH2_32 =>
        ctrl_v.pmem_req := '1';
        if sts_i.pmem_valid = '1' then
          ctrl_v.ir1_we := '1';
          ctrl_v.pc_op  := PC_INC2;
          state_next <= CORE_S_DECODE;
        end if;

      when CORE_S_DECODE =>
        if dec_i.decode_illegal = '1' then
          state_next <= CORE_S_HALT_ILLEGAL;
        else
          case dec_i.instr_kind is
            when I_NOP =>
              state_next <= CORE_S_COMPLETE;
            when I_MOV | I_LDI | I_ADD | I_SUB | I_CP =>
              state_next <= CORE_S_EXEC_ALU;
            when I_IN | I_POP =>
              state_next <= CORE_S_EXEC_READ_REQ;
            when I_OUT | I_PUSH =>
              state_next <= CORE_S_EXEC_WRITE_PREP;
            when I_RJMP =>
              state_next <= CORE_S_EXEC_BRANCH;
            when others =>
              state_next <= CORE_S_HALT_ILLEGAL;
          end case;
        end if;

      when CORE_S_EXEC_ALU =>
        case dec_i.instr_kind is
          when I_MOV =>
            ctrl_v.rf_we   := '1';
            ctrl_v.rf_wsel := RF_W_ALU;
            ctrl_v.alu_op  := ALU_PASS_RR;
            ctrl_v.alu_rhs_sel := ALU_RHS_REG;
          when I_LDI =>
            ctrl_v.rf_we   := '1';
            ctrl_v.rf_wsel := RF_W_IMM;
            ctrl_v.alu_op  := ALU_PASS_IMM;
            ctrl_v.alu_rhs_sel := ALU_RHS_IMM8;
          when I_ADD =>
            ctrl_v.rf_we      := '1';
            ctrl_v.rf_wsel    := RF_W_ALU;
            ctrl_v.alu_op     := ALU_ADD;
            ctrl_v.alu_rhs_sel := ALU_RHS_REG;
            ctrl_v.sreg_we    := '1';
            ctrl_v.sreg_src_alu := '1';
          when I_SUB =>
            ctrl_v.rf_we      := '1';
            ctrl_v.rf_wsel    := RF_W_ALU;
            ctrl_v.alu_op     := ALU_SUB;
            ctrl_v.alu_rhs_sel := ALU_RHS_REG;
            ctrl_v.sreg_we    := '1';
            ctrl_v.sreg_src_alu := '1';
          when I_CP =>
            ctrl_v.alu_op     := ALU_SUB;
            ctrl_v.alu_rhs_sel := ALU_RHS_REG;
            ctrl_v.sreg_we    := '1';
            ctrl_v.sreg_src_alu := '1';
          when others =>
            null;
        end case;
        ctrl_v.alu_exec := '1';
        state_next <= CORE_S_COMPLETE;

      when CORE_S_EXEC_READ_REQ =>
        ctrl_v.d_re := '1';
        case dec_i.instr_kind is
          when I_IN =>
            ctrl_v.d_addr_sel := DA_IO;
          when I_POP =>
            ctrl_v.d_addr_sel := DA_SP;
          when others =>
            null;
        end case;
        if sts_i.d_valid = '1' then
          state_next <= CORE_S_EXEC_READ_CAP;
        end if;

      when CORE_S_EXEC_READ_CAP =>
        ctrl_v.data_latch_we := '1';
        case dec_i.instr_kind is
          when I_IN =>
            ctrl_v.d_addr_sel := DA_IO;
          when I_POP =>
            ctrl_v.d_addr_sel := DA_SP;
          when others =>
            null;
        end case;
        state_next <= CORE_S_EXEC_WRITEBACK;

      when CORE_S_EXEC_WRITEBACK =>
        ctrl_v.rf_we := '1';
        ctrl_v.rf_wsel := RF_W_MEM;
        if dec_i.instr_kind = I_POP then
          ctrl_v.sp_op := SP_INC;
        end if;
        state_next <= CORE_S_COMPLETE;

      when CORE_S_EXEC_WRITE_PREP =>
        case dec_i.instr_kind is
          when I_PUSH =>
            ctrl_v.sp_op := SP_DEC;
          when others =>
            null;
        end case;
        state_next <= CORE_S_EXEC_WRITE;

      when CORE_S_EXEC_WRITE =>
        ctrl_v.d_we := '1';
        case dec_i.instr_kind is
          when I_OUT =>
            ctrl_v.d_addr_sel  := DA_IO;
            ctrl_v.d_wdata_sel := DW_RF;
          when I_PUSH =>
            ctrl_v.d_addr_sel  := DA_SP;
            ctrl_v.d_wdata_sel := DW_RF;
          when others =>
            null;
        end case;
        state_next <= CORE_S_COMPLETE;

      when CORE_S_EXEC_BRANCH =>
        if dec_i.instr_kind = I_RJMP then
          ctrl_v.pc_op := PC_LOAD_REL;
        end if;
        state_next <= CORE_S_COMPLETE;

      when CORE_S_COMPLETE =>
        if sts_i.irq_pending = '1' and sts_i.sreg_q(7) = '1' then
          state_next <= CORE_S_IRQ_ENTRY_0;
        else
          state_next <= CORE_S_FETCH0;
        end if;

      when CORE_S_IRQ_ENTRY_0 =>
        ctrl_v.irq_ack    := '1';
        ctrl_v.sreg_i_clr := '1';
        state_next <= CORE_S_IRQ_ENTRY_5;

      when CORE_S_IRQ_ENTRY_5 =>
        ctrl_v.pc_op := PC_LOAD_IRQ;
        state_next <= CORE_S_FETCH0;

      when CORE_S_HALT_ILLEGAL =>
        ctrl_v.illegal_halt_set := '1';
        state_next <= CORE_S_HALT_ILLEGAL;

      when others =>
        state_next <= CORE_S_HALT_ILLEGAL;
    end case;

    ctrl_s <= ctrl_v;
  end process;

  state_o <= state_reg;
  ctrl_o  <= ctrl_s;
end architecture;
