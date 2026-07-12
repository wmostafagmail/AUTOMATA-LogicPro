library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.cpu_pkg.all;

entity cpu_core is
  port (
    clk_i, rst_i : in std_logic;
    p_addr_o     : out cpu_t;
    p_data_o     : out cpu_t;
    p_req_o      : out std_logic;
    p_ack_i      : in std_logic;
    p_rdata_i    : in cpu_t
  );
end entity cpu_core;

architecture rtl of cpu_core is
  signal pc_reg   : cpu_t;
  signal instr_reg: instr_t;
  signal alu_res  : cpu_t;
begin

  alu_inst : entity work.alu(rtl)
    port map (a_i => p_rdata_i, b_i => (others => '0'), op_i => instr_reg.opcode, res_o => alu_res, zero_o => open);

  process(clk_i)
  begin
    if rising_edge(clk_i) then
      if rst_i = '1' then
        pc_reg <= (others => '0');
        instr_reg.opcode <= OP_ADD;
        instr_reg.dest   <= 0;
        instr_reg.src    <= 0;
        instr_reg.imm    <= (others => '0');
        instr_reg.addr   <= (others => '0');
      else
        case p_rdata_i(7 downto 4) is
          when "0000" => instr_reg.opcode <= OP_ADD;
          when "0001" => instr_reg.opcode <= OP_SUB;
          when "0010" => instr_reg.opcode <= OP_AND;
          when "0011" => instr_reg.opcode <= OP_OR;
          when others => instr_reg.opcode <= OP_ADD;
        end case;
        pc_reg <= pc_reg + 1;
      end if;
    end if;
  end process;

  p_data_o <= alu_res;
  p_addr_o <= pc_reg;
  p_req_o  <= '0';

end architecture rtl;
