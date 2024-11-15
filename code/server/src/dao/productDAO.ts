import { Product} from "../components/product";
import db from "../db/db"
import { ProductNotFoundError, ProductAlreadyExistsError, ProductSoldError, EmptyProductStockError, LowProductStockError } from "../errors/productError";
import { DateError } from "../utilities"
import dayjs from 'dayjs';
/**
 * A class that implements the interaction with the database for all product-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class ProductDAO {
    async registerProducts(model: string, category: string, quantity: number, details: string | null, sellingPrice: number, arrivalDate: string | null): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            let today=dayjs().format("YYYY-MM-DD");
            if(arrivalDate) {
                if(arrivalDate>today){ 
                    reject(new DateError());
                    return;
                }
            }
            else{ arrivalDate = today; }
            const sql = "INSERT INTO ProductDescriptor(model, category, arrival_date, selling_price, quantity, details) VALUES (?, ?, ?, ?, ?, ?)";
            db.run(sql, [model, category, arrivalDate, sellingPrice, quantity, details], function (err: Error | null) {
                if (err) {
                    if (err.message.includes("UNIQUE constraint failed: ProductDescriptor.model")) {
                         reject(new ProductAlreadyExistsError());
                         return;
                    } else {
                        reject(err);
                    }
                } else {
                    resolve(true);
                }
            });
        });
    }

    async changeProductQuantity(model: string, newQuantity: number, changeDate: string ): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
                let sqlUpdate = "UPDATE ProductDescriptor SET quantity = quantity + ?, arrival_date = ? WHERE model = ?";
                let sqlArray = [newQuantity, changeDate, model]

                db.run(sqlUpdate, sqlArray, async function (err: Error | null) {
                    if (err) {
                        reject(err);
                    }
                    else{
                        resolve();
                    }
                });
        });
    }

    async getProducts(grouping: string | null, category: string | null, model: string | null) : Promise<Product[]>  {
        return new Promise<Product[]>(async (resolve, reject) => {
            let sql = "SELECT * FROM ProductDescriptor";
            const params: any[] = [];
    
            if (grouping === "category" && category) {
                sql += " WHERE category = ?";
                params.push(category);
            } else if (grouping === "model" && model) {
                sql += " WHERE model = ?";
                params.push(model);
            }
            db.all(sql, params,(err: Error | null, rows: any[]) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (rows.length === 0 && model) {
                    reject(new ProductNotFoundError());
                    return;
                }
                const products: Product[] = rows.map((row) => 
                    new Product(
                        parseFloat(row.selling_price),
                        row.model,
                        row.category,
                        row.arrival_date,
                        row.details,
                        parseInt(row.quantity)
                    )
                );
                resolve(products);
            });
        });
    }

    getAvailableProducts(grouping: string | null, category: string | null, model: string | null)  :Promise<Product[]>  {
        return new Promise<Product[]>(async (resolve, reject) => {
                let sql = `SELECT * FROM ProductDescriptor WHERE quantity >= 0`;
                const params: any[] = [];
    
                if (grouping === "category" && category) {
                    sql += " AND category = ?";
                    params.push(category);
                } else if (grouping === "model" && model) {
                    sql += " AND model = ?";
                    params.push(model);
                }
                db.all(sql,params, (err: Error | null, rows: any[]) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    if (rows.length === 0 && model) {
                        reject(new ProductNotFoundError());
                        return;
                    }
                    const products: Product[] = rows.filter(x => parseInt(x.quantity) > 0).map((row) => 
                        new Product(
                            parseFloat(row.selling_price),
                            row.model,
                            row.category,
                            row.arrival_date,
                            row.details,
                            parseInt(row.quantity)
                        )
                    );
                    resolve(products);
                });
        });
    }

    async deleteProduct(model: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
                const sqlDelete = "DELETE FROM ProductDescriptor WHERE model = ?"
                db.run(sqlDelete, [model], function(err: Error | null){
                    const changes = this.changes
                    if (err) {
                        return reject(err);
                    }
                    if (changes === 0) {
                        return reject(new ProductNotFoundError());
                    }
                    resolve(true)
                })
            })
    }

    async deleteAllProducts(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
                const sqlDelete = "DELETE FROM ProductDescriptor "
                db.run(sqlDelete, [], (err: Error | null) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(true)
                })
        })
    }
}

export default ProductDAO