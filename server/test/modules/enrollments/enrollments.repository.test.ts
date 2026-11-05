import type { Database } from "../../../src/database/connection";
import { PgEnrollmentRepository } from "../../../src/modules/enrollments/enrollments.repository";

const normalizeSql = (sql: string) => sql.replace(/\s+/g, " ").trim();

describe("PgEnrollmentRepository", () => {
  let query: jest.MockedFunction<Database["query"]>;
  let repository: PgEnrollmentRepository;

  beforeEach(() => {
    query = jest.fn();
    const database: Database = { query };
    repository = new PgEnrollmentRepository(database);
  });

  test("create retorna os campos camelCase e a data e insere RA e curso na ordem correta", async () => {
    const enrolledAt = new Date("2026-01-15T12:00:00.000Z");
    const enrollment = { studentRa: 123, courseId: 7, enrolledAt };
    query.mockResolvedValueOnce({ rows: [enrollment] });

    const result = await repository.create(123, 7);

    expect(result).toBe(enrollment);
    expect(result).toEqual({ studentRa: 123, courseId: 7, enrolledAt });
    expect(result.enrolledAt).toBe(enrolledAt);
    expect(query).toHaveBeenCalledTimes(1);
    const [sql, parameters] = query.mock.calls[0];
    expect(normalizeSql(sql)).toBe(
      'INSERT INTO enrollments (student_ra, course_id) VALUES ($1, $2) RETURNING student_ra AS "studentRa", course_id AS "courseId", enrolled_at AS "enrolledAt"',
    );
    expect(parameters).toEqual([123, 7]);
  });

  test("findAll retorna as matrículas com aliases e data e ordena por RA e curso, sem parâmetros", async () => {
    const enrolledAt = new Date("2026-01-15T12:00:00.000Z");
    const enrollments = [
      { studentRa: 123, courseId: 7, enrolledAt },
      { studentRa: 456, courseId: 8, enrolledAt },
    ];
    query.mockResolvedValueOnce({ rows: enrollments });

    const result = await repository.findAll();

    expect(result).toEqual(enrollments);
    expect(result[0]).toEqual({ studentRa: 123, courseId: 7, enrolledAt });
    expect(result[0].enrolledAt).toBe(enrolledAt);
    expect(query).toHaveBeenCalledTimes(1);
    const [sql] = query.mock.calls[0];
    expect(normalizeSql(sql)).toBe(
      'SELECT student_ra AS "studentRa", course_id AS "courseId", enrolled_at AS "enrolledAt" FROM enrollments ORDER BY student_ra, course_id',
    );
    expect(query.mock.calls[0]).toHaveLength(1);
  });

  test("findAll retorna uma lista vazia quando não há matrículas", async () => {
    query.mockResolvedValueOnce({ rows: [] });

    await expect(repository.findAll()).resolves.toEqual([]);
  });

  test("findOne retorna a primeira matrícula com aliases e data e filtra por RA e curso", async () => {
    const enrolledAt = new Date("2026-01-15T12:00:00.000Z");
    const enrollment = { studentRa: 123, courseId: 7, enrolledAt };
    query.mockResolvedValueOnce({
      rows: [enrollment, { studentRa: 456, courseId: 8, enrolledAt }],
    });

    const result = await repository.findOne(123, 7);

    expect(result).toBe(enrollment);
    expect(result).toEqual({ studentRa: 123, courseId: 7, enrolledAt });
    expect(result?.enrolledAt).toBe(enrolledAt);
    expect(query).toHaveBeenCalledTimes(1);
    const [sql, parameters] = query.mock.calls[0];
    expect(normalizeSql(sql)).toBe(
      'SELECT student_ra AS "studentRa", course_id AS "courseId", enrolled_at AS "enrolledAt" FROM enrollments WHERE student_ra = $1 AND course_id = $2',
    );
    expect(parameters).toEqual([123, 7]);
  });

  test("findOne retorna undefined quando a matrícula não existe", async () => {
    query.mockResolvedValueOnce({ rows: [] });

    await expect(repository.findOne(123, 7)).resolves.toBeUndefined();
  });

  test.each(["create", "findAll", "findOne"] as const)(
    "%s propaga a mesma instância de Error recebida de query",
    async (method) => {
      const error = new Error("Falha ao consultar matrículas");
      query.mockRejectedValueOnce(error);
      const operations = {
        create: () => repository.create(123, 7),
        findAll: () => repository.findAll(),
        findOne: () => repository.findOne(123, 7),
      };

      await expect(operations[method]()).rejects.toBe(error);
      expect(query).toHaveBeenCalledTimes(1);
    },
  );
});
