import { HttpError } from "../../../src/errors";
import type { EnrollmentRepository } from "../../../src/modules/enrollments/enrollments.repository";
import { EnrollmentsService } from "../../../src/modules/enrollments/enrollments.service";

describe("EnrollmentsService", () => {
  let repository: jest.Mocked<EnrollmentRepository>;
  let service: EnrollmentsService;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
    };
    service = new EnrollmentsService(repository);
  });

  test("create retorna a matrícula e encaminha RA e ID como argumentos separados nessa ordem", async () => {
    const record = {
      studentRa: 123,
      courseId: 1,
      enrolledAt: new Date("2026-01-15T12:00:00.000Z"),
    };
    repository.create.mockResolvedValue(record);

    await expect(service.create({ studentRa: 123, courseId: 1 })).resolves.toBe(record);

    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith(123, 1);
  });

  test.each([
    ["RA zero", { studentRa: 0, courseId: 1 }],
    ["ID do curso zero", { studentRa: 123, courseId: 0 }],
  ])("create rejeita %s com HttpError 400 sem consultar o repositório", async (_scenario, input) => {
    const result = service.create(input);

    await expect(result).rejects.toBeInstanceOf(HttpError);
    await expect(result).rejects.toHaveProperty("statusCode", 400);
    expect(repository.create).not.toHaveBeenCalled();
  });

  test("create traduz referência inexistente em HttpError 404", async () => {
    repository.create.mockRejectedValue({ code: "23503" });

    const result = service.create({ studentRa: 123, courseId: 1 });

    await expect(result).rejects.toBeInstanceOf(HttpError);
    await expect(result).rejects.toHaveProperty("statusCode", 404);
  });

  test("create traduz matrícula duplicada em HttpError 409", async () => {
    repository.create.mockRejectedValue({ code: "23505" });

    const result = service.create({ studentRa: 123, courseId: 1 });

    await expect(result).rejects.toBeInstanceOf(HttpError);
    await expect(result).rejects.toHaveProperty("statusCode", 409);
  });

  test("findOne rejeita matrícula inexistente com HttpError 404 e encaminha as chaves na ordem correta", async () => {
    repository.findOne.mockResolvedValue(undefined);

    const result = service.findOne(123, 1);

    await expect(result).rejects.toBeInstanceOf(HttpError);
    await expect(result).rejects.toHaveProperty("statusCode", 404);
    expect(repository.findOne).toHaveBeenCalledTimes(1);
    expect(repository.findOne).toHaveBeenCalledWith(123, 1);
  });

  test("create propaga a mesma instância de um erro inesperado", async () => {
    const error = new Error("Falha inesperada na criação");
    repository.create.mockRejectedValue(error);

    await expect(service.create({ studentRa: 123, courseId: 1 })).rejects.toBe(error);
  });

  test("findAll retorna a lista de matrículas e consulta o repositório uma vez sem argumentos", async () => {
    const records = [
      { studentRa: 123, courseId: 1, enrolledAt: new Date("2026-01-15T12:00:00.000Z") },
      { studentRa: 456, courseId: 2, enrolledAt: new Date("2026-01-16T12:00:00.000Z") },
    ];
    repository.findAll.mockResolvedValue(records);

    await expect(service.findAll()).resolves.toBe(records);

    expect(repository.findAll).toHaveBeenCalledTimes(1);
    expect(repository.findAll).toHaveBeenCalledWith();
  });

  test("findOne retorna a matrícula existente e encaminha RA e ID uma vez", async () => {
    const record = {
      studentRa: 123,
      courseId: 1,
      enrolledAt: new Date("2026-01-15T12:00:00.000Z"),
    };
    repository.findOne.mockResolvedValue(record);

    await expect(service.findOne(123, 1)).resolves.toBe(record);

    expect(repository.findOne).toHaveBeenCalledTimes(1);
    expect(repository.findOne).toHaveBeenCalledWith(123, 1);
  });
});
