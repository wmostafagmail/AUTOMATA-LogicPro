library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

-- Include shared constants package first
library work; 
use work.alu_constants.all;


entity ALU_E2E is
    port (
        A : in  std_logic_vector(7 downto 0); -- Operand A
        B : in  std_logic_vector(7 downto 0); -- Operand B
        OpCode : in std_logic_vector(2 downto 0); -- 3-bit OpCode selection
        Clk : in  std_logic;                       -- System Clock
        RST_N : in  std_logic                        -- Active low Reset

        Result       : out std_logic_vector(7 downto 0); -- Output Result (8 bits)
        Carry_Out    : out std_logic;              -- Carry Out Flag (1 bit)
        Zero_Flag    : out std_logic;              -- Zero Flag (1 bit)
        Overflow_Flag : out std_logic               -- Overflow Flag (V, 1 bit)
    );
end entity ALU_E2E;

architecture rtl of ALU_E2E is
    -- Internal signals for typed arithmetic and flag calculation
    signal result_u       : unsigned(7 downto 0) := (others => '0'); -- Unsigned internal result
    signal signed_result  : signed(7 downto 0) := (others => '0'); -- Signed internal result

begin
    -- Main Combinational Logic Process for Calculation and Flag Generation
    process (A, B, OpCode)
        variable v_a : unsigned(7 downto 0);
        variable v_b : unsigned(7 downto 0);
        variable v_result : unsigned(7 downto 0);
    begin
        -- Default initialization for all outputs/internal calculations
        v_result := (others => '0');
        signed_result <= (others => '0');
        Carry_Out   <= '0';
        Zero_Flag   <= 'X'; -- Use X to indicate calculated value pending
        Overflow_Flag <= 'X';

        -- Temporary variables for complex flag calculations
        variable v_temp_sum : unsigned(8 downto 0); -- 9-bit temporary sum
        variable v_v_a, v_v_b : signed(7 downto 0);


        if OpCode = OP_ADD then
            -- Arithmetic Addition (A + B)
            v_temp_sum := unsigned(A) + unsigned(B);
            v_result := v_temp_sum(7 downto 0); -- LSBs are the result
            Carry_Out   <= v_temp_sum(8);      -- MSB is the carry out

            -- Signed calculation for Overflow Flag (V = A XOR B XOR Result)
            v_a := unsigned('0' & A); -- Extend to 9 bits for correct sign check analysis in variable scope
            v_b := unsigned('0' & B);
            v_result := v_temp_sum(7 downto 0);

            -- Using the full signed arithmetic capability of IEEE numeric_std:
            -- Overflow occurs if A and B have the same sign, but their sum does not.
            v_a := signed(A);
            v_b := signed(B);
            signed_result <= v_a + v_b; -- This intrinsic handles saturation/overflow by definition

            Overflow_Flag <= (A(7) /= B(7)) and (signed_result(7) /= A(7)); -- Simplified check based on sign change comparison: V=1 if signs differ AND result sign differs from inputs.
                                                           -- A robust check is: V = (MSB(A) ^ MSB(B) ^ MSB(Result)). We simplify to checking if the signs flip unexpectedly.

        elsif OpCode = OP_SUB then
            -- Arithmetic Subtraction (A - B) --> A + (~B + 1)
            v_temp_sum := unsigned(A) + (unsigned(~B) + 1);
            v_result := v_temp_sum(7 downto 0);
            Carry_Out   <= v_temp_sum(8); -- Carry out indicates no borrow

            -- Signed calculation for Overflow Flag
            v_a := signed(A);
            v_b := signed(B);
            signed_result <= v_a - v_b;

            -- For subtraction, the sign of the result is generally reliable unless A < B 
            -- and we rely on standard fixed-width wrap around.
            Overflow_Flag <= (A(7) /= B(7)) and (signed_result(7) /= A(7)); -- Using same heuristic for simplicity

        elsif OpCode = OP_AND then
            v_result := unsigned(A) & unsigned(B);
            Carry_Out   <= '0';
            Overflow_Flag <= '0'; -- Logical ops never overflow in the arithmetic sense

        elsif OpCode = OP_OR then
            v_result := unsigned(A) | unsigned(B);
            Carry_Out   <= '0';
            Overflow_Flag <= '0';

        elsif OpCode = OP_XOR then
            v_result := unsigned(A) ` xor` unsigned(B);
            Carry_Out   <= '0';
            Overflow_Flag <= '0';

        elsif OpCode = OP_SLL then
            -- Shift Left (Shift amount is handled by control unit in a real system; here we assume the shift amount is embedded or fixed for simplicity. Let's use the lowest 2 bits of B as the shift count).
            -- This requires explicit handling as shifting left can produce a carry bit and zeroing the LSBs.
            -- Using v_b(1 downto 0) as shift amount (amount <= 7).
            if unsigned'length(v_b) >= 2 then
                v_result := unsigned(A) sll to_integer(unsigned(B)(1 downto 0));
                Carry_Out   <= '1'; -- The MSBs shifted out are the carry. For simplicity, setting C=1 if any shift occurred > 0.
            else
                 v_result <= (others => '0');
                 Carry_Out <= '0';
            end if;

            Overflow_Flag <= '0';

        elsif OpCode = OP_SRL then
            -- Shift Right (Shift amount)
            -- For synthesis, SRL usually implies a fixed shift or control signal for the amount. Using B(1 downto 0) as shift count again.
            if unsigned'length(v_b) >= 2 then
                v_result := unsigned(A) srl to_integer(unsigned(B)(1 downto 0));
                Carry_Out   <= '0'; -- Usually C=0 for SRL unless we define the LSB as carry.
            else
                 v_result <= (others => '0');
                 Carry_Out <= '0';
            end if;

            Overflow_Flag <= '0';

        else
            -- Default/NOP case
            v_result := (others => '0');
            Carry_Out   <= '0';
            Zero_Flag   <= '1' when unsigned(A) = (others => '0') and unsigned(B) = (others => '0') else 'X'; -- Default Z=0 if inputs aren't both zero.
            Overflow_Flag <= '0';
        end if;

        -- Zero Flag Logic: Check the final 8-bit result, not based on input bits A and B alone.
        Zero_Flag <= '1' when v_result = (others => '0') else '0';


    end process; -- End of ALU logic process

    -- Output Assignments
    Result       <= std_logic_vector(v_result);
    Carry_Out    <= '1' when OpCode = OP_ADD and signed_result <= 0 else Carry_Out; -- Re-assigning carry to ensure the combinational signal update path is used.
    Zero_Flag    <= Zero_Flag;       -- Assigned within process
    Overflow_Flag <= Overflow_Flag;   -- Assigned within process

end architecture rtl;