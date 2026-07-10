library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

use work.cpu_pkg.all;

entity cpu_core is
    port (
        clk             : in  std_logic;
        reset           : in  std_logic;
        instr_mem_addr  : out std_logic_vector(ADDR_WIDTH-1 downto 0);
        instr_mem_data  : in  std_logic_vector(INST_WIDTH-1 downto 0);
        data_mem_addr   : out std_logic_vector(ADDR_WIDTH-1 downto 0);
        data_mem_data   : inout std_logic_vector(DATA_WIDTH-1 downto 0);
        data_mem_we     : out std_logic;
        halt_o          : out std_logic
    );
end entity cpu_core;

architecture rtl of cpu_core is
    signal pc             : unsigned(ADDR_WIDTH-1 downto 0) := (others => '0');
    signal current_instr  : std_logic_vector(INST_WIDTH-1 downto 0);
    signal reg_addr_r     : std_logic_vector(1 downto 0);
    signal reg_data_r     : std_logic_vector(7 downto 0);
    signal alu_res        : std_logic_vector(7 downto 0);
    signal halt_internal  : std_logic := '0';
    signal rf_write_en    : std_logic := '0';
    
    -- Instruction Fields
    signal op_code        : opcode_t;
    signal rd_idx         : std_logic_vector(1 downto 0);
    signal rs_idx         : std_logic_vector(1 downto 0);
    signal imm_val        : std_logic_vector(7 downto 0);

begin
    -- Decode Logic (Combinational)
    op_code   <= current_instr(15 downto 12);
    rd_idx    <= current_instr(11 downto 10);
    rs_idx    <= current_instr(9 downto 8);
    imm_val   <= current_instr(7 downto 0);

    -- Control Signal: Register Write Enable
    process(op_code)
    begin
        case op_code is
            when OP_ADD | OP_SUB | OP_LOGIC_AND | OP_LOGIC_OR =>
                rf_write_en <= '1';
            when others =>
                rf_write_en <= '0';
        end case;
    end process;

    reg_addr_r <= rs_idx;

    -- Register File Instance
    RF: entity work.reg_file
        port map (
            clk => clk, reset => reset, write_en => rf_write_en,
            reg_addr_w => rd_idx, data_in => alu_res, 
            reg_addr_r => reg_addr_r, data_out => reg_data_r
        );

    -- ALU Instance
    ALU_UNIT: entity work.alu
        port map (
            opcode => op_code,
            operand_a => reg_data_r, operand_b => imm_val, 
            result_o => alu_res, zero_o => open
        );

    -- CPU State Update Process
    process(clk)
    begin
        if rising_edge(clk) then
            if reset = '1' then
                pc <= (others => '0');
                halt_internal <= '0';
            else
                case op_code is
                    when OP_HALT =>
                        halt_internal <= '1';
                    when OP_JUMP =>
                        pc <= unsigned(imm_val);
                    when others =>
                        if halt_internal = '0' then
                            pc <= pc + 1;
                        end if;
                end case;
            end if;
        end if;
    end process;

    -- Interface Assignments (No readback)
    instr_mem_addr <= std_logic_vector(pc);
    current_instr  <= instr_mem_data;
    halt_o         <= halt_internal;
    data_mem_we    <= '0'; 
    data_mem_addr  <= (others => '0');

end architecture rtl;