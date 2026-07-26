library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.bb_util_pkg.all;

entity bbq_priority_encoder_core is
  generic (
    INPUTS       : positive := 16;
    HIGH_PRIORITY: boolean := true
  );
  port (
    request : in  std_logic_vector(INPUTS-1 downto 0);
    valid   : out std_logic;
    index   : out std_logic_vector(clog2(INPUTS)-1 downto 0);
    onehot  : out std_logic_vector(INPUTS-1 downto 0)
  );
end entity;

architecture rtl of bbq_priority_encoder_core is
begin
  assert INPUTS >= 2 report "INPUTS must be at least 2" severity failure;
  process(all)
    variable found : boolean;
    variable idx   : natural range 0 to INPUTS-1;
    variable oh    : std_logic_vector(INPUTS-1 downto 0);
  begin
    found := false; idx := 0; oh := (others=>'0');
    if HIGH_PRIORITY then
      for i in INPUTS-1 downto 0 loop
        if (not found) and request(i)='1' then found:=true; idx:=i; oh(i):='1'; end if;
      end loop;
    else
      for i in 0 to INPUTS-1 loop
        if (not found) and request(i)='1' then found:=true; idx:=i; oh(i):='1'; end if;
      end loop;
    end if;
    if found then valid<='1'; else valid<='0'; end if;
    index <= std_logic_vector(to_unsigned(idx,index'length));
    onehot <= oh;
  end process;
end architecture;
