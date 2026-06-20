library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.env.all;

use work.avr_pkg.all;

entity tb_avr_core_slice is
end entity;

architecture sim of tb_avr_core_slice is
  constant CLK_PERIOD : time := 10 ns;

  type prog_mem_t is array (0 to 255) of word_t;
  constant prog_c : prog_mem_t := (
    0  => x"E102", -- LDI  R16, 0x12
    1  => x"E314", -- LDI  R17, 0x34
    2  => x"2F20", -- MOV  R18, R16
    3  => x"0F21", -- ADD  R18, R17
    4  => x"B925", -- OUT  0x05, R18
    5  => x"1B20", -- SUB  R18, R16
    6  => x"B926", -- OUT  0x06, R18
    7  => x"1721", -- CP   R18, R17
    8  => x"932F", -- PUSH R18
    9  => x"913F", -- POP  R19
    10 => x"B937", -- OUT  0x07, R19
    11 => x"B143", -- IN   R20, 0x03
    12 => x"B948", -- OUT  0x08, R20
    13 => x"CFFF", -- RJMP -1
    others => x"0000"
  );

  type data_mem_t is array (0 to 4095) of byte_t;

  signal clk         : std_logic := '0';
  signal reset       : std_logic := '1';
  signal pmem_addr_s : addr16_t;
  signal pmem_req_s  : std_logic;
  signal pmem_rdata_s: word_t;
  signal pmem_valid_s: std_logic := '1';
  signal d_addr_s    : addr16_t;
  signal d_wdata_s   : byte_t;
  signal d_rdata_s   : byte_t;
  signal d_we_s      : std_logic;
  signal d_re_s      : std_logic;
  signal d_valid_s   : std_logic := '1';
  signal irq_lines_s : std_logic_vector(IRQ_COUNT - 1 downto 0) := (others => '0');
  signal dbg_s       : avr_debug_t := avr_debug_init;
  signal data_mem_s  : data_mem_t := (16#023# => x"5A", others => (others => '0'));

  signal saw_read_state_s   : boolean := false;
  signal saw_write_state_s  : boolean := false;
  signal saw_branch_state_s : boolean := false;
  signal saw_out25_s        : boolean := false;
  signal saw_out26_s        : boolean := false;
  signal saw_out27_s        : boolean := false;
  signal saw_out28_s        : boolean := false;
  signal saw_push_s         : boolean := false;
  signal finish_count_s     : natural := 0;
begin
  clk <= not clk after CLK_PERIOD / 2;

  dut: entity work.avr_core
    port map (
      clk          => clk,
      reset        => reset,
      pmem_addr_o  => pmem_addr_s,
      pmem_req_o   => pmem_req_s,
      pmem_rdata_i => pmem_rdata_s,
      pmem_valid_i => pmem_valid_s,
      d_addr_o     => d_addr_s,
      d_wdata_o    => d_wdata_s,
      d_rdata_i    => d_rdata_s,
      d_we_o       => d_we_s,
      d_re_o       => d_re_s,
      d_valid_i    => d_valid_s,
      irq_lines_i  => irq_lines_s,
      dbg_o        => dbg_s
    );

  pmem_rdata_s <= prog_c(safe_to_natural(pmem_addr_s(7 downto 0)));
  d_rdata_s    <= data_mem_s(safe_to_natural(d_addr_s(11 downto 0)));

  stim_proc: process
  begin
    wait for 4 * CLK_PERIOD;
    reset <= '0';
    wait;
  end process;

  mem_write_proc: process(clk)
  begin
    if rising_edge(clk) then
      if d_we_s = '1' then
        data_mem_s(to_integer(unsigned(d_addr_s(11 downto 0)))) <= d_wdata_s;
      end if;
    end if;
  end process;

  monitor_proc: process(clk)
  begin
    if rising_edge(clk) then
      if reset = '0' then
        assert dbg_s.state_q /= CORE_S_HALT_ILLEGAL
          report "Core entered CORE_S_HALT_ILLEGAL"
          severity failure;

        if dbg_s.state_q = CORE_S_EXEC_READ_REQ then
          saw_read_state_s <= true;
        end if;

        if dbg_s.state_q = CORE_S_EXEC_WRITE then
          saw_write_state_s <= true;
        end if;

        if dbg_s.state_q = CORE_S_EXEC_BRANCH then
          saw_branch_state_s <= true;
        end if;

        if d_we_s = '1' then
          if d_addr_s = x"0025" then
            assert d_wdata_s = x"46"
              report "ADD/OUT result mismatch at IO 0x25"
              severity failure;
            saw_out25_s <= true;
          elsif d_addr_s = x"0026" then
            assert d_wdata_s = x"34"
              report "SUB/OUT result mismatch at IO 0x26"
              severity failure;
            saw_out26_s <= true;
          elsif d_addr_s = x"0027" then
            assert d_wdata_s = x"34"
              report "POP/OUT result mismatch at IO 0x27"
              severity failure;
            saw_out27_s <= true;
          elsif d_addr_s = x"0028" then
            assert d_wdata_s = x"5A"
              report "IN/OUT result mismatch at IO 0x28, got " & to_hstring(d_wdata_s)
              severity failure;
            saw_out28_s <= true;
          elsif d_addr_s = x"08FE" then
            assert d_wdata_s = x"34"
              report "PUSH stack write mismatch at address 0x08FE"
              severity failure;
            saw_push_s <= true;
          end if;
        end if;

        if saw_out28_s then
          if dbg_s.pc_q = x"000D" then
            finish_count_s <= finish_count_s + 1;
          end if;

          if finish_count_s = 5 then
            assert dbg_s.sreg_q(1) = '1'
              report "Zero flag was not preserved after CP"
              severity failure;
            assert saw_read_state_s
              report "Did not observe read-state transition"
              severity failure;
            assert saw_write_state_s
              report "Did not observe write-state transition"
              severity failure;
            assert saw_branch_state_s
              report "Did not observe branch-state transition"
              severity failure;
            assert saw_out25_s and saw_out26_s and saw_out27_s and saw_push_s
              report "Did not observe all expected side effects before completion"
              severity failure;
            report "AVR slice test passed" severity note;
            stop;
          end if;
        end if;
      end if;
    end if;
  end process;

  timeout_proc: process
  begin
    wait for 5000 ns;
    assert false report "Timeout waiting for AVR slice test to finish" severity failure;
  end process;
end architecture;
