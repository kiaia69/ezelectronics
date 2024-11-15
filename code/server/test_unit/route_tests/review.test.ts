import { test, expect, jest, describe, beforeEach, afterEach } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"
//import { afterEach, describe } from "node:test"
import { Role, User } from "../../src/components/user"
import ReviewController from "../../src/controllers/reviewController"
import { ProductReview } from "../../src/components/review"
import Authenticator from "../../src/routers/auth"
import { ExistingReviewError } from "../../src/errors/reviewError"
import { ProductNotFoundError } from "../../src/errors/productError"
import reviewDAO from "../../src/dao/reviewDAO"
import { Category, Product } from "../../src/components/product"
import { param } from "express-validator"
const baseURL = "/ezelectronics"

describe("ReviewRouteTest", () => {

    afterEach(() => {
        jest.restoreAllMocks();
    });


    test("It should add a new review for a product", async () => {

        const utente = new User("g", "giulia", "df", Role.CUSTOMER, "indirizzo", "datadinascita");

        const testReview: ProductReview = { //Test review object
            model: "test",
            user: utente.username,
            score: 4,
            date: "02/06/2024",
            comment: "test",
        }


        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = utente;
            next()
        });
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
            req.user = utente;
            next()
        });


        jest.spyOn(ReviewController.prototype, "addReview").mockResolvedValueOnce() //Mock the addReview method of the controller
        const response = await request(app).post(baseURL + "/reviews/" + testReview.model).send({
            score: testReview.score,
            comment: testReview.comment
        }) //Send a POST request to the route
        expect(response.status).toBe(200) //Check if the response status is 200
    })



    test("It should show the reviews of a product", async () => {

        const utente = new User("g", "g", "df", Role.CUSTOMER, "indirizzo", "datadinascita");

        const testReview = "modello1";
        let productreview: ProductReview[] = [{
            model: "modello1",
            user: "g",
            score: 5,
            date: "2024-06-06",
            comment: "Nice!"
        }, {
            model: "modello1",
            user: "Ciccio",
            score: 4,
            date: "2024-06-06",
            comment: "Nice!"
        }];

        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = utente;
            next()
        });

        jest.spyOn(ReviewController.prototype, "getProductReviews").mockResolvedValueOnce(productreview)
        const response = await request(app).get(baseURL + "/reviews/"+ testReview).send({model: testReview})
        expect(response.status).toBe(200)
        expect(response.body).toEqual(productreview)
        expect(ReviewController.prototype.getProductReviews).toHaveBeenCalledTimes(1)
        expect(ReviewController.prototype.getProductReviews).toHaveBeenCalledWith(testReview)

    })


    test("It should delete a review", async () => {

        const utente = new User("g", "giulia", "df", Role.CUSTOMER, "indirizzo", "datadinascita");

        const prodotto= new Product(400,"test",Category.SMARTPHONE,null,null,1);

        const testReview = {
            model: "test",
            user: utente,
        };

        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = utente;
            next()
        });

        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
            req.user = utente;
            next()
        });


        jest.spyOn(ReviewController.prototype, "deleteReview").mockResolvedValueOnce()
        const response = await request(app).delete(baseURL + "/reviews/"+ testReview.model).send()
        expect(response.status).toBe(200)
        expect(ReviewController.prototype.deleteReview).toHaveBeenCalledTimes(1)
        expect(ReviewController.prototype.deleteReview).toHaveBeenCalledWith(testReview.model, utente)

    })

    test("It should delete all reviews for a product", async () => {

        const utente = new User("g", "giulia", "df", Role.ADMIN, "indirizzo", "datadinascita");

        const testReview = "test";

        const prodotto= new Product(400,"test",Category.SMARTPHONE,null,null,1);

        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = utente;
            next()
        });

        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            req.user = utente;
            next()
        });

        jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockResolvedValueOnce()
        const response = await request(app).delete(baseURL + "/reviews/"+ testReview + "/all").send()
        expect(response.status).toBe(200)
        expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledTimes(1)
        expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledWith(testReview)

    })


    test("It should delete all reviews", async () => {

        const utente = new User("g", "giulia", "df", Role.ADMIN, "indirizzo", "datadinascita");

        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = utente;
            next()
        });

        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            req.user = utente;
            next()
        });

        jest.spyOn(ReviewController.prototype, "deleteAllReviews").mockResolvedValueOnce()
        const response = await request(app).delete(baseURL + "/reviews").send()
        expect(response.status).toBe(200)
        expect(ReviewController.prototype.deleteAllReviews).toHaveBeenCalledTimes(1)
        expect(ReviewController.prototype.deleteAllReviews).toHaveBeenCalledWith()

    })



    test("parameter model is an empty string ", async () => {

        const utente = new User("g", "giulia", "df", Role.CUSTOMER, "indirizzo", "datadinascita");

        const testreview = { 
            model: "",
            user: "g",
            score: 1,
            date: "2024-06-06",
            comment: "Nice!"
        }
        
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            next()
        });

        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
            req.user = utente;
            next()
        });

        const response = await request(app).post(baseURL + "/reviews/" + testreview.model).send({
            score: testreview.score,
            comment: testreview.comment
        }) 
        expect(response.status).toBe(422);

    })


    test("body comment is an empty string ", async () => {

        const utente = new User("g", "giulia", "df", Role.CUSTOMER, "indirizzo", "datadinascita");

        const testreview = { 
            model: "iphone",
            user: "g",
            score: 1,
            date: "2024-06-06",
            comment:""
        }

        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            next()
        });

        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
            req.user = utente;
            next()
        });
        
        const response = await request(app).post(baseURL + "/reviews/"+ testreview.model).send({
            model: testreview.model,
            user: testreview.user,
            score: testreview.score,
            date: testreview.date,
            comment: testreview.comment
        });

        expect(response.status).toBe(422);

    })


    test("body score is a wrong number", async () => {

        const utente = new User("g", "giulia", "df", Role.CUSTOMER, "indirizzo", "datadinascita");

        const testreview = { 
            model: "iphone",
            user: "g",
            score: 89,
            date: "2024-06-06",
            comment: "Nice!"
        }

        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            next()
        });

        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
            req.user = utente;
            next()
        });
        
        const response = await request(app).post(baseURL + "/reviews/"+ testreview.model).send({
            model: testreview.model,
            user: testreview.user,
            score: testreview.score,
            date: testreview.date,
            comment: testreview.comment
        });
        expect(response.status).toBe(422);

    })


    test("401 user not logged in", async () => {

        const testreview = { 
            model: "iphone",
            user: "g",
            score: 5,
            date: "2024-06-06",
            comment: "top"
        }
      
        const response = await request(app).post(baseURL + "/reviews/"+ testreview.model).send({
            model: testreview.model,
            user: testreview.user,
            score: testreview.score,
            date: testreview.date,
            comment: testreview.comment
        });
        expect(response.status).toBe(401);
    })

    test("401 user not customer", async () => {

        const testreview = { 
            model: "iphone",
            user: "g",
            score: 1,
            date: "2024-06-06",
            comment: "ok"
        }
       
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            next()
        });

        const response = await request(app).post(baseURL + "/reviews/" + testreview.model).send({ model: testreview.model,
            user: testreview.user,
            score: testreview.score,
            date: testreview.date,
            comment: testreview.comment});
        expect(response.status).toBe(401);
    })


    test("401 user not logged in", async () => {

        const testreview = { 
            model: "iphone",
            user: "g",
            score: 1,
            date: "2024-06-06",
            comment: "ok"
        }
      
        const response = await request(app).get(baseURL + "/reviews/"+ testreview.model).send({model: testreview.model});
        expect(response.status).toBe(401);
    })

    test("401 user not logged in", async () => {
      
        const response = await request(app).delete(baseURL + "/reviews/" + "model").send();
        expect(response.status).toBe(401);
    })

    test("401 user not customer", async () => {
       
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            next()
        });

        const response = await request(app).delete(baseURL + "/reviews").send("model");
        expect(response.status).toBe(401);
    })

    test("401 user not admin or manager", async () => {
       
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            next()
        });

        const response = await request(app).delete(baseURL + "/reviews/" + "model" + "/all").send();
        expect(response.status).toBe(401);
    })

//nelle api non si parla di questo errore
    test("getProductReviews: should throw NoReviewProductError if review does not exist", async () => {
        
        const utente = new User("g", "giulia", "df", Role.CUSTOMER, "indirizzo", "datadinascita");
        const productreview: ProductReview[] = []


        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = utente;
            next()
        });       
        
        const response = await request(app).get(baseURL + "/reviews/" + "NotExist").send();

        //SULLE API NON C'E' SCRITTO O ALMENO NON L'HO TROVATO
        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual([]);
    })



})
