import { HttpError } from "../../../src/errors";
import type { StudentRepository } from "../../../src/modules/students/students.repository";
import { StudentsService } from "../../../src/modules/students/students.service";

describe("StudentsService", () => {
  let repository: jest.Mocked<StudentRepository>;
  let service: StudentsService;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
    };
    service = new StudentsService(repository);
  });

  test("create retorna o aluno criado e encaminha RA e nome uma vez", async () => {
    const record = { ra: 123, name: "Ana" };
    repository.create.mockResolvedValue(record);

    await expect(service.create({ ra: 123, name: "Ana" })).resolves.toBe(record);

    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith({ ra: 123, name: "Ana" });
  });

  test("create rejeita RA zero com HttpError 400 sem consultar o repositório", async () => {
    const result = service.create({ ra: 0, name: "Ana" });

    await expect(result).rejects.toBeInstanceOf(HttpError);
    await expect(result).rejects.toHaveProperty("statusCode", 400);
    expect(repository.create).not.toHaveBeenCalled();
  });

  test("create traduz RA duplicado em HttpError 409", async () => {
    repository.create.mockRejectedValue({ code: "23505" });

    const result = service.create({ ra: 123, name: "Ana" });

    await expect(result).rejects.toBeInstanceOf(HttpError);
    await expect(result).rejects.toHaveProperty("statusCode", 409);
  });

  test("findOne rejeita aluno inexistente com HttpError 404", async () => {
    repository.findOne.mockResolvedValue(undefined);

    const result = service.findOne(123);

    await expect(result).rejects.toBeInstanceOf(HttpError);
    await expect(result).rejects.toHaveProperty("statusCode", 404);
    expect(repository.findOne).toHaveBeenCalledWith(123);
  });

  test("create propaga a mesma instância de um erro inesperado", async () => {
    const error = new Error("Falha inesperada na criação");
    repository.create.mockRejectedValue(error);

    await expect(service.create({ ra: 123, name: "Ana" })).rejects.toBe(error);
  });

  test("findAll retorna a lista de alunos e consulta o repositório uma vez sem argumentos", async () => {
    const records = [
      { ra: 123, name: "Ana" },
      { ra: 456, name: "Bruno" },
    ];
    repository.findAll.mockResolvedValue(records);

    await expect(service.findAll()).resolves.toBe(records);

    expect(repository.findAll).toHaveBeenCalledTimes(1);
    expect(repository.findAll).toHaveBeenCalledWith();
  });

  test("findOne retorna o aluno existente e encaminha o RA 123 uma vez", async () => {
    const record = { ra: 123, name: "Ana" };
    repository.findOne.mockResolvedValue(record);

    await expect(service.findOne(123)).resolves.toBe(record);

    expect(repository.findOne).toHaveBeenCalledTimes(1);
    expect(repository.findOne).toHaveBeenCalledWith(123);
  });
});
