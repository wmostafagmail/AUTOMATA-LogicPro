library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

use work.avr_pkg.all;

entity avr_core is
  port (
    clk          : in  std_logic;
    reset        : in  std_logic;
    pmem_addr_o  : out addr16_t;
    pmem_req_o   : out std_logic;
    pmem_rdata_i : in  word_t;
    pmem_valid_i : in  std_logic;
    d_addr_o     : out addr16_t;
    d_wdata_o    : out byte_t;
    d_rdata_i    : in  byte_t;
    d_we_o       : out std_logic;
    d_re_o       : out std_logic;
    d_valid_i    : in  std_logic;
    irq_lines_i  : in  std_logic_vector(IRQ_COUNT - 1 downto 0);
    dbg_o        : out avr_debug_t
  );
end entity;

architecture rtl of avr_core is
  signal dec_s        : avr_decode_t := avr_decode_init;
  signal ctrl_s       : avr_ctrl_t   := avr_ctrl_init;
  signal sts_s        : avr_status_t := avr_status_init;
  signal irq_vector_s : addr16_t     := (others => '0');
  signal state_dbg_s  : core_state_t := CORE_S_RESET;

  signal ir0_q        : word_t   := (others => '0');
  signal ir1_q        : word_t   := (others => '0');
  signal pc_q         : addr16_t := (others => '0');
  signal sp_q         : addr16_t := AVR_RESET_SP;
  signal data_latch_q : byte_t   := (others => '0');
  signal sreg_q       : sreg_t   := (others => '0');
  signal rel_target_s : addr16_t := (others => '0');

  signal pmem_addr_s  : addr16_t := (others => '0');
  signal rf_ra_data_s : byte_t   := (others => '0');
  signal rf_rb_data_s : byte_t   := (others => '0');
  signal rf_rc_data_s : byte_t   := (others => '0');
  signal rf_wdata_s   : byte_t   := (others => '0');
  signal rf_wpair_lo_s: byte_t   := (others => '0');
  signal rf_wpair_hi_s: byte_t   := (others => '0');
  signal alu_lhs_s    : byte_t   := (others => '0');
  signal alu_rhs_s    : byte_t   := (others => '0');
  signal alu_res_lo_s : byte_t   := (others => '0');
  signal alu_res_hi_s : byte_t   := (others => '0');
  signal alu_flags_s  : sreg_t   := (others => '0');
  signal ptr_addr_s   : addr16_t := (others => '0');
  signal d_addr_s     : addr16_t := (others => '0');
  signal d_wdata_s    : byte_t   := (others => '0');
  signal t_value_s    : std_logic := '0';
begin
  decoder_inst: entity work.avr_decoder
    port map (
      instr_word0_i       => ir0_q,
      instr_word1_i       => ir1_q,
      instr_word1_valid_i => '1',
      dec_o               => dec_s
    );

  ctrl_inst: entity work.avr_control_fsm
    port map (
      clk          => clk,
      reset        => reset,
      dec_i        => dec_s,
      sts_i        => sts_s,
      irq_vector_i => irq_vector_s,
      state_o      => state_dbg_s,
      ctrl_o       => ctrl_s
    );

  regfile_inst: entity work.avr_regfile
    port map (
      clk           => clk,
      reset         => reset,
      ra_idx_i      => dec_s.rd_idx,
      rb_idx_i      => dec_s.rr_idx,
      rc_idx_i      => "11110",
      ra_data_o     => rf_ra_data_s,
      rb_data_o     => rf_rb_data_s,
      rc_data_o     => rf_rc_data_s,
      we_i          => ctrl_s.rf_we,
      wd_idx_i      => dec_s.rd_idx,
      wd_data_i     => rf_wdata_s,
      we_pair_i     => ctrl_s.rf_wpair_we,
      wd_pair_idx_i => dec_s.rd_idx,
      wd_pair_lo_i  => rf_wpair_lo_s,
      wd_pair_hi_i  => rf_wpair_hi_s
    );

  alu_inst: entity work.avr_alu
    port map (
      lhs_i        => alu_lhs_s,
      rhs_i        => alu_rhs_s,
      carry_in_i   => sreg_q(0),
      bit_in_i     => sreg_q(6),
      op_i         => ctrl_s.alu_op,
      result_lo_o  => alu_res_lo_s,
      result_hi_o  => alu_res_hi_s,
      flags_next_o => alu_flags_s
    );

  sreg_inst: entity work.avr_sreg
    port map (
      clk           => clk,
      reset         => reset,
      flags_we_i    => ctrl_s.sreg_we and ctrl_s.sreg_src_alu,
      flags_next_i  => alu_flags_s,
      bit_set_we_i  => ctrl_s.sreg_bit_set_we,
      bit_clr_we_i  => ctrl_s.sreg_bit_clr_we,
      bit_idx_i     => dec_s.bit_index,
      t_load_we_i   => ctrl_s.sreg_t_load,
      t_value_i     => t_value_s,
      i_set_i       => ctrl_s.sreg_i_set,
      i_clr_i       => ctrl_s.sreg_i_clr,
      sreg_q_o      => sreg_q
    );

  pc_stack_inst: entity work.avr_pc_stack
    port map (
      clk             => clk,
      reset           => reset,
      pc_op_i         => ctrl_s.pc_op,
      sp_op_i         => ctrl_s.sp_op,
      abs_target_i    => dec_s.imm16,
      rel_target_i    => rel_target_s,
      irq_target_i    => irq_vector_s,
      sp_write_data_i => dec_s.imm16,
      pc_q_o          => pc_q,
      sp_q_o          => sp_q
    );

  process(clk)
  begin
    if rising_edge(clk) then
      if reset = '1' then
        ir0_q        <= (others => '0');
        ir1_q        <= (others => '0');
        data_latch_q <= (others => '0');
      else
        if ctrl_s.ir0_we = '1' then
          ir0_q <= pmem_rdata_i;
        end if;

        if ctrl_s.ir1_we = '1' then
          ir1_q <= pmem_rdata_i;
        end if;

        if ctrl_s.data_latch_we = '1' then
          data_latch_q <= d_rdata_i;
        end if;
      end if;
    end if;
  end process;

  process(ctrl_s, pc_q, state_dbg_s)
  begin
    pmem_addr_s <= pc_q;
    if state_dbg_s = CORE_S_FETCH2_32 then
      pmem_addr_s <= std_logic_vector(unsigned(pc_q) + 1);
    end if;
  end process;

  process(dec_s, ctrl_s, rf_ra_data_s, rf_rb_data_s, data_latch_q, alu_res_lo_s, sreg_q)
    variable alu_rhs_v  : byte_t;
    variable rf_wdata_v : byte_t;
  begin
    alu_rhs_v  := rf_rb_data_s;
    rf_wdata_v := (others => '0');

    case ctrl_s.alu_rhs_sel is
      when ALU_RHS_IMM8 =>
        alu_rhs_v := dec_s.imm8;
      when ALU_RHS_ONE =>
        alu_rhs_v := x"01";
      when ALU_RHS_ZERO =>
        alu_rhs_v := (others => '0');
      when others =>
        null;
    end case;

    case ctrl_s.rf_wsel is
      when RF_W_ALU =>
        rf_wdata_v := alu_res_lo_s;
      when RF_W_MEM | RF_W_POP =>
        rf_wdata_v := data_latch_q;
      when RF_W_IMM =>
        rf_wdata_v := dec_s.imm8;
      when RF_W_BIT_BLEND =>
        rf_wdata_v := rf_ra_data_s;
        rf_wdata_v(to_integer(unsigned(dec_s.bit_index))) := sreg_q(6);
      when others =>
        null;
    end case;

    alu_lhs_s  <= rf_ra_data_s;
    alu_rhs_s  <= alu_rhs_v;
    rf_wdata_s <= rf_wdata_v;
  end process;

  rf_wpair_lo_s <= alu_res_lo_s;
  rf_wpair_hi_s <= alu_res_hi_s;

  ptr_addr_s <= rf_rc_data_s & rf_ra_data_s when dec_s.ptr_sel = PTR_Z else
                rf_rc_data_s & rf_ra_data_s;
  rel_target_s <= std_logic_vector(signed(pc_q) + signed(dec_s.imm16));
  t_value_s <= rf_ra_data_s(safe_to_natural(dec_s.bit_index));

  sts_s.sreg_q              <= sreg_q;
  sts_s.rd_eq_rr            <= '1' when rf_ra_data_s = rf_rb_data_s else '0';
  sts_s.reg_bit_value       <= rf_rb_data_s(safe_to_natural(dec_s.bit_index));
  sts_s.io_bit_value        <= '0';
  sts_s.pmem_valid          <= pmem_valid_i;
  sts_s.d_valid             <= d_valid_i;
  sts_s.irq_pending         <= '1' when unsigned(irq_lines_i) /= 0 else '0';
  sts_s.next_instr_is_32bit <= '0';

  irq_vector_s <= (others => '0');

  pmem_addr_o <= pmem_addr_s;
  pmem_req_o  <= ctrl_s.pmem_req;

  d_addr_s <= dec_s.imm16 when ctrl_s.d_addr_sel = DA_ABS16 else
              std_logic_vector(to_unsigned(16#20#, 16) + resize(unsigned(dec_s.io_addr), 16))
              when ctrl_s.d_addr_sel = DA_IO else
              ptr_addr_s when ctrl_s.d_addr_sel = DA_PTR else
              sp_q when ctrl_s.d_addr_sel = DA_SP else
              (others => '0');
  d_wdata_s <= rf_rb_data_s when ctrl_s.d_wdata_sel = DW_RF else
               data_latch_q when ctrl_s.d_wdata_sel = DW_BITMOD else
               (others => '0');

  d_addr_o  <= d_addr_s;
  d_wdata_o <= d_wdata_s;
  d_we_o    <= ctrl_s.d_we;
  d_re_o    <= ctrl_s.d_re;

  dbg_o.pc_q       <= pc_q;
  dbg_o.sp_q       <= sp_q;
  dbg_o.ir0_q      <= ir0_q;
  dbg_o.ir1_q      <= ir1_q;
  dbg_o.state_q    <= state_dbg_s;
  dbg_o.instr_kind <= dec_s.instr_kind;
  dbg_o.sreg_q     <= sreg_q;
end architecture;
