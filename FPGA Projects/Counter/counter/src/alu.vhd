library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.alu_pkg.all;

entity alu is
  generic (
    DATA_WIDTH : integer := 8
  );
  port (
    clk      : in  std_logic;
    rst      : in  std_logic;
    a        : in  std_logic_vector(DATA_WIDTH - 1 downto 0);
    b        : in  std_logic_vector(DATA_WIDTH - 1 downto 0);
    op       : in  std_logic_vector(2 downto 0);
    result   : out std_logic_vector(DATA_WIDTH - 1 downto 0);
    overflow : out std_logic;
    zero     : out std_logic
  );
end entity alu;

architecture rtl of alu is
  signal res_reg : unsigned(DATA_WIDTH - 1 downto 0);
begin
  process(clk)
    variable res_val : unsigned(DATA_WIDTH - 1 downto 0);
    variable ovf     : std_logic;
  begin
    if rst = '1' then
      res_val := (others => '0');
      ovf     := '0';
    elsif rising_edge(clk) then
      case decode_op(op) is
        when OP_ADD =>
          ovf := '0';
          if a(DATA_WIDTH-1) = b(DATA_WIDTH-1) and a(DATA_WIDTH-1) /= res_reg(DATA_WIDTH-1) then
            ovf := '1';
          end if;
          res_val := resize(a, DATA_WIDTH) + resize(b, DATA_WIDTH);
        when OP_SUB =>
          ovf := '0';
          if a(DATA_WIDTH-1) /= b(DATA_WIDTH-1) and a(DATA_WIDTH-1) = res_reg(DATA_WIDTH-1) then
            ovf := '1';
          end if;
          res_val := resize(a, DATA_WIDTH) - resize(b, DATA_WIDTH);
        when OP_AND =>
          res_val := a and b; ovf := '0';
        when OP_OR   =>
          res_val := a or b;  ovf := '0';
        when OP_XOR =>
          res_val := a xor b; ovf := '0';
        when OP_NOT =>
          res_val := not a;   ovf := '0';
        when OP_SHL =>
          res_val := a sll 1; ovf := '0';
        when OP_SHR =>
          res_val := a srl 1; ovf := '0';
      end case;
      res_reg <= res_val;
      result   <= std_logic_vector(res_reg);
      overflow <= ovf;
      zero     <= '1' when to_integer(res_reg) = 0 else '0';
    end if;
  end process;
end architecture rtl;