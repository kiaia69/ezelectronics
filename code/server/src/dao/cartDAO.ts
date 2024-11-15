import { Cart, ProductInCart } from "../components/cart"
import { Product } from "../components/product";
import { EmptyProductStockError, LowProductStockError, ProductNotFoundError } from "../errors/productError";
import db from "../db/db"
import dayjs from "dayjs";
import { CartNotFoundError, EmptyCartError, ProductNotInCartError } from "../errors/cartError";

/**
 * A class that implements the interaction with the database for all cart-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class CartDAO {

    async getUnpaidCartByUserId(username: string): Promise<Cart | undefined> {
        const cart: Cart = {
            customer: username,
            paid: false,
            paymentDate: null,
            total: 0,
            products: []
        };

        return new Promise<Cart | undefined>((resolve, reject) => {
            const sql = `
                SELECT 
                    c.total, 
                    c.payment_date, 
                    p.ref_product_descriptor, 
                    p.quantity, 
                    pd.model, 
                    pd.category, 
                    pd.selling_price 
                FROM 
                    Cart c 
                LEFT JOIN 
                    ProductUser p ON c.id_cart = p.id_cart 
                LEFT JOIN 
                    ProductDescriptor pd ON p.ref_product_descriptor = pd.model
                WHERE 
                    c.paid = false AND 
                    c.ref_username = ?;
            `;

            db.all(sql, [username], (err: Error | null, rows: any[]) => {
                if (err) {
                    reject(err); // Server error
                    return;
                } else if (rows.length === 0) {
                    // No unpaid cart found, return undefined
                    resolve(undefined);
                } else {
                    // If the cart exists but has no products, rows will contain at least one entry with product details being null
                    const row = rows[0];
                    if (row.ref_product_descriptor === null) {
                        resolve(cart);
                    } else {
                        // Populate the cart details
                        cart.total = row.total;
                        cart.paymentDate = row.payment_date;

                        // Iterate through each row to collect product details
                        rows.forEach(row => {
                            if (row.ref_product_descriptor !== null) {
                                cart.products.push({
                                    model: row.model,
                                    category: row.category,
                                    price: row.selling_price,
                                    quantity: row.quantity,
                                });
                            }
                        });

                        resolve(cart);
                    }
                }
            });
        });
    }

    async getUnpaidCartByUserIdController(username: string): Promise<Cart> {
        const cart: Cart = {
            customer: username,
            paid: false,
            paymentDate: null,
            total: 0,
            products: []
        };

        return new Promise<Cart>((resolve, reject) => {

            try {
                const sql = `
                    SELECT 
                        c.total, 
                        c.payment_date, 
                        p.ref_product_descriptor, 
                        p.quantity, 
                        pd.model, 
                        pd.category, 
                        pd.selling_price 
                    FROM 
                        Cart c 
                    JOIN 
                        ProductUser p ON c.id_cart = p.id_cart 
                    JOIN 
                        ProductDescriptor pd ON p.ref_product_descriptor = pd.model
                    WHERE 
                        c.paid = false AND 
                        c.ref_username = ?;
                `;

                db.all(sql, [username], (err: Error | null, rows: any[]) => {
                    if (err) {
                        reject(err); // Server error
                        return;
                    } else if (rows.length === 0) {
                        // No unpaid cart found, return the empty cart
                        resolve(cart);
                    } else {
                        // Populate the cart details
                        cart.total = rows[0].total;
                        cart.paymentDate = rows[0].payment_date;

                        // Iterate through each row to collect product details
                        rows.forEach(row => {
                            cart.products.push({
                                model: row.model,
                                category: row.category,
                                price: row.selling_price,
                                quantity: row.quantity,
                            });
                        });

                        resolve(cart);
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    async addToCart(username: string, model: string): Promise<Boolean> {
        return new Promise<Boolean>(async (resolve, reject) => {

            try {
                // Check if product exists
                const product = await this.getProduct(model);
                if (!product) {
                    reject(new ProductNotFoundError());
                    return;
                }

                // Check product quantity
                if (product.quantity <= 0) {
                    reject(new EmptyProductStockError())
                    return;
                }

                // Get unpaid cart or create one if it doesn't exist
                let cart = await this.getUnpaidCartByUserId(username);
                if (!cart) {
                    cart = await this.createCart(username);
                }

                // Check if product is already in the cart
                const productInCart = await this.getProductInCart(cart.customer, model);
                if (productInCart) {
                    // Update quantity if product is already in the cart
                    await this.updateProductQuantity(cart.customer, model, 1);
                } else {
                    // Add product to the cart
                    await this.addProductToCart(cart.customer, model);
                }

                // Update cart total
                await this.updateCartTotal(cart.customer);

                resolve(true);
            } catch (error) {
                reject(error);
            }
        });
    }

    async removeToCart(username: string, model: string): Promise<Boolean> {
        return new Promise<Boolean>(async (resolve, reject) => {
            try {

                // Check unpaid cart
                let cart = await this.getUnpaidCartByUserId(username);
                if (!cart) {
                    reject(new CartNotFoundError());
                    return;
                }

                //CONTROLLO CHE IL CARRELLO NON SIA VUOTO
                if (!cart.products[0] || !cart.products[0].model || cart.products.length === 0) {
                    reject(new ProductNotInCartError());
                    return;
                }
                // Check if product exists
                const product = await this.getProduct(model);
                if (!product) {
                    reject(new ProductNotFoundError());
                    return;
                }

                // Check if product is in the cart
                const productInCart = await this.getProductInCart(cart.customer, model);
                if (productInCart) {
                    if (productInCart.quantity > 1) {

                        // Update quantity if product is in the cart
                        await this.updateProductQuantity(cart.customer, model, -1);
                    }
                    else {
                        await this.removeProductFromCart(cart.customer, model);
                    }
                } else {
                    reject(new ProductNotInCartError());
                    return;
                }

                // Update cart total
                await this.updateCartTotal(cart.customer);

                resolve(true);
            } catch (error) {
                reject(error);
            }
        });
    }

    async checkoutCart(username: string): Promise<Boolean> {
        return new Promise<Boolean>(async (resolve, reject) => {
            try {
                // Check unpaid cart
                let cart = await this.getUnpaidCartByUserId(username);
                if (!cart) {
                    reject(new CartNotFoundError());
                    return;
                }

                // Check if there are products in the cart
                // const productsInCart = await this.areProductsInCart(cart.customer);
                // if (!productsInCart) {
                if (!cart.products[0] || !cart.products[0].model || cart.products.length === 0) {
                    reject(new EmptyCartError());
                    return;
                } else {
                    const availability: any = await this.checkProductsAvailability(cart.customer);
                    if (availability.empty === true) {
                        return reject(new EmptyProductStockError());
                    }
                    if (availability.empty === false && availability.avaiable == false) {
                        return reject(new LowProductStockError());
                    }

                    //  // Check if some products are not available
                    //  const result = await this.checkProductsEmpty(cart.customer);
                    //  if (!result) {
                    //      reject(new EmptyProductStockError());
                    //  }
                    // // Check quantity of the products
                    // const availability = await this.checkProductsAvailability(cart.customer);
                    // if (!availability) {
                    //     reject(new LowProductStockError());
                    // }
                }

                const current = dayjs().format('YYYY-MM-DD');

                // Checout cart
                const sql = `
                    UPDATE Cart
                    SET paid = 1, payment_date = ?
                    WHERE id_cart = (SELECT id_cart FROM Cart WHERE ref_username = ? AND paid = 0)`

                db.run(sql, [current, username], async function (err) {
                    if (err) {
                        reject(err);
                        return;
                    } else {
                        try {
                            //aggiornare la quantità dei prodotti comprati riducendola
                            for (const product of cart.products) {
                                const updateProductSql = `
                                UPDATE ProductDescriptor
                                SET quantity = quantity - ?
                                WHERE model = ?`;
                                await new Promise((resolveUpdate, rejectUpdate) => {
                                    db.run(updateProductSql, [product.quantity, product.model], function (err) {
                                        if (err) {
                                            rejectUpdate(err);
                                        } else {
                                            resolveUpdate(true);
                                        }
                                    });
                                });
                            }
                            resolve(true);

                        }
                        catch (updateError) {
                            reject(updateError);
                        }
                    }

                });
            } catch (error) {
                reject(error);
            }
        });
    }

    async getCustomerCarts(username: string): Promise<Cart[]> {
        return new Promise<Cart[]>((resolve, reject) => {
            try {
                const sql = `
                    SELECT 
                        c.id_cart,
                        c.total, 
                        c.payment_date, 
                        p.ref_product_descriptor, 
                        p.quantity, 
                        pd.model, 
                        pd.category, 
                        pd.selling_price 
                    FROM 
                        Cart c 
                    JOIN 
                        ProductUser p ON c.id_cart = p.id_cart 
                    JOIN 
                        ProductDescriptor pd ON p.ref_product_descriptor = pd.model
                    WHERE 
                        c.paid = 1 AND 
                        c.ref_username = ?;
                `;

                db.all(sql, [username], (err: Error | null, rows: any[]) => {
                    if (err) {
                        reject(err); // Server error
                        return;
                    } else if (!rows || rows.length === 0) {
                        // No unpaid cart found, return the empty cart
                        resolve([]);
                    } else {
                        // Create a map to store carts by id_cart
                        const cartsMap: { [key: number]: Cart } = {};

                        // Iterate through each row to collect product details
                        rows.forEach(row => {
                            const cartId = row.id_cart;
                            if (!cartsMap[cartId]) {
                                cartsMap[cartId] = {
                                    customer: username,
                                    paid: true,
                                    paymentDate: row.payment_date,
                                    total: row.total,
                                    products: []
                                };
                            }
                            cartsMap[cartId].products.push({
                                model: row.model,
                                category: row.category,
                                price: row.selling_price,
                                quantity: row.quantity,
                            });
                        });

                        // Convert the map to an array of carts
                        const carts = Object.values(cartsMap);
                        resolve(carts);
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    async clearCart(username: string): Promise<Boolean> {
        return new Promise<Boolean>(async (resolve, reject) => {
            try {
                // Check unpaid cart
                let cart = await this.getUnpaidCartByUserId(username);
                if (!cart) {
                    reject(new CartNotFoundError());
                    return;
                }

                const sql = `DELETE FROM ProductUser WHERE id_cart = (SELECT id_cart FROM Cart WHERE ref_username = ? AND paid = 0)  `;
                db.run(sql, [username], (err: Error) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    else {
                        // Update cart total                
                        this.updateCartTotal(cart.customer).then(() => resolve(true)).catch((err) => reject(err));
                    }
                })
            } catch (error) {
                reject(error);
            }
        });
    }

    async getAllCarts(): Promise<Cart[]> {
        return new Promise<Cart[]>((resolve, reject) => {
            try {
                const sql = `
                    SELECT 
                        c.ref_username,
                        c.paid,
                        c.id_cart,
                        c.total, 
                        c.payment_date, 
                        p.ref_product_descriptor, 
                        p.quantity, 
                        pd.model, 
                        pd.category, 
                        pd.selling_price 
                    FROM 
                        Cart c 
                    JOIN 
                        ProductUser p ON c.id_cart = p.id_cart 
                    JOIN 
                        ProductDescriptor pd ON p.ref_product_descriptor = pd.model
                `;

                db.all(sql, [], (err: Error | null, rows: any[]) => {
                    if (err) {
                        reject(err); // Server error
                        return;
                    } else if (!rows || rows.length === 0) {
                        // No unpaid cart found, return the empty cart
                        resolve([]);
                    } else {
                        // Create a map to store carts by id_cart
                        const cartsMap: { [key: number]: Cart } = {};

                        // Iterate through each row to collect product details
                        rows.forEach(row => {
                            const cartId = row.id_cart;
                            let cartpaid = true;
                            if (row.paid === 0) cartpaid = false;
                            if (!cartsMap[cartId]) {
                                cartsMap[cartId] = {
                                    customer: row.ref_username,
                                    paid: cartpaid,
                                    paymentDate: row.payment_date,
                                    total: row.total,
                                    products: []
                                };
                            }
                            cartsMap[cartId].products.push({
                                model: row.model,
                                category: row.category,
                                price: row.selling_price,
                                quantity: row.quantity,
                            });
                        });

                        // Convert the map to an array of carts
                        const carts = Object.values(cartsMap);
                        resolve(carts);
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    async deleteAllCarts(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            const sql = "BEGIN TRANSACTION;DELETE FROM ProductUser;DELETE FROM Cart;COMMIT;"

            db.exec(sql, (err) => {
                if (err) {
                    reject(err);
                    return;
                } else {
                    resolve(true);
                }
            })
            // db.run('BEGIN TRANSACTION');
            // db.run('DELETE FROM ProductUser');
            // db.run('DELETE FROM Cart', (err) => {
            //     if (err) {
            //         db.run('ROLLBACK TRANSACTION');
            //         reject(err);
            //     } else {
            //         db.run('COMMIT TRANSACTION', (err) => {
            //             if (err) {
            //                 reject(err);
            //             } else {
            //                 resolve(true);
            //             }
            //         });
            //     }
            // });
        });
    }




    //METODI AUSILIARI            
    getProduct(model: string): Promise<Product> {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM ProductDescriptor WHERE model = ?';
            db.get(sql, [model], (err: Error, row: Product) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(row);
                }
            });
        });
    }

    checkProductsAvailability(username: string) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT pd.quantity AS available, pu.quantity AS asked FROM ProductUser pu, ProductDescriptor pd WHERE pd.model = pu.ref_product_descriptor AND pu.id_cart = (SELECT id_cart FROM Cart WHERE ref_username = ? AND paid = 0)';
            db.all(sql, [username], (err: Error, rows: any[]) => {
                if (err) {
                    reject(err);
                }
                else {
                    let result_complete = { empty: false, avaiable: true };
                    // let result = true;
                    rows.map((row) => {
                        if (row.available < row.asked) {
                            // result = false
                            result_complete = { empty: false, avaiable: false };
                        }
                        if (row.available === 0) {
                            // result = false
                            result_complete = { empty: true, avaiable: false };
                        }

                    });
                    return resolve(result_complete);
                }
            })
        })
    }



    removeProductFromCart(username: string, model: string) {
        return new Promise<void>((resolve, reject) => {
            const sql = 'DELETE FROM ProductUser WHERE id_cart = (SELECT id_cart FROM Cart WHERE ref_username = ? AND paid = 0) AND ref_product_descriptor = ?';
            db.run(sql, [username, model], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    createCart(username: string): Promise<Cart> {
        return new Promise((resolve, reject) => {
            const sqlInsert = 'INSERT INTO Cart (ref_username, paid, total) VALUES (?, 0, 0)';
            db.run(sqlInsert, [username], function (err) {
                if (err) {
                    reject(err);
                } else {
                    const sqlSelect = 'SELECT * FROM Cart WHERE id_cart = ?';
                    db.get(sqlSelect, [this.lastID], (err: Error, row: any) => {
                        if (err) {
                            reject(err);
                        } else {
                            let cartpaid = true;
                            if (row.paid === 0) cartpaid = false;
                            const cart: Cart = {
                                customer: row.ref_username,
                                paid: cartpaid,
                                paymentDate: row.paymentDate,
                                total: row.total,
                                products: []
                            };
                            resolve(cart);
                        }
                    });
                }
            });
        });
    }

    getProductInCart(username: string, model: string): Promise<ProductInCart> {
        return new Promise((resolve, reject) => {
            const sql = `
                        SELECT pd.model, pu.quantity, pd.category, pd.selling_price
                        FROM ProductUser pu
                        JOIN ProductDescriptor pd ON pu.ref_product_descriptor = pd.model
                        JOIN Cart c ON pu.id_cart = c.id_cart
                        WHERE c.ref_username = ? AND pu.ref_product_descriptor = ? AND c.paid = 0
                    `;
            db.get(sql, [username, model], (err: Error, row: any) => {
                if (err) {
                    reject(err);
                } else if (!row) {
                    resolve(undefined); //i didn't find the product
                } else {
                    const productInCart: ProductInCart = {
                        model: row.model,
                        quantity: row.quantity,
                        category: row.category,
                        price: row.selling_price
                    };
                    resolve(productInCart);
                }
            });
        });
    }

    updateProductQuantity(username: string, model: string, quantity: Number): Promise<number> {
        return new Promise((resolve, reject) => {
            const sql = `
                        UPDATE ProductUser 
                        SET quantity = quantity + ? 
                        WHERE id_cart = (SELECT id_cart FROM Cart WHERE ref_username = ? AND paid = 0)
                        AND ref_product_descriptor = ?`;
            db.run(sql, [quantity, username, model], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(1);
                }
            });
        });
    }

    addProductToCart(username: string, model: string) {
        return new Promise((resolve, reject) => {
            const getCartIdSql = 'SELECT id_cart FROM Cart WHERE ref_username = ? AND paid = 0';
            db.get(getCartIdSql, [username], (err, row: any) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (!row) {
                    reject(new CartNotFoundError()); //should not happen
                    return;
                }
                const cartId = row.id_cart;


                const sql = 'INSERT INTO ProductUser (ref_product_descriptor, id_cart, quantity) VALUES (?, ?, 1)';
                db.run(sql, [model, cartId], function (err) {
                    if (err) reject(err);
                    resolve(1);
                });
            });
        });
    }


    updateCartTotal(username: string): Promise<number> {
        return new Promise((resolve, reject) => {
            // ID of the cart of the user
            const sqlGetCartId = 'SELECT id_cart FROM Cart WHERE ref_username = ? AND paid = 0';
            db.get(sqlGetCartId, [username], (err, row: any) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (!row) {
                    reject(new CartNotFoundError()); //should not happen
                    return;
                }
                const id_cart = row.id_cart;

                // Update total
                const sqlUpdateTotal = `
                                 UPDATE Cart
                                 SET total = COALESCE(
                                 (SELECT SUM(p.selling_price * pu.quantity)
                                 FROM ProductUser pu
                                 JOIN ProductDescriptor p ON pu.ref_product_descriptor = p.model
                                 WHERE pu.id_cart = (SELECT id_cart FROM Cart WHERE ref_username = ? AND paid = 0)), 
                                 0)
                                 WHERE id_cart = ?`;
                db.run(sqlUpdateTotal, [username, id_cart], function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(1);
                    }
                });
            });
        });
    }
}

export default CartDAO