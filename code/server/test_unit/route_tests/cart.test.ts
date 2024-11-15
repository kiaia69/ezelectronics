import { describe, test, expect, beforeAll, afterAll, jest, afterEach } from "@jest/globals";
import request from "supertest";
import { app } from "../../index";
import { ProductNotFoundError, ProductAlreadyExistsError, ProductSoldError, EmptyProductStockError, LowProductStockError } from "../../src/errors/productError";
import { CartNotFoundError, EmptyCartError, ProductNotInCartError } from "../../src/errors/cartError";

import UserController from "../../src/controllers/userController";
import Authenticator from "../../src/routers/auth";
import CartController from "../../src/controllers/cartController";
import { Role, User } from "../../src/components/user";
import { Cart, ProductInCart } from "../../src/components/cart";
import { Product, Category } from "../../src/components/product";
import ErrorHandler from "../../src/helper";
const baseURL = "/ezelectronics";
const { validationResult } = require("express-validator");

//For unit tests, we need to validate the internal logic of a single component, without the need to test the interaction with other components
//For this purpose, we mock (simulate) the dependencies of the component we are testing
jest.mock("../../src/controllers/userController");
jest.mock("../../src/routers/auth");
jest.mock("../../src/controllers/cartController");

let testCustomer = new User("customer", "customer", "customer", Role.CUSTOMER, "", "");
let testAdmin = new User("admin", "admin", "admin", Role.ADMIN, "", "");
let testManager = new User("manager", "manager", "manager", Role.MANAGER, "", "");

afterEach(() => {
  jest.restoreAllMocks();

  //controllo se mettere jest mock
});


const Prodotto_Iphone13 = { model: "iPhone 13", category: Category.SMARTPHONE, quantity: 5, details: "", sellingPrice: 200, arrivalDate: "2024-01-01" };
let product_in_cart = {model: "iphone13", quantity:10, category: Category.SMARTPHONE, price: 200};

let cart = {customer: "customer", paid: false, paymentDate: "2024-06-11", total: 200, products: [product_in_cart]};

describe("Route unit tests", () => {
  describe("GET /cart", () => {
    test("It should return a 200 success code", async () => {
      jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        req.user = testCustomer;
        return next();
      });
      jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
        return next();
      });
      //We mock the ErrorHandler validateRequest method to return the next function, because we are not testing the validation logic here (we assume it works correctly)
      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
        return next();
      });

      jest.spyOn(CartController.prototype, "getCart").mockResolvedValueOnce(cart);

      const response = await request(app).get(baseURL + ("/carts")).send();
      expect(response.status).toBe(200);
      expect(response.body).toEqual(cart);
      expect(CartController.prototype.getCart).toHaveBeenCalled();
      expect(CartController.prototype.getCart).toHaveBeenCalledWith(testCustomer);
    });
    test("It should fail if is not a customer", async () => {
      jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        req.user = testCustomer;
        return next();
      });
      jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
        return res.status(401).json({ error: "Unauthorized" });
      });

      const response = await request(app).get(baseURL  + ("/carts")).send();
      expect(response.status).toBe(401);
    });
    test("It should fail if is not logged in", async () => {
      jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        return res.status(401).json({ error: "Unauthorized" });
      });

      const response = await request(app).get(baseURL  + ("/carts")).send();
      expect(response.status).toBe(401);
    });
  });

  describe("POST /cart", () => {
    test("It should return a 200 success code", async () => {
      jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        req.user = testCustomer;
        return next();
      });
      jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
        return next();
      });
      //We mock the ErrorHandler validateRequest method to return the next function, because we are not testing the validation logic here (we assume it works correctly)
      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
        return next();
      });

      jest.spyOn(CartController.prototype, "addToCart").mockResolvedValueOnce(true);

      const response = await request(app).post(baseURL + ("/carts")).send({ model: Prodotto_Iphone13.model });
      expect(response.status).toBe(200);
      expect(response.body).toEqual({});
      expect(CartController.prototype.addToCart).toHaveBeenCalled();
      expect(CartController.prototype.addToCart).toHaveBeenCalledWith(testCustomer, Prodotto_Iphone13.model);
    });

    test("should fail if is not a customer", async () => {
      jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        req.user = testCustomer;
        return next();
      });

      jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
        return res.status(401).json({ error: "Unauthorized" });
      });

      jest.spyOn(CartController.prototype, "addToCart").mockResolvedValueOnce(true);

      const response = await request(app).post(baseURL + ("/carts")).send({ model: Prodotto_Iphone13.model });
      expect(response.status).toBe(401);
    });

    test("should fail if is not logged in", async () => {
      jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        return res.status(401).json({ error: "Unauthorized" });
      });

      jest.spyOn(CartController.prototype, "addToCart").mockResolvedValueOnce(true);

      const response = await request(app).post(baseURL + ("/carts")).send({ model: Prodotto_Iphone13.model });
      expect(response.status).toBe(401);
    });

    test("should fail if model is empty", async () => {
      jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        req.user = testCustomer;
        return next();
      });
      jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
        return next();
      });
      //We mock the ErrorHandler validateRequest method to return the next function, because we are not testing the validation logic here (we assume it works correctly)
      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
        return next();
      });

      jest.spyOn(CartController.prototype, "addToCart").mockResolvedValueOnce(true);

      const response = await request(app).post(baseURL + ("/carts")).send({ model: "" });
      expect(response.status).toBe(422);
    });

    describe("PATCH /cart", () => {
        test("It should return a 200 success code", async () => {
          jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = testCustomer;
            return next();
          });
          jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
            return next();
          });
          //We mock the ErrorHandler validateRequest method to return the next function, because we are not testing the validation logic here (we assume it works correctly)
          jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
            return next();
          });
    
          jest.spyOn(CartController.prototype, "checkoutCart").mockResolvedValueOnce(true);
    
          const response = await request(app).patch(baseURL + ("/carts")).send();
          expect(response.status).toBe(200);
          expect(response.body).toEqual({});
          expect(CartController.prototype.checkoutCart).toHaveBeenCalled();
          expect(CartController.prototype.checkoutCart).toHaveBeenCalledWith(testCustomer);
        });
    
        test("should fail if is not a customer", async () => {
          jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = testCustomer;
            return next();
          });
    
          jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthorized" });
          });
    
          jest.spyOn(CartController.prototype, "checkoutCart").mockResolvedValueOnce(true);
    
          const response = await request(app).patch(baseURL + ("/carts")).send();
          expect(response.status).toBe(401);
        });
    
        test("should fail if is not logged in", async () => {
          jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthorized" });
          });
    
          jest.spyOn(CartController.prototype, "checkoutCart").mockResolvedValueOnce(true);
    
          const response = await request(app).patch(baseURL + ("/carts")).send();
          expect(response.status).toBe(401);
        });
    });

    describe("GET /carts/history", () => {
        test("It should return a 200 success code", async () => {
          jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = testCustomer;
            return next();
          });
          jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
            return next();
          });
          //We mock the ErrorHandler validateRequest method to return the next function, because we are not testing the validation logic here (we assume it works correctly)
          jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
            return next();
          });
    
          jest.spyOn(CartController.prototype, "getCustomerCarts").mockResolvedValueOnce([cart]);
    
          const response = await request(app).get(baseURL + "/carts/history").send();
          expect(response.status).toBe(200);
          expect(response.body).toStrictEqual([cart]);
          expect(CartController.prototype.getCustomerCarts).toHaveBeenCalled();
          expect(CartController.prototype.getCustomerCarts).toHaveBeenCalledWith(testCustomer);
        });



        test("should fail if is not a customer", async () => {
          jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = testCustomer;
            return next();
          });
    
          jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthorized" });
          });
    
          jest.spyOn(CartController.prototype, "getCustomerCarts").mockResolvedValueOnce([cart]);
    
          const response = await request(app).get(baseURL + ("/carts/history")).send();
          expect(response.status).toBe(401);
        });
    
        test("should fail if is not logged in", async () => {
          jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthorized" });
          });
    
          jest.spyOn(CartController.prototype, "getCustomerCarts").mockResolvedValueOnce([cart]);
    
          const response = await request(app).get(baseURL + ("/carts/history")).send();
          expect(response.status).toBe(401);
        });
    });


    describe("DELETE /carts/products/:model?", () => {
        test("It should return a 200 success code", async () => {
          jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = testCustomer;
            return next();
          });
          jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
            return next();
          });
          //We mock the ErrorHandler validateRequest method to return the next function, because we are not testing the validation logic here (we assume it works correctly)
          jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
            return next();
          });
    
          jest.spyOn(CartController.prototype, "removeProductFromCart").mockResolvedValueOnce(true);
    
          const response = await request(app).delete(baseURL + "/carts/products/" + Prodotto_Iphone13.model).send();
          expect(response.status).toBe(200);
          expect(response.body).toStrictEqual({});
          expect(CartController.prototype.removeProductFromCart).toHaveBeenCalled();
          expect(CartController.prototype.removeProductFromCart).toHaveBeenCalledWith(testCustomer,Prodotto_Iphone13.model);
        });

        test("It should fail with 404 parameter model not speficied", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
              req.user = testCustomer;
              return next();
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
              return next();
            });
            //We mock the ErrorHandler validateRequest method to return the next function, because we are not testing the validation logic here (we assume it works correctly)
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
              return next();
            });
      
            jest.spyOn(CartController.prototype, "removeProductFromCart").mockResolvedValueOnce(true);
      
            const response = await request(app).delete(baseURL + "/carts/products/").send();
            expect(response.status).toBe(422);
          });


        test("should fail if is not a customer", async () => {
          jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = testCustomer;
            return next();
          });
    
          jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthorized" });
          });
    
          jest.spyOn(CartController.prototype, "removeProductFromCart").mockResolvedValueOnce(true);
    
          const response = await request(app).delete(baseURL + ("/carts/products/")).send();
          expect(response.status).toBe(401);
        });
    
        test("should fail if is not logged in", async () => {
          jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthorized" });
          });
    
          jest.spyOn(CartController.prototype, "removeProductFromCart").mockResolvedValueOnce(true);
    
          const response = await request(app).delete(baseURL + ("/carts/products/")).send();
          expect(response.status).toBe(401);
        });
    });

    describe("DELETE /carts/current", () => {
        test("It should return a 200 success code", async () => {
          jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = testCustomer;
            return next();
          });
          jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
            return next();
          });
          //We mock the ErrorHandler validateRequest method to return the next function, because we are not testing the validation logic here (we assume it works correctly)
          jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
            return next();
          });
    
          jest.spyOn(CartController.prototype, "clearCart").mockResolvedValueOnce(true);
    
          const response = await request(app).delete(baseURL + "/carts/current").send();
          expect(response.status).toBe(200);
          expect(response.body).toStrictEqual({});
          expect(CartController.prototype.clearCart).toHaveBeenCalled();
          expect(CartController.prototype.clearCart).toHaveBeenCalledWith(testCustomer);
        });

        test("should fail if is not a customer", async () => {
          jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = testCustomer;
            return next();
          });
    
          jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthorized" });
          });
    
          jest.spyOn(CartController.prototype, "clearCart").mockResolvedValueOnce(true);
    
          const response = await request(app).delete(baseURL + ("/carts/current")).send();
          expect(response.status).toBe(401);
        });
    
        test("should fail if is not logged in", async () => {
          jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthorized" });
          });
    
          jest.spyOn(CartController.prototype, "clearCart").mockResolvedValueOnce(true);
    
          const response = await request(app).delete(baseURL + ("/carts/current")).send();
          expect(response.status).toBe(401);
        });
    });


    describe("DELETE /carts", () => {
        test("It should return a 200 success code", async () => {
          jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = testAdmin;
            return next();
          });
          jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return next();
          });
          //We mock the ErrorHandler validateRequest method to return the next function, because we are not testing the validation logic here (we assume it works correctly)
          jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
            return next();
          });
    
          jest.spyOn(CartController.prototype, "deleteAllCarts").mockResolvedValueOnce(true);
    
          const response = await request(app).delete(baseURL + "/carts").send();
          expect(response.status).toBe(200);
          expect(response.body).toStrictEqual({});
          expect(CartController.prototype.deleteAllCarts).toHaveBeenCalled();
          expect(CartController.prototype.deleteAllCarts).toHaveBeenCalledWith();
        });

        test("should fail if is not a admin", async () => {
          jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = testAdmin;
            return next();
          });
    
          jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthorized" });
          });
    
          jest.spyOn(CartController.prototype, "deleteAllCarts").mockResolvedValueOnce(true);
    
          const response = await request(app).delete(baseURL + ("/carts")).send();
          expect(response.status).toBe(401);
        });
    
        test("should fail if is not logged in", async () => {
          jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthorized" });
          });
    
          jest.spyOn(CartController.prototype, "deleteAllCarts").mockResolvedValueOnce(true);
    
          const response = await request(app).delete(baseURL + ("/carts")).send();
          expect(response.status).toBe(401);
        });
    });

    describe("GET /carts/all", () => {
        test("It should return a 200 success code", async () => {
          jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = testAdmin;
            return next();
          });
          jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return next();
          });
          //We mock the ErrorHandler validateRequest method to return the next function, because we are not testing the validation logic here (we assume it works correctly)
          jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
            return next();
          });
    
          jest.spyOn(CartController.prototype, "getAllCarts").mockResolvedValueOnce([cart]);
    
          const response = await request(app).get(baseURL + "/carts/all").send();
          expect(response.status).toBe(200);
          expect(response.body).toStrictEqual([cart]);
          expect(CartController.prototype.getAllCarts).toHaveBeenCalled();
          expect(CartController.prototype.getAllCarts).toHaveBeenCalledWith();
        });

        test("should fail if is not a admin", async () => {
          jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = testAdmin;
            return next();
          });
    
          jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthorized" });
          });
    
          jest.spyOn(CartController.prototype, "getAllCarts").mockResolvedValueOnce([cart]);
    
          const response = await request(app).get(baseURL + ("/carts/all")).send();
          expect(response.status).toBe(401);
        });
    
        test("should fail if is not logged in", async () => {
          jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthorized" });
          });
    
          jest.spyOn(CartController.prototype, "getAllCarts").mockResolvedValueOnce([cart]);
    
          const response = await request(app).get(baseURL + ("/carts/all")).send();
          expect(response.status).toBe(401);
        });
    });




  });

  // describe("GET /users", () => {
  //     test("It returns an array of users", async () => {
  //         //The route we are testing calls the getUsers method of the UserController and the isAdmin method of the Authenticator
  //         //We mock the 'getUsers' method to return an array of users, because we are not testing the UserController logic here (we assume it works correctly)
  //         jest.spyOn(UserController.prototype, "getUsers").mockResolvedValueOnce([testAdmin, testCustomer])
  //         //We mock the 'isAdmin' method to return the next function, because we are not testing the Authenticator logic here (we assume it works correctly)
  //         jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
  //             return next();
  //         })

  //         //We send a request to the route we are testing. We are in a situation where:
  //         //  - The user is an Admin (= the Authenticator logic is mocked to be correct)
  //         //  - The getUsers function returns an array of users (= the UserController logic is mocked to be correct)
  //         //We expect the 'getUsers' function to have been called, the route to return a 200 success code and the expected array
  //         const response = await request(app).get(baseURL + "/users")
  //         expect(response.status).toBe(200)
  //         expect(UserController.prototype.getUsers).toHaveBeenCalled()
  //         expect(response.body).toEqual([testAdmin, testCustomer])
  //     })

  //     test("It should fail if the user is not an Admin", async () => {
  //         //In this case, we are testing the situation where the route returns an error code because the user is not an Admin
  //         //We mock the 'isAdmin' method to return a 401 error code, because we are not testing the Authenticator logic here (we assume it works correctly)
  //         jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
  //             return res.status(401).json({ error: "Unauthorized" });
  //         })
  //         //By calling the route with this mocked dependency, we expect the route to return a 401 error code
  //         const response = await request(app).get(baseURL + "/users")
  //         expect(response.status).toBe(401)
  //     })
  // })

  // describe("GET /users/roles/:role", () => {

  //     test("It returns an array of users with a specific role", async () => {
  //         //The route we are testing calls the getUsersByRole method of the UserController, the isAdmin method of the Authenticator, and the param method of the express-validator
  //         //We mock the 'getUsersByRole' method to return an array of users, because we are not testing the UserController logic here (we assume it works correctly)
  //         jest.spyOn(UserController.prototype, "getUsersByRole").mockResolvedValueOnce([testAdmin])
  //         //We mock the 'isAdmin' method to return the next function, because we are not testing the Authenticator logic here (we assume it works correctly)
  //         jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
  //             return next();
  //         })
  //         //We mock the 'param' method of the express-validator to throw an error, because we are not testing the validation logic here (we assume it works correctly)
  //   jest.mock('express-validator', () => ({
  //       param: jest.fn().mockImplementation(() => ({
  //           isString: () => ({ isLength: () => ({}) }),
  //           isIn: () => ({ isLength: () => ({}) }),
  //       })),
  //   }))
  //         //We call the route with the mocked dependencies. We expect the 'getUsersByRole' function to have been called, the route to return a 200 success code and the expected array
  //         const response = await request(app).get(baseURL + "/users/roles/Admin")
  //         expect(response.status).toBe(200)
  //         expect(UserController.prototype.getUsersByRole).toHaveBeenCalled()
  //         expect(UserController.prototype.getUsersByRole).toHaveBeenCalledWith("Admin")
  //         expect(response.body).toEqual([testAdmin])
  //     })

  //     test("It should fail if the role is not valid", async () => {
  //         //In this case we are testing a scenario where the role parameter is not among the three allowed ones
  //         //We need the 'isAdmin' method to return the next function, because the route checks if the user is an Admin before validating the role
  //         jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
  //             return next();
  //         })
  //         //We mock the 'param' method of the express-validator to throw an error, because we are not testing the validation logic here (we assume it works correctly)
  //         jest.mock('express-validator', () => ({
  //             param: jest.fn().mockImplementation(() => {
  //                 throw new Error("Invalid value");
  //             }),
  //         }));
  //         //We mock the 'validateRequest' method to receive an error and return a 422 error code, because we are not testing the validation logic here (we assume it works correctly)
  //         jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
  //             return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
  //         })
  //         //We call the route with dependencies mocked to simulate an error scenario, and expect a 422 code
  //         const response = await request(app).get(baseURL + "/users/roles/Invalid")
  //         expect(response.status).toBe(422)
  //     })
  // })
});
