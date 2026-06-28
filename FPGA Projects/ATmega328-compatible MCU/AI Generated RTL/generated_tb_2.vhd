assert (sck_reg = '0' or sck_reg = '1') 
    report "SCK must be stable during CS assertion" 
    severity warning;
  assert byte_counter = 2 
    report "Frame must transfer exactly 2 bytes per CS window" 
    severity error when cs_n = '0' and state = IDLE;
