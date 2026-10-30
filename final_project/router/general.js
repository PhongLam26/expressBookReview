const express = require('express');
const axios = require('axios');
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

// Axios client for the asynchronous assignment tasks. These helpers call the
// running Express API, so they can be used from another process or the CLI.
const bookApi = axios.create({
  baseURL: process.env.BOOK_API_BASE_URL || `http://127.0.0.1:${process.env.PORT || 5000}`,
  timeout: 5000
});
const getAllBooks = async () => (await bookApi.get('/')).data;
const getBooksByISBN = async (isbn) =>
  (await bookApi.get(`/isbn/${encodeURIComponent(isbn)}`)).data;
const getBooksByAuthor = async (author) =>
  (await bookApi.get(`/author/${encodeURIComponent(author)}`)).data;
const getBooksByTitle = async (title) =>
  (await bookApi.get(`/title/${encodeURIComponent(title)}`)).data;
const axiosQueries = { all: getAllBooks, isbn: getBooksByISBN, author: getBooksByAuthor, title: getBooksByTitle };

const runAxiosQuery = async () => {
  const [query, ...values] = process.argv.slice(2);
  const value = values.join(' ');
  const handler = axiosQueries[query];
  if (!handler || (query !== 'all' && !value)) {
    throw new Error('Usage: node router/general.js <all|isbn|author|title> [value]');
  }
  return handler(value);
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
module.exports.axiosQueries = axiosQueries;

if (require.main === module) {
  runAxiosQuery()
    .then((data) => console.log(JSON.stringify(data, null, 2)))
    .catch((error) => {
      const status = error.response && error.response.status;
      const message = error.response?.data?.message || error.message;
      console.error(JSON.stringify({ message, ...(status ? { status } : {}) }));
      process.exitCode = 1;
    });
}
