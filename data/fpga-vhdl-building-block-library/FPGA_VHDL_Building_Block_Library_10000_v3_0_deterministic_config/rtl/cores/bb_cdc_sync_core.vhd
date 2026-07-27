library ieee;
use ieee.std_logic_1164.all;

entity bb_cdc_sync_core is
  generic (
    DATA_WIDTH : positive := 1;
    STAGES     : positive := 2
  );
  port (
    dst_clk   : in  std_logic;
    dst_rst_n : in  std_logic;
    async_in  : in  std_logic_vector(DATA_WIDTH-1 downto 0);
    sync_out  : out std_logic_vector(DATA_WIDTH-1 downto 0)
  );
end entity;

architecture rtl of bb_cdc_sync_core is
  type sync_array_t is array (0 to STAGES-1) of std_logic_vector(DATA_WIDTH-1 downto 0);
  signal sync_regs : sync_array_t := (others => (others => '0'));
  attribute async_reg : string;
  attribute async_reg of sync_regs : signal is "true";
begin
  assert STAGES >= 2 report "CDC synchronizer STAGES must be >= 2" severity failure;
  process(dst_clk)
  begin
    if rising_edge(dst_clk) then
      if dst_rst_n = '0' then
        sync_regs <= (others => (others => '0'));
      else
        sync_regs(0) <= async_in;
        for i in 1 to STAGES-1 loop
          sync_regs(i) <= sync_regs(i-1);
        end loop;
      end if;
    end if;
  end process;
  sync_out <= sync_regs(STAGES-1);
end architecture;
