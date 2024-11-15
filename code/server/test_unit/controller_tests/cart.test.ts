import { describe, test, expect, afterEach, jest } from "@jest/globals";
import { ProductNotFoundError, EmptyProductStockError, LowProductStockError } from "../../src/errors/productError";
import { CartNotFoundError, EmptyCartError, ProductNotInCartError } from "../../src/errors/cartError";
import CartController from "../../src/controllers/cartController";
import CartDAO from "../../src/dao/cartDAO";
import { Role, User } from "../../src/components/user";
import { Category } from "../../src/components/product";
jest.mock("../../src/dao/cartDAO");
jest.mock("../../src/routers/auth");

let testCustomer = new User("customer", "customer", "customer", Role.CUSTOMER, "", "");

afterEach(() => {
  jest.restoreAllMocks();
  //controllo se mettere jest mock
});

let product_in_cart = { model: "iphone13", quantity: 10, category: Category.SMARTPHONE, price: 200 };

const controller = new CartController();

const product_not_found = new ProductNotFoundError();
const empty_product_stock = new EmptyProductStockError();
const empty_cart_err = new EmptyCartError();
const low_product_stock = new LowProductStockError();
const cart_not_found = new CartNotFoundError();
const product_not_in_cart = new ProductNotInCartError();

let cart = { customer: "customer", paid: false, paymentDate: "2024-06-11", total: 200, products: [product_in_cart] };

describe("CartController unit tests", () => {
  describe("test getUnpaidCartByUserIdController", () => {
    test("It should return success", async () => {
      jest.spyOn(CartDAO.prototype, "getUnpaidCartByUserIdController").mockResolvedValueOnce(cart);

      const response = await controller.getCart(testCustomer);
      expect(response).toBe(cart);

      expect(CartDAO.prototype.getUnpaidCartByUserIdController).toHaveBeenCalled();
      expect(CartDAO.prototype.getUnpaidCartByUserIdController).toHaveBeenCalledWith(testCustomer.username);
    });

    test("It should return errors", async () => {
      jest.spyOn(CartDAO.prototype, "getUnpaidCartByUserIdController").mockRejectedValueOnce(cart_not_found);

      await expect(controller.getCart(testCustomer)).rejects.toThrowError(CartNotFoundError);

      expect(CartDAO.prototype.getUnpaidCartByUserIdController).toHaveBeenCalled();
      expect(CartDAO.prototype.getUnpaidCartByUserIdController).toHaveBeenCalledWith(testCustomer.username);
    });
  });
  describe("test addToCart", () => {
    test("It should return success", async () => {
      jest.spyOn(CartDAO.prototype, "addToCart").mockResolvedValueOnce(true);

      const response = await controller.addToCart(testCustomer, "Iphone 13");
      expect(response).toBe(true);

      expect(CartDAO.prototype.addToCart).toHaveBeenCalled();
      expect(CartDAO.prototype.addToCart).toHaveBeenCalledWith(testCustomer.username, "Iphone 13");
    });

    test("It should return errors", async () => {
      jest.spyOn(CartDAO.prototype, "addToCart").mockRejectedValueOnce(product_not_found);

      await expect(controller.addToCart(testCustomer, "Iphone 13")).rejects.toThrowError(ProductNotFoundError);

      expect(CartDAO.prototype.addToCart).toHaveBeenCalledWith(testCustomer.username, "Iphone 13");

      jest.spyOn(CartDAO.prototype, "addToCart").mockRejectedValueOnce(empty_product_stock);

      await expect(controller.addToCart(testCustomer, "Iphone 13")).rejects.toThrowError(EmptyProductStockError);

      expect(CartDAO.prototype.addToCart).toHaveBeenCalledWith(testCustomer.username, "Iphone 13");
    });
  });

  describe("test checkoutCart", () => {
    test("It should return success", async () => {
      jest.spyOn(CartDAO.prototype, "checkoutCart").mockResolvedValueOnce(true);

      const response = await controller.checkoutCart(testCustomer);
      expect(response).toBe(true);

      expect(CartDAO.prototype.checkoutCart).toHaveBeenCalled();
      expect(CartDAO.prototype.checkoutCart).toHaveBeenCalledWith(testCustomer.username);
    });

    test("It should return errors", async () => {
      jest.spyOn(CartDAO.prototype, "checkoutCart").mockRejectedValueOnce(product_not_found);

      await expect(controller.checkoutCart(testCustomer)).rejects.toThrowError(ProductNotFoundError);

      expect(CartDAO.prototype.checkoutCart).toHaveBeenCalledWith(testCustomer.username);

      jest.spyOn(CartDAO.prototype, "checkoutCart").mockRejectedValueOnce(empty_cart_err);

      await expect(controller.checkoutCart(testCustomer)).rejects.toThrowError(EmptyCartError);

      expect(CartDAO.prototype.checkoutCart).toHaveBeenCalledWith(testCustomer.username);

      jest.spyOn(CartDAO.prototype, "checkoutCart").mockRejectedValueOnce(empty_product_stock);

      await expect(controller.checkoutCart(testCustomer)).rejects.toThrowError(EmptyProductStockError);

      expect(CartDAO.prototype.checkoutCart).toHaveBeenCalledWith(testCustomer.username);

      jest.spyOn(CartDAO.prototype, "checkoutCart").mockRejectedValueOnce(low_product_stock);

      await expect(controller.checkoutCart(testCustomer)).rejects.toThrowError(LowProductStockError);

      expect(CartDAO.prototype.checkoutCart).toHaveBeenCalledWith(testCustomer.username);
    });
  });

  describe("test getCustomerCart", () => {
    test("It should return success", async () => {
      jest.spyOn(CartDAO.prototype, "getCustomerCarts").mockResolvedValueOnce([cart]);

      const response = await controller.getCustomerCarts(testCustomer);
      expect(response).toStrictEqual([cart]);

      expect(CartDAO.prototype.getCustomerCarts).toHaveBeenCalled();
      expect(CartDAO.prototype.getCustomerCarts).toHaveBeenCalledWith(testCustomer.username);
    });
  });

  describe("test removeProductFromCart", () => {
    test("It should return success", async () => {
      jest.spyOn(CartDAO.prototype, "removeToCart").mockResolvedValueOnce(true);

      const response = await controller.removeProductFromCart(testCustomer, "Iphone 13");
      expect(response).toBe(true);

      expect(CartDAO.prototype.removeToCart).toHaveBeenCalled();
      expect(CartDAO.prototype.removeToCart).toHaveBeenCalledWith(testCustomer.username, "Iphone 13");
    });

    test("It should return errors", async () => {
      jest.spyOn(CartDAO.prototype, "removeToCart").mockRejectedValueOnce(product_not_found);

      await expect(controller.removeProductFromCart(testCustomer, "Iphone 13")).rejects.toThrowError(ProductNotFoundError);

      expect(CartDAO.prototype.removeToCart).toHaveBeenCalledWith(testCustomer.username, "Iphone 13");

      jest.spyOn(CartDAO.prototype, "removeToCart").mockRejectedValueOnce(cart_not_found);

      await expect(controller.removeProductFromCart(testCustomer, "Iphone 13")).rejects.toThrowError(CartNotFoundError);

      expect(CartDAO.prototype.removeToCart).toHaveBeenCalledWith(testCustomer.username, "Iphone 13");

      jest.spyOn(CartDAO.prototype, "removeToCart").mockRejectedValueOnce(empty_cart_err);
      await expect(controller.removeProductFromCart(testCustomer, "Iphone 13")).rejects.toThrowError(EmptyCartError);

      expect(CartDAO.prototype.removeToCart).toHaveBeenCalledWith(testCustomer.username, "Iphone 13");

      jest.spyOn(CartDAO.prototype, "removeToCart").mockRejectedValueOnce(product_not_in_cart);
      await expect(controller.removeProductFromCart(testCustomer, "Iphone 13")).rejects.toThrowError(ProductNotInCartError);

      expect(CartDAO.prototype.removeToCart).toHaveBeenCalledWith(testCustomer.username, "Iphone 13");
    });
  });

  describe("test clearCart", () => {
    test("It should return success", async () => {
      jest.spyOn(CartDAO.prototype, "clearCart").mockResolvedValueOnce(true);

      const response = await controller.clearCart(testCustomer);
      expect(response).toBe(true);

      expect(CartDAO.prototype.clearCart).toHaveBeenCalled();
      expect(CartDAO.prototype.clearCart).toHaveBeenCalledWith(testCustomer.username);
    });

    test("It should return errors", async () => {
      jest.spyOn(CartDAO.prototype, "clearCart").mockRejectedValueOnce(cart_not_found);

      await expect(controller.clearCart(testCustomer)).rejects.toThrowError(CartNotFoundError);

      expect(CartDAO.prototype.clearCart).toHaveBeenCalledWith(testCustomer.username);
    });
  });

  describe("test deleteAllCarts", () => {
    test("It should return success", async () => {
      jest.spyOn(CartDAO.prototype, "deleteAllCarts").mockResolvedValueOnce(true);

      const response = await controller.deleteAllCarts();
      expect(response).toBe(true);

      expect(CartDAO.prototype.deleteAllCarts).toHaveBeenCalled();
      expect(CartDAO.prototype.deleteAllCarts).toHaveBeenCalledWith();
    });
  });

  describe("test getAllCarts", () => {
    test("It should return success", async () => {
      jest.spyOn(CartDAO.prototype, "getAllCarts").mockResolvedValueOnce([cart]);

      const response = await controller.getAllCarts();
      expect(response).toStrictEqual([cart]);

      expect(CartDAO.prototype.getAllCarts).toHaveBeenCalled();
      expect(CartDAO.prototype.getAllCarts).toHaveBeenCalledWith();
    });
  });
});
