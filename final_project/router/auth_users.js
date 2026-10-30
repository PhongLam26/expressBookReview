const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username) => users.some((user) => user.username === username);

const authenticatedUser = (username, password) => users.some(
  (user) => user.username === username && user.password === password
);

//only registered users can login
regd_users.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: 'username and password are required' });
  }
  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  const secret = process.env.JWT_SECRET || 'book-review-local-secret';
  const token = jwt.sign({ username }, secret, { expiresIn: '1h' });
  req.session.username = username;
  return req.session.save((error) => {
    if (error) return res.status(500).json({ message: 'Could not create login session' });
    return res.status(200).json({ message: 'Login successful!', username, token });
  });
});

// Add a book review
regd_users.put('/auth/review/:isbn', (req, res) => {
  const { isbn } = req.params;
  const book = books[isbn];
  const username = req.user && req.user.username;
  const review = typeof req.body?.review === 'string' ? req.body.review.trim() : '';

  if (!book) return res.status(404).json({ message: 'Book not found' });
  if (!username) return res.status(401).json({ message: 'Authentication required' });
  if (!review) return res.status(400).json({ message: 'review is required' });

  if (!book.reviews || typeof book.reviews !== 'object') book.reviews = {};
  const updated = Object.prototype.hasOwnProperty.call(book.reviews, username);
  book.reviews[username] = review;
  return res.status(updated ? 200 : 201).json({
    message: updated ? 'Review updated successfully' : 'Review added successfully',
    isbn,
    username,
    review
  });
});

// Delete the authenticated user's review for a book.
regd_users.delete('/auth/review/:isbn', (req, res) => {
  const { isbn } = req.params;
  const book = books[isbn];
  const username = req.user && req.user.username;

  if (!book) return res.status(404).json({ message: 'Book not found' });
  if (!username) return res.status(401).json({ message: 'Authentication required' });
  if (!book.reviews || !Object.prototype.hasOwnProperty.call(book.reviews, username)) {
    return res.status(404).json({ message: 'Review not found' });
  }

  delete book.reviews[username];
  return res.status(200).json({ message: 'Review deleted successfully', isbn, username });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
