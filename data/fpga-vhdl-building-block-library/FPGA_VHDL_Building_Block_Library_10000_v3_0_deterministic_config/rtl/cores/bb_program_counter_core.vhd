library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity bb_program_counter_core is
  generic (
    PC_WIDTH     : positive := 32;
    RESET_VECTOR : natural := 0;
    INSTR_BYTES  : positive := 4
  );
  port (
    clk                : in  std_logic;
    rst_n              : in  std_logic;
    stall              : in  std_logic;
    sequential_advance : in  std_logic;
    redirect_valid     : in  std_logic;
    redirect_pc        : in  std_logic_vector(PC_WIDTH-1 downto 0);
    pc_current         : out std_logic_vector(PC_WIDTH-1 downto 0);
    pc_next            : out std_logic_vector(PC_WIDTH-1 downto 0);
    pc_valid           : out std_logic
  );
end entity;

architecture rtl of bb_program_counter_core is
  signal pc_reg : unsigned(PC_WIDTH-1 downto 0) := to_unsigned(RESET_VECTOR, PC_WIDTH);
  signal next_comb : unsigned(PC_WIDTH-1 downto 0);
begin
  process(all)
  begin
    next_comb <= pc_reg;
    if redirect_valid = '1' then
      next_comb <= unsigned(redirect_pc);
    elsif sequential_advance = '1' then
      next_comb <= pc_reg + INSTR_BYTES;
    end if;
  end process;

  process(clk)
  begin
    if rising_edge(clk) then
      if rst_n = '0' then
        pc_reg <= to_unsigned(RESET_VECTOR, PC_WIDTH);
      elsif stall = '0' then
        pc_reg <= next_comb;
      end if;
    end if;
  end process;

  pc_current <= std_logic_vector(pc_reg);
  pc_next <= std_logic_vector(next_comb);
  pc_valid <= rst_n;
end architecture;
