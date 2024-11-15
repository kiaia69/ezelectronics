-- Create table for Users
CREATE TABLE IF NOT EXISTS users (
    username TEXT NOT NULL PRIMARY KEY,
    name TEXT NOT NULL ,
    surname TEXT NOT NULL,
    password TEXT NOT NULL,
    salt TEXT NOT NULL,
    address TEXT NULL,
    birthdate TEXT NULL,
    role TEXT NOT NULL
);

-- Create table for Product Descriptors
CREATE TABLE IF NOT EXISTS ProductDescriptor (
    model TEXT NOT NULL PRIMARY KEY,
    category TEXT NOT NULL,
    arrival_date TEXT NOT NULL,
    selling_price REAL NOT NULL,
    quantity INTEGER,
    details TEXT
);

-- Create table for Carts
CREATE TABLE IF NOT EXISTS Cart (
    id_cart INTEGER PRIMARY KEY,
    paid INTEGER,
    payment_date TEXT,
    total REAL,
    ref_username TEXT,
    FOREIGN KEY (ref_username) REFERENCES users(username) ON DELETE CASCADE
);

-- Create table for Product-User (Cart Items)
CREATE TABLE IF NOT EXISTS ProductUser (
    ref_product_descriptor TEXT,
    id_cart INTEGER,
    quantity INTEGER,
    PRIMARY KEY (ref_product_descriptor, id_cart),
    FOREIGN KEY (ref_product_descriptor) REFERENCES ProductDescriptor(model) ON DELETE CASCADE,
    FOREIGN KEY (id_cart) REFERENCES Cart(id_cart) ON DELETE CASCADE
);

-- Create table for Reviews
CREATE TABLE IF NOT EXISTS Review (
    score INTEGER,
    date TEXT,
    comment TEXT,
    ref_utente TEXT,
    ref_product_descriptor TEXT,
    FOREIGN KEY (ref_utente) REFERENCES users(username) ON DELETE CASCADE,
    FOREIGN KEY (ref_product_descriptor) REFERENCES ProductDescriptor(model) ON DELETE CASCADE
);

-- Create table for Sales
CREATE TABLE IF NOT EXISTS Sale (
    ref_product_desc TEXT,
    selling_date TEXT,
    quantity INTEGER,
    FOREIGN KEY (ref_product_desc) REFERENCES ProductDescriptor(model) ON DELETE CASCADE
);

-- Create table for History of Products
CREATE TABLE IF NOT EXISTS ProductHistory (
    ref_product TEXT,
    quantity INTEGER,
    change_date TEXT,
    FOREIGN KEY (ref_product) REFERENCES ProductDescriptor(model) ON DELETE CASCADE
);