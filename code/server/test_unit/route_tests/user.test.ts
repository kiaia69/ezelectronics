import { test, expect, jest, describe, beforeEach, afterEach } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"

import UserController from "../../src/controllers/userController"
import Authenticator from "../../src/routers/auth"
import { NextFunction } from "express"
import { Role, User } from "../../src/components/user"
import { UserRoutes } from "../../src/routers/userRoutes"
import { Utility } from "../../src/utilities"
const baseURL = "/ezelectronics"


//Example of a unit test for the POST ezelectronics/users route
//The test checks if the route returns a 200 success code
//The test also expects the createUser method of the controller to be called once with the correct parameters
describe("UserRouteTest", () => {

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("route: POST /", () => {
        test("POST request to creat a user: it should return a 200 success code", async () => {
            const testUser = { //Define a test user  object sent to the route
                username: "test",
                name: "test",
                surname: "test",
                password: "test",
                role: "Manager"
            }
            jest.spyOn(UserController.prototype, "createUser").mockResolvedValueOnce(true) //Mock the createUser method of the controller
            const response = await request(app).post(baseURL + "/users").send(testUser) //Send a POST request to the route
            expect(response.status).toBe(200) //Check if the response status is 200
            expect(UserController.prototype.createUser).toHaveBeenCalledTimes(1) //Check if the createUser method has been called once
            //Check if the createUser method has been called with the correct parameters
            expect(UserController.prototype.createUser).toHaveBeenCalledWith(testUser.username,
                testUser.name,
                testUser.surname,
                testUser.password,
                testUser.role)
        });

        test("POST request to creat a user: it should return a 422 code, request not valid", async () => {
            const testUser = { //Define a test user  object sent to the route
                username: "test",
                name: "test",
                surname: "test",
                password: "test",
                role: "Manager"
            }
            jest.spyOn(UserController.prototype, "createUser").mockResolvedValueOnce(true) //Mock the createUser method of the controller
            const response = await request(app).post(baseURL + "/users").send() //Send a POST request to the route without body
            expect(response.status).toBe(422) //Check if the response status is 422
            expect(UserController.prototype.createUser).toHaveBeenCalledTimes(0) //Check if the createUser method has been called zero times

        });

    });

    describe("route: GET /", () => {

        test("GET request to get all users: it should return a 200 success code", async () => {
            const Users = [{ //Users
                username: "test",
                name: "test",
                surname: "test",
                password: "test",
                role: "Manager"
            }, {
                username: "test1",
                name: "test1",
                surname: "test1",
                password: "test1",
                role: "Admin"
            }]
            const admin = new User("admin", "admin", "admin", Role.ADMIN, "", "");
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                req.user = admin;
                next()
            });

            jest.spyOn(UserController.prototype, "getUsers").mockResolvedValueOnce(Users) //Mock the getUsers method of the controller

            const response = await request(app).get(baseURL + "/users").send() //Send a GET request to the route
            expect(response.status).toBe(200) //Check if the response status is 200
            expect(UserController.prototype.getUsers).toHaveBeenCalledTimes(1) //Check if the getUsers method has been called once
            //Check if the getUsers method has been called with the correct parameters
            expect(UserController.prototype.getUsers).toHaveBeenCalledWith()
            expect(response.body).toEqual(Users);
        });

        test("GET request to get all users: it should return a 401 code, Not an Admin error", async () => {
            const Users = [{ //Users
                username: "test",
                name: "test",
                surname: "test",
                password: "test",
                role: "Manager"
            }, {
                username: "test1",
                name: "test1",
                surname: "test1",
                password: "test1",
                role: "Admin"
            }]
            // const admin = new User("admin", "admin", "admin", Role.MANAGER, "", "");
            // jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
            //     req.user = admin;
            //     next()
            // });

            jest.spyOn(UserController.prototype, "getUsers").mockResolvedValueOnce(Users) //Mock the getUsers method of the controller

            const response = await request(app).get(baseURL + "/users").send() //Send a GET request to the route
            expect(response.status).toBe(401) //Check if the response status is 401
            expect(UserController.prototype.getUsers).toHaveBeenCalledTimes(0) //Check if the getUsers method has been called once
        });


    });

    describe("route: GET /roles/:role", () => {


        test("GET request to get all users with a specific role: it should return a 200 success code", async () => {
            const Users = [{ //Users
                username: "test",
                name: "test",
                surname: "test",
                password: "test",
                role: "Manager"
            }, {
                username: "test1",
                name: "test1",
                surname: "test1",
                password: "test1",
                role: "Manager"
            }];
            const role = "Manager"
            const admin = new User("admin", "admin", "admin", Role.ADMIN, "", "");
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                req.user = admin;
                next()
            });

            jest.spyOn(UserController.prototype, "getUsersByRole").mockResolvedValueOnce(Users) //Mock the getUsersByRole method of the controller
            const response = await request(app).get(baseURL + "/users/roles/" + role).send() //Send a GET request to the route
            expect(response.status).toBe(200) //Check if the response status is 200
            expect(UserController.prototype.getUsersByRole).toHaveBeenCalledTimes(1) //Check if the getUsersByRole method has been called once
            //Check if the getUsersByRole method has been called with the correct parameters
            expect(UserController.prototype.getUsersByRole).toHaveBeenCalledWith(role)
            expect(response.body).toEqual(Users);
        });

        test("GET request to get all users with a specific role: it should return a 422 code, request not valid", async () => {
            const Users = [{ //Users
                username: "test",
                name: "test",
                surname: "test",
                password: "test",
                role: "Manager"
            }, {
                username: "test1",
                name: "test1",
                surname: "test1",
                password: "test1",
                role: "Manager"
            }];
            const role = "Manager"
            const admin = new User("admin", "admin", "admin", Role.ADMIN, "", "");
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                req.user = admin;
                next()
            });

            jest.spyOn(UserController.prototype, "getUsersByRole").mockResolvedValueOnce(Users) //Mock the getUsersByRole method of the controller
            const response = await request(app).get(baseURL + "/users/roles/ciao").send() //Send a GET request to the route with a not exsisting role
            expect(response.status).toBe(422) //Check if the response status is 422
            expect(UserController.prototype.getUsersByRole).toHaveBeenCalledTimes(0) //Check if the getUsersByRole method has been called once
        });

        test("GET request to get all users with a specific role: it should return a 401 code, not an Admin error", async () => {
            const Users = [{ //Users
                username: "test",
                name: "test",
                surname: "test",
                password: "test",
                role: "Manager"
            }, {
                username: "test1",
                name: "test1",
                surname: "test1",
                password: "test1",
                role: "Manager"
            }];
            const role = "Manager"
            // const admin = new User("admin", "admin", "admin", Role.ADMIN, "", "");
            // jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
            //     req.user = admin;
            //     next()
            // });

            jest.spyOn(UserController.prototype, "getUsersByRole").mockResolvedValueOnce(Users) //Mock the getUsersByRole method of the controller
            const response = await request(app).get(baseURL + "/users/roles/" + role).send() //Send a GET request to the route
            expect(response.status).toBe(401) //Check if the response status is 200
            expect(UserController.prototype.getUsersByRole).toHaveBeenCalledTimes(0) //Check if the getUsersByRole method has been called once
        });

    });

    describe("route: GET /:username", () => {

        test("GET request to get a user with a specific username: it should return a 200 success code", async () => {
            const user = { //User
                username: "test",
                name: "test",
                surname: "test",
                password: "test",
                role: Role.CUSTOMER,
                address: "",
                birthdate: "",
            };
            const username = "test";
            const admin = new User("admin", "admin", "admin", Role.ADMIN, "", "");
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = admin;
                next()
            });
            jest.spyOn(Utility, "isAdmin").mockImplementation(() => { return true; });

            jest.spyOn(UserController.prototype, "getUserByUsername").mockResolvedValueOnce(user); //Mock the getUserByUsername method of the controller
            const response = await request(app).get(baseURL + "/users/" + username).send(); //Send a GET request to the route
            expect(response.status).toBe(200); //Check if the response status is 200
            expect(UserController.prototype.getUserByUsername).toHaveBeenCalledTimes(1); //Check if the getUserByUsername method has been called once
            //Check if the getUserByUsername method has been called with the correct parameters
            expect(UserController.prototype.getUserByUsername).toHaveBeenCalledWith(undefined, username);
            expect(response.body).toEqual(user);
        });

        test("GET request to get a user with a specific username: it should return a 401 code, User not Admin Error", async () => {
            const user = { //User
                username: "test",
                name: "test",
                surname: "test",
                password: "test",
                role: Role.CUSTOMER,
                address: "",
                birthdate: "",
            };
            //test if a customer can get a user with a specific username that it's not hisself
            const username = "test";
            const admin = new User("admin", "admin", "admin", Role.CUSTOMER, "", "");
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = admin;
                next()
            });
            // jest.spyOn(Utility, "isAdmin").mockImplementation(() => { return true; });

            jest.spyOn(UserController.prototype, "getUserByUsername").mockResolvedValueOnce(user); //Mock the getUserByUsername method of the controller
            const response = await request(app).get(baseURL + "/users/" + "NonEsiste").send(); //Send a GET request to the route
            expect(response.status).toBe(401); //Check if the response status is 200
            expect(UserController.prototype.getUserByUsername).toHaveBeenCalledTimes(0); //Check if the getUserByUsername method has been called 0 times

        });
    });
    describe("route: DELETE /:username", () => {

        test("DELETE request to delete his personl account: it should return a 200 success code", async () => {
            const user = { //User
                username: "test",
                name: "test",
                surname: "test",
                password: "test",
                role: "Customer" as Role,
                address: "",
                birthdate: "",
            };
            const username = "test";
            const user1 = new User("test", "test", "test", Role.CUSTOMER, "", "");
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = user1;
                next()
            });
            //CASO DEL CUSTOMER CHE ELIMINA SE STESSO

            // jest.spyOn(Utility, "isAdmin").mockImplementation(() => {return false;});
            // jest.spyOn(UserController.prototype, "getUserByUsername").mockResolvedValueOnce(user); //Mock the deleteUser method of the controller
            // jest.spyOn(Utility, "isAdmin").mockImplementation(() => {return false;});
            jest.spyOn(UserController.prototype, "deleteUser").mockResolvedValueOnce(true); //Mock the deleteUser method of the controller
            const response = await request(app).delete(baseURL + "/users/" + username).send(); //Send a DELETE request to the route
            expect(response.status).toBe(200); //Check if the response status is 200
            expect(UserController.prototype.deleteUser).toHaveBeenCalledTimes(1); //Check if the deleteUser method has been called once
            //Check if the deleteUser method has been called with the correct parameters
            expect(UserController.prototype.deleteUser).toHaveBeenCalledWith(undefined, username);
            expect(response.body).toEqual({});
        });

        test("DELETE admin request to delete an account: it should return a 200 success code", async () => {
            const userToDelete = { //User
                username: "test",
                name: "test",
                surname: "test",
                password: "test",
                role: "Customer" as Role,
                address: "",
                birthdate: "",
            };
            const username = "test";
            const admin = new User("admin", "admin", "admin", Role.ADMIN, "", "");
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = admin;
                next()
            });

            // jest.spyOn(Utility, "isAdmin").mockImplementation(() => {return false;});
            jest.spyOn(UserController.prototype, "getUserByUsername").mockResolvedValueOnce(userToDelete); //Mock the deleteUser method of the controller
            // jest.spyOn(Utility, "isAdmin").mockImplementation(() => {return false;});
            jest.spyOn(UserController.prototype, "deleteUser").mockResolvedValueOnce(true); //Mock the deleteUser method of the controller
            const response = await request(app).delete(baseURL + "/users/" + username).send(); //Send a DELETE request to the route
            expect(response.status).toBe(200); //Check if the response status is 200
            expect(UserController.prototype.deleteUser).toHaveBeenCalledTimes(1); //Check if the deleteUser method has been called once
            //Check if the deleteUser method has been called with the correct parameters
            expect(UserController.prototype.deleteUser).toHaveBeenCalledWith(undefined, username);
            expect(response.body).toEqual({});
        });

        test("DELETE customer request to delete an other account: it should return a 401 code, Unauthorized User Error", async () => {
            const userToDelete = { //User
                username: "delete",
                name: "delete",
                surname: "delete",
                password: "delete",
                role: "Customer" as Role,
                address: "",
                birthdate: "",
            };
            const username = "delete";
            const user1 = new User("test", "test", "test", Role.CUSTOMER, "", "");
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = user1;
                next()
            });
            //CASO DEL CUSTOMER CHE ELIMINA un altro CUSTOMER

            // jest.spyOn(Utility, "isAdmin").mockImplementation(() => {return false;});
            // jest.spyOn(UserController.prototype, "getUserByUsername").mockResolvedValueOnce(user); //Mock the deleteUser method of the controller
            // jest.spyOn(Utility, "isAdmin").mockImplementation(() => {return false;});
            jest.spyOn(UserController.prototype, "deleteUser").mockResolvedValueOnce(true); //Mock the deleteUser method of the controller
            const response = await request(app).delete(baseURL + "/users/" + username).send(); //Send a DELETE request to the route
            expect(response.status).toBe(401); //Check if the response status is 401
            expect(UserController.prototype.deleteUser).toHaveBeenCalledTimes(0); //Check if the deleteUser method has been called 0 times
        });

        test("DELETE admin request to delete an other admin account: it should return a 401 code, User Is Admin Error", async () => {
            const userToDelete: User = { //User
                username: "delete",
                name: "delete",
                surname: "delete",
                role: Role.ADMIN,
                address: "",
                birthdate: "",
            };
            const username = "delete";
            const user1 = new User("test", "test", "test", Role.ADMIN, "", "");
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = user1;
                next()
            });
            //CASO DEL CUSTOMER CHE ELIMINA un altro CUSTOMER

            // jest.spyOn(Utility, "isAdmin").mockImplementation(() => {return false;});
            jest.spyOn(UserController.prototype, "getUserByUsername").mockResolvedValueOnce(userToDelete); //Mock the deleteUser method of the controller
            // jest.spyOn(Utility, "isAdmin").mockImplementation(() => {return false;});
            jest.spyOn(UserController.prototype, "deleteUser").mockResolvedValueOnce(true); //Mock the deleteUser method of the controller
            const response = await request(app).delete(baseURL + "/users/" + username).send(); //Send a DELETE request to the route
            expect(response.status).toBe(401); //Check if the response status is 401
            expect(UserController.prototype.deleteUser).toHaveBeenCalledTimes(0); //Check if the deleteUser method has been called 0 times
        });

    });

    describe("route: DELETE /", () => {

        test("DELETE admin request to delete all users: it should return a 200 success code", async () => {

            const admin = new User("admin", "admin", "admin", Role.ADMIN, "", "");
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                req.user = admin;
                next()
            });

            jest.spyOn(UserController.prototype, "deleteAll").mockResolvedValueOnce(true); //Mock the deleteAll method of the controller
            const response = await request(app).delete(baseURL + "/users/").send(); //Send a DELETE request to the route
            expect(response.status).toBe(200); //Check if the response status is 200
            expect(UserController.prototype.deleteAll).toHaveBeenCalledTimes(1); //Check if the deleteAll method has been called once
            //Check if the deleteAll method has been called with the correct parameters
            expect(UserController.prototype.deleteAll).toHaveBeenCalledWith();
            expect(response.body).toEqual({});
        });

        test("DELETE no admin request to delete all users: it should return a 401 code, Not Admin Error", async () => {

            const admin = new User("admin", "admin", "admin", Role.MANAGER, "", "");
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = admin;
                next()
            });

            jest.spyOn(UserController.prototype, "deleteAll").mockResolvedValueOnce(true); //Mock the deleteAll method of the controller
            const response = await request(app).delete(baseURL + "/users/").send(); //Send a DELETE request to the route
            expect(response.status).toBe(401); //Check if the response status is 200
            expect(UserController.prototype.deleteAll).toHaveBeenCalledTimes(0); //Check if the deleteAll method has been called 0
        });

    });

    describe("route: PATCH /:username", () => {


        test("PATCH customer request to update his personal information: it should return a 200 success code", async () => {
            // Mock user and controller
            const testUser = {
                username: "test",
                name: "test",
                surname: "test",
                role: Role.CUSTOMER,
                address: "via pietro",
                birthdate: "2001-12-18"
            };
            const updatedUser = {
                username: "test",
                name: "test",
                surname: "test",
                role: Role.CUSTOMER,
                address: "via pietro giuria",
                birthdate: "2001-12-18"
            }
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testUser;
                next()
            });

            // jest.spyOn(UserController.prototype, "getUserByUsername").mockResolvedValueOnce(testUser);
            jest.spyOn(UserController.prototype, "updateUserInfo").mockResolvedValueOnce(updatedUser);

            const response = await request(app).patch(baseURL + "/users/" + testUser.username).send({
                name: "test",
                surname: "test",
                address: "via pietro giuria",
                birthdate: "2001-12-18"
            }); //Send a PATCH request to the route
            expect(response.status).toBe(200); //Check if the response status is 200
            expect(UserController.prototype.updateUserInfo).toHaveBeenCalledTimes(1); //Check if the updateUserInfo method has been called once
            //Check if the updateUserInfo method has been called with the correct parameters
            expect(UserController.prototype.updateUserInfo).toHaveBeenCalledWith(undefined, updatedUser.name, updatedUser.surname, updatedUser.address, updatedUser.birthdate, updatedUser.username);
            expect(response.body).toEqual(updatedUser);
        });

        test("PATCH admin request to update other user information: it should return a 200 success code", async () => {
            // Mock user and controller
            const testUser = {
                username: "test",
                name: "test",
                surname: "test",
                role: Role.CUSTOMER,
                address: "via pietro",
                birthdate: "2001-02-02"
            };
            const updatedUser = {
                username: "test",
                name: "test",
                surname: "test",
                role: Role.CUSTOMER,
                address: "via pietro giuria",
                birthdate: "2001-02-02"
            }
            const admin = new User("admin", "admin", "admin", Role.ADMIN, "", "");
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = admin;
                next()
            });

            jest.spyOn(UserController.prototype, "getUserByUsername").mockResolvedValueOnce(testUser);
            jest.spyOn(UserController.prototype, "updateUserInfo").mockResolvedValueOnce(updatedUser);

            const response = await request(app).patch(baseURL + "/users/" + testUser.username).send({
                name: "test",
                surname: "test",
                address: "via pietro giuria",
                birthdate: "2001-02-02"
            }); //Send a PATCH request to the route
            expect(response.status).toBe(200); //Check if the response status is 200
            expect(UserController.prototype.updateUserInfo).toHaveBeenCalledTimes(1); //Check if the updateUserInfo method has been called once
            //Check if the updateUserInfo method has been called with the correct parameters
            expect(UserController.prototype.updateUserInfo).toHaveBeenCalledWith(undefined, updatedUser.name, updatedUser.surname, updatedUser.address, updatedUser.birthdate, updatedUser.username);
            expect(response.body).toEqual(updatedUser);
        });

        test("PATCH admin request to update other admin user information: it should return a 401 code, User Admin Error", async () => {
            // Mock user and controller
            const testUser = {
                username: "test",
                name: "test",
                surname: "test",
                role: Role.ADMIN,
                address: "via pietro",
                birthdate: "2001-12-18"
            };
            const updatedUser = {
                username: "test",
                name: "test",
                surname: "test",
                role: Role.ADMIN,
                address: "via pietro giuria",
                birthdate: "2001-12-18"
            }
            const admin = new User("admin", "admin", "admin", Role.ADMIN, "", "");
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = admin;
                next()
            });

            jest.spyOn(UserController.prototype, "getUserByUsername").mockResolvedValueOnce(testUser);
            jest.spyOn(UserController.prototype, "updateUserInfo").mockResolvedValueOnce(updatedUser);

            const response = await request(app).patch(baseURL + "/users/" + testUser.username).send({
                name: "test",
                surname: "test",
                address: "via pietro giuria",
                birthdate: "2001-12-18"
            }); //Send a PATCH request to the route
            expect(response.status).toBe(401); //Check if the response status is 401
            expect(UserController.prototype.updateUserInfo).toHaveBeenCalledTimes(0); //Check if the updateUserInfo method has been called 0 
        });

        test("PATCH customer request to update other user information: it should return a 401 code, Unauthorized User Error", async () => {
            // Mock user and controller
            const testUser = {
                username: "test",
                name: "test",
                surname: "test",
                role: Role.CUSTOMER,
                address: "via pietro",
                birthdate: "2001-12-18"
            };
            const updatedUser = {
                username: "test",
                name: "test",
                surname: "test",
                role: Role.CUSTOMER,
                address: "via pietro giuria",
                birthdate: "2001-12-18"
            }
            const c = new User("c", "c", "c", Role.CUSTOMER, "", "");
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = c;
                next()
            });

            jest.spyOn(UserController.prototype, "getUserByUsername").mockResolvedValueOnce(testUser);
            jest.spyOn(UserController.prototype, "updateUserInfo").mockResolvedValueOnce(updatedUser);

            const response = await request(app).patch(baseURL + "/users/" + testUser.username).send({
                name: "test",
                surname: "test",
                address: "via pietro giuria",
                birthdate: "2001-12-18"
            }); //Send a PATCH request to the route
            expect(response.status).toBe(401); //Check if the response status is 401
            expect(UserController.prototype.updateUserInfo).toHaveBeenCalledTimes(0); //Check if the updateUserInfo method has been called 0
            expect(UserController.prototype.getUserByUsername).toHaveBeenCalledTimes(0);
        });


    });


});