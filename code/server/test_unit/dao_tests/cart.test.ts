import { describe, test, expect, beforeAll, afterAll, jest } from "@jest/globals";
import request from "supertest";
import { app } from "../../index";
import { ProductNotFoundError, ProductAlreadyExistsError, ProductSoldError, EmptyProductStockError, LowProductStockError } from "../../src/errors/productError";
import { CartNotFoundError, EmptyCartError, ProductNotInCartError } from "../../src/errors/cartError";

import UserController from "../../src/controllers/userController";
import Authenticator from "../../src/routers/auth";
import CartController from "../../src/controllers/cartController";
import CartDAO from "../../src/dao/cartDAO";
import { Role, User } from "../../src/components/user";
import { Cart, ProductInCart } from "../../src/components/cart";
import { Product, Category } from "../../src/components/product";
import ErrorHandler from "../../src/helper";
const baseURL = "/ezelectronics";
const { validationResult } = require("express-validator");
import db from "../../src/db/db";
import { Database } from "sqlite3";

//For unit tests, we need to validate the internal logic of a single component, without the need to test the interaction with other components
//For this purpose, we mock (simulate) the dependencies of the component we are testing
jest.mock("../../src/routers/auth");
jest.mock("../../src/db/db.ts");

let cartDAO = new CartDAO();

let testCustomer = new User("customer", "customer", "customer", Role.CUSTOMER, "", "");


//INFORMAZIONI PRODOTTI
const Prodotto_Iphone13 = { model: "iPhone 13", category: Category.SMARTPHONE, quantity: 5, details: "", sellingPrice: 200, arrivalDate: "2024-01-01" };
const Prodotto_Iphone13_q0 = { model: "iPhone 13", category: Category.SMARTPHONE, quantity: 0, details: "", sellingPrice: 200, arrivalDate: "2024-01-01" };
const Prodotto_Iphone14 = { model: "iPhone 14", category: Category.SMARTPHONE, quantity: 5, details: "", sellingPrice: 200, arrivalDate: "2024-01-01" };

//RISPOSTA DATABASE CART
let cart = { ref_username: "customer", payment_date: "2024-06-11", total: 200, selling_price: 200, quantity: 1, ref_product_descriptor: Prodotto_Iphone13.model, model: Prodotto_Iphone13.model, category: Category.SMARTPHONE };

//RISPOSTA CHE CI ASPETTIAMO COME CART
let prod = { price: 200, quantity: 1, model: Prodotto_Iphone13.model, category: Category.SMARTPHONE };
let expected_cart = { customer: "customer", paid: false, paymentDate: "2024-06-11", total: 200, products: [prod] };

describe("CartDAO unit tests", () => {
  describe("test addToCart", () => {
    test("It should return success", async () => {
      //MOCK INSERIMENTO NEL CARRELLO
      const runMock = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback.call({ lastID: 1 }, null);
        return {} as Database;
      });
      //PRODOTTO DA AGGIUNGERE
      const getMock = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, Prodotto_Iphone13);
        return {} as Database;
      });
      //CART VUOTO
      const allMock = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        callback(null, []);
        return {} as Database;
      });

      const response = await cartDAO.addToCart(testCustomer.username, Prodotto_Iphone13.model);
      expect(response).toBe(true);

      runMock.mockRestore();
      getMock.mockRestore();
      allMock.mockRestore();
    });

    test("It should 409 - product with quantity 0", async () => {
      const runMock = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(null);
        return {} as Database;
      });
      //PRODOTTO DA AGGIUNGERE
      const getMock = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, Prodotto_Iphone13_q0);
        return {} as Database;
      });
      //CART GIA' PRESENTE
      const allMock = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        callback(null, [cart]);
        return {} as Database;
      });

      await expect(cartDAO.addToCart(testCustomer.username, Prodotto_Iphone13.model)).rejects.toThrowError(EmptyProductStockError);

      runMock.mockRestore();
      getMock.mockRestore();
      allMock.mockRestore();
    });

    test("It should 404 - product doesn't exist", async () => {
      const runMock = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(null);
        return {} as Database;
      });
      //PRODOTTO DA AGGIUNGERE
      const getMock = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null);
        return {} as Database;
      });
      //CART GIA' PRESENTE
      const allMock = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        callback(null, [cart]);
        return {} as Database;
      });

      await expect(cartDAO.addToCart(testCustomer.username, Prodotto_Iphone13.model)).rejects.toThrowError(ProductNotFoundError);

      runMock.mockRestore();
      getMock.mockRestore();
      allMock.mockRestore();
      //guardare nelle chiavi
    });
  });

  describe("test getUnpaidCartByUserIdController", () => {
    test("It should return success", async () => {
      const getMock = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, Prodotto_Iphone13);
        return {} as Database;
      });

      //CART GIA' PRESENTE - POTREMMO PASSARE ANCHE CART VUOTO
      const allMock = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        callback(null, [cart]);
        return {} as Database;
      });

      const response = await cartDAO.getUnpaidCartByUserIdController(testCustomer.username);
      expect(response).toStrictEqual(expected_cart);

      getMock.mockRestore();
      allMock.mockRestore();
    });
  });

  describe("test checkoutCart", () => {
    test("It should return success", async () => {
      //CART GIA' PRESENTE - POTREMMO PASSARE ANCHE CART VUOTO
      const allMock = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        callback(null, [cart]);
        return {} as Database;
      });
      const runMock = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(null);
        return {} as Database;
      });

      const response = await cartDAO.checkoutCart(testCustomer.username);
      expect(response).toStrictEqual(true);

      allMock.mockRestore();
      runMock.mockRestore();
    });

    test("it should return cart not found because there is no cart", async () => {
      //CART GIA' PRESENTE - POTREMMO PASSARE ANCHE CART VUOTO
      const allMock = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        callback(null, []);
        return {} as Database;
      });

      await expect(cartDAO.checkoutCart(testCustomer.username)).rejects.toThrowError(CartNotFoundError);

      allMock.mockRestore();
    });

    test("it should return empty cart error because there is a cart but there are no product", async () => {
      let cart_empty = { payment_date: "", total: 0 };

      //CART GIA' PRESENTE - POTREMMO PASSARE ANCHE CART VUOTO
      const allMock = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        callback(null, [cart_empty]);
        return {} as Database;
      });

      await expect(cartDAO.checkoutCart(testCustomer.username)).rejects.toThrowError(EmptyCartError);
      allMock.mockRestore();
    });

    test("it should return empty product stock error because there are 0 product available", async () => {
      let cart = { payment_date: "2024-06-11", total: 200, selling_price: 200, available: 0, quantity: 0, ref_product_descriptor: Prodotto_Iphone13.model, model: Prodotto_Iphone13.model, category: Category.SMARTPHONE };

      //CART GIA' PRESENTE - POTREMMO PASSARE ANCHE CART VUOTO
      const allMock = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        callback(null, [cart]);
        return {} as Database;
      });

      await expect(cartDAO.checkoutCart(testCustomer.username)).rejects.toThrowError(EmptyProductStockError);
      allMock.mockRestore();
    });

    test("it should return empty product stock error because there are 0 product available", async () => {
      let cart = { payment_date: "2024-06-11", total: 200, selling_price: 200, available: 1, quantity: 0, asked: 2, ref_product_descriptor: Prodotto_Iphone13.model, model: Prodotto_Iphone13.model, category: Category.SMARTPHONE };

      //CART GIA' PRESENTE - POTREMMO PASSARE ANCHE CART VUOTO
      const allMock = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        callback(null, [cart]);
        return {} as Database;
      });

      await expect(cartDAO.checkoutCart(testCustomer.username)).rejects.toThrowError(LowProductStockError);
      allMock.mockRestore();
    });
  });

  describe("test getCustomerCarts", () => {
    test("It should return success", async () => {
      //CART GIA' PRESENTE - POTREMMO PASSARE ANCHE CART VUOTO
      const allMock = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        callback(null, [cart]);
        return {} as Database;
      });

      let payed_cart = expected_cart;
      payed_cart.paid = true;

      const response = await cartDAO.getCustomerCarts(testCustomer.username);
      expect(response).toStrictEqual([payed_cart]);
      allMock.mockRestore();
    });

    test("It should return success event with empty cart", async () => {
      //CART GIA' PRESENTE - POTREMMO PASSARE ANCHE CART VUOTO
      const allMock = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        callback(null, []);
        return {} as Database;
      });

      const response = await cartDAO.getCustomerCarts(testCustomer.username);
      expect(response).toStrictEqual([]);
      allMock.mockRestore();
    });
  });

  describe("test removeToCart", () => {
    test("It should return success", async () => {
      const runMock = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(null);
        return {} as Database;
      });

      const getMock = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, Prodotto_Iphone13, prod);
        return {} as Database;
      });

      //CART GIA' PRESENTE - POTREMMO PASSARE ANCHE CART VUOTO
      const allMock = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        callback(null, [cart]);
        return {} as Database;
      });

      const response = await cartDAO.removeToCart(testCustomer.username, Prodotto_Iphone13.model);
      expect(response).toBe(true);
      allMock.mockRestore();
      getMock.mockRestore();
      runMock.mockRestore();
    });

    test("It should error, product not found", async () => {
      const getMock = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null);
        return {} as Database;
      });

      //CART GIA' PRESENTE - POTREMMO PASSARE ANCHE CART VUOTO
      const allMock = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        callback(null, [cart]);
        return {} as Database;
      });

      await expect(cartDAO.removeToCart(testCustomer.username, Prodotto_Iphone13.model)).rejects.toThrowError(ProductNotFoundError);

      getMock.mockRestore();
      allMock.mockRestore();
    });

    test("It should error, cart empty", async () => {
      let cart_empty = { payment_date: "", total: 0 };

      const getMock = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, Prodotto_Iphone13);
        return {} as Database;
      });

      //CART GIA' PRESENTE - POTREMMO PASSARE ANCHE CART VUOTO
      const allMock = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        callback(null, [cart_empty]);
        return {} as Database;
      });

      await expect(cartDAO.removeToCart(testCustomer.username, Prodotto_Iphone13.model)).rejects.toThrowError(ProductNotInCartError);

      allMock.mockRestore();
      getMock.mockRestore();
    });

    test("It should error, product not in cart", async () => {
      const getMock = jest
        .spyOn(db, "get")
        .mockImplementationOnce((sql, params, callback) => {
          callback(null, Prodotto_Iphone13);
          return {} as Database;
        })
        .mockImplementationOnce((sql, params, callback) => {
          callback(null);
          return {} as Database;
        });

      //CART GIA' PRESENTE - POTREMMO PASSARE ANCHE CART VUOTO
      const allMock = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        callback(null, [cart]);
        return {} as Database;
      });

      await expect(cartDAO.removeToCart(testCustomer.username, Prodotto_Iphone14.model)).rejects.toThrowError(ProductNotInCartError);

      allMock.mockRestore();
      getMock.mockRestore();
    });

    test("It should error, cart not found", async () => {
      const getMock = jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
        callback(null, Prodotto_Iphone13);
        return {} as Database;
      });
      //CART GIA' PRESENTE - POTREMMO PASSARE ANCHE CART VUOTO
      const allMock = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        callback(null, []);
        return {} as Database;
      });

      await expect(cartDAO.removeToCart(testCustomer.username, Prodotto_Iphone14.model)).rejects.toThrowError(CartNotFoundError);

      allMock.mockRestore();
      getMock.mockRestore();
    });
  });


describe("test clearCart", () => {
  test("It should return success", async () => {
    //CART GIA' PRESENTE - POTREMMO PASSARE ANCHE CART VUOTO
    const allMock = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
      callback(null, [cart]);
      return {} as Database;
    });

    const runMock = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(null);
      return {} as Database;
    });

    const getMock = jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
      callback(null, testCustomer.username);
      return {} as Database;
    });

    const response = await cartDAO.clearCart(testCustomer.username);
    expect(response).toBe(true);

    allMock.mockRestore();
    getMock.mockRestore();
    runMock.mockRestore();
  });

  test("It should error, cart not found", async () => {
    const getMock = jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
      callback(null, testCustomer.username);
      return {} as Database;
    });
    //CART GIA' PRESENTE - POTREMMO PASSARE ANCHE CART VUOTO
    const allMock = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
      callback(null, []);
      return {} as Database;
    });

    await expect(cartDAO.clearCart(testCustomer.username)).rejects.toThrowError(CartNotFoundError);

    allMock.mockRestore();
    getMock.mockRestore();
  });
});

describe("test deleteAllCarts", () => {
  test("It should return success", async () => {
    const execMock = jest.spyOn(db, "exec").mockImplementationOnce((sql, callback: any) => {
      callback(null);
      return {} as Database;
    });

    await expect(cartDAO.deleteAllCarts()).resolves.toBe(true);

    execMock.mockRestore();
  });

  describe("test getAllCarts", () => {
    test("It should return success", async () => {
      const allMock = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        callback(null, [cart]);
        return {} as Database;
      });

      const response = await cartDAO.getAllCarts();
      expect(response).toStrictEqual([expected_cart]);

      allMock.mockRestore();
    });
  });
});
});