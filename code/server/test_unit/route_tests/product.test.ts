import { describe, test, expect, beforeAll, afterAll, jest,afterEach } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"
import Authenticator from "../../src/routers/auth"

import ProductController from "../../src/controllers/productController"
import { EmptyProductStockError, LowProductStockError, ProductAlreadyExistsError, ProductNotFoundError } from "../../src/errors/productError"
import { DateError } from "../../src/utilities"
const baseURL = "/ezelectronics"

describe("productRoutesTest", () => {

    afterEach(() => {
        jest.restoreAllMocks();
    });

    //  Registerproduct route
    test("Register product: success 200", async () => {
        const testProduct = { 
            model: "test",
            category: "Smartphone",
            quantity: "1",
            details: "null",
            sellingPrice: "20",
            arrivalDate: "2024-07-06"
        }
        jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce(true) 
        
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            next()
        });
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            next()
        });
        
        const response = await request(app).post(baseURL + "/products").send(testProduct);
        expect(response.status).toBe(200);
        expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(1);
        expect(ProductController.prototype.registerProducts).toHaveBeenCalledWith(
            testProduct.model,
            testProduct.category,
            testProduct.quantity,
            testProduct.details,
            testProduct.sellingPrice,
            testProduct.arrivalDate);
    })

    test("Register product: 422 model empty", async () => {
        const testProduct = { 
            model: "",
            category: "Smartphone",
            quantity: "1",
            details: "null",
            sellingPrice: "20",
            arrivalDate: "2024-07-06"
        }
        
        const response = await request(app).post(baseURL + "/products").send(testProduct);
        expect(response.status).toBe(422);
    })

    test("Register product: 422 wrong category", async () => {
        const testProduct = { 
            model: "model",
            category: "not a category",
            quantity: "1",
            details: "null",
            sellingPrice: "20",
            arrivalDate: "2024-07-06"
        }
        
        const response = await request(app).post(baseURL + "/products").send(testProduct);
        expect(response.status).toBe(422);
    })

    test("Register product: 422 negative quanitity", async () => {
        const testProduct = { 
            model: "model",
            category: "Smartphone",
            quantity: "-1",
            details: "null",
            sellingPrice: "20",
            arrivalDate: "2024-07-06"
        }
        
        const response = await request(app).post(baseURL + "/products").send(testProduct);
        expect(response.status).toBe(422);
    })

    test("Register product: 422 negative sellingPrice", async () => {
        const testProduct = { 
            model: "model",
            category: "Smartphone",
            quantity: "5",
            details: "null",
            sellingPrice: "-20",
            arrivalDate: "2024-07-06"
        }
        
        const response = await request(app).post(baseURL + "/products").send(testProduct);
        expect(response.status).toBe(422);
    })

    test("Register product: 422 wrong date format", async () => {
        const testProduct = { 
            model: "model",
            category: "Smartphone",
            quantity: "5",
            details: "null",
            sellingPrice: "20",
            arrivalDate: "2024-14-06"
        }
        
        const response = await request(app).post(baseURL + "/products").send(testProduct);
        expect(response.status).toBe(422);
    })

    test("Register product: 401 user not logged in", async () => {
        const testProduct = { 
            model: "test",
            category: "Smartphone",
            quantity: "1",
            details: "null",
            sellingPrice: "20",
            arrivalDate: "2024-07-06"
        }
        const response = await request(app).post(baseURL + "/products").send(testProduct);
        expect(response.status).toBe(401);
    })

    test("Register product: 401 user not admin or manager", async () => {
        const testProduct = { 
            model: "test",
            category: "Smartphone",
            quantity: "1",
            details: "null",
            sellingPrice: "20",
            arrivalDate: "2024-07-06"
        }
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            next()
        });

        const response = await request(app).post(baseURL + "/products").send(testProduct);
        expect(response.status).toBe(401);
    })

    test("Register product: 409 product already exists", async () => {
        const testProduct = { 
            model: "test",
            category: "Smartphone",
            quantity: "1",
            details: "null",
            sellingPrice: "20",
            arrivalDate: "2024-07-06"
        }
        jest.spyOn(ProductController.prototype, "registerProducts").mockRejectedValueOnce(new ProductAlreadyExistsError()) 
        
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            next()
        });
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            next()
        });
        
        const response = await request(app).post(baseURL + "/products").send(testProduct);
        expect(response.status).toBe(409);
        expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(1);
    })

    test("Register product: 400 impossible date", async () => {
        const testProduct = { 
            model: "test",
            category: "Smartphone",
            quantity: "1",
            details: "null",
            sellingPrice: "20",
            arrivalDate: "2024-07-06"
        }
        jest.spyOn(ProductController.prototype, "registerProducts").mockRejectedValueOnce(new DateError()) 
        
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            next()
        });
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            next()
        });
        
        const response = await request(app).post(baseURL + "/products").send(testProduct);
        expect(response.status).toBe(400);
        expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(1);
    })

    // ChangeProductQuantity route
    test("Change product product: success 200", async () => {
        const model ="model";
        const testProduct = {
             quantity: "10", 
             changeDate: "2024-06-07"
            }
        jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValueOnce(20) 
        
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            next()
        });
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            next()
        });
        
        const response = await request(app).patch(baseURL + "/products"+ "/"+ model).send(testProduct);
        expect(response.status).toBe(200);
        expect(response.body.quantity).toBe(20)
        expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(1);
        expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledWith(model,testProduct.quantity,testProduct.changeDate);
    })

    test("Change product product: 404 product not found", async () => {
        const model ="model";
        const testProduct = {
             quantity: "10", 
             changeDate: "2024-06-07"
            }
        jest.spyOn(ProductController.prototype, "changeProductQuantity").mockRejectedValueOnce(new ProductNotFoundError()) 
        
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            next()
        });
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            next()
        });
        
        const response = await request(app).patch(baseURL + "/products"+ "/"+ model).send(testProduct);
        expect(response.status).toBe(404);
        expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(1);
    })

    test("Change product quantity: 400 impossible date", async () => {
        const model ="model";
        const testProduct = {
             quantity: "10", 
             changeDate: "2024-06-07"
            }
        jest.spyOn(ProductController.prototype, "changeProductQuantity").mockRejectedValueOnce(new DateError()) 
        
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            next()
        });
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            next()
        });
        
        const response = await request(app).patch(baseURL + "/products"+ "/"+ model).send(testProduct);
        expect(response.status).toBe(400);
        expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(1);
    })

    // Sell Product
    test("Sell product: success 200", async () => {
        const model ="model";
        const testProduct = {
             quantity: "10", 
             sellingDate: "2024-06-07"
            }
        jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValueOnce(20) 
        
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            next()
        });
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            next()
        });
        
        const response = await request(app).patch(baseURL + "/products"+ "/"+ model + "/sell").send(testProduct);
        expect(response.status).toBe(200);
        expect(response.body.quantity).toBe(20)
        expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1);
        expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith(model,testProduct.quantity,testProduct.sellingDate);
    })

    test("Sell product: 404 product not foud", async () => {
        const model ="model";
        const testProduct = {
             quantity: "10", 
             sellingDate: "2024-06-07"
            }
        jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValueOnce(new ProductNotFoundError()) 
        
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            next()
        });
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            next()
        });
        
        const response = await request(app).patch(baseURL + "/products"+ "/"+ model + "/sell").send(testProduct);
        expect(response.status).toBe(404);
        expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1);
    })

    test("Sell product: 400 impossible date", async () => {
        const model ="model";
        const testProduct = {
             quantity: "10", 
             sellingDate: "2024-06-07"
            }
        jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValueOnce(new DateError()) 
        
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            next()
        });
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            next()
        });
        
        const response = await request(app).patch(baseURL + "/products"+ "/"+ model + "/sell").send(testProduct);
        expect(response.status).toBe(400);
        expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1);
    })

    test("Sell product: 409 low product stock", async () => {
        const model ="model";
        const testProduct = {
             quantity: "10", 
             sellingDate: "2024-06-07"
            }
        jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValueOnce(new LowProductStockError()) 
        
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            next()
        });
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            next()
        });
        
        const response = await request(app).patch(baseURL + "/products"+ "/"+ model + "/sell").send(testProduct);
        expect(response.status).toBe(409);
        expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1);
    })

    test("Sell product: 409 empty stock", async () => {
        const model ="model";
        const testProduct = {
             quantity: "10", 
             sellingDate: "2024-06-07"
            }
        jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValueOnce(new EmptyProductStockError()) 
        
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            next()
        });
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            next()
        });
        
        const response = await request(app).patch(baseURL + "/products"+ "/"+ model + "/sell").send(testProduct);
        expect(response.status).toBe(409);
        expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1);
    })

    // get Products 
    test("get Products: success 200", async () => {
        const testProduct = { }
        jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([]) 
        
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            next()
        });
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            next()
        });
        
        const response = await request(app).get(baseURL + "/products").query(testProduct);
        expect(response.status).toBe(200);
        expect(response.body).toEqual([])
        expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(1);
        expect(ProductController.prototype.getProducts).toHaveBeenCalledWith(null,null,null);
    })

    test("get Products: 404 product not found", async () => {
        const testProduct = { 
            grouping: "model",
            model: "model",
        }
        jest.spyOn(ProductController.prototype, "getProducts").mockRejectedValueOnce(new ProductNotFoundError()) 
        
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            next()
        });
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            next()
        });
        
        const response = await request(app).get(baseURL + "/products").query(testProduct);
        expect(response.status).toBe(404);
        expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(1);
        expect(ProductController.prototype.getProducts).toHaveBeenCalledWith(testProduct.grouping,null,testProduct.model);
    })

    test("get Products: 422 grouping null category no", async () => {
        const testProduct = { 
            grouping: null as string | null,
            category: "SmartPhone"
        }
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            next()
        });
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            next()
        });
        
        const response = await request(app).get(baseURL + "/products").query(testProduct);
        expect(response.status).toBe(422);
    })

    test("get Products: 422 grouping null model no", async () => {
        const testProduct = { 
            grouping: null as string | null,
            model: "model"
        }
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            next()
        });
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            next()
        });
        
        const response = await request(app).get(baseURL + "/products").query(testProduct);
        expect(response.status).toBe(422);
    })

    test("get Products: 422 grouping category category null", async () => {
        const testProduct = { 
            grouping: "category",
            category: null as string | null,
        }
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            next()
        });
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            next()
        });
        
        const response = await request(app).get(baseURL + "/products").query(testProduct);
        expect(response.status).toBe(422);
    })

    test("get Products: 422 grouping category model not null", async () => {
        const testProduct = { 
            grouping: "category",
            category: "Smartphone",
            model : "model"
        }
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            next()
        });
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            next()
        });
        
        const response = await request(app).get(baseURL + "/products").query(testProduct);
        expect(response.status).toBe(422);
    })

    // get Available Products 
    test("get Available Products: success 200", async () => {
        const testProduct = { }
        jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValueOnce([]) 
        
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            next()
        });
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            next()
        });
        
        const response = await request(app).get(baseURL + "/products/available").query(testProduct);
        expect(response.status).toBe(200);
        expect(response.body).toEqual([])
        expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(1);
        expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledWith(null,null,null);
    })

    test("get Available Products: 404 product not found", async () => {
        const testProduct = { 
            grouping: "model",
            model: "model",
        }
        jest.spyOn(ProductController.prototype, "getAvailableProducts").mockRejectedValueOnce(new ProductNotFoundError()) 
        
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            next()
        });
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            next()
        });
        
        const response = await request(app).get(baseURL + "/products/available").query(testProduct);
        expect(response.status).toBe(404);
        expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(1);
        expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledWith(testProduct.grouping,null,testProduct.model);
    })

    test("get Available Products: 422 category not a category", async () => {
        const testProduct = { 
            grouping: "category",
            category: "Smartphones",
        }
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            next()
        });
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            next()
        });
        
        const response = await request(app).get(baseURL + "/products/available").query(testProduct);
        expect(response.status).toBe(422);
    })

    // Delete All products
    test("Delete All products: 200 success", async () => {
        jest.spyOn(ProductController.prototype, "deleteAllProducts").mockResolvedValueOnce(true) 
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            next()
        });
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            next()
        });
        
        const response = await request(app).delete(baseURL + "/products")
        expect(response.status).toBe(200);
        expect(ProductController.prototype.deleteAllProducts).toHaveBeenCalledTimes(1);
    })

    test("Delete All products: error", async () => {
        jest.spyOn(ProductController.prototype, "deleteAllProducts").mockRejectedValueOnce(new Error()) 
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            next()
        });
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            next()
        });
        
        const response = await request(app).delete(baseURL + "/products")
        expect(response.status).toBe(503);
        expect(ProductController.prototype.deleteAllProducts).toHaveBeenCalledTimes(1);
    })

    // Delete product
    test("Delete product: 200 success", async () => {
        const param ="model";
        jest.spyOn(ProductController.prototype, "deleteProduct").mockResolvedValueOnce(true) 
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            next()
        });
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            next()
        });
        
        const response = await request(app).delete(baseURL + "/products" +"/" + param)
        expect(response.status).toBe(200);
        expect(ProductController.prototype.deleteProduct).toHaveBeenCalledTimes(1);
        expect(ProductController.prototype.deleteProduct).toHaveBeenCalledWith(param)
    })

    test("Delete product: 404 product not found", async () => {
        const param ="model";
        jest.spyOn(ProductController.prototype, "deleteProduct").mockRejectedValueOnce(new ProductNotFoundError()) 
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            next()
        });
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            next()
        });
        
        const response = await request(app).delete(baseURL + "/products" +"/" + param)
        expect(response.status).toBe(404);
        expect(ProductController.prototype.deleteProduct).toHaveBeenCalledTimes(1);
        expect(ProductController.prototype.deleteProduct).toHaveBeenCalledWith(param)
    })
})