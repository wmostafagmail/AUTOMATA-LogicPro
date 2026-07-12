library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.cpu_pkg.all;

entity mini_cpu_core is
    port (
        clk       : in  std_logic;
        reset     : in  std_logic;
        -- Instruction Memory Interface
        instr_addr : out std_logic_vector(7 downto 0);
        instr_data : in  std_logic_vector(15 downto 0);
        -- Data Memory Interface
        data_addr  : out std_logic_vector(7 downto 0);
        data_din   : in  std_logic_vector(7 downto 0);
        data_dout  : out std_logic_vector(7 downto 0);
        data_we    : out std_logic
    );
end entity mini_cpu_core;

architecture rtl of mini_cpu_core is
    -- Internal State
    signal pc_reg       : unsigned(7 downto 0) := (others => '0');
    type reg_file_t is array (0 to REG_COUNT-1) of unsigned(WORD_WIDTH-1 downto 0);
    signal registers    : reg_file_t := (others => (others => '0'));

    -- Internal mirrors for output ports (avoiding readback)
    signal data_addr_int : unsigned(7 downto 0) := (others => '0');
    signal data_dout_int : unsigned(WORD_WIDTH-1 downto 0) := (others => '0');
    signal data_we_int   : std_logic := '0';
    signal instr_addr_int : unsigned(7 downto 0) := (others => '0');

begin
    -- Port Assignments from internal mirrors
    instr_addr <= std_logic_vector(instr_addr_int);
    data_addr  <= std_logic_vector(data_addr_int);
    data_dout  <= std_logic_vector(data_dout_int);
    data_we    <= data_we_int;

    process(clk)
        variable instr       : std_logic_vector(15 downto 0);
        variable op          : opcode_t;
        variable rd          : integer;
        variable rs          : integer;
        variable addr_imm    : unsigned(7 downto 0);
        variable alu_res     : unsigned(WORD_WIDTH-1 downto 0);
        variable current_pc  : unsigned(7 downto 0);
    begin
        if rising_edge(clk) then
            if reset = '1' then
                pc_reg <= (others => '0');
                registers <= (others => (others => '0'));
                data_we_int <= '0';
                instr_addr_int <= (others => '0');
                data_addr_int <= (others => '0');
                data_dout_int <= (others => '0');
            else
                -- Default values for combinational-like logic inside synchronous process
                data_we_int   <= '0';
                instr_addr_int <= pc_reg;
                data_addr_int  <= (others => '0');
                data_dout_int  <= (others => '0');
                current_pc    := pc_reg;

                -- Decode Instruction
                instr := instr_data;
                op    := instr(15 downto 12);
                rd    := to_integer(unsigned(instr(11 downto 8)));
                rs    := to_integer(unsigned(instr(7 downto 4)));
                addr_imm := unsigned(instr(7 downto 0));

                -- Execution Logic
                case op is
                    when OP_NOP =>
                        current_pc := current_pc + 1;

                    when OP_LOAD =>
                        if rd < REG_COUNT then
                            registers(rd) <= unsigned(data_din);
                        end if;
                        data_addr_int  <= addr_imm;
                        current_pc     := current_pc + 1;

                    when OP_STORE =>
                        if rs < REG_COUNT then
                            data_dout_int <= registers(rs);
                            data_addr_int  <= addr_imm;
                            data_we_int    <= '1';
                        end if;
                        current_pc := current_pc + 1;

                    when OP_ADD =>
                        if rd < REG_COUNT and rs < REG_COUNT then
                            alu_res := registers(rd) + registers(rs);
                            registers(rd) <= alu_res;
                        end if;
                        current_pc := current_pc + 1;

                    when OP_SUB =>
                        if rd < REG_COUNT and rs < REG_COUNT then
                            alu_res := registers(rd) - registers(rs);
                            registers(rd) <= alu_res;
                        end if;
                        current_pc := current_pc + 1;

                    when OP_AND =>
                        if rd < REG_COUNT and rs < REG_COUNT then
                            alu_res := registers(rd) and registers(rs);
                            registers(rd) <= alu_res;
                        end if;
                        current_pc := current_pc + 1;

                    when OP_OR =>
                        if rd < REG_COUNT and rs < REG_COUNT then
                            alu_res := registers(rd) or registers(rs);
                            registers(rd) <= alu_res;
                        end if;
                        current_pc := current_pc + 1;

                    when OP_JUMP =>
                        current_pc := addr_imm;

                    when OP_BZ =>
                        if rs < REG_COUNT and registers(rs) = (others => '0') then
                            -- Offset is signed for jumps, treat as unsigned here for simplicity in compact mode
                            current_pc := current_pc + addr_imm;
                        else
                            current_pc := current_pc + 1;
                        end if;

                    when others =>
                        current_pc := current_pc + 1;
                end case;

                pc_reg <= current_pc;
            end if;
        end if;
    end process;

end architecture rtl;
