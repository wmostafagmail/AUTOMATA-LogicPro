library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity bb_vector_mac_core is
  generic (
    ELEM_WIDTH : positive := 8;
    LANES      : positive := 4;
    ACC_WIDTH  : positive := 32
  );
  port (
    clk        : in  std_logic;
    rst_n      : in  std_logic;
    vector_a   : in  std_logic_vector(LANES*ELEM_WIDTH-1 downto 0);
    vector_b   : in  std_logic_vector(LANES*ELEM_WIDTH-1 downto 0);
    in_valid   : in  std_logic;
    in_ready   : out std_logic;
    result     : out std_logic_vector(ACC_WIDTH-1 downto 0);
    out_valid  : out std_logic;
    out_ready  : in  std_logic
  );
end entity;

architecture rtl of bb_vector_mac_core is
  signal result_reg : signed(ACC_WIDTH-1 downto 0) := (others => '0');
  signal valid_reg : std_logic := '0';
begin
  in_ready <= (not valid_reg) or out_ready;
  result <= std_logic_vector(result_reg);
  out_valid <= valid_reg;
  process(clk)
    variable acc : signed(ACC_WIDTH-1 downto 0);
    variable av, bv : signed(ELEM_WIDTH-1 downto 0);
    variable product : signed(2*ELEM_WIDTH-1 downto 0);
  begin
    if rising_edge(clk) then
      if rst_n = '0' then
        result_reg <= (others => '0');
        valid_reg <= '0';
      elsif ((not valid_reg) or out_ready) = '1' then
        valid_reg <= in_valid;
        if in_valid = '1' then
          acc := (others => '0');
          for lane in 0 to LANES-1 loop
            av := signed(vector_a((lane+1)*ELEM_WIDTH-1 downto lane*ELEM_WIDTH));
            bv := signed(vector_b((lane+1)*ELEM_WIDTH-1 downto lane*ELEM_WIDTH));
            product := av * bv;
            acc := acc + resize(product, ACC_WIDTH);
          end loop;
          result_reg <= acc;
        end if;
      end if;
    end if;
  end process;
end architecture;
