library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity bbq_add_sub_core is
  generic (
    WIDTH       : positive := 32;
    SIGNED_MODE : boolean := false
  );
  port (
    a         : in  std_logic_vector(WIDTH-1 downto 0);
    b         : in  std_logic_vector(WIDTH-1 downto 0);
    subtract  : in  std_logic;
    result    : out std_logic_vector(WIDTH-1 downto 0);
    carry_borrow : out std_logic;
    overflow  : out std_logic;
    zero      : out std_logic;
    negative  : out std_logic
  );
end entity;

architecture rtl of bbq_add_sub_core is
begin
  process(all)
    variable au, bu : unsigned(WIDTH-1 downto 0);
    variable su, eu : unsigned(WIDTH downto 0);
    variable asg, bsg, rsg : signed(WIDTH-1 downto 0);
    variable rv : std_logic_vector(WIDTH-1 downto 0);
    variable cb, ov : std_logic;
  begin
    au := unsigned(a); bu := unsigned(b);
    asg := signed(a); bsg := signed(b);
    cb := '0'; ov := '0';
    if subtract = '1' then
      eu := ('0' & au) - ('0' & bu);
      su := eu;
      if au < bu then cb := '1'; end if;
      rsg := asg - bsg;
      ov := (asg(WIDTH-1) xor bsg(WIDTH-1)) and (rsg(WIDTH-1) xor asg(WIDTH-1));
    else
      eu := ('0' & au) + ('0' & bu);
      su := eu;
      cb := eu(WIDTH);
      rsg := asg + bsg;
      ov := (not (asg(WIDTH-1) xor bsg(WIDTH-1))) and (rsg(WIDTH-1) xor asg(WIDTH-1));
    end if;
    if SIGNED_MODE then rv := std_logic_vector(rsg); else rv := std_logic_vector(su(WIDTH-1 downto 0)); end if;
    result <= rv;
    carry_borrow <= cb;
    overflow <= ov;
    if unsigned(rv)=0 then zero<='1'; else zero<='0'; end if;
    negative <= rv(WIDTH-1);
  end process;
end architecture;
