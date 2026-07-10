library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.mini_cpu_pkg.all;

entity control_fsm is
  port (
    clk           : in  std_logic;
    reset_n       : in  std_logic;
    current_state : in  cpu_state_t;
    instruction   : in  instruction_t;
    zero_flag     : in  std_logic;

    alu_op_sel      : out integer range 0 to 7;
    write_reg_en    : out std_logic;
    write_mem_en    : out std_logic;
    read_mem_en     : out std_logic;
    next_pc_valid   : out std_logic;
    pc_mux_select   : out std_logic;
    next_state      : out cpu_state_t
  );
end entity control_fsm;

architecture rtl of control_fsm is

  function opcode_to_int(op : opcode_t) return integer is
  begin
    case op is
      when OP_NOP     => return 0;
      when OP_LOAD    => return 1;
      when OP_STORE   => return 2;
      when OP_ADD     => return 3;
      when OP_SUB     => return 4;
      when OP_AND_OP  => return 5;
      when OP_OR_OP   => return 6;
      when OP_XOR_OP  => return 7;
      when OP_JMP     => return 8;
      when OP_BEQ    => return 9;
      when others     => return 0;
    end case;
  end function opcode_to_int;

begin

  process(clk, reset_n)
    variable current_opcode : opcode_t;
  begin
    if reset_n = '0' then
      alu_op_sel      <= to_integer(opcode_to_int(OP_ADD));
      write_reg_en    <= '0';
      write_mem_en    <= '0';
      read_mem_en     <= '0';
      next_pc_valid   <= '0';
      pc_mux_select   <= '0';
      next_state      <= STATE_DECODE;

    elsif rising_edge(clk) then
      case current_state is
        when STATE_FETCH =>
          alu_op_sel      <= to_integer(opcode_to_int(OP_ADD));
          write_reg_en    <= '0';
          write_mem_en    <= '0';
          read_mem_en     <= '1';
          next_pc_valid   <= '1';
          pc_mux_select   <= '0';
          next_state      <= STATE_DECODE;

        when STATE_DECODE =>
          current_opcode := instruction.opcode;

          case current_opcode is
            when OP_NOP    =>
              alu_op_sel      <= to_integer(opcode_to_int(OP_ADD));
              write_reg_en    <= '0';
              write_mem_en    <= '0';
              read_mem_en     <= '0';
              next_pc_valid   <= '1';
              pc_mux_select   <= '0';
              next_state      <= STATE_EXECUTE;

            when OP_LOAD   =>
              alu_op_sel      <= to_integer(opcode_to_int(OP_ADD));
              write_reg_en    <= '1';
              write_mem_en    <= '0';
              read_mem_en     <= '1';
              next_pc_valid   <= '1';
              pc_mux_select   <= '0';
              next_state      <= STATE_EXECUTE;

            when OP_STORE  =>
              alu_op_sel      <= to_integer(opcode_to_int(OP_ADD));
              write_reg_en    <= '0';
              write_mem_en    <= '1';
              read_mem_en     <= '0';
              next_pc_valid   <= '1';
              pc_mux_select   <= '0';
              next_state      <= STATE_EXECUTE;

            when OP_ADD    =>
              alu_op_sel      <= to_integer(opcode_to_int(OP_ADD));
              write_reg_en    <= '1';
              write_mem_en    <= '0';
              read_mem_en     <= '0';
              next_pc_valid   <= '1';
              pc_mux_select   <= '0';
              next_state      <= STATE_EXECUTE;

            when OP_SUB    =>
              alu_op_sel      <= to_integer(opcode_to_int(OP_SUB));
              write_reg_en    <= '1';
              write_mem_en    <= '0';
              read_mem_en     <= '0';
              next_pc_valid   <= '1';
              pc_mux_select   <= '0';
              next_state      <= STATE_EXECUTE;

            when OP_AND_OP =>
              alu_op_sel      <= to_integer(opcode_to_int(OP_AND_OP));
              write_reg_en    <= '1';
              write_mem_en    <= '0';
              read_mem_en     <= '0';
              next_pc_valid   <= '1';
              pc_mux_select   <= '0';
              next_state      <= STATE_EXECUTE;

            when OP_OR_OP  =>
              alu_op_sel      <= to_integer(opcode_to_int(OP_OR_OP));
              write_reg_en    <= '1';
              write_mem_en    <= '0';
              read_mem_en     <= '0';
              next_pc_valid   <= '1';
              pc_mux_select   <= '0';
              next_state      <= STATE_EXECUTE;

            when OP_XOR_OP =>
              alu_op_sel      <= to_integer(opcode_to_int(OP_XOR_OP));
              write_reg_en    <= '1';
              write_mem_en    <= '0';
              read_mem_en     <= '0';
              next_pc_valid   <= '1';
              pc_mux_select   <= '0';
              next_state      <= STATE_EXECUTE;

            when OP_JMP    =>
              alu_op_sel      <= to_integer(opcode_to_int(OP_ADD));
              write_reg_en    <= '0';
              write_mem_en    <= '0';
              read_mem_en     <= '0';
              next_pc_valid   <= '1';
              pc_mux_select   <= '1';
              next_state      <= STATE_EXECUTE;

            when OP_BEQ    =>
              if zero_flag = '1' then
                alu_op_sel      <= to_integer(opcode_to_int(OP_ADD));
                write_reg_en    <= '0';
                write_mem_en    <= '0';
                read_mem_en     <= '0';
                next_pc_valid   <= '1';
                pc_mux_select   <= '1';
              else
                alu_op_sel      <= to_integer(opcode_to_int(OP_ADD));
                write_reg_en    <= '0';
                write_mem_en    <= '0';
                read_mem_en     <= '0';
                next_pc_valid   <= '1';
                pc_mux_select   <= '0';
              end if;
              next_state      <= STATE_EXECUTE;

            when others =>
              alu_op_sel      <= to_integer(opcode_to_int(OP_ADD));
              write_reg_en    <= '0';
              write_mem_en    <= '0';
              read_mem_en     <= '0';
              next_pc_valid   <= '1';
              pc_mux_select   <= '0';
              next_state      <= STATE_EXECUTE;
          end case;

        when STATE_EXECUTE =>
          alu_op_sel      <= to_integer(opcode_to_int(OP_ADD));
          write_reg_en    <= '0';
          write_mem_en    <= '0';
          read_mem_en     <= '0';
          next_pc_valid   <= '1';
          pc_mux_select   <= '0';
          next_state      <= STATE_WRITEBACK;

        when STATE_WRITEBACK =>
          alu_op_sel      <= to_integer(opcode_to_int(OP_ADD));
          write_reg_en    <= '0';
          write_mem_en    <= '0';
          read_mem_en     <= '0';
          next_pc_valid   <= '1';
          pc_mux_select   <= '0';
          next_state      <= STATE_FETCH;

        when others =>
          alu_op_sel      <= to_integer(opcode_to_int(OP_ADD));
          write_reg_en    <= '0';
          write_mem_en    <= '0';
          read_mem_en     <= '0';
          next_pc_valid   <= '1';
          pc_mux_select   <= '0';
          next_state      <= STATE_FETCH;
      end case;
    end if;
  end process;

end architecture rtl;