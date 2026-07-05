library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.alu_pkg.all;
use std.env.all;

entity alu_tb is
end entity alu_tb;

architecture sim of alu_tb is
    constant CLK_PERIOD : time := 10 ns;
    constant TEST_WIDTH : integer := 8;

    signal clk     : std_logic := '0';
    signal rst     : std_logic := '0';
    signal opcode  : alu_op_t := ALU_OP_NOP;
    signal a       : std_logic_vector(TEST_WIDTH - 1 downto 0) := (others => '0');
    signal b       : std_logic_vector(TEST_WIDTH - 1 downto 0) := (others => '0');
    signal result  : std_logic_vector(TEST_WIDTH - 1 downto 0);
    signal flags   : alu_flags_t;

begin

    clk_gen : process
    begin
        clk <= '0';
        wait for CLK_PERIOD / 2;
        clk <= '1';
        wait for CLK_PERIOD / 2;
    end process clk_gen;

    rst_gen : process
    begin
        rst <= '1';
        wait for 20 ns;
        rst <= '0';
        wait;
    end process rst_gen;

    ------------------------------------------------------------------
    -- Helper to convert std_logic_vector to string (VHDL does not
    -- permit the 'image attribute on array types directly).
    ------------------------------------------------------------------
    function slv_to_string(slv : in std_logic_vector) return string is
        variable result_str : string(1 to slv'length);
    begin
        for i in slv'range loop
            if slv(i) = '1' then
                result_str(i - slv'low + 1) := '1';
            else
                result_str(i - slv'low + 1) := '0';
            end if;
        end loop;
        return result_str;
    end function slv_to_string;

    stim : process
        variable pass_count   : integer := 0;
        variable fail_count   : integer := 0;
        variable expected_u   : unsigned(TEST_WIDTH - 1 downto 0);
        variable exp_zero     : std_logic;
        variable exp_carry    : std_logic;
    begin

        ------------------------------------------------------------------
        -- Clock and reset release.
        ------------------------------------------------------------------
        wait until rising_edge(clk);
        wait until rst = '0';
        wait for 1 ns;

        ------------------------------------------------------------------
        -- Test RESET state: one full cycle after reset deassertion,
        -- with NOP opcode the ALU should output zero and assert zero flag.
        ------------------------------------------------------------------
        wait until rising_edge(clk);
        expected_u := to_unsigned(0, TEST_WIDTH);
        exp_zero   := '1';
        exp_carry  := '0';
        if (result = std_logic_vector(expected_u))
           and (flags.zero  = exp_zero)
           and (flags.carry = exp_carry) then
            pass_count := pass_count + 1;
            report "RESET_STATE PASS" severity note;
        else
            fail_count := fail_count + 1;
            report "RESET_STATE FAIL: got res=" & slv_to_string(result)
                & " flags=(" & std_logic'image(flags.zero) & "," & std_logic'image(flags.carry) & ")"
                severity error;
        end if;

        ------------------------------------------------------------------
        -- Test ADD: 1 + 2 = 3.
        ------------------------------------------------------------------
        a       <= "00000001";
        b       <= "00000010";
        opcode  <= ALU_OP_ADD;
        wait until rising_edge(clk);
        expected_u := to_unsigned(3, TEST_WIDTH);
        exp_zero   := '0';
        exp_carry  := '0';
        if (result = std_logic_vector(expected_u))
           and (flags.zero  = exp_zero)
           and (flags.carry = exp_carry) then
            pass_count := pass_count + 1;
            report "ADD 1+2 PASS" severity note;
        else
            fail_count := fail_count + 1;
            report "ADD 1+2 FAIL: got res=" & slv_to_string(result)
                & " flags=(" & std_logic'image(flags.zero) & "," & std_logic'image(flags.carry) & ")"
                severity error;
        end if;

        ------------------------------------------------------------------
        -- Test ADD overflow: 255 + 1 wraps to 0 with carry = 1.
        ------------------------------------------------------------------
        a       <= "11111111";
        b       <= "00000001";
        opcode  <= ALU_OP_ADD;
        wait until rising_edge(clk);
        expected_u := to_unsigned(0, TEST_WIDTH);
        exp_zero   := '1';
        exp_carry  := '1';
        if (result = std_logic_vector(expected_u))
           and (flags.zero  = exp_zero)
           and (flags.carry = exp_carry) then
            pass_count := pass_count + 1;
            report "ADD_OVERFLOW PASS" severity note;
        else
            fail_count := fail_count + 1;
            report "ADD_OVERFLOW FAIL: got res=" & slv_to_string(result)
                & " flags=(" & std_logic'image(flags.zero) & "," & std_logic'image(flags.carry) & ")"
                severity error;
        end if;

        ------------------------------------------------------------------
        -- Test SUB: 5 - 3 = 2.
        ------------------------------------------------------------------
        a       <= "00000101";
        b       <= "00000011";
        opcode  <= ALU_OP_SUB;
        wait until rising_edge(clk);
        expected_u := to_unsigned(2, TEST_WIDTH);
        exp_zero   := '0';
        exp_carry  := '0';
        if (result = std_logic_vector(expected_u))
           and (flags.zero  = exp_zero)
           and (flags.carry = exp_carry) then
            pass_count := pass_count + 1;
            report "SUB 5-3 PASS" severity note;
        else
            fail_count := fail_count + 1;
            report "SUB 5-3 FAIL: got res=" & slv_to_string(result)
                & " flags=(" & std_logic'image(flags.zero) & "," & std_logic'image(flags.carry) & ")"
                severity error;
        end if;

        ------------------------------------------------------------------
        -- Test SUB underflow (borrow): 0 - 1 = 255, carry = 0.
        ------------------------------------------------------------------
        a       <= "00000000";
        b       <= "00000001";
        opcode  <= ALU_OP_SUB;
        wait until rising_edge(clk);
        expected_u := to_unsigned(255, TEST_WIDTH);
        exp_zero   := '0';
        exp_carry  := '0';
        if (result = std_logic_vector(expected_u))
           and (flags.zero  = exp_zero)
           and (flags.carry = exp_carry) then
            pass_count := pass_count + 1;
            report "SUB_UNDERFLOW PASS" severity note;
        else
            fail_count := fail_count + 1;
            report "SUB_UNDERFLOW FAIL: got res=" & slv_to_string(result)
                & " flags=(" & std_logic'image(flags.zero) & "," & std_logic'image(flags.carry) & ")"
                severity error;
        end if;

        ------------------------------------------------------------------
        -- Test AND: F0h and A0h = A0h.
        ------------------------------------------------------------------
        a       <= "11110000";
        b       <= "10100000";
        opcode  <= ALU_OP_AND;
        wait until rising_edge(clk);
        expected_u := to_unsigned(160, TEST_WIDTH);
        exp_zero   := '0';
        exp_carry  := '0';
        if (result = std_logic_vector(expected_u))
           and (flags.zero  = exp_zero)
           and (flags.carry = exp_carry) then
            pass_count := pass_count + 1;
            report "AND PASS" severity note;
        else
            fail_count := fail_count + 1;
            report "AND FAIL: got res=" & slv_to_string(result)
                & " flags=(" & std_logic'image(flags.zero) & "," & std_logic'image(flags.carry) & ")"
                severity error;
        end if;

        ------------------------------------------------------------------
        -- Test OR: F0h or 0Fh = FFh.
        ------------------------------------------------------------------
        a       <= "11110000";
        b       <= "00001111";
        opcode  <= ALU_OP_OR;
        wait until rising_edge(clk);
        expected_u := to_unsigned(255, TEST_WIDTH);
        exp_zero   := '0';
        exp_carry  := '0';
        if (result = std_logic_vector(expected_u))
           and (flags.zero  = exp_zero)
           and (flags.carry = exp_carry) then
            pass_count := pass_count + 1;
            report "OR PASS" severity note;
        else
            fail_count := fail_count + 1;
            report "OR FAIL: got res=" & slv_to_string(result)
                & " flags=(" & std_logic'image(flags.zero) & "," & std_logic'image(flags.carry) & ")"
                severity error;
        end if;

        ------------------------------------------------------------------
        -- Test XOR: F0h xor 0Fh = FFh.
        ------------------------------------------------------------------
        a       <= "11110000";
        b       <= "00001111";
        opcode  <= ALU_OP_XOR;
        wait until rising_edge(clk);
        expected_u := to_unsigned(255, TEST_WIDTH);
        exp_zero   := '0';
        exp_carry  := '0';
        if (result = std_logic_vector(expected_u))
           and (flags.zero  = exp_zero)
           and (flags.carry = exp_carry) then
            pass_count := pass_count + 1;
            report "XOR PASS" severity note;
        else
            fail_count := fail_count + 1;
            report "XOR FAIL: got res=" & slv_to_string(result)
                & " flags=(" & std_logic'image(flags.zero) & "," & std_logic'image(flags.carry) & ")"
                severity error;
        end if;

        ------------------------------------------------------------------
        -- Test NOT: not F0h = 0Fh.
        ------------------------------------------------------------------
        a       <= "11110000";
        b       <= "00000000";
        opcode  <= ALU_OP_NOT;
        wait until rising_edge(clk);
        expected_u := to_unsigned(15, TEST_WIDTH);
        exp_zero   := '0';
        exp_carry  := '0';
        if (result = std_logic_vector(expected_u))
           and (flags.zero  = exp_zero)
           and (flags.carry = exp_carry) then
            pass_count := pass_count + 1;
            report "NOT PASS" severity note;
        else
            fail_count := fail_count + 1;
            report "NOT FAIL: got res=" & slv_to_string(result)
                & " flags=(" & std_logic'image(flags.zero) & "," & std_logic'image(flags.carry) & ")"
                severity error;
        end if;

        ------------------------------------------------------------------
        -- Test SLL: 01h << 1 = 02h.
        ------------------------------------------------------------------
        a       <= "00000001";
        b       <= "00000001";
        opcode  <= ALU_OP_SLL;
        wait until rising_edge(clk);
        expected_u := to_unsigned(2, TEST_WIDTH);
        exp_zero   := '0';
        exp_carry  := '0';
        if (result = std_logic_vector(expected_u))
           and (flags.zero  = exp_zero)
           and (flags.carry = exp_carry) then
            pass_count := pass_count + 1;
            report "SLL PASS" severity note;
        else
            fail_count := fail_count + 1;
            report "SLL FAIL: got res=" & slv_to_string(result)
                & " flags=(" & std_logic'image(flags.zero) & "," & std_logic'image(flags.carry) & ")"
                severity error;
        end if;

        ------------------------------------------------------------------
        -- Test SRL: 02h >> 1 = 01h.
        ------------------------------------------------------------------
        a       <= "00000010";
        b       <= "00000001";
        opcode  <= ALU_OP_SRL;
        wait until rising_edge(clk);
        expected_u := to_unsigned(1, TEST_WIDTH);
        exp_zero   := '0';
        exp_carry  := '0';
        if (result = std_logic_vector(expected_u))
           and (flags.zero  = exp_zero)
           and (flags.carry = exp_carry) then
            pass_count := pass_count + 1;
            report "SRL PASS" severity note;
        else
            fail_count := fail_count + 1;
            report "SRL FAIL: got res=" & slv_to_string(result)
                & " flags=(" & std_logic'image(flags.zero) & "," & std_logic'image(flags.carry) & ")"
                severity error;
        end if;

        ------------------------------------------------------------------
        -- Test NOP: output forced to zero, zero flag asserted.
        ------------------------------------------------------------------
        a       <= "11111111";
        b       <= "11111111";
        opcode  <= ALU_OP_NOP;
        wait until rising_edge(clk);
        expected_u := to_unsigned(0, TEST_WIDTH);
        exp_zero   := '1';
        exp_carry  := '0';
        if (result = std_logic_vector(expected_u))
           and (flags.zero  = exp_zero)
           and (flags.carry = exp_carry) then
            pass_count := pass_count + 1;
            report "NOP PASS" severity note;
        else
            fail_count := fail_count + 1;
            report "NOP FAIL: got res=" & slv_to_string(result)
                & " flags=(" & std_logic'image(flags.zero) & "," & std_logic'image(flags.carry) & ")"
                severity error;
        end if;

        ------------------------------------------------------------------
        -- Final summary.
        ------------------------------------------------------------------
        if fail_count = 0 then
            report "==============================" severity note;
            report "ALL TESTS PASSED" severity note;
            report "==============================" severity note;
            std.env.stop(0);
        else
            report "==============================" severity error;
            report "FAILURES DETECTED: " & integer'image(fail_count) severity error;
            report "==============================" severity error;
            std.env.stop(1);
        end if;

    end process stim;

end architecture sim;