import { HttpError } from "../../../src/errors";
import type { CourseRepository } from "../../../src/modules/courses/courses.repository";
import { CoursesService } from "../../../src/modules/courses/courses.service";

describe("CoursesService", () => {
  let repository: jest.Mocked<CourseRepository>;
  let service: CoursesService;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
    };
    service = new CoursesService(repository);
  });

  test("create retorna a disciplina criada e chama o mock uma vez com o nome", async () => {
    const record = { id: 1, name: "Qualidade" };
    repository.create.mockResolvedValue(record);

    await expect(service.create({ name: "Qualidade" })).resolves.toBe(record);

    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith({ name: "Qualidade" });
  });

  test.each([
    ["corpo nulo", null],
    ["nome ausente", {}],
    ["nome curto", { name: "A" }],
  ])("create rejeita %s com HttpError 400 sem consultar o repositório", async (_scenario, input) => {
    const result = service.create(input);

    await expect(result).rejects.toBeInstanceOf(HttpError);
    await expect(result).rejects.toHaveProperty("statusCode", 400);
    expect(repository.create).not.toHaveBeenCalled();
  });

  test("create traduz nome duplicado em HttpError 409", async () => {
    repository.create.mockRejectedValue({ code: "23505" });

    const result = service.create({ name: "Qualidade" });

    await expect(result).rejects.toBeInstanceOf(HttpError);
    await expect(result).rejects.toHaveProperty("statusCode", 409);
  });

  test("findAll retorna a lista predefinida pelo stub e o consulta uma vez sem argumentos", async () => {
    const records = [
      { id: 1, name: "Qualidade" },
      { id: 2, name: "Programação" },
    ];
    // Como stub, o dublê fornece uma resposta conhecida para o serviço.
    repository.findAll.mockResolvedValue(records);

    await expect(service.findAll()).resolves.toBe(records);

    expect(repository.findAll).toHaveBeenCalledTimes(1);
    expect(repository.findAll).toHaveBeenCalledWith();
  });

  test("findOne retorna a disciplina existente e encaminha o ID 123 uma vez", async () => {
    const record = { id: 123, name: "Qualidade" };
    repository.findOne.mockResolvedValue(record);

    await expect(service.findOne(123)).resolves.toBe(record);

    expect(repository.findOne).toHaveBeenCalledTimes(1);
    expect(repository.findOne).toHaveBeenCalledWith(123);
  });

  test("findOne rejeita disciplina inexistente com HttpError 404", async () => {
    repository.findOne.mockResolvedValue(undefined);

    const result = service.findOne(123);

    await expect(result).rejects.toBeInstanceOf(HttpError);
    await expect(result).rejects.toHaveProperty("statusCode", 404);
    expect(repository.findOne).toHaveBeenCalledWith(123);
  });

  test("findOne rejeita ID zero com HttpError 400 sem consultar o repositório", async () => {
    const result = service.findOne(0);

    await expect(result).rejects.toBeInstanceOf(HttpError);
    await expect(result).rejects.toHaveProperty("statusCode", 400);
    expect(repository.findOne).not.toHaveBeenCalled();
  });

  test("create propaga a mesma instância de um erro inesperado", async () => {
    const error = new Error("Falha inesperada na criação");
    repository.create.mockRejectedValue(error);

    await expect(service.create({ name: "Qualidade" })).rejects.toBe(error);
  });

  test("findAll propaga a mesma instância de um erro inesperado", async () => {
    const error = new Error("Falha inesperada na listagem");
    repository.findAll.mockRejectedValue(error);

    await expect(service.findAll()).rejects.toBe(error);
  });

  test("findOne propaga a mesma instância de um erro inesperado", async () => {
    const error = new Error("Falha inesperada na busca");
    repository.findOne.mockRejectedValue(error);

    await expect(service.findOne(123)).rejects.toBe(error);
  });

  test("findOne retorna o registro e permite observar o método do stub com spy", async () => {
    const record = { id: 1, name: "Qualidade" };
    const stub: CourseRepository = {
      async create() { return record; },
      async findAll() { return [record]; },
      async findOne() { return record; },
    };
    const spy = jest.spyOn(stub, "findOne");
    const serviceWithStub = new CoursesService(stub);

    await expect(serviceWithStub.findOne(1)).resolves.toBe(record);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(1);
  });

  test("create encaminha somente name quando o corpo contém campos extras", async () => {
    const record = { id: 1, name: "Qualidade" };
    repository.create.mockResolvedValue(record);

    await expect(service.create({ name: "Qualidade", extra: true })).resolves.toBe(record);

    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith({ name: "Qualidade" });
  });
});
