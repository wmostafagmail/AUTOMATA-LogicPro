library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.bb_util_pkg.all;

entity bb_alu_core is
  generic (
    DATA_WIDTH   : positive := 32;
    RESULT_WIDTH : positive := 32;
    OP_WIDTH     : positive := 4;
    SIGNED_MODE  : boolean := false
  );
  port (
    clk       : in  std_logic;
    rst_n     : in  std_logic;
    op        : in  std_logic_vector(OP_WIDTH-1 downto 0);
    in_a      : in  std_logic_vector(DATA_WIDTH-1 downto 0);
    in_b      : in  std_logic_vector(DATA_WIDTH-1 downto 0);
    in_valid  : in  std_logic;
    in_ready  : out std_logic;
    result    : out std_logic_vector(RESULT_WIDTH-1 downto 0);
    flags     : out std_logic_vector(3 downto 0);
    out_valid : out std_logic;
    out_ready : in  std_logic
  );
end entity;

architecture rtl of bb_alu_core is
  signal result_reg : std_logic_vector(RESULT_WIDTH-1 downto 0) := (others => '0');
  signal flags_reg  : std_logic_vector(3 downto 0) := (others => '0');
  signal valid_reg  : std_logic := '0';
begin
  in_ready <= (not valid_reg) or out_ready;
  result <= result_reg;
  flags <= flags_reg;
  out_valid <= valid_reg;

  process(clk)
    variable ua, ub, ur : unsigned(RESULT_WIDTH-1 downto 0);
    variable sa, sb, sr : signed(RESULT_WIDTH-1 downto 0);
    variable sh : natural;
    variable carry_ext : unsigned(RESULT_WIDTH downto 0);
    variable op_n : natural;
  begin
    if rising_edge(clk) then
      if rst_n = '0' then
        result_reg <= (others => '0');
        flags_reg <= (others => '0');
        valid_reg <= '0';
      elsif ((not valid_reg) or out_ready) = '1' then
        valid_reg <= in_valid;
        if in_valid = '1' then
          ua := resize(unsigned(in_a), RESULT_WIDTH);
          ub := resize(unsigned(in_b), RESULT_WIDTH);
          sa := resize(signed(in_a), RESULT_WIDTH);
          sb := resize(signed(in_b), RESULT_WIDTH);
          ur := (others => '0'); sr := (others => '0');
          sh := limited_shift_amount(in_b, RESULT_WIDTH-1);
          op_n := to_integer(unsigned(op));
          flags_reg <= (others => '0');
          if SIGNED_MODE then
            case op_n is
              when 0 => sr := sa + sb;
              when 1 => sr := sa - sb;
              when 2 => sr := signed(std_logic_vector(sa) and std_logic_vector(sb));
              when 3 => sr := signed(std_logic_vector(sa) or std_logic_vector(sb));
              when 4 => sr := signed(std_logic_vector(sa) xor std_logic_vector(sb));
              when 5 => sr := shift_left(sa, sh);
              when 6 => sr := shift_right(sa, sh);
              when 7 => if sa < sb then sr := to_signed(1, RESULT_WIDTH); end if;
              when 8 => if sa = sb then sr := to_signed(1, RESULT_WIDTH); end if;
              when 9 => if sa(sa'high)='1' then sr := -sa; else sr := sa; end if;
              when others => sr := sa;
            end case;
            result_reg <= std_logic_vector(sr);
            flags_reg(0) <= '1' when sr = 0 else '0';
            flags_reg(1) <= sr(sr'high);
            if op_n = 0 then
              flags_reg(3) <= (not (sa(sa'high) xor sb(sb'high))) and (sr(sr'high) xor sa(sa'high));
            elsif op_n = 1 then
              flags_reg(3) <= (sa(sa'high) xor sb(sb'high)) and (sr(sr'high) xor sa(sa'high));
            end if;
          else
            carry_ext := ('0' & ua) + ('0' & ub);
            case op_n is
              when 0 => ur := ua + ub; flags_reg(2) <= carry_ext(carry_ext'high);
              when 1 => ur := ua - ub; if ua < ub then flags_reg(2) <= '1'; end if;
              when 2 => ur := ua and ub;
              when 3 => ur := ua or ub;
              when 4 => ur := ua xor ub;
              when 5 => ur := shift_left(ua, sh);
              when 6 => ur := shift_right(ua, sh);
              when 7 => if ua < ub then ur := to_unsigned(1, RESULT_WIDTH); end if;
              when 8 => if ua = ub then ur := to_unsigned(1, RESULT_WIDTH); end if;
              when 9 => ur := ua;
              when others => ur := ua;
            end case;
            result_reg <= std_logic_vector(ur);
            flags_reg(0) <= '1' when ur = 0 else '0';
            flags_reg(1) <= ur(ur'high);
          end if;
        end if;
      end if;
    end if;
  end process;
end architecture;
