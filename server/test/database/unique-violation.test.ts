import { isUniqueViolation } from "../../src/database/unique-violation";

describe("isUniqueViolation", () => {
  test("reconhece o código 23505 na propriedade code de um objeto", () => {
    expect(isUniqueViolation({ code: "23505" })).toBe(true);
  });

  test.each([null, undefined, "23505", 23503, {}, { code: "outro" }])(
    "retorna false para %p",
    (error) => {
      expect(isUniqueViolation(error)).toBe(false);
    },
  );
});
