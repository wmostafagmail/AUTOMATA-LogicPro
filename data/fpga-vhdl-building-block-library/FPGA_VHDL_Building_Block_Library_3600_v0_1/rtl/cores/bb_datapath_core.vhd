library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.bb_util_pkg.all;

entity bb_datapath_core is
  generic (
    DATA_WIDTH   : positive := 32;
    RESULT_WIDTH : positive := 32;
    OP_CODE      : natural range 0 to 15 := 0;
    SIGNED_MODE  : boolean := false
  );
  port (
    clk       : in  std_logic;
    rst_n     : in  std_logic;
    in_a      : in  std_logic_vector(DATA_WIDTH-1 downto 0);
    in_b      : in  std_logic_vector(DATA_WIDTH-1 downto 0);
    in_valid  : in  std_logic;
    in_ready  : out std_logic;
    result    : out std_logic_vector(RESULT_WIDTH-1 downto 0);
    out_valid : out std_logic;
    out_ready : in  std_logic;
    error     : out std_logic
  );
end entity;

architecture rtl of bb_datapath_core is
  signal result_reg : std_logic_vector(RESULT_WIDTH-1 downto 0) := (others => '0');
  signal valid_reg  : std_logic := '0';
  signal error_reg  : std_logic := '0';

  function calculate(a, b : std_logic_vector(DATA_WIDTH-1 downto 0))
    return std_logic_vector is
    variable ur : unsigned(RESULT_WIDTH-1 downto 0) := (others => '0');
    variable sr : signed(RESULT_WIDTH-1 downto 0) := (others => '0');
    variable ua : unsigned(RESULT_WIDTH-1 downto 0) := resize(unsigned(a), RESULT_WIDTH);
    variable ub : unsigned(RESULT_WIDTH-1 downto 0) := resize(unsigned(b), RESULT_WIDTH);
    variable sa : signed(RESULT_WIDTH-1 downto 0) := resize(signed(a), RESULT_WIDTH);
    variable sb : signed(RESULT_WIDTH-1 downto 0) := resize(signed(b), RESULT_WIDTH);
    variable product_u : unsigned(2*DATA_WIDTH-1 downto 0);
    variable product_s : signed(2*DATA_WIDTH-1 downto 0);
    variable sh : natural;
  begin
    sh := limited_shift_amount(b, RESULT_WIDTH-1);
    if SIGNED_MODE then
      case OP_CODE is
        when 0  => sr := sa;
        when 1  => sr := sa + sb;
        when 2  => sr := sa - sb;
        when 3  =>
          product_s := signed(a) * signed(b);
          sr := resize(product_s, RESULT_WIDTH);
        when 4  => sr := signed(std_logic_vector(sa) and std_logic_vector(sb));
        when 5  => sr := signed(std_logic_vector(sa) or std_logic_vector(sb));
        when 6  => sr := signed(std_logic_vector(sa) xor std_logic_vector(sb));
        when 7  => sr := shift_left(sa, sh);
        when 8  => sr := shift_right(sa, sh);
        when 9  => if sa < sb then sr := to_signed(1, RESULT_WIDTH); end if;
        when 10 => if sa > sb then sr := to_signed(1, RESULT_WIDTH); end if;
        when 11 => if sb /= 0 then sr := sa / sb; end if;
        when 12 => if sb /= 0 then sr := sa rem sb; end if;
        when 13 => if sa(sa'high) = '1' then sr := -sa; else sr := sa; end if;
        when 14 => sr := to_signed(popcount(a), RESULT_WIDTH);
        when others => sr := sa + sb + to_signed(1, RESULT_WIDTH);
      end case;
      return std_logic_vector(sr);
    else
      case OP_CODE is
        when 0  => ur := ua;
        when 1  => ur := ua + ub;
        when 2  => ur := ua - ub;
        when 3  =>
          product_u := unsigned(a) * unsigned(b);
          ur := resize(product_u, RESULT_WIDTH);
        when 4  => ur := ua and ub;
        when 5  => ur := ua or ub;
        when 6  => ur := ua xor ub;
        when 7  => ur := shift_left(ua, sh);
        when 8  => ur := shift_right(ua, sh);
        when 9  => if ua < ub then ur := to_unsigned(1, RESULT_WIDTH); end if;
        when 10 => if ua > ub then ur := to_unsigned(1, RESULT_WIDTH); end if;
        when 11 => if ub /= 0 then ur := ua / ub; end if;
        when 12 => if ub /= 0 then ur := ua rem ub; end if;
        when 13 => ur := ua;
        when 14 => ur := to_unsigned(popcount(a), RESULT_WIDTH);
        when others => ur := ua + ub + to_unsigned(1, RESULT_WIDTH);
      end case;
      return std_logic_vector(ur);
    end if;
  end function;
begin
  in_ready <= (not valid_reg) or out_ready;
  result <= result_reg;
  out_valid <= valid_reg;
  error <= error_reg;

  process(clk)
  begin
    if rising_edge(clk) then
      if rst_n = '0' then
        result_reg <= (others => '0');
        valid_reg <= '0';
        error_reg <= '0';
      elsif ((not valid_reg) or out_ready) = '1' then
        valid_reg <= in_valid;
        error_reg <= '0';
        if in_valid = '1' then
          result_reg <= calculate(in_a, in_b);
          if (OP_CODE = 11 or OP_CODE = 12) and unsigned(in_b) = 0 then
            error_reg <= '1';
          end if;
        end if;
      end if;
    end if;
  end process;
end architecture;
