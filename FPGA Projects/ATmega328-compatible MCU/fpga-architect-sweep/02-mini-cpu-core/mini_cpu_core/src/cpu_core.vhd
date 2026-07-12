library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.cpu_pkg.all;

entity cpu_core is
  port (
    clk_i, rst_i : in std_logic;
    -- Memory interfaces
    p_addr_o     : out cpu_t;
    p_data_o     : out cpu_t;
    p_req_o      : out std_logic;
    p_ack_i      : in std_logic;
    p_rdata_i    : in cpu_t;
    
    d_addr_o     : out cpu_t;
    d_data_o     : out cpu_t;
    d_we_o       : out std_logic;
    d_req_o      : out std_logic;
    d_ack_i      : in std_logic;
    d_rdata_i    : in cpu_t
  );
end entity cpu_core;

architecture rtl of cpu_core is
  signal pc_reg      : cpu_t;
  signal instr_reg   : instr_t;
  signal alu_res     : cpu_t;
  signal zero_flag   : std_logic;
  signal we_reg      : std_logic;
  signal dest_reg    : integer range 0 to 7;
  signal src_reg     : integer range 0 to 7;
begin

  alu_inst : entity work.alu(rtl)
    port map (a_i => p_rdata_i, b_i => d_rdata_i, op_i => instr_reg.opcode, res_o => alu_res, zero_o => zero_flag);

  regfile_inst : entity work.regfile(rtl)
    port map (clk_i => clk_i, rst_i => rst_i, we_i => we_reg, addr_i => dest_reg, src_i => src_reg, data_i => alu_res, src_o => p_data_o);

  -- Control Logic
  process(clk_i)
  begin
    if rising_edge(clk_i) then
      if rst_i = '1' then
        pc_reg      <= (others => '0');
        we_reg      <= '0';
        instr_reg.opcode <= OP_ADD;
        instr_reg.dest   <= 0;
        instr_reg.src    <= 0;
        instr_reg.imm    <= (others => '0');
        instr_reg.addr   <= (others => '0');
      else
        -- Decode instruction from p_rdata_i
        -- Format: [7:4] opcode, [3:1] dest, [0] src
        case p_rdata_i(7 downto 4) is
          when "0000" => instr_reg.opcode <= OP_ADD;
          when "0001" => instr_reg.opcode <= OP_SUB;
          when "0010" => instr_reg.opcode <= OP_AND;
          when "0011" => instr_reg.opcode <= OP_OR;
          when "0100" => instr_reg.opcode <= OP_LDI;
          when others => instr_reg.opcode <= OP_ADD;
        end case;
        instr_reg.dest <= to_integer(unsigned(p_rdata_i(3 downto 1)));
        instr_reg.src  <= to_integer(unsigned(p_rdata_i(0 downto 0)));
        
        -- Execute / Control
        case instr_reg.opcode is
          when OP_ADD | OP_SUB | OP_AND | OP_OR | OP_LDI =>
            we_reg <= '1';
          when others =>
            we_reg <= '0';
        end case;
        
        -- Fetch next instruction
        p_addr_o <= pc_reg;
      end if;
    end if;
  end process;
  
  p_data_o <= alu_res;
  
end architecture rtl;
