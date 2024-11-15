import { describe, test, expect, beforeAll, afterAll, jest,afterEach } from "@jest/globals"

import ProductDAO from "../../src/dao/productDAO"
import db from "../../src/db/db"
import { Database } from "sqlite3"
import { Category, Product } from "../../src/components/product";
import { ProductNotFoundError, ProductAlreadyExistsError} from "../../src/errors/productError";
import dayjs from "dayjs";
import { DateError } from "../../src/utilities";

jest.mock("../../src/db/db.ts");

describe("productDAOTest", () => {
  
    let productDAO: ProductDAO;
    
    beforeAll(() => {
      productDAO = new ProductDAO();
    });
    
    afterEach(() => {
      jest.restoreAllMocks();
    });

    // Register product tests 
    test("correctly registering a new product", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null)
            return {} as Database
        });
  
        const result = await productDAO.registerProducts("model", "category", 0, null, 0,null)
        expect(result).toBe(true)
    
    })

    test("registering a new product : date in future", async () => {
      const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');;      

      await expect(productDAO.registerProducts("model", "category", 0, null, 0,tomorrow)).rejects.toThrowError(DateError)
    })

    test("registering a new product : failure already registered", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql: string, params: any[], callback: (err: Error | null) => void) => {
            const uniqueConstraintError = new Error("UNIQUE constraint failed: ProductDescriptor.model");
            callback(uniqueConstraintError);
            return {} as Database
          });      

        await expect(productDAO.registerProducts("model", "category", 0, null, 0,null)).rejects.toThrowError(ProductAlreadyExistsError)
    })

    test("registering a new product : generic failure", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql: string, params: any[], callback: (err: Error | null) => void) => {
            callback(new Error());
            return {} as Database
          });      

        await expect(productDAO.registerProducts("model", "category", 0, null, 0,null)).rejects.toThrowError()
    })

    // changeProductQuantity tests

    test("correctly updating a  product", async () => {
      const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
          callback(null)
          return {} as Database
      });

      await expect(productDAO.changeProductQuantity("model", 10, "2024-06-07")).resolves.toBeUndefined();
    })

    test("error updating a  product", async () => {
      const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
          callback(new Error())
          return {} as Database
      });

      await expect(productDAO.changeProductQuantity("model", 10, "2024-06-07")).rejects.toThrowError();
    })   
    
    // get product tests
    test("correctly get products", async () => {
      const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        callback(null, [{
          selling_price: "0",
          model: "model",
          category: "Smartphone",
          arrival_date: null,
          details: null,
          quantity: "0"
        },
        {
          selling_price: "0",
          model: "model2",
          category: "Smartphone",
          arrival_date: null,
          details: null,
          quantity: "0"
        },
      ]);
        return {} as Database;
      });

      const expectedProducts = [
        new Product( 0, "model","Smartphone" as Category,null,null,0 ),
        new Product( 0, "model2","Smartphone" as Category,null,null,0 )
      ];
    
      const result = await productDAO.getProducts("category","Smartphone",null);
      expect(result).toEqual(expectedProducts); 
      expect(result.length).toBe(2)
    });
    
    test("getProducts: product not found error", async () => {
      const mockDBGet = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        callback(null,[]);
        return {} as Database
      });
    
      await expect(productDAO.getProducts("model",null,"model1")).rejects.toThrowError(ProductNotFoundError)
    });

    test("getProducts: generic faillure", async () => {
      const mockDBGet = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        callback(new Error());
        return {} as Database
      });
    
      await expect(productDAO.getProducts(null,null,null)).rejects.toThrowError()
    });

    // get Available products tests
    test("correctly get available products", async () => {
      const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        callback(null, [{
          selling_price: "0",
          model: "model",
          category: "Smartphone",
          arrival_date: null,
          details: null,
          quantity: "20"
        },
        {
          selling_price: "0",
          model: "model2",
          category: "Smartphone",
          arrival_date: null,
          details: null,
          quantity: "15"
        },
      ]);
        return {} as Database;
      });

      const expectedProducts = [
        new Product( 0, "model","Smartphone" as Category,null,null,20 ),
        new Product( 0, "model2","Smartphone" as Category,null,null,15 )
      ];
    
      const result = await productDAO.getAvailableProducts("category","Smartphone",null);
      expect(result).toEqual(expectedProducts); 
      expect(result.length).toBe(2)
    });
    
    test("getAvailableProducts: product not found error", async () => {
      const mockDBGet = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        callback(null,[]);
        return {} as Database
      });
    
      await expect(productDAO.getAvailableProducts("model",null,"model1")).rejects.toThrowError(ProductNotFoundError)
    });

    test("getAvailableProducts: generic faillure", async () => {
      const mockDBGet = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        callback(new Error());
        return {} as Database
      });
    
      await expect(productDAO.getAvailableProducts(null,null,null)).rejects.toThrowError()
    });
    
    // Delete product
    test("correctly deleting a  product", async () => {
      const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback.call({changes : 1},null);
          return {} as Database
      });

      const result = await productDAO.deleteProduct("model")
      expect(result).toBe(true)
  
    })

    test("error deleting a  product", async () => {
      const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
          callback.call({changes : 0},null);
          return {} as Database
      });

      await expect(productDAO.deleteProduct("model")).rejects.toThrowError(ProductNotFoundError)
    })

    // Deleting all product
    test("correctly deleting all products", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null)
            return {} as Database
        });
    
        const result = await productDAO.deleteAllProducts();
        expect(result).toBe(true)
    })
    
    test("error deleting all products", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error())
            return {} as Database
        });
    
        await expect(productDAO.deleteAllProducts()).rejects.toThrowError()
    })
})
  