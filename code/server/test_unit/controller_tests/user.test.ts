import { test, expect, jest, afterEach, describe, beforeEach } from "@jest/globals";
import UserController from "../../src/controllers/userController";
import UserDAO from "../../src/dao/userDAO";
import { Role } from "../../src/components/user";
import { UserNotAdminError } from "../../src/errors/userError";

jest.mock("../../src/dao/userDAO");

describe("UserControllerTest", () => {
    beforeEach(() => {
        jest.clearAllMocks(); // Clear mocks before each test
    });

    describe("function: createUser", () => {
        test("It should return true", async () => {
            const testUser = { // Define a test user object
                username: "test",
                name: "test",
                surname: "test",
                password: "test",
                role: "Manager"
            };
            jest.spyOn(UserDAO.prototype, "createUser").mockResolvedValueOnce(true); // Mock the createUser method of the DAO
            const controller = new UserController(); // Create a new instance of the controller

            // Call the createUser method of the controller with the test user object
            const response = await controller.createUser(testUser.username, testUser.name, testUser.surname, testUser.password, testUser.role);

            // Check if the createUser method of the DAO has been called once with the correct parameters
            expect(UserDAO.prototype.createUser).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.createUser).toHaveBeenCalledWith(
                testUser.username,
                testUser.name,
                testUser.surname,
                testUser.password,
                testUser.role
            );
            expect(response).toBe(true); // Check if the response is true
        });
    });

    describe("function: getUsers", () => {
        test("It should return all users", async () => {
            const testUsers = [ // Define an array of test users
                { username: "Ciccio", name: "Francesco", surname: "Chiaia", role: "Customer" },
                { username: "hugonoizz", name: "Alberto", surname: "Alberto", role: "Manager" }
            ];
            jest.spyOn(UserDAO.prototype, "GetUsers").mockResolvedValueOnce(testUsers); // Mock the GetUsers method of the DAO
            const controller = new UserController(); // Create a new instance of the controller

            // Call the getUsers method of the controller
            const response = await controller.getUsers();

            // Check if the GetUsers method of the DAO has been called once with the correct parameters
            expect(UserDAO.prototype.GetUsers).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.GetUsers).toHaveBeenCalledWith(0, "");
            expect(response).toEqual(testUsers); // Check if the response is the test users array
        });
    });

    describe("function: getUsersByRole", () => {
        test("It should return all users with a specific role", async () => {
            const testRole = "Manager";
            const testUsers = [ // Define an array of test users
                { username: "Ciccio", name: "Francesco", surname: "Chiaia", role: testRole },
                { username: "hugonoizz", name: "Alberto", surname: "Alberto", role: testRole },
                { username: "giuli", name: "Giulia", surname: "ids", role: testRole }
            ];

            jest.spyOn(UserDAO.prototype, "GetUsers").mockResolvedValueOnce(testUsers); // Mock the getUsersByRole method of the DAO
            const controller = new UserController(); // Create a new instance of the controller

            // Call the getUsersByRole method of the controller with the test role
            const response = await controller.getUsersByRole(testRole);

            // Check if the GetUsers method of the DAO has been called once with the correct parameters
            expect(UserDAO.prototype.GetUsers).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.GetUsers).toHaveBeenCalledWith(1, testRole);
            expect(response).toEqual(testUsers); // Check if the response is the test users array
        });
    });

    describe("function: getUserByUsername", () => {
        test("Admin should be able to retrieve any user", async () => {
            const adminUser = { username: "admin", name: "admin", surname: "admin", role: "Admin" as Role, address: "admin", birthdate: "18/11/1998" };
            const targetUsername = "targetUser";
            const targetUser = { username: targetUsername, name: "Target", surname: "User", role: "Customer" as Role, address: "ciao", birthdate: "18/12/2002" };

            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(targetUser); // Mock the getUserByUsername method of the DAO
            const controller = new UserController(); // Create a new instance of the controller

            // Call the getUserByUsername method of the controller
            const response = await controller.getUserByUsername(adminUser, targetUsername);

            // Check if the getUserByUsername method of the DAO has been called once with the correct parameters
            expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith(targetUsername);
            expect(response).toEqual(targetUser); // Check if the response is the target user
        });

        test("Non admin user should only be able to retrieve their own information", async () => {
            const normalUser = { username: "normalUser", name: "Normal", surname: "User", role: "Customer" as Role, address: "via pietro", birthdate: "11/02/1655" };
            const targetUser = { username: "normalUser", name: "Normal", surname: "User", role: "Customer" as Role, address: "via pietro", birthdate: "11/02/1655" };

            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(targetUser); // Mock the getUserByUsername method of the DAO
            const controller = new UserController(); // Create a new instance of the controller

            // Call the getUserByUsername method of the controller
            const response = await controller.getUserByUsername(normalUser, normalUser.username);

            // Check if the getUserByUsername method of the DAO has been called once with the correct parameters
            expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith(normalUser.username);
            expect(response).toEqual(targetUser); // Check if the response is the target user
        });
    });

    describe("function: deleteUser", () => {
        test("Admin should be able to delete any user", async () => {
            const Admin = { username: "Albe", name: "Albe", surname: "Albe", role: "Admin" as Role, address: "via pietro", birthdate: "11/02/1655" };
            const usernameToDelete = "Ciccio"

            jest.spyOn(UserDAO.prototype, "DeleteUser").mockResolvedValueOnce(true); // Mock the deleteUser method of the DAO
            const controller = new UserController(); // Create a new instance of the controller

            // Call the DeleteUser method of the controller
            const response = await controller.deleteUser(Admin, usernameToDelete);

            // Check if the DeleteUser method of the DAO has been called once with the correct parameters
            expect(UserDAO.prototype.DeleteUser).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.DeleteUser).toHaveBeenCalledWith(usernameToDelete);
            expect(response).toEqual(true); // Check if the response is true
        });

        test("Non admin user should only be able to delete their own account", async () => {
            const Customer = { username: "Albe", name: "Albe", surname: "Albe", role: "Customer" as Role, address: "via pietro", birthdate: "11/02/1655" };
            const usernameToDelete = "Albe";

            jest.spyOn(UserDAO.prototype, "DeleteUser").mockResolvedValueOnce(true); // Mock the deleteUser method of the DAO
            const controller = new UserController(); // Create a new instance of the controller

            // Call the DeleteUser method of the controller
            const response = await controller.deleteUser(Customer, usernameToDelete);

            // Check if the DeleteUser method of the DAO has been called once with the correct parameters
            expect(UserDAO.prototype.DeleteUser).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.DeleteUser).toHaveBeenCalledWith(usernameToDelete);
            expect(response).toEqual(true); // Check if the response is true
        });
    });

    describe("function: deleteAll", () => {
        test("Admin can delete all non-admin users", async () => {
            
            jest.spyOn(UserDAO.prototype, "DeleteAll").mockResolvedValueOnce(true); // Mock the DeleteAll method of the DAO
            const controller = new UserController(); // Create a new instance of the controller

            // Call the deleteAll method of the controller
            const response = await controller.deleteAll();

            // Check if the DeleteAll method of the DAO has been called once with the correct parameters
            expect(UserDAO.prototype.DeleteAll).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.DeleteAll).toHaveBeenCalledWith();
            expect(response).toEqual(true); // Check if the response is true
        });
    });

    describe("function: updateUserInfo", () => {
        test("The user can only update their own information", async () => {
            const normalUser = { username: "normalUser", name: "Normal", surname: "User", role: "Customer" as Role, address: "old address", birthdate: "01/01/1990" };
            const updatedUser = { username: "normalUser", name: "UpdatedName", surname: "UpdatedSurname", address: "new address", birthdate: "02/02/1992" };
    
            jest.spyOn(UserDAO.prototype, "EditUser").mockResolvedValueOnce(updatedUser); // Mock the EditUser method of the DAO
            const controller = new UserController(); // Create a new instance of the controller
    
            // Call the updateUserInfo method of the controller
            const response = await controller.updateUserInfo(normalUser, updatedUser.name, updatedUser.surname, updatedUser.address, updatedUser.birthdate, normalUser.username);
    
            // Check if the EditUser method of the DAO has been called once with the correct parameters
            expect(UserDAO.prototype.EditUser).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.EditUser).toHaveBeenCalledWith(
                normalUser.username,
                updatedUser.name,
                updatedUser.surname,
                updatedUser.address,
                updatedUser.birthdate
            );
            expect(response).toEqual(updatedUser); // Check if the response is the updated user
        });
    
        test("Admin can update any user's information", async () => {
            const adminUser = { username: "admin", name: "Admin", surname: "Admin", role: "Admin" as Role, address: "admin address", birthdate: "01/01/1980" };
            const targetUser = { username: "targetUser", name: "Target", surname: "User", role: "Customer" as Role, address: "old address", birthdate: "01/01/1990" };
            const updatedUser = { username: "targetUser", name: "UpdatedName", surname: "UpdatedSurname", address: "new address", birthdate: "02/02/1992" };
    
            jest.spyOn(UserDAO.prototype, "EditUser").mockResolvedValueOnce(updatedUser); // Mock the EditUser method of the DAO
            const controller = new UserController(); // Create a new instance of the controller
    
            // Call the updateUserInfo method of the controller
            const response = await controller.updateUserInfo(adminUser, updatedUser.name, updatedUser.surname, updatedUser.address, updatedUser.birthdate, targetUser.username);
    
            // Check if the EditUser method of the DAO has been called once with the correct parameters
            expect(UserDAO.prototype.EditUser).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.EditUser).toHaveBeenCalledWith(
                targetUser.username,
                updatedUser.name,
                updatedUser.surname,
                updatedUser.address,
                updatedUser.birthdate
            );
            expect(response).toEqual(updatedUser); // Check if the response is the updated user
        });
    
     /*   test("User cannot update another user's information", async () => {
            const normalUser = { username: "normalUser", name: "Normal", surname: "User", role: "Customer" as Role, address: "old address", birthdate: "01/01/1990" };
            const targetUser = { username: "targetUser", name: "Target", surname: "User", role: "Customer" as Role, address: "old address", birthdate: "01/01/1990" };
            const updatedUser = { username: "targetUser", name: "UpdatedName", surname: "UpdatedSurname", address: "new address", birthdate: "02/02/1992" };
    
            const controller = new UserController(); // Create a new instance of the controller
    
            // Call the updateUserInfo method of the controller and expect it to throw an error
            await expect(controller.updateUserInfo(normalUser, updatedUser.name, updatedUser.surname, updatedUser.address, updatedUser.birthdate, targetUser.username))
                .rejects
                .toThrow(new UserNotAdminError());
        });*/
    }); 
    //GESTIONE ERRORI SBAGLIATA
});
