library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity bb_crypto_shell_core is
  generic (
    DATA_WIDTH : positive := 128;
    KEY_WIDTH  : positive := 128
  );
  port (
    clk       : in  std_logic;
    rst_n     : in  std_logic;
    data_in   : in  std_logic_vector(DATA_WIDTH-1 downto 0);
    key_in    : in  std_logic_vector(KEY_WIDTH-1 downto 0);
    in_valid  : in  std_logic;
    in_ready  : out std_logic;
    data_out  : out std_logic_vector(DATA_WIDTH-1 downto 0);
    out_valid : out std_logic;
    out_ready : in  std_logic;
    fault     : out std_logic
  );
end entity;

architecture rtl of bb_crypto_shell_core is
  signal data_reg  : std_logic_vector(DATA_WIDTH-1 downto 0) := (others => '0');
  signal valid_reg : std_logic := '0';
begin
  -- This remains an integration shell and is intentionally not represented as
  -- a cryptographically secure implementation.
  in_ready  <= (not valid_reg) or out_ready;
  data_out  <= data_reg;
  out_valid <= valid_reg;
  fault     <= '0';

  process(clk)
    variable key_resized : unsigned(DATA_WIDTH-1 downto 0);
  begin
    if rising_edge(clk) then
      if rst_n = '0' then
        data_reg  <= (others => '0');
        valid_reg <= '0';
      elsif ((not valid_reg) or out_ready) = '1' then
        valid_reg <= in_valid;
        if in_valid = '1' then
          key_resized := resize(unsigned(key_in), DATA_WIDTH);
          data_reg <= data_in xor std_logic_vector(key_resized);
        end if;
      end if;
    end if;
  end process;
end architecture;
