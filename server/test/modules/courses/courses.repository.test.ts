import type { Database } from "../../../src/database/connection";
import { PgCourseRepository } from "../../../src/modules/courses/courses.repository";

const normalizeSql = (sql: string) => sql.replace(/\s+/g, " ").trim();

describe("PgCourseRepository", () => {
  let query: jest.MockedFunction<Database["query"]>;
  let repository: PgCourseRepository;

  beforeEach(() => {
    // Cada teste recebe um mock novo, sem chamadas ou respostas anteriores.
    query = jest.fn();
    const database: Database = { query };
    repository = new PgCourseRepository(database);
  });

  test("create retorna a disciplina e insere o nome com parâmetro separado", async () => {
    const course = { id: 7, name: "Qualidade" };
    query.mockResolvedValueOnce({ rows: [course] });

    await expect(repository.create({ name: "Qualidade" })).resolves.toBe(course);

    expect(query).toHaveBeenCalledTimes(1);
    const [sql, parameters] = query.mock.calls[0];
    expect(normalizeSql(sql)).toBe(
      "INSERT INTO courses (name) VALUES ($1) RETURNING id, name",
    );
    expect(parameters).toEqual(["Qualidade"]);
  });

  test("findAll retorna as linhas e seleciona id e name com ORDER BY id, sem parâmetros", async () => {
    const courses = [
      { id: 7, name: "Qualidade" },
      { id: 8, name: "Engenharia" },
    ];
    query.mockResolvedValueOnce({ rows: courses });

    await expect(repository.findAll()).resolves.toEqual(courses);

    expect(query).toHaveBeenCalledTimes(1);
    const [sql] = query.mock.calls[0];
    expect(normalizeSql(sql)).toBe("SELECT id, name FROM courses ORDER BY id");
    expect(query.mock.calls[0]).toHaveLength(1);
  });

  test("findAll retorna uma lista vazia quando não há disciplinas", async () => {
    query.mockResolvedValueOnce({ rows: [] });

    await expect(repository.findAll()).resolves.toEqual([]);
  });

  test("findOne retorna a primeira linha e consulta pelo id parametrizado", async () => {
    const course = { id: 7, name: "Qualidade" };
    query.mockResolvedValueOnce({
      rows: [course, { id: 8, name: "Engenharia" }],
    });

    await expect(repository.findOne(7)).resolves.toBe(course);

    expect(query).toHaveBeenCalledTimes(1);
    const [sql, parameters] = query.mock.calls[0];
    expect(normalizeSql(sql)).toBe("SELECT id, name FROM courses WHERE id = $1");
    expect(parameters).toEqual([7]);
  });

  test("findOne retorna undefined quando a disciplina não existe", async () => {
    query.mockResolvedValueOnce({ rows: [] });

    await expect(repository.findOne(7)).resolves.toBeUndefined();
  });

  test.each(["create", "findAll", "findOne"] as const)(
    "%s propaga a mesma instância de Error recebida de query",
    async (method) => {
      const error = new Error("Falha ao consultar disciplinas");
      query.mockRejectedValueOnce(error);
      const operations = {
        create: () => repository.create({ name: "Qualidade" }),
        findAll: () => repository.findAll(),
        findOne: () => repository.findOne(7),
      };

      await expect(operations[method]()).rejects.toBe(error);
      expect(query).toHaveBeenCalledTimes(1);
    },
  );
});
