import { describe, expect, test } from "bun:test";
import { toCsv } from "../src/features/exports/data";

describe("CSV export", () => {
  test("preserves UTF-8, quotes, delimiters, newlines, leading zeroes and numbers", () => {
    expect(toCsv({ title: "Teste", columns: ["Nome", "CPF", "Valor"], rows: [
      ['João; "Silva"\nSouza', "001234", 42.5], [null, "", 0],
    ] })).toBe('\uFEFF"Nome";"CPF";"Valor"\r\n"João; ""Silva""\nSouza";"001234";"42,5"\r\n"";"";"0"\r\n');
  });
  test("neutralizes spreadsheet formulas and control characters without altering negative numbers", () => {
    const csv = toCsv({ title: "Teste", columns: ["Valor"], rows: [
      ["=1+1"], ["  +1"], ["-1"], ["@cmd"], ["\tcmd"], [-1],
    ] });
    expect(csv).toBe('\uFEFF"Valor"\r\n"\'=1+1"\r\n"\'  +1"\r\n"\'-1"\r\n"\'@cmd"\r\n"\'\tcmd"\r\n"-1"\r\n');
  });
});
