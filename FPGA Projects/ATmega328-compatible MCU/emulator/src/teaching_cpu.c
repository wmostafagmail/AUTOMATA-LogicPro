#include "teaching_cpu.h"

#include <string.h>

enum {
    OP_NOP = 0x0,
    OP_MOV = 0x1,
    OP_LDI = 0x2,
    OP_ADD = 0x3,
    OP_SUB = 0x4,
    OP_AND = 0x5,
    OP_OR = 0x6,
    OP_XOR = 0x7,
    OP_CMP = 0x8,
    OP_LD = 0x9,
    OP_ST = 0xA,
    OP_JMP = 0xB,
    OP_JZ = 0xC,
    OP_JNZ = 0xD,
    OP_OUT = 0xE,
    OP_HALT = 0xF
};

static bool is_illegal_encoding(uint16_t instr_word, uint8_t opcode) {
    uint16_t low12 = (uint16_t)(instr_word & 0x0FFFu);
    uint8_t upper_reserved = (uint8_t)((instr_word >> 8) & 0x0Fu);
    uint8_t i_reserved = (uint8_t)((instr_word >> 8) & 0x01u);

    if ((opcode == OP_NOP || opcode == OP_HALT) && low12 != 0u) {
        return true;
    }

    if ((opcode == OP_LDI || opcode == OP_LD || opcode == OP_ST || opcode == OP_OUT) && i_reserved != 0u) {
        return true;
    }

    if ((opcode == OP_JMP || opcode == OP_JZ || opcode == OP_JNZ) && upper_reserved != 0u) {
        return true;
    }

    return false;
}

static void trap_halt(teaching_cpu_t *cpu, teaching_cpu_status_t status) {
    cpu->halted = 1u;
    cpu->last_status = status;
}

static uint8_t read_data_bus(const teaching_cpu_t *cpu, uint8_t addr) {
    if (addr < TEACHING_CPU_MMIO_BASE_ADDR) {
        return cpu->data[addr];
    }

    if (addr == TEACHING_CPU_LED_ADDR) {
        return cpu->led_reg;
    }

    if (addr == TEACHING_CPU_UART_STATUS_ADDR) {
        return (uint8_t)(cpu->uart_busy & 0x01u);
    }

    return 0u;
}

static void append_uart_char(teaching_cpu_t *cpu, uint8_t value) {
    if (cpu->uart_log_len + 1u >= TEACHING_CPU_UART_BUFFER_CAPACITY) {
        trap_halt(cpu, TEACHING_CPU_STATUS_UART_OVERFLOW);
        return;
    }

    cpu->uart_log[cpu->uart_log_len++] = (char)value;
    cpu->uart_log[cpu->uart_log_len] = '\0';
}

static void write_data_bus(teaching_cpu_t *cpu, uint8_t addr, uint8_t value) {
    if (addr < TEACHING_CPU_MMIO_BASE_ADDR) {
        cpu->data[addr] = value;
        return;
    }

    if (addr == TEACHING_CPU_LED_ADDR) {
        cpu->led_reg = value;
        if (cpu->hooks.on_led_write != NULL) {
            cpu->hooks.on_led_write(cpu, value, cpu->hooks.user_data);
        }
        return;
    }

    if (addr == TEACHING_CPU_UART_TX_ADDR) {
        if (cpu->uart_busy != 0u) {
            return;
        }

        append_uart_char(cpu, value);
        if (cpu->halted != 0u) {
            return;
        }

        if (cpu->hooks.on_uart_write != NULL) {
            cpu->hooks.on_uart_write(cpu, value, cpu->hooks.user_data);
        }
        return;
    }
}

void teaching_cpu_init(teaching_cpu_t *cpu) {
    memset(cpu, 0, sizeof(*cpu));
    cpu->last_status = TEACHING_CPU_STATUS_OK;
}

void teaching_cpu_reset(teaching_cpu_t *cpu) {
    uint16_t program_copy[TEACHING_CPU_PROGRAM_WORDS];
    teaching_cpu_hooks_t hooks = cpu->hooks;

    memcpy(program_copy, cpu->program, sizeof(program_copy));
    memset(cpu, 0, sizeof(*cpu));
    memcpy(cpu->program, program_copy, sizeof(program_copy));
    cpu->hooks = hooks;
    cpu->last_status = TEACHING_CPU_STATUS_OK;
}

void teaching_cpu_set_hooks(teaching_cpu_t *cpu, const teaching_cpu_hooks_t *hooks) {
    if (hooks == NULL) {
        memset(&cpu->hooks, 0, sizeof(cpu->hooks));
        return;
    }

    cpu->hooks = *hooks;
}

void teaching_cpu_load_program(teaching_cpu_t *cpu, const uint16_t *program_words, size_t word_count) {
    size_t copy_words = word_count < TEACHING_CPU_PROGRAM_WORDS ? word_count : TEACHING_CPU_PROGRAM_WORDS;
    memset(cpu->program, 0, sizeof(cpu->program));
    memcpy(cpu->program, program_words, copy_words * sizeof(uint16_t));
}

teaching_cpu_status_t teaching_cpu_step(teaching_cpu_t *cpu) {
    uint16_t instr_word;
    uint8_t opcode;
    uint8_t rd;
    uint8_t rs;
    uint8_t imm;
    uint16_t alu;

    if (cpu->halted != 0u) {
        cpu->last_status = TEACHING_CPU_STATUS_HALTED;
        return cpu->last_status;
    }

    instr_word = cpu->program[cpu->pc];
    cpu->pc = (uint8_t)(cpu->pc + 1u);
    opcode = (uint8_t)((instr_word >> 12) & 0x0Fu);
    rd = (uint8_t)((instr_word >> 9) & 0x07u);
    rs = (uint8_t)((instr_word >> 6) & 0x07u);
    imm = (uint8_t)(instr_word & 0x00FFu);

    if (is_illegal_encoding(instr_word, opcode)) {
        trap_halt(cpu, TEACHING_CPU_STATUS_ILLEGAL_INSTRUCTION);
        return cpu->last_status;
    }

    switch (opcode) {
        case OP_NOP:
            break;
        case OP_MOV:
            cpu->regs[rd] = cpu->regs[rs];
            break;
        case OP_LDI:
            cpu->regs[rd] = imm;
            break;
        case OP_ADD:
            alu = (uint16_t)cpu->regs[rd] + (uint16_t)cpu->regs[rs];
            cpu->regs[rd] = (uint8_t)alu;
            cpu->cf = (uint8_t)((alu >> 8) & 0x01u);
            cpu->zf = (uint8_t)(cpu->regs[rd] == 0u);
            break;
        case OP_SUB:
            alu = (uint16_t)cpu->regs[rd] - (uint16_t)cpu->regs[rs];
            cpu->regs[rd] = (uint8_t)alu;
            cpu->cf = (uint8_t)((alu >> 8) & 0x01u);
            cpu->zf = (uint8_t)(cpu->regs[rd] == 0u);
            break;
        case OP_AND:
            cpu->regs[rd] &= cpu->regs[rs];
            cpu->cf = 0u;
            cpu->zf = (uint8_t)(cpu->regs[rd] == 0u);
            break;
        case OP_OR:
            cpu->regs[rd] |= cpu->regs[rs];
            cpu->cf = 0u;
            cpu->zf = (uint8_t)(cpu->regs[rd] == 0u);
            break;
        case OP_XOR:
            cpu->regs[rd] ^= cpu->regs[rs];
            cpu->cf = 0u;
            cpu->zf = (uint8_t)(cpu->regs[rd] == 0u);
            break;
        case OP_CMP:
            alu = (uint16_t)cpu->regs[rd] - (uint16_t)cpu->regs[rs];
            cpu->cf = (uint8_t)((alu >> 8) & 0x01u);
            cpu->zf = (uint8_t)(((uint8_t)alu) == 0u);
            break;
        case OP_LD:
            cpu->regs[rd] = read_data_bus(cpu, imm);
            break;
        case OP_ST:
            write_data_bus(cpu, imm, cpu->regs[rd]);
            break;
        case OP_JMP:
            cpu->pc = imm;
            break;
        case OP_JZ:
            if (cpu->zf != 0u) {
                cpu->pc = imm;
            }
            break;
        case OP_JNZ:
            if (cpu->zf == 0u) {
                cpu->pc = imm;
            }
            break;
        case OP_OUT:
            write_data_bus(cpu, imm, cpu->regs[rd]);
            break;
        case OP_HALT:
            trap_halt(cpu, TEACHING_CPU_STATUS_HALTED);
            break;
        default:
            trap_halt(cpu, TEACHING_CPU_STATUS_ILLEGAL_INSTRUCTION);
            break;
    }

    if (cpu->halted == 0u) {
        cpu->last_status = TEACHING_CPU_STATUS_OK;
    }

    return cpu->last_status;
}

teaching_cpu_status_t teaching_cpu_run(teaching_cpu_t *cpu, uint32_t max_steps, uint32_t *steps_executed) {
    uint32_t steps = 0;

    while (steps < max_steps && cpu->halted == 0u) {
        teaching_cpu_status_t status = teaching_cpu_step(cpu);
        steps++;
        if (status != TEACHING_CPU_STATUS_OK && status != TEACHING_CPU_STATUS_HALTED) {
            if (steps_executed != NULL) {
                *steps_executed = steps;
            }
            return status;
        }
    }

    if (steps_executed != NULL) {
        *steps_executed = steps;
    }

    if (cpu->halted != 0u) {
        return cpu->last_status;
    }

    return TEACHING_CPU_STATUS_OK;
}

const char *teaching_cpu_status_string(teaching_cpu_status_t status) {
    switch (status) {
        case TEACHING_CPU_STATUS_OK:
            return "ok";
        case TEACHING_CPU_STATUS_HALTED:
            return "halted";
        case TEACHING_CPU_STATUS_ILLEGAL_INSTRUCTION:
            return "illegal-instruction";
        case TEACHING_CPU_STATUS_UART_OVERFLOW:
            return "uart-overflow";
        default:
            return "unknown";
    }
}
