library ieee;
use ieee.std_logic_1164.all;
use work.bb_util_pkg.all;

entity bbq_parity_core is
  generic (
    WIDTH      : positive := 32;
    ODD_PARITY : boolean  := false
  );
  port (
    data_in         : in  std_logic_vector(WIDTH-1 downto 0);
    parity_out      : out std_logic;
    received_parity : in  std_logic;
    parity_error    : out std_logic
  );
end entity;

architecture rtl of bbq_parity_core is
  signal even_parity : std_logic;
  signal selected_parity : std_logic;
begin
  even_parity <= xor_reduce(data_in);

  odd_g : if ODD_PARITY generate
    selected_parity <= not even_parity;
  end generate;

  even_g : if not ODD_PARITY generate
    selected_parity <= even_parity;
  end generate;

  parity_out   <= selected_parity;
  parity_error <= selected_parity xor received_parity;
end architecture;
