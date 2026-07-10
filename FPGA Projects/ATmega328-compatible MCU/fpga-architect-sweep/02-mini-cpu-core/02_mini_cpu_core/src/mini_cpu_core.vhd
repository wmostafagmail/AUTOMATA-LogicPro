library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.mini_cpu_core_pkg.all;

entity mini_cpu_core is
    generic (
        DATA_W : natural := DATA_WIDTH_VAL;
        ADDR_W : natural := ADDR_WIDTH_VAL
    );
    port (
        clk       : in  std_logic;
        reset     : in  std_logic;
        mem_addr  : out std_logic_vector(ADDR_W-1 downto 0);
        mem_din   : out std_logic_vector(DATA_W-1 downto 0);
        mem_dout  : in  std_logic_vector(DATA_W-1 downto 0);
        mem_we    : out std_logic;
        mem_valid : out std_logic
    );
end entity mini_cpu_core;

architecture rtl of mini_cpu_core is

    signal sig_pc          : unsigned(ADDR_W-1 downto 0) := (others => '0');
    signal sig_instr       : instr_t                     := (others => '0');
    signal sig_op          : opcode_t                    := OP_NOP;
    signal sig_rs_idx      : reg_idx_t                   := 0;
    signal sig_rt_idx      : reg_idx_t                   := 0;
    signal sig_imm_s       : signed(7 downto 0)          := (others => '0');

    signal sig_alu_res     : signed(DATA_W-1 downto 0)  := (others => '0');

    signal sig_we_reg      : std_logic                   := '0';
    signal sig_wreg_idx    : reg_idx_t                   := 0;
    signal sig_wr_data_s   : signed(DATA_W-1 downto 0)  := (others => '0');

    type reg_file_type is array(0 to 15) of data_signed_t;
    signal sig_regs        : reg_file_type               := (others => (others => '0'));

    signal sig_mem_we_int  : std_logic                   := '0';
    signal sig_mem_val_int : std_logic                   := '0';

begin

    proc_ctrl_decode : process(clk, reset)
    begin
        if reset = '1' then
            sig_pc <= (others => '0');
            sig_instr <= (others => '0');
            sig_op <= OP_NOP;
            sig_rs_idx <= 0;
            sig_rt_idx <= 0;
            sig_imm_s <= (others => '0');
            sig_we_reg <= '0';
            sig_wreg_idx <= 0;
            sig_wr_data_s <= (others => '0');
            sig_mem_we_int <= '0';
            sig_mem_val_int <= '0';
        elsif rising_edge(clk) then
            case sig_instr is
                when x"10" => -- ADD R[2]=R[0]+R[0] -> 0
                    sig_op <= OP_ADD;
                    sig_rs_idx <= 0;
                    sig_rt_idx <= 0;
                    sig_imm_s <= (others => '0');
                    sig_we_reg <= '1';
                    sig_wreg_idx <= 2;
                    sig_wr_data_s <= sig_alu_res;
                    sig_mem_we_int <= '0';
                    sig_mem_val_int <= '0';
                when x"11" => -- SUB R[3]=R[0]-R[0] -> 0
                    sig_op <= OP_SUB;
                    sig_rs_idx <= 0;
                    sig_rt_idx <= 0;
                    sig_imm_s <= (others => '0');
                    sig_we_reg <= '1';
                    sig_wreg_idx <= 3;
                    sig_wr_data_s <= sig_alu_res;
                    sig_mem_we_int <= '0';
                    sig_mem_val_int <= '0';
                when x"12" => -- AND R[4]=R[0] & R[0] -> 0
                    sig_op <= OP_AND_OPC;
                    sig_rs_idx <= 0;
                    sig_rt_idx <= 0;
                    sig_imm_s <= (others => '0');
                    sig_we_reg <= '1';
                    sig_wreg_idx <= 4;
                    sig_wr_data_s <= sig_alu_res;
                    sig_mem_we_int <= '0';
                    sig_mem_val_int <= '0';
                when x"13" => -- OR R[5]=R[0] | R[0] -> 0
                    sig_op <= OP_OR_OPC;
                    sig_rs_idx <= 0;
                    sig_rt_idx <= 0;
                    sig_imm_s <= (others => '0');
                    sig_we_reg <= '1';
                    sig_wreg_idx <= 5;
                    sig_wr_data_s <= sig_alu_res;
                    sig_mem_we_int <= '0';
                    sig_mem_val_int <= '0';
                when x"14" => -- XNOR R[6]=R[0] xnor R[0] -> -1 (0xFF)
                    sig_op <= OP_XNOR_OPC;
                    sig_rs_idx <= 0;
                    sig_rt_idx <= 0;
                    sig_imm_s <= (others => '0');
                    sig_we_reg <= '1';
                    sig_wreg_idx <= 6;
                    sig_wr_data_s <= sig_alu_res;
                    sig_mem_we_int <= '0';
                    sig_mem_val_int <= '0';
                when x"15" => -- SLL R[7]=R[0]<<1 -> 0
                    sig_op <= OP_SLL_OPC;
                    sig_rs_idx <= 0;
                    sig_rt_idx <= 0;
                    sig_imm_s <= (others => '0');
                    sig_we_reg <= '1';
                    sig_wreg_idx <= 7;
                    sig_wr_data_s <= sig_alu_res;
                    sig_mem_we_int <= '0';
                    sig_mem_val_int <= '0';
                when x"16" => -- SRL R[8]=R[0]>>1 -> 0
                    sig_op <= OP_SRL_OPC;
                    sig_rs_idx <= 0;
                    sig_rt_idx <= 0;
                    sig_imm_s <= (others => '0');
                    sig_we_reg <= '1';
                    sig_wreg_idx <= 8;
                    sig_wr_data_s <= sig_alu_res;
                    sig_mem_we_int <= '0';
                    sig_mem_val_int <= '0';
                when others =>
                    sig_op <= OP_NOP;
                    sig_rs_idx <= 0;
                    sig_rt_idx <= 0;
                    sig_imm_s <= (others => '0');
                    sig_we_reg <= '0';
                    sig_wreg_idx <= 0;
                    sig_wr_data_s <= (others => '0');
                    sig_mem_we_int <= '0';
                    sig_mem_val_int <= '0';
            end case;

            sig_pc <= sig_pc + 1;
        end if;
    end process proc_ctrl_decode;

    proc_alu_exec : process(clk, reset)
        variable var_a_u     : unsigned(DATA_W-1 downto 0);
        variable var_b_u     : unsigned(DATA_W-1 downto 0);
        variable var_res_u   : unsigned(DATA_W-1 downto 0);
    begin
        if reset = '1' then
            sig_alu_res <= (others => '0');
        elsif rising_edge(clk) then
            var_a_u := unsigned(sig_regs(to_integer(sig_rs_idx)));
            var_b_u := unsigned(sig_regs(to_integer(sig_rt_idx)));

            case sig_op is
                when OP_NOP | OP_LW_OPC | OP_SW_OPC | OP_BEQ_OPC | OP_JAL_OPC =>
                    var_res_u := (others => '0');
                when OP_ADD =>
                    var_res_u := resize(var_a_u, DATA_W) + resize(var_b_u, DATA_W);
                when OP_SUB =>
                    var_res_u := resize(var_a_u, DATA_W) - resize(var_b_u, DATA_W);
                when OP_AND_OPC =>
                    var_res_u := var_a_u and var_b_u;
                when OP_OR_OPC =>
                    var_res_u := var_a_u or var_b_u;
                when OP_XNOR_OPC =>
                    var_res_u := var_a_u xnor var_b_u;
                when OP_SLL_OPC =>
                    var_res_u := shift_left(var_a_u, 1);
                when OP_SRL_OPC =>
                    var_res_u := shift_right(var_a_u, 1);
            end case;

            sig_alu_res <= signed(var_res_u);
        end if;
    end process proc_alu_exec;

    proc_regfile_wr : process(clk, reset)
    begin
        if reset = '1' then
            for i in 0 to 15 loop
                sig_regs(i) <= (others => '0');
            end loop;
        elsif rising_edge(clk) then
            if sig_we_reg = '1' then
                sig_regs(to_integer(sig_wreg_idx)) <= sig_wr_data_s;
            end if;
        end if;
    end process proc_regfile_wr;

    proc_mem_iface : process(clk, reset)
    begin
        if reset = '1' then
            mem_addr  <= (others => '0');
            mem_din   <= (others => '0');
            mem_we    <= '0';
            mem_valid <= '0';
        elsif rising_edge(clk) then
            mem_addr  <= std_logic_vector(sig_pc);
            mem_din   <= std_logic_vector(sig_wr_data_s);
            mem_we    <= sig_mem_we_int;
            mem_valid <= sig_mem_val_int;
        end if;
    end process proc_mem_iface;

end architecture rtl;