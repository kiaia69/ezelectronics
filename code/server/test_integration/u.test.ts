import { describe, test, expect, beforeAll, afterAll } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import db from "../src/db/db"
import { cleanup } from "../src/db/cleanup"
import { User } from "../src/components/user"

const routePath = "/ezelectronics" //Base route path for the API

let agent = request.agent(app);


const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: "Customer" }
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" }

//Helper function that creates a new user in the database.
//Can be used to create a user before the tests or in the tests
//Is an implicit test because it checks if the return code is successful
const postUser = async (userInfo: any) => {
    await agent
        .post(`${routePath}/users`)
        .send(userInfo)
        .expect(200)
}

//Before executing tests, we remove everything from our test database, create an Admin user and log in as Admin, saving the cookie in the corresponding variable
beforeAll(async () => {
    await cleanup()
    await agent.post(routePath + "/users").send(admin).expect(200); //creo admin 

})

//After executing tests, we remove everything from our test database
afterAll(async () => {
   await cleanup()
})



describe("User routes integration tests", () => {
    
    describe("POST /users", () => {
        test("It should return a 200 success code and create a new user", async () => {

            await agent.post(`${routePath}/users`).send(customer) .expect(200); //creo utente customer 
            // await agent.post(routePath + "/users").send(admin).expect(200); //creo admin 
            
            await agent.post(routePath + "/sessions").send({ username: admin.username, password: admin.password }).expect(200);  //LOGIN UTENTE

            const users = await agent.get(`${routePath}/users`).expect(200); //recupero tutti gli utenti

            expect(users.body).toHaveLength(2) //Since we know that the database was empty at the beginning of our tests and we created two users (an Admin before starting and a Customer in this test), the array should contain only two users
            let cust = users.body.find((user: any) => user.username === customer.username) //We look for the user we created in the array of users
            expect(cust).toBeDefined() //We expect the user we have created to exist in the array. The parameter should also be equal to those we have sent
            expect(cust.name).toBe(customer.name)
            expect(cust.surname).toBe(customer.surname)
            expect(cust.role).toBe(customer.role)
        })

        //Tests for error conditions can be added in separate 'test' blocks.
        //We can group together tests for the same condition, no need to create a test for each body parameter, for example
        test("It should return a 422 error code if at least one request body parameter is empty/missing", async () => {
            await agent
                .post(`${routePath}/users`)
                .send({ username: "", name: "test", surname: "test", password: "test", role: "Customer" }) //We send a request with an empty username. The express-validator checks will catch this and return a 422 error code
                .expect(422)
            await agent.post(`${routePath}/users`).send({ username: "test", name: "", surname: "test", password: "test", role: "Customer" }).expect(422) //We can repeat the call for the remaining body parameters
        })

        test("It should return a 409 error code if the username represents a user that is already present in the database", async () => {
            await agent
                .post(`${routePath}/users`)
                .send(customer)
                .expect(409)
        })


    })

    describe("GET /users", () => {
        test("It should return an array of users", async () => {
            await agent.post(routePath + "/sessions").send({ username: admin.username, password: admin.password }).expect(200);  //LOGIN UTENTE

            const users = await agent.get(`${routePath}/users`).expect(200)
            expect(users.body).toHaveLength(2)
            let cust = users.body.find((user: any) => user.username === customer.username)
            expect(cust).toBeDefined()
            expect(cust.name).toBe(customer.name)
            expect(cust.surname).toBe(customer.surname)
            expect(cust.role).toBe(customer.role)
            let adm = users.body.find((user: any) => user.username === admin.username)
            expect(adm).toBeDefined()
            expect(adm.name).toBe(admin.name)
            expect(adm.surname).toBe(admin.surname)
            expect(adm.role).toBe(admin.role)
        })

        test("It should return a 401 error code if the user is not an Admin", async () => {
            await agent.post(routePath + "/sessions").send({ username: customer.username, password: customer.password }).expect(200);  //LOGIN UTENTE

            await agent.get(`${routePath}/users`).expect(401) //We call the same route but with the customer cookie. The 'expect' block must be changed to validate the error
            await agent.get(`${routePath}/users`).expect(401) //We can also call the route without any cookie. The result should be the same
        })
    })

    describe("GET /users/roles/:role", () => {
        test("It should return an array of users with a specific role", async () => {
            await agent.post(routePath + "/sessions").send({ username: admin.username, password: admin.password }).expect(200);  //LOGIN UTENTE

            const admins = await agent.get(`${routePath}/users/roles/Admin`).expect(200)
            expect(admins.body).toHaveLength(1) //In this case, we expect only one Admin user to be returned
            let adm = admins.body[0]
            expect(adm.username).toBe(admin.username)
            expect(adm.name).toBe(admin.name)
            expect(adm.surname).toBe(admin.surname)
        })

        test("It should fail if the role is not valid", async () => {
            await agent.post(routePath + "/sessions").send({ username: admin.username, password: admin.password }).expect(200);  //LOGIN UTENTE

            await agent.get(`${routePath}/users/roles/Invalid`).expect(422)
        })

        test("It should return a 401 error code if the user is not an Admin", async () => {
            await agent.post(routePath + "/sessions").send({ username: customer.username, password: customer.password }).expect(200);  //LOGIN UTENTE

            await agent.get(`${routePath}/users/roles/Admin`).expect(401) //We call the same route but with the customer cookie. The 'expect' block must be changed to validate the error
            await agent.get(`${routePath}/users/roles/Admin`).expect(401) //We can also call the route without any cookie. The result should be the same
        })
    })

    describe("GET /users/:username", () => {
        test("It should return a single user with a specific username ADMIN", async () => {
            await agent.post(routePath + "/sessions").send({ username: admin.username, password: admin.password }).expect(200);  //LOGIN UTENTE

            const user = await agent.get(`${routePath}/users/customer`).expect(200)
            let cstm = user.body
            expect(cstm.username).toBe(customer.username)
            expect(cstm.name).toBe(customer.name)
            expect(cstm.surname).toBe(customer.surname)
        })

        test("It should return a single user with a specific username CUSTOMER", async () => {
            await agent.post(routePath + "/sessions").send({ username: customer.username, password: customer.password }).expect(200);  //LOGIN UTENTE

            const user = await agent.get(`${routePath}/users/customer`).expect(200)
            let cstm = user.body
            expect(cstm.username).toBe(customer.username)
            expect(cstm.name).toBe(customer.name)
            expect(cstm.surname).toBe(customer.surname)
        })

        test("It should return a 401 if a normal user wants to see other user's info", async () => {
            await agent.post(routePath + "/sessions").send({ username: customer.username, password: customer.password }).expect(200);  //LOGIN UTENTE

            await agent.get(`${routePath}/users/admin`).expect(401)
        })

        test("It should return a 404 error code if username does not exist", async () => {
            await agent.post(routePath + "/sessions").send({ username: admin.username, password: admin.password }).expect(200);  //LOGIN UTENTE

            await agent.get(`${routePath}/users/NotExist`).expect(404)
        })
    })

    describe("DELETE /users/:username", () => {
        test("It should delete a user with a certain username ADMIN", async () => {
            await agent.post(routePath + "/sessions").send({ username: admin.username, password: admin.password }).expect(200);  //LOGIN UTENTE

            const response = await agent.delete(`${routePath}/users/customer`).expect(200)
            expect(response.status).toBe(200);
            //se lo cerco non dovrei trovarlo
            await agent.get(`${routePath}/users/customer`).expect(404)

        })

        test("It should delete his self CUSTOMER", async () => {
            await postUser(customer); //creo di nuovo il customer
            await agent.post(routePath + "/sessions").send({ username: customer.username, password: customer.password }).expect(200);  //LOGIN UTENTE

            const response = await agent.delete(`${routePath}/users/customer`).expect(200)
            expect(response.status).toBe(200);
            //se lo cerco non dovrei trovarlo
            await agent.post(routePath + "/sessions").send({ username: admin.username, password: admin.password }).expect(200);  //LOGIN UTENTE
            await agent.get(`${routePath}/users/customer`).expect(404)

        })

        test("It should return a 401 if an ADMIN wants to delete another admin", async () => {
            const admin2 = { username: "admin2", name: "admin2", surname: "admin2", password: "admin2", role: "Admin" }
            await postUser(admin2);
            await agent.post(routePath + "/sessions").send({ username: admin2.username, password: admin2.password }).expect(200);  //LOGIN UTENTE

            await agent.delete(`${routePath}/users/admin`).expect(401)
        })

        test("It should return a 401 if a normal user wants to delete another admin", async () => {
            //await agent.post(routePath + "/sessions").send({ username: customer.username, password: customer.password }).expect(200);  //LOGIN UTENTE

            await agent.delete(`${routePath}/users/admin`).expect(401)
        })

        test("It should return 404 for a not existing username", async () => {
            await agent.post(routePath + "/sessions").send({ username: admin.username, password: admin.password }).expect(200);  //LOGIN UTENTE

            const response = await agent.delete(`${routePath}/users/NotExisting`).expect(404)
        })
    })
    describe("DELETE /users", () => {
        test("It should delete all non-Admin user from database", async () => {
            await agent.post(routePath + "/sessions").send({ username: admin.username, password: admin.password }).expect(200);  //LOGIN UTENTE

            const response = await agent.delete(`${routePath}/users`).expect(200)
            //se lo cerco non dovrei trovarlo
            await agent.get(`${routePath}/users/customer`).expect(404)
            //dovrei trovare invece
            await agent.get(`${routePath}/users/admin2`).expect(200)

        })

        test("It should return a 401 if a user wants to delete all users", async () => {
            await postUser(customer); //creo di nuovo il customer
            await agent.post(routePath + "/sessions").send({ username: customer.username, password: customer.password }).expect(200);  //LOGIN UTENTE

            await agent.delete(`${routePath}/users`).expect(401)
        })
    })

    describe("PATCH /users/:username", () => {
        test("It should update the personal information of a customer by the customer", async () => {
            const updatedInfo = {
                name: "updatedCustomer",
                surname: "updatedCustomer",
                address: "New Address 123",
                birthdate: "1980-01-01"
            };
            await agent.post(routePath + "/sessions").send({ username: customer.username, password: customer.password }).expect(200);  //LOGIN UTENTE
            const response = await agent
                .patch(`${routePath}/users/customer`)
                .send(updatedInfo)
                .expect(200);

            expect(response.body).toMatchObject({
                username: "customer",
                name: "updatedCustomer",
                surname: "updatedCustomer",
                address: "New Address 123",
                birthdate: "1980-01-01",
                role: "Customer"
            });
        });

        test("It should update the personal information of a customer by an admin", async () => {
            const updatedInfo = {
                name: "adminUpdatedCustomer",
                surname: "adminUpdatedCustomer",
                address: "Admin New Address 123",
                birthdate: "1980-01-01"
            };
            await agent.post(routePath + "/sessions").send({ username: admin.username, password: admin.password }).expect(200);  //LOGIN UTENTE

            const response = await agent
                .patch(`${routePath}/users/customer`)
                .send(updatedInfo)
                .expect(200);

            expect(response.body).toMatchObject({
                username: "customer",
                name: "adminUpdatedCustomer",
                surname: "adminUpdatedCustomer",
                address: "Admin New Address 123",
                birthdate: "1980-01-01",
                role: "Customer"
            });
        });

        test("It should return a 404 error if the username does not exist", async () => {
            const updatedInfo = {
                name: "nonexistent",
                surname: "nonexistent",
                address: "Nonexistent Address",
                birthdate: "1980-01-01"
            };
            await agent.post(routePath + "/sessions").send({ username: admin.username, password: admin.password }).expect(200);  //LOGIN UTENTE
            await agent
                .patch(`${routePath}/users/nonexistent`)
                .send(updatedInfo)
                .expect(404);
        });

        test("It should return a 401 error if a user tries to update another user's information", async () => {
            const updatedInfo = {
                name: "unauthorizedUpdate",
                surname: "unauthorizedUpdate",
                address: "Unauthorized Address",
                birthdate: "1980-01-01"
            };
            await agent.post(routePath + "/sessions").send({ username: customer.username, password: customer.password }).expect(200);  //LOGIN UTENTE
            await agent
                .patch(`${routePath}/users/admin`)
                .send(updatedInfo)
                .expect(401);
        });

        test("It should return a 400 error if the birthdate is after the current date", async () => {
            const updatedInfo = {
                name: "futureDate",
                surname: "futureDate",
                address: "Future Address",
                birthdate: "2100-01-01"
            };
            await agent.post(routePath + "/sessions").send({ username: customer.username, password: customer.password }).expect(200);  //LOGIN UTENTE
            await agent
                .patch(`${routePath}/users/customer`)
                .send(updatedInfo)
                .expect(400);
        });

        test("It should return a 401 error if the user is not authenticated", async () => {
            const updatedInfo = {
                name: "unauthenticatedUpdate",
                surname: "unauthenticatedUpdate",
                address: "Unauthenticated Address",
                birthdate: "1980-01-01"
            };

            await agent.delete(`${routePath}/sessions/current`).send().expect(200);

            await agent
                .patch(`${routePath}/users/customer`)
                .send(updatedInfo)
                .expect(401);
        });
    });

})

