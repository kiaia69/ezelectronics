import { describe, test, expect, beforeAll, afterAll, jest, afterEach } from "@jest/globals";
import crypto from "crypto"
import db from "../../src/db/db"
import { Database } from "sqlite3"
import ReviewController from "../../src/controllers/reviewController"
import ReviewDAO from "../../src/dao/reviewDAO"
import { ProductReview } from "../../src/components/review"
import { Role, User } from "../../src/components/user"
import { Category, Product } from "../../src/components/product";
import { ProductNotFoundError } from "../../src/errors/productError";
import { ExistingReviewError, NoReviewProductError } from "../../src/errors/reviewError";

describe("ReviewrDAOTest", () => {

    let reviewDAO: ReviewDAO;

    beforeAll(() => {
        reviewDAO = new ReviewDAO();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {
        jest.restoreAllMocks();
      });
    


    const utente = new User("g", "giulia", "df", Role.CUSTOMER, "indirizzo", "datadinascita");


    test("It should add a new review for a product", async () => {
        const reviewDAO = new ReviewDAO()
        const product: Product = {
            sellingPrice: 10,
            model: "model",
            category: Category.APPLIANCE,
            arrivalDate:  null,
            details: null,
            quantity: 2
        }
        jest.spyOn(reviewDAO, 'getProduct').mockResolvedValueOnce(product);  // Mock getProduct
        jest.spyOn(reviewDAO, 'getReview').mockResolvedValueOnce(false);  // Mock getReview

    // Mock del metodo db.run
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql: string, params: any[], callback: (err: Error | null) => void) => {
        callback(null);
        return {} as Database;
    });
     
        const result = await reviewDAO.addReview("model", "g", 4, "comment")
        expect(result).toBe(undefined)
        mockDBRun.mockRestore()

    })


    test("It should show the reviews of a product", async () => {
        let productReviews: ProductReview[] = [
            new ProductReview("modello1", "Giulia", 5, "2024-06-06", "Nice!"),
            new ProductReview("modello1", "Ciccio", 4, "2024-06-06", "Nice!")
        ];
    
        const reviewDAO = new ReviewDAO();
    
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql: string, params: any[], callback: (err: Error | null, rows: any[]) => void) => {
            callback(null, productReviews);
            return {} as Database;
        });
    
        const result = await reviewDAO.getProductReviews("modello1");
        expect(result).toEqual(productReviews);
    
        mockDBAll.mockRestore();
    });
    

    test("It should delete a review", async () => {

        const testReview = {
            model: "test",
            user: utente,
        };

        const reviewDAO = new ReviewDAO()
    
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql: string, params: any[], callback: (err: Error | null) => void) => {
            callback.call({ changes: 1 }, null);
            return {} as Database
        });
    

        const result = await reviewDAO.deleteReview("test", utente)
        expect(result).toBe(undefined)
        mockDBRun.mockRestore()

    })


    test("It should delete all reviews for a product", async () => {
        const reviewDAO = new ReviewDAO()

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql: string, params: any[], callback: (err: Error | null) => void) => {
            callback.call({ changes: 1 }, null);
            return {} as Database
        });
    

        const result = await reviewDAO.deleteReviewsOfProduct("modello1")
        expect(result).toBe(undefined)
        mockDBRun.mockRestore()

    })


    test("It should delete all reviews", async () => {

        const reviewDAO = new ReviewDAO()

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql: string, params: any[], callback: (err: Error | null) => void) => {
            callback.call({ changes: 1 }, null);
            return {} as Database
        });
    

        const result = await reviewDAO.deleteAllReviews()
        expect(result).toBe(undefined)
        mockDBRun.mockRestore()

    })




    test("addReview: should throw ProductNotFoundError if product does not exist", async () => {
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql: string, params: any[], callback: (err: Error | null) => void) => {
            callback(new ProductNotFoundError());
            return {} as Database
          });      

        await expect(reviewDAO.getProduct("model")).rejects.toThrowError(ProductNotFoundError)
    })


    test("addReview: should throw ExistingReviewError if review already exists", async () => {

        const product: Product = {
            sellingPrice: 200,
            model: "model",
            category: Category.APPLIANCE,
            arrivalDate:  null,
            details: null,
            quantity: 3
        }

        const mockDBGet1 = jest.spyOn(db, "get").mockImplementation((sql: string, params: any[], callback: (err: Error | null, rows: any) => void) => {
            callback(null, product);
            return {} as Database
          });     
          const mockDBGet2 = jest.spyOn(db, "get").mockImplementation((sql: string, params: any[], callback: (err: Error | null, rows: any) => void) => {
            callback(null, new ProductReview("model","",2,"",""));
            return {} as Database
          });     
    

        await expect(reviewDAO.addReview("model", "g", 4, "")).rejects.toThrowError(ExistingReviewError)
    })


    test("getProductReviews: should throw NoReviewProductError if review does not exist", async () => {

        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql: string, params: any[], callback: (err: Error | null, rows: any[]) => void) => {
            callback(new NoReviewProductError, []);
            return {} as Database
          });      

        await expect(reviewDAO.getProductReviews("model")).rejects.toThrowError(NoReviewProductError)        

    })

})
