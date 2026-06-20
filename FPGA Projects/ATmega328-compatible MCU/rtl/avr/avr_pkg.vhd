library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

package avr_pkg is
  subtype byte_t is std_logic_vector(7 downto 0);
  subtype word_t is std_logic_vector(15 downto 0);
  subtype addr16_t is std_logic_vector(15 downto 0);
  subtype reg_idx5_t is std_logic_vector(4 downto 0);
  subtype bit_idx3_t is std_logic_vector(2 downto 0);
  subtype io_addr6_t is std_logic_vector(5 downto 0);
  subtype sreg_t is std_logic_vector(7 downto 0);

  constant IRQ_COUNT    : positive := 8;
  constant AVR_RESET_SP : addr16_t := x"08FF";

  type avr_instr_t is (
    I_NOP,
    I_MOV,
    I_MOVW,
    I_LDI,
    I_IN,
    I_OUT,
    I_LD_X,
    I_LD_X_POSTINC,
    I_LD_X_PREDEC,
    I_LD_Y,
    I_LD_Y_POSTINC,
    I_LD_Y_PREDEC,
    I_LD_Z,
    I_LD_Z_POSTINC,
    I_LD_Z_PREDEC,
    I_ST_X,
    I_ST_X_POSTINC,
    I_ST_X_PREDEC,
    I_ST_Y,
    I_ST_Y_POSTINC,
    I_ST_Y_PREDEC,
    I_ST_Z,
    I_ST_Z_POSTINC,
    I_ST_Z_PREDEC,
    I_LDS,
    I_STS,
    I_PUSH,
    I_POP,
    I_ADD,
    I_ADC,
    I_ADIW,
    I_SUB,
    I_SUBI,
    I_SBC,
    I_SBCI,
    I_AND,
    I_ANDI,
    I_OR,
    I_ORI,
    I_EOR,
    I_COM,
    I_NEG,
    I_INC,
    I_DEC,
    I_CP,
    I_CPC,
    I_CPI,
    I_TST,
    I_LSL,
    I_LSR,
    I_ROL,
    I_ROR,
    I_ASR,
    I_SWAP,
    I_BSET,
    I_BCLR,
    I_BST,
    I_BLD,
    I_SBI,
    I_CBI,
    I_RJMP,
    I_JMP,
    I_RCALL,
    I_CALL,
    I_RET,
    I_RETI,
    I_BRBS,
    I_BRBC,
    I_CPSE,
    I_SBRC,
    I_SBRS,
    I_SBIC,
    I_SBIS,
    I_ILLEGAL
  );

  type ptr_sel_t is (PTR_NONE, PTR_X, PTR_Y, PTR_Z);
  type ptr_mode_t is (PTR_MODE_NONE, PTR_MODE_DIRECT, PTR_MODE_POSTINC, PTR_MODE_PREDEC);
  type branch_cond_t is (BC_NONE, BC_ALWAYS, BC_SREG_BIT_SET, BC_SREG_BIT_CLEAR);
  type skip_kind_t is (
    SKIP_NONE,
    SKIP_IF_REG_EQ,
    SKIP_IF_BIT_CLR_REG,
    SKIP_IF_BIT_SET_REG,
    SKIP_IF_BIT_CLR_IO,
    SKIP_IF_BIT_SET_IO
  );

  type rf_wsel_t is (RF_W_NONE, RF_W_ALU, RF_W_MEM, RF_W_IMM, RF_W_BIT_BLEND, RF_W_POP);
  type alu_rhs_sel_t is (ALU_RHS_REG, ALU_RHS_IMM8, ALU_RHS_ONE, ALU_RHS_ZERO, ALU_RHS_CARRY);
  type d_addr_sel_t is (DA_NONE, DA_IO, DA_ABS16, DA_PTR, DA_SP);
  type d_wdata_sel_t is (DW_NONE, DW_RF, DW_RET_HI, DW_RET_LO, DW_BITMOD);
  type pc_op_t is (PC_HOLD, PC_INC1, PC_INC2, PC_LOAD_ABS, PC_LOAD_REL, PC_LOAD_IRQ);
  type sp_op_t is (SP_HOLD, SP_DEC, SP_INC, SP_WRITE);

  type alu_op_t is (
    ALU_NOP,
    ALU_PASS_RR,
    ALU_PASS_IMM,
    ALU_ADD,
    ALU_ADC,
    ALU_SUB,
    ALU_SBC,
    ALU_AND,
    ALU_OR,
    ALU_EOR,
    ALU_COM,
    ALU_NEG,
    ALU_INC,
    ALU_DEC,
    ALU_LSL,
    ALU_LSR,
    ALU_ROL,
    ALU_ROR,
    ALU_ASR,
    ALU_SWAP,
    ALU_BIT_BLEND,
    ALU_ADIW
  );

  type core_state_t is (
    CORE_S_RESET,
    CORE_S_FETCH0,
    CORE_S_FETCH1,
    CORE_S_FETCH2_32,
    CORE_S_DECODE,
    CORE_S_EXEC_ALU,
    CORE_S_EXEC_ALU16,
    CORE_S_EXEC_ALU16_WB,
    CORE_S_EXEC_BIT,
    CORE_S_EXEC_READ_REQ,
    CORE_S_EXEC_READ_CAP,
    CORE_S_EXEC_WRITEBACK,
    CORE_S_EXEC_WRITE_PREP,
    CORE_S_EXEC_WRITE,
    CORE_S_EXEC_PTR_POST,
    CORE_S_EXEC_SP_INC,
    CORE_S_EXEC_RMW_READ_REQ,
    CORE_S_EXEC_RMW_MODIFY,
    CORE_S_EXEC_BRANCH,
    CORE_S_EXEC_CALL_PREP,
    CORE_S_EXEC_CALL_PUSH_H_DEC,
    CORE_S_EXEC_CALL_PUSH_H_WR,
    CORE_S_EXEC_CALL_PUSH_L_DEC,
    CORE_S_EXEC_CALL_PUSH_L_WR,
    CORE_S_EXEC_CALL_PC_LOAD,
    CORE_S_EXEC_RET_POP0,
    CORE_S_EXEC_RET_POP0_CAP,
    CORE_S_EXEC_RET_POP1,
    CORE_S_EXEC_RET_POP1_CAP,
    CORE_S_EXEC_RET_PC_LOAD,
    CORE_S_EXEC_SKIP_EVAL,
    CORE_S_SKIP_FETCH,
    CORE_S_SKIP_CLASSIFY,
    CORE_S_IRQ_ENTRY_0,
    CORE_S_IRQ_ENTRY_1,
    CORE_S_IRQ_ENTRY_2,
    CORE_S_IRQ_ENTRY_3,
    CORE_S_IRQ_ENTRY_4,
    CORE_S_IRQ_ENTRY_5,
    CORE_S_COMPLETE,
    CORE_S_HALT_ILLEGAL
  );

  type avr_decode_t is record
    instr_kind      : avr_instr_t;
    is_32bit        : std_logic;
    decode_illegal  : std_logic;
    rd_idx          : reg_idx5_t;
    rr_idx          : reg_idx5_t;
    imm8            : byte_t;
    imm16           : addr16_t;
    io_addr         : io_addr6_t;
    bit_index       : bit_idx3_t;
    ptr_sel         : ptr_sel_t;
    ptr_mode        : ptr_mode_t;
    branch_cond     : branch_cond_t;
    skip_kind       : skip_kind_t;
  end record;

  type avr_status_t is record
    sreg_q              : sreg_t;
    rd_eq_rr            : std_logic;
    reg_bit_value       : std_logic;
    io_bit_value        : std_logic;
    pmem_valid          : std_logic;
    d_valid             : std_logic;
    irq_pending         : std_logic;
    next_instr_is_32bit : std_logic;
  end record;

  type avr_ctrl_t is record
    pmem_req         : std_logic;
    ir0_we           : std_logic;
    ir1_we           : std_logic;
    pc_op            : pc_op_t;
    sp_op            : sp_op_t;
    rf_we            : std_logic;
    rf_wpair_we      : std_logic;
    rf_wsel          : rf_wsel_t;
    alu_exec         : std_logic;
    alu_op           : alu_op_t;
    alu_rhs_sel      : alu_rhs_sel_t;
    sreg_we          : std_logic;
    sreg_src_alu     : std_logic;
    sreg_bit_set_we  : std_logic;
    sreg_bit_clr_we  : std_logic;
    sreg_t_load      : std_logic;
    sreg_i_set       : std_logic;
    sreg_i_clr       : std_logic;
    ptr_predec_we    : std_logic;
    ptr_postinc_we   : std_logic;
    ptr_sel_out      : ptr_sel_t;
    d_re             : std_logic;
    d_we             : std_logic;
    d_addr_sel       : d_addr_sel_t;
    d_wdata_sel      : d_wdata_sel_t;
    data_latch_we    : std_logic;
    skip_eval_en     : std_logic;
    skip_len_capture : std_logic;
    irq_ack          : std_logic;
    illegal_halt_set : std_logic;
  end record;

  type avr_debug_t is record
    pc_q       : addr16_t;
    sp_q       : addr16_t;
    ir0_q      : word_t;
    ir1_q      : word_t;
    state_q    : core_state_t;
    instr_kind : avr_instr_t;
    sreg_q     : sreg_t;
  end record;

  function avr_decode_init return avr_decode_t;
  function avr_status_init return avr_status_t;
  function avr_ctrl_init return avr_ctrl_t;
  function avr_debug_init return avr_debug_t;
  function slv_is_01(vec : std_logic_vector) return boolean;
  function safe_to_natural(vec : std_logic_vector) return natural;
end package;

package body avr_pkg is
  function avr_decode_init return avr_decode_t is
    variable ret : avr_decode_t;
  begin
    ret.instr_kind     := I_NOP;
    ret.is_32bit       := '0';
    ret.decode_illegal := '0';
    ret.rd_idx         := (others => '0');
    ret.rr_idx         := (others => '0');
    ret.imm8           := (others => '0');
    ret.imm16          := (others => '0');
    ret.io_addr        := (others => '0');
    ret.bit_index      := (others => '0');
    ret.ptr_sel        := PTR_NONE;
    ret.ptr_mode       := PTR_MODE_NONE;
    ret.branch_cond    := BC_NONE;
    ret.skip_kind      := SKIP_NONE;
    return ret;
  end function;

  function avr_status_init return avr_status_t is
    variable ret : avr_status_t;
  begin
    ret.sreg_q              := (others => '0');
    ret.rd_eq_rr            := '0';
    ret.reg_bit_value       := '0';
    ret.io_bit_value        := '0';
    ret.pmem_valid          := '0';
    ret.d_valid             := '0';
    ret.irq_pending         := '0';
    ret.next_instr_is_32bit := '0';
    return ret;
  end function;

  function avr_ctrl_init return avr_ctrl_t is
    variable ret : avr_ctrl_t;
  begin
    ret.pmem_req         := '0';
    ret.ir0_we           := '0';
    ret.ir1_we           := '0';
    ret.pc_op            := PC_HOLD;
    ret.sp_op            := SP_HOLD;
    ret.rf_we            := '0';
    ret.rf_wpair_we      := '0';
    ret.rf_wsel          := RF_W_NONE;
    ret.alu_exec         := '0';
    ret.alu_op           := ALU_NOP;
    ret.alu_rhs_sel      := ALU_RHS_REG;
    ret.sreg_we          := '0';
    ret.sreg_src_alu     := '0';
    ret.sreg_bit_set_we  := '0';
    ret.sreg_bit_clr_we  := '0';
    ret.sreg_t_load      := '0';
    ret.sreg_i_set       := '0';
    ret.sreg_i_clr       := '0';
    ret.ptr_predec_we    := '0';
    ret.ptr_postinc_we   := '0';
    ret.ptr_sel_out      := PTR_NONE;
    ret.d_re             := '0';
    ret.d_we             := '0';
    ret.d_addr_sel       := DA_NONE;
    ret.d_wdata_sel      := DW_NONE;
    ret.data_latch_we    := '0';
    ret.skip_eval_en     := '0';
    ret.skip_len_capture := '0';
    ret.irq_ack          := '0';
    ret.illegal_halt_set := '0';
    return ret;
  end function;

  function avr_debug_init return avr_debug_t is
    variable ret : avr_debug_t;
  begin
    ret.pc_q       := (others => '0');
    ret.sp_q       := AVR_RESET_SP;
    ret.ir0_q      := (others => '0');
    ret.ir1_q      := (others => '0');
    ret.state_q    := CORE_S_RESET;
    ret.instr_kind := I_NOP;
    ret.sreg_q     := (others => '0');
    return ret;
  end function;

  function slv_is_01(vec : std_logic_vector) return boolean is
  begin
    for i in vec'range loop
      if vec(i) /= '0' and vec(i) /= '1' then
        return false;
      end if;
    end loop;
    return true;
  end function;

  function safe_to_natural(vec : std_logic_vector) return natural is
  begin
    if slv_is_01(vec) then
      return to_integer(unsigned(vec));
    end if;
    return 0;
  end function;
end package body;
