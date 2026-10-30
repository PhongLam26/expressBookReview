const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

// Promise-based data access keeps these operations asynchronous while using
// the supplied in-memory catalog. The route handlers below await these same
// functions, so the async tasks exercise the running Express server.
const asyncResult = (value) => new Promise((resolve) => setImmediate(() => resolve(value)));
const getAllBooksAsync = () => asyncResult(books);
const getBookByISBNAsync = (isbn) => asyncResult(books[isbn] || null);
const getBooksByAuthorAsync = (author) => asyncResult(
  Object.fromEntries(Object.entries(books).filter(([, book]) =>
    book.author.toLocaleLowerCase() === author.trim().toLocaleLowerCase()))
);
const getBooksByTitleAsync = (title) => {
  const query = title.trim().toLocaleLowerCase();
  return asyncResult(Object.fromEntries(Object.entries(books).filter(([, book]) =>
    book.title.toLocaleLowerCase().includes(query))));
};
const getBookReviewAsync = (isbn) => asyncResult(books[isbn] ? books[isbn].reviews : null);
const asyncRoute = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};


public_users.post('/register', (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || !username.trim() ||
      typeof password !== 'string' || !password) {
    return res.status(400).json({ message: 'username and password are required' });
  }
  const normalizedUsername = username.trim();
  if (isValid(normalizedUsername)) {
    return res.status(409).json({ message: 'Username already exists' });
  }
  users.push({ username: normalizedUsername, password });
  return res.status(201).json({ message: 'User successfully registered', username: normalizedUsername });
});

// Get the book list available in the shop
public_users.get('/', asyncRoute(async (req, res) => {
  return res.status(200).json(await getAllBooksAsync());
}));

// Get book details based on ISBN
public_users.get('/isbn/:isbn', asyncRoute(async (req, res) => {
  const book = await getBookByISBNAsync(req.params.isbn);
  return book
    ? res.status(200).json(book)
    : res.status(404).json({ message: 'Book not found' });
}));
  
// Get book details based on author
public_users.get('/author/:author', asyncRoute(async (req, res) => {
  return res.status(200).json(await getBooksByAuthorAsync(req.params.author));
}));

// Get all books based on title
public_users.get('/title/:title', asyncRoute(async (req, res) => {
  return res.status(200).json(await getBooksByTitleAsync(req.params.title));
}));

//  Get book review
public_users.get('/review/:isbn', asyncRoute(async (req, res) => {
  const reviews = await getBookReviewAsync(req.params.isbn);
  return reviews
    ? res.status(200).json(reviews)
    : res.status(404).json({ message: 'Book not found' });
}));

module.exports.general = public_users;
module.exports.asyncQueries = {
  getAllBooksAsync,
  getBookByISBNAsync,
  getBooksByAuthorAsync,
  getBooksByTitleAsync,
  getBookReviewAsync
};
