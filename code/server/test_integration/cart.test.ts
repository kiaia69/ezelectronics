import { test, expect, beforeAll, afterAll, beforeEach, describe } from "@jest/globals";
import request from "supertest";
import { app } from "../index";
import db from "../src/db/db";
const baseURL = "/ezelectronics";
import { cleanup, cleanup_without_users } from "../src/db/cleanup";
import { EmptyProductStockError, LowProductStockError, ProductNotFoundError } from "../src/errors/productError";
import { CartNotFoundError, ProductNotInCartError, EmptyCartError } from "../src/errors/cartError";
import dayjs from "dayjs";

const customer = { username: "customer", name: "customer_name", surname: "customer_surname", password: "customer", role: "Customer" };
const customer2 = { username: "customer2", name: "customer_name2", surname: "customer_surname2", password: "customer2", role: "Customer" };
const admin = { username: "admin", name: "admin_name", surname: "admin_surname", password: "admin", role: "Admin" };
const manager = { username: "manager", name: "manager_name", surname: "manager_surname", password: "manager", role: "Manager" };

let agent = request.agent(app);

const Prodotto_q_0 = { model: "iPhone 13", category: "Smartphone", quantity: 0, details: "", sellingPrice: 200, arrivalDate: "2024-01-01" };
const Prodotto_q_1 = { model: "iPhone 13", category: "Smartphone", quantity: 1, details: "", sellingPrice: 200, arrivalDate: "2024-01-01" };
const Prodotto_q_2 = { model: "iPhone 13", category: "Smartphone", quantity: 2, details: "", sellingPrice: 200, arrivalDate: "2024-01-01" };

const Prodotto2_q_2 = { model: "iPhone 14", category: "Smartphone", quantity: 2, details: "", sellingPrice: 200, arrivalDate: "2024-01-01" };

const AddProductList = async (Prodotto: any) => {
  //ADD PRODUCT
  let add_product_query = "INSERT INTO ProductDescriptor(model, category, arrival_date, selling_price, quantity, details) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT (model) DO UPDATE SET quantity = ?";

  function add_product() {
    return new Promise((resolve, reject) => {
      db.run(add_product_query, [Prodotto.model, Prodotto.category, Prodotto.arrivalDate, Prodotto.sellingPrice, Prodotto.quantity, Prodotto.details, Prodotto.quantity], function (err: Error | null) {
        if (err) reject(err);
        else {
          resolve(true);
        }
      });
    });
  }
  await add_product();
};

const Login = async (Utente: any) => {
  await agent
    .post(baseURL + "/sessions")
    .send({ username: Utente.username, password: Utente.password })
    .expect(200);
};

const Logout = async () => {
  await agent
    .delete(baseURL + "/sessions/current")
    .send()
    .expect(200);
};

beforeAll(async () => {
  await cleanup();
  //crea admin
  await agent
    .post(baseURL + "/users")
    .send(admin)
    .expect(200);
  //crea customer
  await agent
    .post(baseURL + "/users")
    .send(customer)
    .expect(200);
  await agent
    .post(baseURL + "/users")
    .send(customer2)
    .expect(200);
  //crea manager
  await agent
    .post(baseURL + "/users")
    .send(manager)
    .expect(200);
});

beforeEach(async () => {
  //LOGOUT
  await Logout();

  await cleanup_without_users();
});

afterAll(async () => {
  //LOGOUT
  await agent
    .delete(baseURL + "/sessions/current")
    .send()
    .expect(200);

  await cleanup();
});

describe("Cart routes integration tests", () => {
  describe("GET /carts", () => {
    test("Return Empty Cart of logged Customer", async () => {
      //LOGIN CUSTOMER
      await Login(customer); //LOGIN UTENTE
      //GET CARRELLO
      let customer_cart = await agent
        .get(baseURL + "/carts")
        .send()
        .expect(200);

      expect(customer_cart).toBeDefined(); //We expect the user we have created to exist in the array. The parameter should also be equal to those we have sent
      expect(customer_cart.body.customer).toBe(customer.username);
      expect(customer_cart.body.paid).toBe(false);
      expect(customer_cart.body.paymentDate).toBe(null);
      expect(customer_cart.body.total).toBe(0);
      expect(customer_cart.body.products).toStrictEqual([]);
    });

    test("Cannot return cart of logged Admin or Manager", async () => {
      //LOGIN ADMIN
      await Login(admin);

      await agent
        .get(baseURL + "/carts")
        .send()
        .expect(401);

      //LOGIN MANAGER
      await Login(manager);

      await agent
        .get(baseURL + "/carts")
        .send()
        .expect(401);
    });
  });

  describe("POST /carts", () => {
    test("Add Product to Cart", async () => {
      //LOGIN CUSTOMER
      await Login(customer);

      const Prodotto_Carrello = { model: "iPhone 13", category: "Smartphone", quantity: 1, price: 200 };

      await AddProductList(Prodotto_q_1);

      //CARICO PRODOTTO SUL CARRELLO
      await agent
        .post(baseURL + "/carts")
        .send({ model: Prodotto_q_1.model })
        .expect(200);

      //GET CARRELLO
      let customer_cart = await agent
        .get(baseURL + "/carts")
        .send()
        .expect(200);

      expect(customer_cart).toBeDefined();
      expect(customer_cart.body.customer).toBe(customer.username);
      expect(customer_cart.body.paid).toBe(false);
      expect(customer_cart.body.paymentDate).toBe(null);
      expect(customer_cart.body.total).toBe(Prodotto_q_1.sellingPrice);
      expect(customer_cart.body.products).toStrictEqual([Prodotto_Carrello]);
    });

    test("Try add product to the cart with quantity 0 should return 409", async () => {
      //LOGIN CUSTOMER
      await Login(customer);

      await AddProductList(Prodotto_q_0);

      //CARICO PRODOTTO SUL CARRELLO
      await agent
        .post(baseURL + "/carts")
        .send({ model: Prodotto_q_0.model })
        .expect(409);
    });

    test("Try add product to the card that doesn't exist should return 404", async () => {
      //LOGIN CUSTOMER
      await Login(customer);

      //CARICO PRODOTTO SUL CARRELLO
      await agent
        .post(baseURL + "/carts")
        .send({ model: Prodotto_q_0.model })
        .expect(404);
    });

    test("Try add product to the cart without specify the model", async () => {
      //LOGIN CUSTOMER
      await Login(customer);

      //CARICO PRODOTTO SUL CARRELLO
      await agent
        .post(baseURL + "/carts")
        .send({})
        .expect(422);
    });

    test("Try add product to the cart without login", async () => {
      //CARICO PRODOTTO SUL CARRELLO
      await agent
        .post(baseURL + "/carts")
        .send({ model: Prodotto_q_0.model })
        .expect(401);
    });
  });

  describe("PATCH /ezelectronics/carts", () => {
    test("Checkout current cart", async () => {
      const Prodotto_Carrello = { model: "iPhone 13", category: "Smartphone", quantity: 1, price: 200 };

      await AddProductList(Prodotto_q_1);

      await Login(customer);

      await agent
        .post(baseURL + "/carts")
        .send({ model: Prodotto_q_1.model })
        .expect(200);

      //CHECKOUT CART
      await agent
        .patch(baseURL + "/carts")
        .send()
        .expect(200);

      //GET CARRELLO
      let customer_cart = await agent
        .get(baseURL + "/carts/history")
        .send()
        .expect(200);

      expect(customer_cart).toBeDefined();
      expect(customer_cart.body[0].products).toStrictEqual([Prodotto_Carrello]);
      expect(customer_cart.body[0].paid).toBe(true);
      expect(customer_cart.body[0].customer).toBe(customer.username);
      expect(customer_cart.body[0].paymentDate).toBe(dayjs().format("YYYY-MM-DD"));
      expect(customer_cart.body[0].total).toBe(Prodotto_q_1.sellingPrice);
    });

    test("Try to checkout the cart of the current user that doesn't exist - 404 error", async () => {
      await Login(customer);

      //CHECKOUT CART
      let resp = await agent
        .patch(baseURL + "/carts")
        .send()
        .expect(404);

      expect(resp).toBeDefined();
      expect(resp.body).toStrictEqual({ error: new CartNotFoundError().customMessage, status: new CartNotFoundError().customCode });
    });

    test("Try to checkout the cart of the current user that does exist but has no products - 400 error", async () => {
      //LOGIN CUSTOMER
      await Login(customer);

      await AddProductList(Prodotto_q_1);

      await agent
        .post(baseURL + "/carts")
        .send({ model: Prodotto_q_1.model })
        .expect(200);

      await agent
        .delete(baseURL + "/carts/products/iPhone 13")
        .send()
        .expect(200);

      //CHECKOUT CART VUOTO - dovrebbe ritornare 400 invece di 404
      let resp = await agent
        .patch(baseURL + "/carts")
        .send()
        .expect(400);

      expect(resp).toBeDefined();
      expect(resp.body).toStrictEqual({ error: new EmptyCartError().customMessage, status: new EmptyCartError().customCode });
    });

    test("Try to checkout the cart of the current user when product is not avaiable (q=0) or quantity is not enough (request < avaiable) - 409 error", async () => {
      await Login(customer);

      await AddProductList(Prodotto_q_1);

      await agent
        .post(baseURL + "/carts")
        .send({ model: Prodotto_q_1.model })
        .expect(200);

      await AddProductList(Prodotto_q_0);

      //controllo errore 409 se prodotto non disponibile  //NON FUNZIONA
      await agent
        .patch(baseURL + "/carts")
        .send()
        .expect(409)
        .then((res) => {
          expect(res.body).toStrictEqual({ error: new EmptyProductStockError().customMessage, status: new EmptyProductStockError().customCode });
        });

      await AddProductList(Prodotto_q_2);

      await agent
        .post(baseURL + "/carts")
        .send({ model: Prodotto_q_2.model })
        .expect(200);

      await agent
        .post(baseURL + "/carts")
        .send({ model: Prodotto_q_2.model })
        .expect(200);

      await AddProductList(Prodotto_q_1);

      await agent
        .patch(baseURL + "/carts")
        .send()
        .expect(409)
        .then((res) => {
          expect(res.body).toStrictEqual({ error: new LowProductStockError().customMessage, status: new LowProductStockError().customCode });
        });
    });

    describe("GET ezelectronics/carts/history", () => {
      test("return history of the carts of the user excluded the current cart - 200", async () => {
        await Login(customer);

        const Prodotto_Carrello_q1 = { model: "iPhone 13", category: "Smartphone", quantity: 1, price: 200 };

        await AddProductList(Prodotto_q_1);

        await agent
          .post(baseURL + "/carts")
          .send({ model: Prodotto_q_1.model })
          .expect(200);

        await agent
          .patch(baseURL + "/carts")
          .send()
          .expect(200);

        await AddProductList(Prodotto_q_1);

        await agent
          .post(baseURL + "/carts")
          .send({ model: Prodotto_q_1.model })
          .expect(200);

        let customer_cart = await agent
          .get(baseURL + "/carts/history")
          .send()
          .expect(200);

        expect(customer_cart).toBeDefined();
        expect(customer_cart.body[0].customer).toBe(customer.username);
        expect(customer_cart.body[0].paid).toBe(true);
        expect(customer_cart.body[0].paymentDate).toBe(dayjs().format("YYYY-MM-DD"));
        expect(customer_cart.body[0].total).toBe(Prodotto_q_1.sellingPrice);
        expect(customer_cart.body[0].products).toStrictEqual([Prodotto_Carrello_q1]);
      });

      test("try to return history of the carts of the user that doesn't have one - 200", async () => {
        await Login(customer);

        let customer_cart_history = await agent
          .get(baseURL + "/carts/history")
          .send()
          .expect(200);

        expect(customer_cart_history).toBeDefined();
        expect(customer_cart_history.body).toStrictEqual([]);
      });

      test("try to return history of the carts without permission - 401", async () => {
        let customer_cart_history = await agent
          .get(baseURL + "/carts/history")
          .send()
          .expect(401);

        await Login(manager);

        customer_cart_history = await agent
          .get(baseURL + "/carts/history")
          .send()
          .expect(401);

        await Login(admin);

        customer_cart_history = await agent
          .get(baseURL + "/carts/history")
          .send()
          .expect(401);
      });
    });

    describe("DELETE ezelectronics/carts/products/:model", () => {
      test("remove one instance of a product in the cart - 200", async () => {
        await Login(customer);

        const Prodotto_Carrello_q1 = { model: "iPhone 13", category: "Smartphone", quantity: 1, price: 200 };

        await AddProductList(Prodotto_q_2);

        await agent
          .post(baseURL + "/carts")
          .send({ model: Prodotto_q_2.model })
          .expect(200);

        await agent
          .post(baseURL + "/carts")
          .send({ model: Prodotto_q_2.model })
          .expect(200);

        let resp = await agent
          .delete(baseURL + "/carts/products/iPhone 13")
          .send()
          .expect(200);

        expect(resp).toBeDefined();
        expect(resp.body).toStrictEqual({});

        //GET CART
        let customer_cart = await agent
          .get(baseURL + "/carts")
          .send()
          .expect(200);

        expect(customer_cart).toBeDefined();
        expect(customer_cart.body.customer).toBe(customer.username);
        expect(customer_cart.body.paid).toBe(false);
        expect(customer_cart.body.paymentDate).toBe(null);
        expect(customer_cart.body.total).toBe(Prodotto_q_2.sellingPrice);
        expect(customer_cart.body.products).toStrictEqual([Prodotto_Carrello_q1]);
      });

      test("try to remove product in a cart that doesn't exists - 404", async () => {


        await Login(customer);

        let resp = await agent
          .delete(baseURL + "/carts/products/iPhone 13")
          .send()
          .expect(404);

        expect(resp).toBeDefined();

        expect(resp.body).toStrictEqual({ error: new CartNotFoundError().customMessage, status: new CartNotFoundError().customCode });
      });

      test("try to remove product from a empty cart - 404", async () => {

        await AddProductList(Prodotto_q_2);

        await Login(customer);


        await agent
          .post(baseURL + "/carts")
          .send({ model: Prodotto_q_2.model })
          .expect(200);

        let resp = await agent
          .delete(baseURL + "/carts/products/iPhone 13")
          .send()
          .expect(200);

        let resp2 = await agent
          .delete(baseURL + "/carts/products/iPhone 13")
          .send()
          .expect(404);


        expect(resp2).toBeDefined();

        expect(resp2.body).toStrictEqual({ error: new ProductNotInCartError().customMessage, status: new ProductNotInCartError().customCode });
      });

      test("try to remove product not present in cart - 404", async () => {
        await Login(customer);

        await AddProductList(Prodotto_q_2);

        await AddProductList(Prodotto2_q_2);

        await agent
          .post(baseURL + "/carts")
          .send({ model: Prodotto_q_2.model })
          .expect(200);

        let resp = await agent
          .delete(baseURL + "/carts/products/iPhone 14")
          .send()
          .expect(404);

        expect(resp).toBeDefined();
        expect(resp.body).toStrictEqual({ error: new ProductNotInCartError().customMessage, status: new ProductNotInCartError().customCode });
      });

      test("try to remove product that doesn't exist from cart - 404", async () => {
        await Login(customer);

        await AddProductList(Prodotto_q_2);

        await agent
          .post(baseURL + "/carts")
          .send({ model: Prodotto_q_2.model })
          .expect(200);

        let resp = await agent
          .delete(baseURL + "/carts/products/iPhone 14")
          .send()
          .expect(404);

        expect(resp).toBeDefined();
        expect(resp.body).toStrictEqual({ error: new ProductNotFoundError().customMessage, status: new ProductNotFoundError().customCode });
      });

      test("try delete without parameter model - 404", async () => {
        await Login(customer);

        await AddProductList(Prodotto_q_2);

        await agent
          .post(baseURL + "/carts")
          .send({ model: Prodotto_q_2.model })
          .expect(200);

        await agent
          .delete(baseURL + "/carts/products/")
          .send()
          .expect(422);

      });
    });

    describe("DELETE ezelectronics/carts/current", () => {
      test("empty the cart - 200", async () => {
        await Login(customer);

        await AddProductList(Prodotto_q_2);

        await agent
          .post(baseURL + "/carts")
          .send({ model: Prodotto_q_2.model })
          .expect(200);

        await agent
          .post(baseURL + "/carts")
          .send({ model: Prodotto_q_2.model })
          .expect(200);

        let resp = await agent
          .delete(baseURL + "/carts/current")
          .send()
          .expect(200);

        expect(resp).toBeDefined();
        expect(resp.body).toStrictEqual({});

        //GET CART
        let customer_cart = await agent
          .get(baseURL + "/carts")
          .send()
          .expect(200);

        expect(customer_cart).toBeDefined();
        expect(customer_cart.body.customer).toBe(customer.username);
        expect(customer_cart.body.paid).toBe(false);
        expect(customer_cart.body.paymentDate).toBe(null);
        expect(customer_cart.body.total).toBe(0);
        expect(customer_cart.body.products).toStrictEqual([]);
      });

      test("empty a cart that doesn't exist - 404", async () => {
        await Login(customer);
        let resp = await agent
          .delete(baseURL + "/carts/current")
          .send()
          .expect(404);
        expect(resp.body).toStrictEqual({ error: new CartNotFoundError().customMessage, status: new CartNotFoundError().customCode });
      });
    });

    describe("DELETE ezelectronics/carts", () => {
      test("delete cart of all users - 200", async () => {
        await Login(admin);

        await agent
          .delete(baseURL + "/carts/")
          .send()
          .expect(200);

        await Login(manager);

        await agent
          .delete(baseURL + "/carts/")
          .send()
          .expect(200);
      });

      test("delete cart of all users by Customer - 401", async () => {
        await Login(customer);

        await agent
          .delete(baseURL + "/carts/")
          .send()
          .expect(401);
      });
    });

    describe("GET ezelectronics/carts/all", () => {
      test("return all cart of the users current and past - 200", async () => {
        await Login(customer);

        await AddProductList(Prodotto_q_2);

        //ADD TO CART CUSTOMER
        await agent
          .post(baseURL + "/carts")
          .send({ model: Prodotto_q_2.model })
          .expect(200);

        //CHECKOUT CART
        await agent
          .patch(baseURL + "/carts")
          .send()
          .expect(200);

        //ADD TO CURRENT CUSTOMER CART
        await agent
          .post(baseURL + "/carts")
          .send({ model: Prodotto_q_2.model })
          .expect(200);

        await AddProductList(Prodotto2_q_2);

        await Login(customer2);

        await agent
          .post(baseURL + "/carts")
          .send({ model: Prodotto2_q_2.model })
          .expect(200);

        await Login(admin);

        //GET ALL CARTS
        let users_cart = await agent
          .get(baseURL + "/carts/all")
          .send()
          .expect(200);

        const Prodotto_Carrello_q2 = { model: "iPhone 13", category: "Smartphone", quantity: 1, price: 200 };

        const Prodotto_Carrello2_q2 = { model: "iPhone 14", category: "Smartphone", quantity: 1, price: 200 };

        expect(users_cart).toBeDefined();
        expect(users_cart.body[0].customer).toBe(customer.username);
        expect(users_cart.body[0].paid).toBe(true);
        expect(users_cart.body[0].paymentDate).toBe(dayjs().format("YYYY-MM-DD"));
        expect(users_cart.body[0].total).toBe(Prodotto_q_2.sellingPrice);
        expect(users_cart.body[0].products).toStrictEqual([Prodotto_Carrello_q2]);

        expect(users_cart.body[1].customer).toBe(customer.username);
        expect(users_cart.body[1].paid).toBe(false);
        expect(users_cart.body[1].paymentDate).toBe(null);
        expect(users_cart.body[1].total).toBe(Prodotto_q_2.sellingPrice);
        expect(users_cart.body[1].products).toStrictEqual([Prodotto_Carrello_q2]);

        expect(users_cart.body[2].customer).toBe(customer2.username);
        expect(users_cart.body[2].paid).toBe(false);
        expect(users_cart.body[2].paymentDate).toBe(null);
        expect(users_cart.body[2].total).toBe(Prodotto2_q_2.sellingPrice);
        expect(users_cart.body[2].products).toStrictEqual([Prodotto_Carrello2_q2]);
      });
    });
  });
});