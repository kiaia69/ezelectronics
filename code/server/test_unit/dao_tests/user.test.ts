import { describe, test, expect, beforeAll, afterAll, jest, afterEach } from "@jest/globals";
import UserDAO from "../../src/dao/userDAO";
import db from "../../src/db/db";
import crypto from "crypto";
import { Database } from "sqlite3";
import { User } from "../../src/components/user";
import { UserNotFoundError, UserAlreadyExistsError } from "../../src/errors/userError";

jest.mock("crypto");
jest.mock("../../src/db/db.ts");

describe("UserDAOTest", () => {
  
  let userDAO: UserDAO;
  
  beforeAll(() => {
    userDAO = new UserDAO();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  afterAll(() => {
    jest.restoreAllMocks();
  });

  test("createUser - Create a user", async () => {
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql: string, params: any[], callback: (err: Error | null) => void) => {
      callback(null);
      return {} as Database;
    });
    const mockRandomBytes = jest.spyOn(crypto, "randomBytes").mockImplementation((size: number) => {
      return Buffer.from("salt");
    });
    const mockScrypt = jest.spyOn(crypto, "scrypt").mockImplementation(async (password, salt , keylen) => {
      return Buffer.from("hashedPassword");
    });
    const result = await userDAO.createUser("username", "name", "surname", "password", "role");
    expect(result).toBe(true);
    mockRandomBytes.mockRestore();
    mockDBRun.mockRestore();
    mockScrypt.mockRestore();
  });

  test("GetUsers - Retrieve all users", async () => {
    const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql: string, params: any[], callback: (err: Error | null, rows: any[]) => void) => {
      callback(null, [{ username: "user1", name: "John", surname: "Doe", role: "Customer", address: "123 Street", birthdate: "1990-01-01" }]);
      return {} as Database
    });
    const result = await userDAO.GetUsers(0, "");
    expect(result.length).toBe(1);
    expect(result[0].username).toBe("user1");
    mockDBAll.mockRestore();
  });

  test("GetUsers - Retrieve users by role", async () => {
    const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql: string, params: any[], callback: (err: Error | null, rows: any[]) => void) => {
      callback(null, [{ username: "user1", name: "John", surname: "Doe", role: "Manager", address: "123 Street", birthdate: "1990-01-01" }]);
      return {} as Database
    });
    const result = await userDAO.GetUsers(1, "Manager");
    expect(result.length).toBe(1);
    expect(result[0].username).toBe("user1");
    mockDBAll.mockRestore();
  });

  test("getUserByUsername - Retrieve user by username", async () => {
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql: string, params: any[], callback: (err: Error | null, row: any) => void) => {
      callback(null, { username: "user1", name: "John", surname: "Doe", role: "Manager", address: "123 Street", birthdate: "1990-01-01" });
      return {} as Database
    });
    const result = await userDAO.getUserByUsername("user1");
    expect(result.username).toBe("user1");
    expect(result.name).toBe("John");
    expect(result.surname).toBe("Doe");
    expect(result.role).toBe("Manager");
    expect(result.address).toBe("123 Street");
    expect(result.birthdate).toBe("1990-01-01");

    mockDBGet.mockRestore();
  });

  test("DeleteAll - Delete all users except Admin", async () => {
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql: string, params: any[], callback: (err: Error | null) => void) => {
      callback(null);
      return {} as Database
    });
    const result = await userDAO.DeleteAll();
    expect(result).toBe(true);
    mockDBRun.mockRestore();
  });

  test("EditUser - Edit user details", async () => {
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql: string, params: any[], callback: (err: Error | null, row: any) => void) => {
      callback(null, { username: "user1", name: "John", surname: "Doe", role: "Customer", address: "123 Street", birthdate: "1990-01-01" });
      return {} as Database
    });
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql: string, params: any[], callback: (err: Error | null) => void) => {
        callback.call({ changes: 1 }, null);
        return {} as Database
    });
    const mockDBGet2 = jest.spyOn(db, "get").mockImplementation((sql: string, params: any[], callback: (err: Error | null, row: any) => void) => {
        callback(null, { username: "user1", name: "John", surname: "Doe", role: "Customer", address: "456 Avenue", birthdate: "1990-01-01" });
        return {} as Database
      });

    const result = await userDAO.EditUser("user1", "John", "Doe", "456 Avenue", "1990-01-01");
    expect(result.username).toBe("user1");
    expect(result.address).toBe("456 Avenue");
    mockDBGet.mockRestore();
    mockDBGet2.mockRestore();
    mockDBRun.mockRestore();
  });

  test("DeleteUser - Delete a user by username", async () => {
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql: string, params: any[], callback: (err: Error | null) => void) => {
      callback(null);
      return {} as Database
    });
    const result = await userDAO.DeleteUser("user1");
    expect(result).toBe(true);
    mockDBRun.mockRestore();
  });

  test("getIsUserAuthenticated - Authenticate a user", async () => {
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql: string, params: any[], callback: (err: Error | null, row: any) => void) => {
      callback(null, { username: "user1", password: "hashedPassword", salt: "salt" });
      return {} as Database
    });
    const mockCrypto = jest.spyOn(crypto, "timingSafeEqual").mockReturnValue(true);
    const result = await userDAO.getIsUserAuthenticated("user1", "password");
    expect(result).toBe(true);
    mockDBGet.mockRestore();
    mockCrypto.mockRestore();
  });

  //GESTIRE ERRORI
  test("createUser - Handle database error", async () => {
    // Mock del comportamento del database per sollevare un errore generico durante l'esecuzione della query
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql: string, params: any[], callback: (err: Error | null) => void) => {
      const genericError = new Error("Generic database error");
      callback(genericError);
      return {} as Database
    });
    // Chiamata al metodo createUser
    await expect(userDAO.createUser("newuser", "John", "Doe", "password", "Customer")).rejects.toThrow(Error);
    // Ripristina il mock del database dopo il test
    mockDBRun.mockRestore();
  });

  test("createUser - Handle unique constraint error", async () => {
    // Mock del comportamento del database per sollevare un errore di vincolo univoco durante l'inserimento dell'utente
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql: string, params: any[], callback: (err: Error | null) => void) => {
      const uniqueConstraintError = new Error("UNIQUE constraint failed: users.username");
      callback(uniqueConstraintError);
      return {} as Database

    });
    // Chiamata al metodo createUser
    await expect(userDAO.createUser("existinguser", "John", "Doe", "password", "Customer")).rejects.toThrow(UserAlreadyExistsError);
    // Ripristina il mock del database dopo il test
    mockDBRun.mockRestore();
  });

  test("createUser - Handle crypto error", async () => {
    // Mock del comportamento del modulo crypto per sollevare un errore durante la generazione del salt
    const mockRandomBytes = jest.spyOn(crypto, "randomBytes").mockImplementation(() => {
      throw new Error("Crypto error");
    });
    // Chiamata al metodo createUser
    await expect(userDAO.createUser("newuser", "John", "Doe", "password", "Customer")).rejects.toThrow(Error);
    // Ripristina il mock del modulo crypto dopo il test
    mockRandomBytes.mockRestore();
  });

  test("GetUsers - Handle database error", async () => {
    // Mock del comportamento del database per sollevare un errore generico durante l'esecuzione della query
    const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql: string, params: any[], callback: (err: Error | null, rows: any[]) => void) => {
      const genericError = new Error("Generic database error");
      let rows = [1, 2, 3]; //indifferente
      callback(genericError, rows);
      return {} as Database
    });
    // Chiamata al metodo GetUsers
    await expect(userDAO.GetUsers(0, "")).rejects.toThrow(Error);
    // Ripristina il mock del database dopo il test
    mockDBAll.mockRestore();
  });

  test("GetUsers - Handle invalid filter value", async () => { //serve codice diverso per eseguirlo
    // Chiamata al metodo GetUsers con un valore di filtro non valido
    await expect(userDAO.GetUsers(2, "")).rejects.toThrow(Error);
  });

  test("DeleteAll - Handle database error", async () => {
    // Mock del comportamento del database per sollevare un errore generico durante l'esecuzione della query
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql: string, params: any[], callback: (err: Error | null) => void) => {
      const genericError = new Error("Generic database error");
      callback(genericError);
      return {} as Database
    });
    // Chiamata al metodo DeleteAll
    await expect(userDAO.DeleteAll()).rejects.toThrow(Error);
    // Ripristina il mock del database dopo il test
    mockDBRun.mockRestore();
  });

  test("DeleteAll - Handle connection error", async () => {
    // Mock del comportamento del database per simulare un errore di connessione
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql: string, params: any[], callback: (err: Error | null) => void) => {
      callback(new Error("Connection error"));
      return {} as Database
    });
    // Chiamata al metodo DeleteAll
    await expect(userDAO.DeleteAll()).rejects.toThrow(Error);
    // Ripristina il mock del database dopo il test
    mockDBRun.mockRestore();
  });

  test("DeleteUser - Handle database error", async () => {
    // Mock del comportamento del database per sollevare un errore generico durante l'esecuzione della query
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql: string, params: any[], callback: (err: Error | null) => void) => {
      const genericError = new Error("Generic database error");
      callback(genericError);
      return {} as Database
    });
    // Chiamata al metodo DeleteUser
    await expect(userDAO.DeleteUser("username")).rejects.toThrow(Error);
    // Ripristina il mock del database dopo il test
    mockDBRun.mockRestore();
  });

  test("DeleteUser - Handle user not found error", async () => {
    // Mock del comportamento del database per restituire un errore quando l'utente non è stato trovato
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql: string, params: any[], callback: (err: Error | null) => void) => {
      const userNotFoundError = new UserNotFoundError();
      callback(userNotFoundError);
      return {} as Database
    });
    // Chiamata al metodo DeleteUser
    await expect(userDAO.DeleteUser("username")).rejects.toThrow(UserNotFoundError);
    // Ripristina il mock del database dopo il test
    mockDBRun.mockRestore();
  });

  test("getIsUserAuthenticated - Handle database error", async () => {
    // Mock del comportamento del database per sollevare un errore generico durante l'esecuzione della query
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql: string, params: any[], callback: (err: Error | null, row: any) => void) => {
      const genericError = new Error("Generic database error");
      callback(genericError, null);
      return {} as Database
    });
    // Chiamata al metodo getIsUserAuthenticated
    await expect(userDAO.getIsUserAuthenticated("username", "password")).rejects.toThrow(Error);
    // Ripristina il mock del database dopo il test
    mockDBGet.mockRestore();
  });

  test("getIsUserAuthenticated - Handle user not found error", async () => {
    // Mock del comportamento del database per restituire un utente non trovato
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql: string, params: any[], callback: (err: Error | null, row: any) => void) => {
      callback(null, null);
      return {} as Database
    });
    // Chiamata al metodo getIsUserAuthenticated
    const result = await userDAO.getIsUserAuthenticated("nonexistent_username", "password");
    expect(result).toBe(false);
    // Ripristina il mock del database dopo il test
    mockDBGet.mockRestore();
  });

  test("getIsUserAuthenticated - Handle missing salt error", async () => {
    // Mock del comportamento del database per restituire un utente senza salt
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql: string, params: any[], callback: (err: Error | null, row: any) => void) => {
      callback(null, { username: "username", password: "hashedPassword" });
      return {} as Database
    });
    // Chiamata al metodo getIsUserAuthenticated
    const result = await userDAO.getIsUserAuthenticated("username", "password");
    expect(result).toBe(false);
    // Ripristina il mock del database dopo il test
    mockDBGet.mockRestore();
  });

  test("getIsUserAuthenticated - Handle password mismatch error", async () => {
    // Mock del comportamento del database per restituire un utente con un hash password diverso
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql: string, params: any[], callback: (err: Error | null, row: any) => void) => {
      const salt = "salt";
      const hashedPassword = "differentHashedPassword";
      callback(null, { username: "username", password: hashedPassword, salt: salt });
      return {} as Database
    });
    // Mock del comportamento di crypto.timingSafeEqual per restituire false
    const mockTimingSafeEqual = jest.spyOn(crypto, "timingSafeEqual").mockReturnValue(false);
    // Chiamata al metodo getIsUserAuthenticated
    const result = await userDAO.getIsUserAuthenticated("username", "password");
    expect(result).toBe(false);
    // Ripristina i mock dopo il test
    mockDBGet.mockRestore();
    mockTimingSafeEqual.mockRestore();
  });

  test("getUserByUsername - Handle database error", async () => {
    // Mock del comportamento del database per sollevare un errore generico durante l'esecuzione della query
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql: string, params: any[], callback: (err: Error | null, row: any) => void) => {
      const genericError = new Error("Generic database error");
      callback(genericError, null);
      return {} as Database
    });
    // Chiamata al metodo getUserByUsername
    await expect(userDAO.getUserByUsername("username")).rejects.toThrow(Error);
    // Ripristina il mock del database dopo il test
    mockDBGet.mockRestore();
  });

  test("getUserByUsername - Handle user not found error", async () => {
    // Mock del comportamento del database per restituire un utente non trovato
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql: string, params: any[], callback: (err: Error | null, row: any) => void) => {
      callback(null, null);
      return {} as Database
    });
    // Chiamata al metodo getUserByUsername
    await expect(userDAO.getUserByUsername("nonexistent_username")).rejects.toThrow(UserNotFoundError);
    // Ripristina il mock del database dopo il test
    mockDBGet.mockRestore();
  });

  //MANCA EDIT USER PERCHE LA FUNZIONE NEL DAO DEVE ESSERE AGGIUSTATA
});
