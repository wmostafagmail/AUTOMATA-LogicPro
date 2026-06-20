library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

use work.cpu_pkg.all;

entity cpu_top is
  generic (
    CLOCK_FREQ_HZ : positive := 50000000;
    BAUD_RATE     : positive := 115200
  );
  port (
    clk         : in  std_logic;
    reset       : in  std_logic;
    led_out     : out byte_t;
    uart_tx     : out std_logic;
    halted      : out std_logic;
    debug_pc    : out byte_t;
    debug_ir    : out word_t;
    debug_state : out cpu_state_t;
    debug_zero  : out std_logic
  );
end entity;

architecture rtl of cpu_top is
  signal rom_instr_s    : word_t;
  signal instr_word_s   : word_t;
  signal opcode_s       : opcode_t;
  signal pc_addr_s      : byte_t;
  signal mem_addr_s     : byte_t;
  signal mem_wdata_s    : byte_t;
  signal mem_rdata_s    : byte_t;
  signal ram_rdata_s    : byte_t;
  signal mmio_rdata_s   : byte_t;
  signal rd_idx_s       : reg_idx_t;
  signal rs_idx_s       : reg_idx_t;
  signal imm8_s         : byte_t;
  signal zero_flag_s    : std_logic;
  signal carry_flag_s   : std_logic;
  signal halted_s       : std_logic;
  signal pc_we_s        : std_logic;
  signal pc_sel_imm_s   : std_logic;
  signal ir_we_s        : std_logic;
  signal reg_we_s       : std_logic;
  signal reg_src_mem_s  : std_logic;
  signal reg_src_imm_s  : std_logic;
  signal flags_we_s     : std_logic;
  signal mem_we_s       : std_logic;
  signal halted_set_s   : std_logic;
  signal alu_op_s       : alu_op_t;
  signal state_s        : cpu_state_t;
  signal ram_write_en_s : std_logic;
  signal mmio_write_en_s: std_logic;
  signal uart_busy_s    : std_logic;
  signal uart_tx_data_s : byte_t;
  signal uart_tx_wr_s   : std_logic;
begin
  ctrl_inst: entity work.control_unit
    port map (
      clk         => clk,
      reset       => reset,
      instr_word  => instr_word_s,
      opcode      => opcode_s,
      zero_flag   => zero_flag_s,
      state_dbg   => state_s,
      alu_op      => alu_op_s,
      pc_we       => pc_we_s,
      pc_sel_imm  => pc_sel_imm_s,
      ir_we       => ir_we_s,
      reg_we      => reg_we_s,
      reg_src_mem => reg_src_mem_s,
      reg_src_imm => reg_src_imm_s,
      flags_we    => flags_we_s,
      mem_we      => mem_we_s,
      halted_set  => halted_set_s
    );

  datapath_inst: entity work.datapath
    port map (
      clk         => clk,
      reset       => reset,
      instr_data  => rom_instr_s,
      data_read   => mem_rdata_s,
      alu_op      => alu_op_s,
      pc_we       => pc_we_s,
      pc_sel_imm  => pc_sel_imm_s,
      ir_we       => ir_we_s,
      reg_we      => reg_we_s,
      reg_src_mem => reg_src_mem_s,
      reg_src_imm => reg_src_imm_s,
      flags_we    => flags_we_s,
      halted_set  => halted_set_s,
      opcode      => opcode_s,
      instr_word  => instr_word_s,
      rd_idx      => rd_idx_s,
      rs_idx      => rs_idx_s,
      imm8        => imm8_s,
      zero_flag   => zero_flag_s,
      carry_flag  => carry_flag_s,
      halted      => halted_s,
      pc_addr     => pc_addr_s,
      mem_addr    => mem_addr_s,
      mem_wdata   => mem_wdata_s,
      debug_ir    => debug_ir
    );

  rom_inst: entity work.prog_rom
    port map (
      addr      => pc_addr_s,
      instr_out => rom_instr_s
    );

  ram_inst: entity work.data_ram
    port map (
      clk        => clk,
      write_en   => ram_write_en_s,
      addr       => mem_addr_s,
      write_data => mem_wdata_s,
      read_data  => ram_rdata_s
    );

  mmio_inst: entity work.mmio
    port map (
      clk           => clk,
      reset         => reset,
      addr          => mem_addr_s,
      write_en      => mmio_write_en_s,
      write_data    => mem_wdata_s,
      uart_busy     => uart_busy_s,
      read_data     => mmio_rdata_s,
      led_out       => led_out,
      uart_tx_data  => uart_tx_data_s,
      uart_tx_write => uart_tx_wr_s
    );

  uart_inst: entity work.uart_tx
    generic map (
      CLOCK_FREQ_HZ => CLOCK_FREQ_HZ,
      BAUD_RATE     => BAUD_RATE
    )
    port map (
      clk     => clk,
      reset   => reset,
      start   => uart_tx_wr_s,
      data_in => uart_tx_data_s,
      tx      => uart_tx,
      busy    => uart_busy_s
    );

  ram_write_en_s  <= mem_we_s when unsigned(mem_addr_s) < unsigned(MMIO_BASE_ADDR) else '0';
  mmio_write_en_s <= mem_we_s when unsigned(mem_addr_s) >= unsigned(MMIO_BASE_ADDR) else '0';
  mem_rdata_s     <= mmio_rdata_s when unsigned(mem_addr_s) >= unsigned(MMIO_BASE_ADDR) else ram_rdata_s;

  halted      <= halted_s;
  debug_pc    <= pc_addr_s;
  debug_state <= state_s;
  debug_zero  <= zero_flag_s;
end architecture;
