import { HttpError } from "../src/errors";
import {
  parseId,
  positiveInteger,
  validateBody,
  validateName,
} from "../src/validation";

// O matcher assimétrico confere o tipo e o status do mesmo erro lançado.
const badRequest = expect.objectContaining({
  constructor: HttpError,
  statusCode: 400,
});

describe("positiveInteger", () => {
  test.each([1, 2147483647])("retorna o inteiro permitido %p", (value) => {
    expect(positiveInteger(value, "RA")).toBe(value);
  });

  test.each([0, -1, 1.5, NaN, Infinity, 2147483648, "123", null, undefined])(
    "rejeita %p com HttpError 400",
    (value) => {
      expect(() => positiveInteger(value, "RA")).toThrow(badRequest);
    },
  );
});

describe("parseId", () => {
  test.each([
    ["1", 1],
    ["2147483647", 2147483647],
  ])("converte %p para %p", (value, expected) => {
    expect(parseId(value, "RA")).toBe(expected);
  });

  test.each(["1abc", "1.2", "1e2", "", "-1", "0", "2147483648", 123])(
    "rejeita %p com HttpError 400",
    (value) => {
      expect(() => parseId(value, "RA")).toThrow(badRequest);
    },
  );
});

describe("validateName", () => {
  test.each(["Ana", "a".repeat(100)])("retorna o nome válido %p", (value) => {
    expect(validateName(value)).toBe(value);
  });

  test.each(["", "ab", "   ", " a ", "a".repeat(101), 123, null, undefined])(
    "rejeita %p com HttpError 400",
    (value) => {
      expect(() => validateName(value)).toThrow(badRequest);
    },
  );
});

describe("validateBody", () => {
  test("retorna a mesma referência de um objeto congelado sem modificá-lo", () => {
    const body = Object.freeze({ name: "Ana" });

    expect(validateBody(body)).toBe(body);
    expect(body).toEqual({ name: "Ana" });
    expect(Object.isFrozen(body)).toBe(true);
  });

  test.each([null, undefined, [], "Ana", 12])(
    "rejeita %p com HttpError 400",
    (value) => {
      expect(() => validateBody(value)).toThrow(badRequest);
    },
  );

  test("aceita campos extras e preserva a referência e o conteúdo do objeto", () => {
    const body = { name: "Ana", extra: true };

    expect(validateBody(body)).toBe(body);
    expect(body).toEqual({ name: "Ana", extra: true });
  });
});
