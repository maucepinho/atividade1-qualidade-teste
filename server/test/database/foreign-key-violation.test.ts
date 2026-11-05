import { isForeignKeyViolation } from "../../src/database/foreign-key-violation";

describe("isForeignKeyViolation", () => {
  test("reconhece o código 23503 na propriedade code de um objeto", () => {
    expect(isForeignKeyViolation({ code: "23503" })).toBe(true);
  });

  test.each([null, undefined, "23505", 23503, {}, { code: "outro" }])(
    "retorna false para %p",
    (error) => {
      expect(isForeignKeyViolation(error)).toBe(false);
    },
  );
});
