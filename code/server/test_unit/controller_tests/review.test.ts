import { test, expect, jest, describe, beforeEach } from "@jest/globals"
import ReviewController from "../../src/controllers/reviewController"
import ReviewDAO from "../../src/dao/reviewDAO"
import { ProductReview } from "../../src/components/review"
import { Role, User } from "../../src/components/user"
import UserDAO from "../../src/dao/userDAO"
import dayjs from "dayjs"
import ProductDAO from "../../src/dao/productDAO"
import { ProductNotFoundError } from "../../src/errors/productError"
import { ExistingReviewError, NoReviewProductError } from "../../src/errors/reviewError"

jest.mock("../../src/dao/reviewDAO")

describe("ReviewControllerTest", () => {
    
    beforeEach(() => {
        jest.clearAllMocks(); // Clear mocks before each test
    });


    test("It should add a new review for a product", async () => {

        const utente = new User("g", "giulia", "df", Role.CUSTOMER, "indirizzo", "datadinascita");

        const testReview = { //Test review object
            model: "test",
            user: utente,
            score: 4,
            date: "02/06/2024",
            comment: "test",
        }
        

        jest.spyOn(ReviewDAO.prototype, "addReview").mockResolvedValueOnce();
        const controller = new ReviewController();
        const response = await controller.addReview(testReview.model, utente , testReview.score, testReview.comment);

        expect(ReviewDAO.prototype.addReview).toHaveBeenCalledTimes(1);
        expect(ReviewDAO.prototype.addReview).toHaveBeenCalledWith(testReview.model,
            testReview.user.username,
            testReview.score,
            testReview.comment);
        expect(response).toBe(undefined);

    });


    test("It should show the reviews of a product", async () => {

        const testReview = "modello1";
        let ProductReview: ProductReview[] = [{
            model: "modello1",
            user: "Giulia",
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


        jest.spyOn(ReviewDAO.prototype, "getProductReviews").mockResolvedValueOnce(ProductReview);
        const controller = new ReviewController();
        const response = await controller.getProductReviews(testReview);

        expect(ReviewDAO.prototype.getProductReviews).toHaveBeenCalledTimes(1);
        expect(ReviewDAO.prototype.getProductReviews).toHaveBeenCalledWith(testReview);
        expect(response).toBe(ProductReview);

    });

    test("It should delete a review", async () => {

        const utente = new User("g", "giulia", "df", Role.CUSTOMER, "indirizzo", "datadinascita");


        const testReview = {
            model: "test",
            user: utente,
        };

        jest.spyOn(ReviewDAO.prototype, "deleteReview").mockResolvedValueOnce();
        const controller = new ReviewController();
        const response = await controller.deleteReview(testReview.model, testReview.user);

        expect(ReviewDAO.prototype.deleteReview).toHaveBeenCalledTimes(1);
        expect(ReviewDAO.prototype.deleteReview).toHaveBeenCalledWith(testReview.model, testReview.user);
        expect(response).toBe(undefined);

    });

    test("It should delete all reviews for a product", async () => {

        const testReview = "test";

        jest.spyOn(ReviewDAO.prototype, "deleteReviewsOfProduct").mockResolvedValueOnce();
        const controller = new ReviewController();
        const response = await controller.deleteReviewsOfProduct(testReview);

        expect(ReviewDAO.prototype.deleteReviewsOfProduct).toHaveBeenCalledTimes(1);
        expect(ReviewDAO.prototype.deleteReviewsOfProduct).toHaveBeenCalledWith(testReview);
        expect(response).toBe(undefined);

    });

    test("It should delete all reviews", async () => {

        jest.spyOn(ReviewDAO.prototype, "deleteAllReviews").mockResolvedValueOnce();
        const controller = new ReviewController();
        const response = await controller.deleteAllReviews();

        expect(ReviewDAO.prototype.deleteAllReviews).toHaveBeenCalledTimes(1);
        expect(ReviewDAO.prototype.deleteAllReviews).toHaveBeenCalledWith();
        expect(response).toBe(undefined);

    });


});
