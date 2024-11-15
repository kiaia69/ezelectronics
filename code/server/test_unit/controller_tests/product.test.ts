import { describe, test, expect, beforeAll, afterAll, jest,afterEach } from "@jest/globals"
import ProductController from "../../src/controllers/productController"
import ProductDAO from "../../src/dao/productDAO"
import { Category, Product } from "../../src/components/product";
import { ProductNotFoundError, ProductAlreadyExistsError, ProductSoldError, EmptyProductStockError, LowProductStockError } from "../../src/errors/productError";

import dayjs from "dayjs";
import { DateError } from "../../src/utilities";

describe("productControllerTest", () => {
  
    let productController: ProductController;
    
    beforeAll(() => {
      productController= new ProductController();
    });
    
    afterEach(() => {
      jest.restoreAllMocks();
    });

    // register products
    test("Register Product", async () => {
        jest.spyOn(ProductDAO.prototype, "registerProducts").mockResolvedValueOnce(true); 
      
        const result = await productController.registerProducts( "model", "Smartphone",1,null,10,null)
        expect(ProductDAO.prototype.registerProducts).toHaveBeenCalledTimes(1);
        expect(ProductDAO.prototype.registerProducts).toHaveBeenCalledWith("model","Smartphone",1,null,10,null);
        expect(result).toBe(true)
    })


     // ChangeProductQuantity 
    test("Change Product Quantity: correctly getting the quantity", async () => {
        const product = new Product( 0, "model", "Smartphone" as Category,null,null,10)
        jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValueOnce([product]); 
      
        const result = await productController.changeProductQuantity("model", 10, null)
        expect(result).toBe(20)
    })

    test("Change Product Quantity: Date error, date in future", async () => {
        const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');
        await expect(productController.changeProductQuantity("model", 10, tomorrow)).rejects.toThrowError(DateError)
    })

    test("Change Product Quantity: Date error, date before arrival date", async () => {
        const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');
        const product = new Product( 0, "model", "Smartphone" as Category,tomorrow,null,10)
        jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValueOnce([product]);

        const today = dayjs().format('YYYY-MM-DD');
        await expect(productController.changeProductQuantity("model", 10, today)).rejects.toThrowError(DateError)
    })

    test("Change Product Quantity: Product not found error", async () => {
        jest.spyOn(ProductDAO.prototype, "getProducts").mockRejectedValue(new Error()); 
        await expect(productController.changeProductQuantity("model", 10, null)).rejects.toThrowError(ProductNotFoundError)
    })

    // Sell Product
    test("Sell Product: correctly getting the quantity", async () => {
        const product = new Product( 0, "model", "Smartphone" as Category,null,null,10)
        jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValueOnce([product]); 
      
        const result = await productController.sellProduct("model", 10, null)
        expect(result).toBe(0)
    }) 

    test("Sell product: Date error, date in future", async () => {
        const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');
        await expect(productController.sellProduct("model", 10, tomorrow)).rejects.toThrowError(DateError)
    })

    test("Sell product: Date error, date before arrival date", async () => {
        const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');
        const product = new Product( 0, "model", "Smartphone" as Category,tomorrow,null,10)
        jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValueOnce([product]);

        const today = dayjs().format('YYYY-MM-DD');
        await expect(productController.sellProduct("model", 10, today)).rejects.toThrowError(DateError)
    })

    test("Sell Product: Empty product stock error", async () => {
        const product = new Product( 0, "model", "Smartphone" as Category,null,null,0)
        jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValueOnce([product]); 
      
        await expect(productController.sellProduct("model", 10, null)).rejects.toThrowError(EmptyProductStockError)
    }) 

    test("Sell Product: Empty product stock error", async () => {
        const product = new Product( 0, "model", "Smartphone" as Category,null,null,5)
        jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValueOnce([product]); 
      
        await expect(productController.sellProduct("model", 10, null)).rejects.toThrowError(LowProductStockError)
    }) 

    test("Sell product: Product not found error", async () => {
        jest.spyOn(ProductDAO.prototype, "getProducts").mockRejectedValue(new Error()); 
        await expect(productController.sellProduct("model", 10, null)).rejects.toThrowError(ProductNotFoundError)
    })

    // getProducts
    test("get Products", async () => {
        const product1 = new Product( 0, "model", "Smartphone" as Category,null,null,5)
        const product2 = new Product( 0, "model2", "Smartphone" as Category,null,null,5)
        jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValueOnce([product1,product2]); 
      
        const result = await productController.getProducts(null,null,null)
        expect(result).toEqual([product1,product2])
    }) 

    // get Available products
    test("get Products", async () => {
        const product1 = new Product( 0, "model", "Smartphone" as Category,null,null,5)
        const product2 = new Product( 0, "model2", "Smartphone" as Category,null,null,5)
        jest.spyOn(ProductDAO.prototype, "getAvailableProducts").mockResolvedValueOnce([product1,product2]); 
      
        const result = await productController.getAvailableProducts(null,null,null)
        expect(result).toEqual([product1,product2])
    }) 

    // delete Product
    test("delete Product", async () => {
        jest.spyOn(ProductDAO.prototype, "deleteProduct").mockResolvedValueOnce(true); 
      
        const result = await productController.deleteProduct("model")
        expect(result).toBe(true)
    }) 

    // delete all Product
    test("delete All Products", async () => {
        jest.spyOn(ProductDAO.prototype, "deleteAllProducts").mockResolvedValueOnce(true); 
      
        const result = await productController.deleteAllProducts()
        expect(result).toBe(true)
    }) 

})