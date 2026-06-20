library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

use work.cpu_pkg.all;

entity datapath is
  port (
    clk          : in  std_logic;
    reset        : in  std_logic;
    instr_data   : in  word_t;
    data_read    : in  byte_t;
    alu_op       : in  alu_op_t;
    pc_we        : in  std_logic;
    pc_sel_imm   : in  std_logic;
    ir_we        : in  std_logic;
    reg_we       : in  std_logic;
    reg_src_mem  : in  std_logic;
    reg_src_imm  : in  std_logic;
    flags_we     : in  std_logic;
    halted_set   : in  std_logic;
    opcode       : out opcode_t;
    instr_word   : out word_t;
    rd_idx       : out reg_idx_t;
    rs_idx       : out reg_idx_t;
    imm8         : out byte_t;
    zero_flag    : out std_logic;
    carry_flag   : out std_logic;
    halted       : out std_logic;
    pc_addr      : out byte_t;
    mem_addr     : out byte_t;
    mem_wdata    : out byte_t;
    debug_ir     : out word_t
  );
end entity;

architecture rtl of datapath is
  signal pc_reg         : byte_t := (others => '0');
  signal ir_reg         : word_t := (others => '0');
  signal zf_reg         : std_logic := '0';
  signal cf_reg         : std_logic := '0';
  signal halted_reg     : std_logic := '0';
  signal rf_data_a      : byte_t;
  signal rf_data_b      : byte_t;
  signal alu_result     : byte_t;
  signal alu_zero       : std_logic;
  signal alu_carry      : std_logic;
  signal reg_write_data : byte_t;
begin
  rf_inst: entity work.register_file
    port map (
      clk         => clk,
      reset       => reset,
      read_addr_a => ir_reg(11 downto 9),
      read_addr_b => ir_reg(8 downto 6),
      read_data_a => rf_data_a,
      read_data_b => rf_data_b,
      write_en    => reg_we,
      write_addr  => ir_reg(11 downto 9),
      write_data  => reg_write_data
    );

  alu_inst: entity work.alu
    port map (
      lhs        => rf_data_a,
      rhs        => rf_data_b,
      op         => alu_op,
      result     => alu_result,
      zero_flag  => alu_zero,
      carry_flag => alu_carry
    );

  reg_write_data <= data_read when reg_src_mem = '1' else
                    ir_reg(7 downto 0) when reg_src_imm = '1' else
                    alu_result;

  process(clk)
  begin
    if rising_edge(clk) then
      if reset = '1' then
        pc_reg     <= (others => '0');
        ir_reg     <= (others => '0');
        zf_reg     <= '0';
        cf_reg     <= '0';
        halted_reg <= '0';
      else
        if ir_we = '1' then
          ir_reg <= instr_data;
        end if;

        if pc_we = '1' then
          if pc_sel_imm = '1' then
            pc_reg <= ir_reg(7 downto 0);
          else
            pc_reg <= std_logic_vector(unsigned(pc_reg) + 1);
          end if;
        end if;

        if flags_we = '1' then
          zf_reg <= alu_zero;
          cf_reg <= alu_carry;
        end if;

        if halted_set = '1' then
          halted_reg <= '1';
        end if;
      end if;
    end if;
  end process;

  opcode     <= ir_reg(15 downto 12);
  instr_word <= ir_reg;
  rd_idx     <= ir_reg(11 downto 9);
  rs_idx     <= ir_reg(8 downto 6);
  imm8       <= ir_reg(7 downto 0);
  zero_flag  <= zf_reg;
  carry_flag <= cf_reg;
  halted     <= halted_reg;
  pc_addr    <= pc_reg;
  mem_addr   <= ir_reg(7 downto 0);
  mem_wdata  <= rf_data_a;
  debug_ir   <= ir_reg;
end architecture;
