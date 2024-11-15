import { describe, test, expect, beforeAll, afterAll, beforeEach} from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import db from "../src/db/db";
import { cleanup, cleanup_without_users } from "../src/db/cleanup"
import { ProductReview } from "../src/components/review";
import dayjs from "dayjs";

const routePath = "/ezelectronics" //Base route path for the API

//let customerCookie: string
//let adminCookie: string
let agent = request.agent(app);

//Helper function that creates a new user in the database.
const postUser = async (userInfo: any) => {
    await agent
    .post(`${routePath}/users`)
    .send(userInfo)
    .expect(200);
};

const Prodotto_q_1 = { model: "iPhone 13", category: "Smartphone", quantity: 1, details: "", sellingPrice: 200, arrivalDate: "2024-01-01" };


//Helper function that insert a new product in the database.
const PostProductList = async (Prodotto: any) => {
    //ADD PRODUCT
    let add_product_query = "INSERT OR REPLACE INTO ProductDescriptor(model, category, arrival_date, selling_price, quantity, details) VALUES (?, ?, ?, ?, ?, ?)";
  
    function add_product() {
      return new Promise((resolve, reject) => {
        db.run(add_product_query, [Prodotto.model, Prodotto.category, Prodotto.arrivalDate, Prodotto.sellingPrice, Prodotto.quantity, Prodotto.details], function (err: Error | null) {
          if (err) reject(err);
          else {
            resolve(true);
          }
        });
      });
    }
    await add_product();
  };
  

//Helper function that logs in a user and returns the cookie
const login  = async (Utente: any) => {
    await agent
      .post(routePath + "/sessions")
      .send({ username: Utente.username, password: Utente.password })
      .expect(200);
  };
  
  const Logout = async () => {
    await agent
      .delete(routePath + "/sessions/current")
      .send()
      .expect(200);
  };
  


const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: "Customer" }
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" }
const product = {sellingPrice: 100, model: "hp", category: "Laptop",arrivalDate: "10/06/2020", details: "null",quantity: 2}


beforeAll(async () => {
    await cleanup()
    await postUser(admin)
    await postUser(customer)
})

//After executing tests, we remove everything from our test database
afterAll(async () => {
    await Logout();

    await cleanup()
})

beforeEach(async () => {
    //LOGOUT
    await Logout();
  
    await cleanup_without_users();
  });


describe("Review integration tests", () => {

//POST

describe("Add Review for a product", () => {

    test("should return a 200 success code and add the review to the specified product", async () => {


        //ESEMPIO, PRIMA CREIAMO IL PRODOTTO, POI LOGIN, POI MANDIAMO LA REVIEW POI GET DI TUTTE LE REVIEW,
        //PRENDIAMO PRIMO ELEMENTO ARRAY E VEDIAMO SE CORRISPONDE ALLA REVIEW CREATA
        //MANDARE SEMPRE SOLO I DATI STRETTAMENTE NECESSARI QUINDI SOLO SCORE E COMMENT
  
        const testReview = {
            score: 4,
            comment: "test"
        }

        await PostProductList(Prodotto_q_1);

        await login(customer); 

        await agent
            .post(routePath + '/reviews/'+Prodotto_q_1.model)
            .send(testReview)
            .expect(200);

        const getResponse = await agent.get(routePath + '/reviews/'+Prodotto_q_1.model).expect(200);

        expect(getResponse).toBeDefined();
        expect(getResponse.body).toHaveLength(1);

        expect(getResponse.body[0].score).toEqual(testReview.score);
        expect(getResponse.body[0].date).toEqual(dayjs().format("YYYY-MM-DD"));
        expect(getResponse.body[0].comment).toEqual(testReview.comment);

    });
    
    test("should return a 409 error if the review data is duplicated", async () => {

  
        const testReview2 = {
            score: 3,
            comment: "altro"
        }

        const testReview1 = {
            score: 2,
            comment: "altro"
        }

        await PostProductList(Prodotto_q_1);

        await login(customer);

        await agent
            .post(routePath + '/reviews/'+Prodotto_q_1.model)
            .send(testReview2)
            .expect(200);

        //const getResponse = await agent.get(routePath + '/reviews/'+Prodotto_q_1.model).expect(200);

        //expect(getResponse.body).toBeDefined();

        await agent
            .post(routePath + '/reviews/'+Prodotto_q_1.model)
            .send(testReview1)
            .expect(409);

        //COME TI POTREBBE TORNARE 409 SE LA REVIEW ESISTE? LA PRIMA ADD VA A BUON FINE
        const getResponse2 = await agent.get(routePath + '/reviews/'+Prodotto_q_1.model).expect(200);
        expect(getResponse2.body[0].score).toStrictEqual(3);


    });

    test("should return ProductNotFound if the product does not exist", async () => {
       
  
        const testReview = {
            score: 4,
            comment: "test"
        }

        await login(customer);

        const response = await agent
            .post(routePath + '/reviews/noproduct')
            .send(testReview)
            .expect(404);

        expect(response.status ).toBe(404);
    });

    test("Try add review  without login", async () => {
       
        await agent
          .post(routePath + "/reviews")
          .send({ model: product.model })
          .expect(401);
      });

      test("should return a 422 code if the review is not valid (comment is an empty string)", async () => {
  
        const testReview = {
            score: 3,
            comment: ''
        }

        await PostProductList(Prodotto_q_1);

        await login(customer); 

        await agent
            .post(routePath + "/reviews/"+Prodotto_q_1.model)
            .send(testReview)
            .expect(422);


         const getResponse = await agent.get(routePath + '/reviews/'+ Prodotto_q_1.model).expect(200);
         expect(getResponse.body).toEqual([]);

    });

    test("should return a 422 code if the review is not valid (model is an empty string)", async () => {
  
        const testReview = {
            score: 5,
            comment: "nice"
        }

        await PostProductList(Prodotto_q_1);

        await login(customer); 

        const getResponse = await agent
            .post(routePath + '/reviews/'+"")
            .send(testReview)
            .expect(422);

        expect(getResponse.status).toBe(422);

        const getResponse2 = await agent.get(routePath + '/reviews/'+ Prodotto_q_1.model).expect(200);
        expect(getResponse2.body).toEqual([]);
    });

    });
    


//GET

describe("Get Reviews for a specific product", () => {

    test("should return a 200 success code and the reviews for the specified product", async () => {

        const utente = {username:"g", name:"giulia", surname: "df", password: "ciao", role:"Customer"}
        const Prodotto_1 = { model: "iPhone 11", category: "Smartphone", quantity: 2, details: "", sellingPrice: 200, arrivalDate: "2024-01-01" };

        await PostProductList(Prodotto_1);
        await login(customer);
        //  await login(utente);

        const productReview1=new ProductReview("Smartphone", customer.username, 5, dayjs().toString(), "Nice!")
        const productReview2=new ProductReview("Smartphone", utente.username, 4, dayjs().toString(), "Ok!")

        await agent
            .post(routePath + '/reviews/iPhone 11')
            .send(productReview1)
            .expect(200);
        await agent  //NON POSSO FARE UN'ALTRA REVIEW CON LO STESSO UTENTE
            .post(routePath + '/reviews/iPhone 11')
            .send(productReview2)
            .expect(409);

        const response = await agent
            .get(routePath + '/reviews/iPhone 11')
            .send()
            .expect(200);

        expect(response.body).toHaveLength(1);
        expect(response.body[0].score).toEqual(productReview1.score);
        expect(response.body[0].date).toEqual(dayjs().format("YYYY-MM-DD"));
        expect(response.body[0].comment).toEqual(productReview1.comment);
        // expect(response.body[1].score).toEqual(productReview2.score);
        // expect(response.body[1].date).toEqual(dayjs().format("YYYY-MM-DD"));
        // expect(response.body[1].comment).toEqual(productReview2.comment);
       
    });

    test("should return an empty array error if the product does not exist", async () => { //TEST STRANO
                                                                                        //NEL CODICE NON VIENE MAI LANCIATO UN ERRORE
                                                                                        //AL MASSIMO SI RESTITUISCE ARRAY VUOTO
                                                                                        //SE VUOI FARE IL TEST CAMBIA IL CODICE NEL DAO
                                                                                        //CONTROLLANDO ALL'INIZIO SE IL PRODOTTO ESISTE
        await login(customer);

        const response = await agent
            .get(routePath + '/reviews/lavatrice')
            .expect(200);

        expect(response.body).toEqual([]);
    });
});



//DELETE

describe("Delete a Review of a product", () => {

    test("should return a 200 success code and remove the review", async () => {
         
        const testReview = {
            score: 3,
            comment: "top"
        }

        await PostProductList(Prodotto_q_1);

        await login(customer); 

        await agent
            .post(routePath + '/reviews/'+Prodotto_q_1.model)
            .send(testReview)
            .expect(200);

        await agent
            .delete(routePath + "/reviews/iPhone 13")
            .expect(200);

            const getResponse = await agent.get(routePath + '/reviews/'+ "iPhone 13").expect(200);
            expect(getResponse.body).toEqual([]);

    });

    test("should throw ProductNotFoundError if the model provided does not exists", async () => {
        
        await login(customer);

        const response =await agent
        .delete(routePath + "/reviews/"+"test")
        .send()
        .expect(404);

        expect(response.body).toEqual({status:404,  error: "You have not reviewed this product"});
    });
});



describe("Delete all the reviews of a product", () => {

    test("should return a 200 success code and remove all reviews", async () => {

        //ALTRO ESEMPIO

        const testReview = {
            score: 4,
            comment: "test"
        }

        let review_object = new ProductReview(Prodotto_q_1.model, customer.username, 4, dayjs().format("YYYY-MM-DD"), "test")

        //AGGIUNGIAMO IL PRODOTTO SE NO 404
        await PostProductList(Prodotto_q_1);

        //LOGIN COME CUSTOMER PERCHE' SOLO LUI PUO CREARE REVIEW
        await login(customer);
        
        await agent
            .post(routePath + '/reviews/'+Prodotto_q_1.model)
            .send(testReview)
            .expect(200);

        //CONTROLLIAMO CHE CI SIANO

        const reviews = await agent
            .get(routePath + "/reviews/"+Prodotto_q_1.model)
            .expect(200);


        expect(reviews.body).toEqual([review_object]);


        //LOGIN COME ADMIN COSI POSSIAMO CANCELLARLE
        await login(admin);


        await agent
            .delete(routePath + '/reviews/'+Prodotto_q_1.model+ '/all')
            .expect(200);


            const no_reviews = await agent
            .get(routePath + "/reviews/"+Prodotto_q_1.model)
            .expect(200);


        //CONTROLLIAMO CHE SIANO CANCELLATE
        expect(no_reviews.body).toStrictEqual([]);

        
       
    });

    test("should return a 401 Unauthorized if the user is not admin or manager", async () => {
        
        let review1= new ProductReview("smartphone", "g", 5, "2024-06-09", "Nice!")

        await login(customer);
        
        const response = await agent
            .delete(routePath + '/reviews/smartphone/all')
            .expect(401);
        
        expect(response.body).toEqual({ status: 401, error: "User is not an admin or manager" });
    });
});

describe("Delete all reviews of all products", () => {

    test("should return a 200 success code and remove all reviews", async () => {

        const testReview = {
            score: 3,
            comment: "top"
        }

        const Prodotto_1 = { model: "iPhone 11", category: "Smartphone", quantity: 2, details: "", sellingPrice: 200, arrivalDate: "2024-01-01" };

        await PostProductList(Prodotto_1);
        const Prodotto_2 = { model: "iPhone 112", category: "Smartphone", quantity: 2, details: "", sellingPrice: 200, arrivalDate: "2024-01-01" };

        await PostProductList(Prodotto_2);

        await login(customer);

        await agent
        .post(routePath + '/reviews/'+Prodotto_1.model)
        .send(testReview)
        .expect(200);

        await agent
        .post(routePath + '/reviews/'+Prodotto_2.model)
        .send(testReview)
        .expect(200);

        await login(admin);

        
        await agent
            .delete(routePath + "/reviews/")
            .expect(200);

            const no_reviews  = await agent
            .get(routePath + "/reviews/iPhone11")
            .expect(200);

        expect(no_reviews.body).toEqual([]);
    })
})

});

