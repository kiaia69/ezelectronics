import { ProductReview } from "../components/review";
import { Product } from "../components/product";
import db from "../db/db";
import dayjs from "dayjs";
import { ExistingReviewError, NoReviewProductError } from "../errors/reviewError";
import { ProductNotFoundError } from "../errors/productError";
import { User } from "../components/user";

/**
 * A class that implements the interaction with the database for all review-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class ReviewDAO {

    addReview(model: string, username: string, score: number, comment: string): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {
                const product = await this.getProduct(model);
                if (!product) {
                    reject(new ProductNotFoundError());
                    return;
                }

                const review = await this.getReview(model, username);
                if (review) {
                    reject(new ExistingReviewError());
                    return;
                }

                const date = dayjs().format("YYYY-MM-DD");

                const sql = "INSERT INTO Review(score, date, comment, ref_utente, ref_product_descriptor) VALUES(?, ?, ?, ?, ?)";
                db.run(sql, [score, date, comment, username, model], (err: Error | null) => {
                    if (err) reject(err)
                    else {
                        resolve();
                    }
                })
            } catch (error) {
                reject(error)
            }

        });
    }



    getProductReviews(model: string): Promise<ProductReview[]> {

        return new Promise<ProductReview[]>((resolve, reject) => {
            try {
                let reviews: ProductReview[] = [];
                const sql = "SELECT ref_product_descriptor, ref_utente AS user, score, date, comment FROM Review WHERE ref_product_descriptor=?"
                db.all(sql, [model], (err: Error | null, rows: any[]) => {
                    if (err) {
                        reject(err)
                        return
                    }
                    if (!rows || rows.length === 0) {
                        resolve(reviews);
                        return;
                    }

                    rows.forEach((row: any) => {
                        reviews.push(new ProductReview(model, row.user, row.score, row.date, row.comment)
                        )
                    })
                    resolve(reviews)
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    deleteReview(model: string, user: User): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                const sql = "DELETE FROM Review WHERE ref_utente = ? AND ref_product_descriptor = ?"
                db.run(sql, [user.username, model], function (err) {
                    if (this.changes === 0){
                        reject(new NoReviewProductError());
                        return;
                    }
                    resolve();
                }
                )
            }
            catch (err) {
                resolve(err)
            }
        })
    }


    deleteReviewsOfProduct(model: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const sql = "DELETE FROM Review WHERE ref_product_descriptor = ?"
            db.run(sql, [model], function (err) {
                if (this.changes === 0)
                    return reject(new NoReviewProductError());
                else if (err)
                    return reject(err);
                resolve();
            }
            )
        }
        )

    }

    deleteAllReviews(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                const sql = "DELETE FROM Review;"
                db.run(sql, [], function (err) {
                    // if (this.changes === 0)
                    //     return reject(err);
                    resolve();
                }
                )
            }
            catch (err) {
                resolve(err)
            }

        })
    }

    //METODI AUSILIARI            
    getProduct(model: string): Promise<Product> {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM ProductDescriptor WHERE model = ?';
            db.get(sql, [model], (err: Error, row: Product) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
    }

    getReview(model: string, username: string): Promise<Boolean> {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM Review WHERE ref_product_descriptor = ? AND ref_utente = ?';
            db.get(sql, [model, username], (err: Error, row: ProductReview) => {
                if (err) return reject(err);
                if (row) return resolve(true);
                resolve(false)
            });
        });
    }

}




export default ReviewDAO;