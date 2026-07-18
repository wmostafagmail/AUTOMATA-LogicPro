library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.cpu_pkg.all;

entity cpu_top is
  port (
    clk    : in  std_logic;
    rst    : in  std_logic;
    halt_o: out std_logic
   );
end entity;

architecture rtl of cpu_top is
  signal pc_reg    : addr_t := (others => '0');
  signal pc_next   : addr_t := (others => '0');
  signal pc_inc    : std_logic;
  signal pc_jmp    : std_logic;
  signal pc_jmp_addr : addr_t := (others => '0');

  signal instr_reg : instr_t := (opcode => (others=>'0'));

  signal alu_op    : data_t;
  signal alu_a     : data_t;
  signal alu_b     : data_t;
  signal alu_res   : data_t;
  signal alu_zero : std_logic;

  signal reg_we    : std_logic;
  signal reg_wdata: data_t;
  signal reg_rdata: data_t;

  signal rom_instr : instr_t;
begin
  process(clk)
  begin
    if rising_edge(clk) then
      if rst = '1' then
        pc_reg <= (others => '0');
      elsif pc_inc = '1' then
        pc_reg <= pc_reg + to_unsigned(1, ADDR_WIDTH);
      elsif pc_jmp = '1' then
        pc_reg <= pc_jmp_addr;
      end if;
    end if;
  end process;
  pc_next <= pc_reg;

  rom_inst : entity work.rom
    port map (clk => clk, addr => pc_next, instr => rom_instr);

  ctrl_inst : entity work.control_fsm
    port map (clk => clk, rst => rst, instr => rom_instr,
              pc_inc => pc_inc, pc_jmp => pc_jmp, pc_jmp_addr => pc_jmp_addr,
              reg_we => reg_we, alu_op => alu_op, halt => halt_o);

  regfile_inst : entity work.regfile
    port map (clk => clk, rst => rst, we => reg_we,
              addr => rom_instr.rd, wdata => alu_res, rdata => reg_rdata);

  alu_inst : entity work.alu
    port map (clk => clk, rst => rst, op => alu_op,
              a => reg_rdata, b => rom_instr.rs2, result => alu_res, zero => alu_zero);
end architecture;
