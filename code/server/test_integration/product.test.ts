import { describe, test, expect, beforeAll, afterAll, beforeEach } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import db from "../src/db/db"
import { cleanup, cleanup_without_users } from "../src/db/cleanup";

const baseURL= "/ezelectronics"
let agent = request.agent(app);

const customer = { username: "customer", name: "customer_name", surname: "customer_surname", password: "customer", role: "Customer" };
const admin = { username: "admin", name: "admin_name", surname: "admin_surname", password: "admin", role: "Admin" };
const manager = { username: "manager", name: "manager_name", surname: "manager_surname", password: "manager", role: "Manager" };

const Prodotto1 = { model: "iPhone 13", category: "Smartphone", quantity: 2, details: "", sellingPrice: 200, arrivalDate: "2024-01-01" };
const Prodotto2 = { model: "iPhone 14", category: "Laptop", quantity: 0, details: "", sellingPrice: 200, arrivalDate: "2024-01-01" };

const AddProductList = async (Prodotto: any) => {
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

async function populate(){
    await AddProductList(Prodotto1);
    await AddProductList(Prodotto2);
}

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

beforeAll( async () => {
    await cleanup();
    await agent.post(baseURL + "/users").send(admin).expect(200);
    await agent.post(baseURL + "/users").send(customer).expect(200);
    await agent.post(baseURL + "/users").send(manager).expect(200);
})

beforeEach(async () => {
    await Logout();
    await cleanup_without_users();
    // await populate();
});

afterAll(async () => {
    await Logout();
    await cleanup();
});

describe("Product routes integration tests", () => {
    describe("POST `ezelectronics/products'", () => {
        test("200 :correctly adding a product", async () => {
            const test ={
                model: "iPhone 10", 
                category: "Smartphone", 
                quantity: 1,
                details: "", 
                sellingPrice: 200, 
                arrivalDate: "2024-01-01"
            }
            await Login(manager);
            await agent.post(baseURL + "/products")
              .send(test)
              .expect(200);
            const result = await agent.get(baseURL + "/products").send().expect(200);
            expect(result.body).toStrictEqual([test]);
            
          });

          test("422 : fake date", async () => {
            const test ={
                model: "", 
                category: "Smartphone", 
                quantity: 1,
                details: "", 
                sellingPrice: 200, 
                arrivalDate: "2024-13-01"
            }
            await Login(manager);
            await agent.post(baseURL + "/products")
              .send(test)
              .expect(422);
              const result = await agent.get(baseURL + "/products").send().expect(200);
              expect(result.body).toStrictEqual([]);
          });

          test("401 : not logged in user", async () => {
            const test ={
                model: "iPhone 10", 
                category: "Smartphone", 
                quantity: 1,
                details: "", 
                sellingPrice: 200, 
                arrivalDate: "2024-01-01"
            }
            await agent.post(baseURL + "/products")
              .send(test)
              .expect(401);

              await Login(admin);
              const result = await agent.get(baseURL + "/products").send().expect(200);
              expect(result.body).toStrictEqual([]);
          });

          test("401 : user is customer", async () => {
            const test ={
                model: "iPhone 10", 
                category: "Smartphone", 
                quantity: 1,
                details: "", 
                sellingPrice: 200, 
                arrivalDate: "2024-01-01"
            }
            await Login(customer)
            await agent.post(baseURL + "/products")
              .send(test)
              .expect(401);

              await Login(admin);
              const result = await agent.get(baseURL + "/products").send().expect(200);
              expect(result.body).toStrictEqual([]);
          });

          test("409 : model already existing", async () => {
            await populate();
            const test ={
                model: "iPhone 13", 
                category: "Smartphone", 
                quantity: 1,
                details: "", 
                sellingPrice: 200, 
                arrivalDate: "2024-01-01"
            }
            await Login(manager);
            await agent.post(baseURL + "/products")
              .send(test)
              .expect(409);
          });

          test("400 : date in future", async () => {
            const test ={
                model: "iPhone 13", 
                category: "Smartphone", 
                quantity: 1,
                details: "", 
                sellingPrice: 200, 
                arrivalDate: "2025-01-01"
            }
            await Login(manager);
            await agent.post(baseURL + "/products")
              .send(test)
              .expect(400);

              const result = await agent.get(baseURL + "/products").send().expect(200);

              expect(result.body).toStrictEqual([]);
          });
    })

    describe("PATCH `ezelectronics/products/:model`", () => {
        test("200 :correctly updating product quantity", async () => {
            await populate();
            const model ="iPhone 13"
            const test ={
                quantity: 1,
            }
            await Login(manager);
            let nq = await agent.patch(baseURL + "/products" + "/"+ model).send(test).expect(200);
            expect(nq.body.quantity).toBe(3)
          });

          test("422 : model empty", async () => {
            await populate();
            const model =""
            const test ={
                quantity: 1,
                changeDate: "2024-02-01"
            }
            await Login(manager);
            let nq = await agent.patch(baseURL + "/products" + "/"+ model).send(test).expect(422);
          });

          test("404 : model not found", async () => {
            await populate();
            const model ="inexistent"
            const test ={
                quantity: 1,
                changeDate: "2024-02-01"
            }
            await Login(manager);
            let nq = await agent.patch(baseURL + "/products" + "/"+ model).send(test).expect(404);
          });

          test("400 : date before arrival", async () => {
            await populate();
            const model ="iPhone 13"
            const test ={
                quantity: 1,
                changeDate: "2023-01-01"
            }
            await Login(manager);
            let nq = await agent.patch(baseURL + "/products" + "/"+ model).send(test).expect(400);
          });

    })
    describe("PATCH ezelectronics/products/:model/sell", () => {
        test("200 :correctly selling product ", async () => {
            await populate();
            const model ="iPhone 13"
            const test ={
                quantity: 1,
            }
            await Login(manager);
            let nq = await agent.patch(baseURL + "/products" + "/"+ model +"/sell").send(test).expect(200);
            expect(nq.body.quantity).toBe(1)
        });
        /*
        test("422 : model empty", async () => {
            const model =""
            const test ={
                quantity: 1,
            }
            await Login(manager);
            let nq = await agent.patch(baseURL + "/products" + "/"+ model +"/sell").send(test).expect(422);
        });
        */
        test("404 : product not found ", async () => {
            await populate();
            const model ="iPhone 10"
            const test ={
                quantity: 1,
            }
            await Login(manager);
            let nq = await agent.patch(baseURL + "/products" + "/"+ model +"/sell").send(test).expect(404);
        });
        test("409 : product quaniity 0 ", async () => {
            await populate();
            const model ="iPhone 14"
            const test ={
                quantity: 1,
            }
            await Login(manager);
            let nq = await agent.patch(baseURL + "/products" + "/"+ model +"/sell").send(test).expect(409);
        });

        test("409 : product quantity less than requested ", async () => {
            await populate();
            const model ="iPhone 13"
            const test ={
                quantity: 3,
            }
            await Login(manager);
            let nq = await agent.patch(baseURL + "/products" + "/"+ model +"/sell").send(test).expect(409);
        });
        
    })
    describe("GET `ezelectronics/products`", () => {
        test("200 :correctly selling product ", async () => {
            await populate();
            const result =[Prodotto1,Prodotto2]
            await Login(manager);
            let r = await agent.get(baseURL + "/products").send({}).expect(200);
            expect(r.body).toEqual(result)
        });
        test("200 : grouping category ", async () => {
            await populate();
            const result =[Prodotto1]
            const test ={
                grouping : "category",
                category : "Smartphone"
            }
            await Login(manager);
            let r = await agent.get(baseURL + "/products").query(test).expect(200);
            expect(r.body).toEqual(result)
        });
        test("200 : grouping model ", async () => {
            await populate();
            const result =[Prodotto2]
            const test ={
                grouping : "model",
                model : "iPhone 14"
            }
            await Login(manager);
            let r = await agent.get(baseURL + "/products").query(test).expect(200);
            expect(r.body).toEqual(result)
        });

        test("422 : model + category ", async () => {
            const test ={
                grouping : "model",
                category : "Smartphone",
                model : "iPhone 14"
            }
            await Login(manager);
            await agent.get(baseURL + "/products").query(test).expect(422);
        });

        test("422 : grouping model given category", async () => {
            const test ={
                grouping : "model",
                category : "Smartphone",
            }
            await Login(manager);
            await agent.get(baseURL + "/products").query(test).expect(422);
        });

        test("422 : grouping category given model", async () => {
            const test ={
                grouping : "category",
                model : "something",
            }
            await Login(manager);
            await agent.get(baseURL + "/products").query(test).expect(422);
        });

        test("422 : grouping category no category ", async () => {
            const test ={
                grouping : "category",
            }
            await Login(manager);
            await agent.get(baseURL + "/products").query(test).expect(422);
        });

        test("422 : grouping model no model", async () => {
            const test ={
                grouping : "model",
            }
            await Login(manager);
            await agent.get(baseURL + "/products").query(test).expect(422);
        });

        test("422 : no grouping category", async () => {
            const test ={
                category : "Smartphone",
            }
            await Login(manager);
            await agent.get(baseURL + "/products").query(test).expect(422);
        });

        test("422 : no grouping model", async () => {
            const test ={
                model : "iPhone 13",
            }
            await Login(manager);
            await agent.get(baseURL + "/products").query(test).expect(422);
        });

        test("404 : model not found", async () => {
            const test ={
                grouping : "model",
                model : "iPhone 10"
            }
            await Login(manager);
            await agent.get(baseURL + "/products").query(test).expect(404);
        });
    })
    describe("GET `ezelectronics/products/available`", () => {
        test("200 : getting available products ", async () => {
            await populate();
            const result =[Prodotto1]
            await Login(customer);
            let r = await agent.get(baseURL + "/products/available").send({}).expect(200);
            expect(r.body).toEqual(result)
        });
    })
    describe("DELETE `ezelectronics/products/:model`", () => {
        test("correctly deleting  ", async () => {
            await populate();
            const model = "iPhone 14"
            await Login(manager);
            await agent.delete(baseURL + "/products"+ "/"+ model).expect(200);
            await agent.get(baseURL + "/products"+ "/"+ model).expect(404)
        });
        test("model to delete not found", async () => {
            await populate();
            const model = "iPhone 10"
            await Login(manager);
            await agent.delete(baseURL + "/products"+ "/"+ model).expect(404);
        });
        /*
        test("empty model deleting", async () => {
            const model = ""
            await Login(manager);
            await agent.delete(baseURL + "/products/" + model).expect(422);
        });
        */
    })
    describe("DELETE `ezelectronics/products`", () => {
        test("correctly deleting  ", async () => {
            await populate();
            await Login(manager);
            await agent.delete(baseURL + "/products").expect(200);
            let r = await agent.get(baseURL + "/products").expect(200);
            expect(r.body).toEqual([])
        });
    })
})