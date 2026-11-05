import type { Database } from "../../../src/database/connection";
import { PgStudentRepository } from "../../../src/modules/students/students.repository";

const normalizeSql = (sql: string) => sql.replace(/\s+/g, " ").trim();

describe("PgStudentRepository", () => {
  let query: jest.MockedFunction<Database["query"]>;
  let repository: PgStudentRepository;

  beforeEach(() => {
    query = jest.fn();
    const database: Database = { query };
    repository = new PgStudentRepository(database);
  });

  test("create retorna o aluno e insere RA e nome com parâmetros na ordem correta", async () => {
    const student = { ra: 123, name: "Ana" };
    query.mockResolvedValueOnce({ rows: [student] });

    await expect(repository.create({ ra: 123, name: "Ana" })).resolves.toBe(student);

    expect(query).toHaveBeenCalledTimes(1);
    const [sql, parameters] = query.mock.calls[0];
    expect(normalizeSql(sql)).toBe(
      "INSERT INTO students (ra, name) VALUES ($1, $2) RETURNING ra, name",
    );
    expect(parameters).toEqual([123, "Ana"]);
  });

  test("findAll retorna as linhas e seleciona ra e name com ORDER BY name, sem parâmetros", async () => {
    const students = [
      { ra: 123, name: "Ana" },
      { ra: 456, name: "Bruno" },
    ];
    query.mockResolvedValueOnce({ rows: students });

    await expect(repository.findAll()).resolves.toEqual(students);

    expect(query).toHaveBeenCalledTimes(1);
    const [sql] = query.mock.calls[0];
    expect(normalizeSql(sql)).toBe("SELECT ra, name FROM students ORDER BY name");
    expect(query.mock.calls[0]).toHaveLength(1);
  });

  test("findAll retorna uma lista vazia quando não há alunos", async () => {
    query.mockResolvedValueOnce({ rows: [] });

    await expect(repository.findAll()).resolves.toEqual([]);
  });

  test("findOne retorna a primeira linha e consulta pelo RA parametrizado", async () => {
    const student = { ra: 123, name: "Ana" };
    query.mockResolvedValueOnce({
      rows: [student, { ra: 456, name: "Bruno" }],
    });

    await expect(repository.findOne(123)).resolves.toBe(student);

    expect(query).toHaveBeenCalledTimes(1);
    const [sql, parameters] = query.mock.calls[0];
    expect(normalizeSql(sql)).toBe("SELECT ra, name FROM students WHERE ra = $1");
    expect(parameters).toEqual([123]);
  });

  test("findOne retorna undefined quando o aluno não existe", async () => {
    query.mockResolvedValueOnce({ rows: [] });

    await expect(repository.findOne(123)).resolves.toBeUndefined();
  });

  test.each(["create", "findAll", "findOne"] as const)(
    "%s propaga a mesma instância de Error recebida de query",
    async (method) => {
      const error = new Error("Falha ao consultar alunos");
      query.mockRejectedValueOnce(error);
      const operations = {
        create: () => repository.create({ ra: 123, name: "Ana" }),
        findAll: () => repository.findAll(),
        findOne: () => repository.findOne(123),
      };

      await expect(operations[method]()).rejects.toBe(error);
      expect(query).toHaveBeenCalledTimes(1);
    },
  );
});
