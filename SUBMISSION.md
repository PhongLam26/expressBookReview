# IBM Express Book Review — Final Project

**GitHub fork:** https://github.com/PhongLam26/expressBookReview

**Working directory:** C:\Users\phong\Downloads\crs\expressBookReview

**Test server:** http://127.0.0.1:5000
**Catalog:** Original booksdb.js data retained. The supplied records use keys 1 through 10 as lookup identifiers; no replacement data was added.

> Repository note: the requested upstream URL ending in expressBookReview returned 404. The live IBM repository is ibm-developer-skills-network/expressBookReviews (plural). The GitHub CLI fork is named PhongLam26/expressBookReview, and the public API confirms it is a fork whose parent is ibm-developer-skills-network/expressBookReviews.

The evidence files in submission/ contain the executed commands and captured responses. Login output redacts the live JWT. Registration/login commands use process environment variables; the test password was generated only for this local run and is not stored in the repository.

## Question 1 — Fork the repository

GitHub CLI command and output:

~~~text
gh repo fork https://github.com/ibm-developer-skills-network/expressBookReviews --fork-name expressBookReview
https://github.com/PhongLam26/expressBookReview
~~~

cURL command and actual output excerpt from the public GitHub API response:

~~~powershell
curl.exe -sS -H 'Accept: application/vnd.github+json' -H 'X-GitHub-Api-Version: 2022-11-28' https://api.github.com/repos/PhongLam26/expressBookReview | jq '.parent.full_name'
~~~

~~~text
"ibm-developer-skills-network/expressBookReviews"
~~~

Full fork and remote details: [submission/githubrepo](submission/githubrepo).

## Questions 2–10 — cURL checks and actual responses

### Question 2 — Get all books

~~~powershell
curl.exe -sS -w '\nHTTP_STATUS:%{http_code}' http://127.0.0.1:5000/
~~~

~~~text
{"1":{"author":"Chinua Achebe","title":"Things Fall Apart","reviews":{}},"2":{"author":"Hans Christian Andersen","title":"Fairy tales","reviews":{}},"3":{"author":"Dante Alighieri","title":"The Divine Comedy","reviews":{}},"4":{"author":"Unknown","title":"The Epic Of Gilgamesh","reviews":{}},"5":{"author":"Unknown","title":"The Book Of Job","reviews":{}},"6":{"author":"Unknown","title":"One Thousand and One Nights","reviews":{}},"7":{"author":"Unknown","title":"Njál's Saga","reviews":{}},"8":{"author":"Jane Austen","title":"Pride and Prejudice","reviews":{}},"9":{"author":"Honoré de Balzac","title":"Le Père Goriot","reviews":{}},"10":{"author":"Samuel Beckett","title":"Molloy, Malone Dies, The Unnamable, the trilogy","reviews":{}}}
HTTP_STATUS:200
~~~

### Question 3 — Find a book by ISBN/lookup key

~~~powershell
curl.exe -sS -w '\nHTTP_STATUS:%{http_code}' http://127.0.0.1:5000/isbn/8
~~~

~~~text
{"author":"Jane Austen","title":"Pride and Prejudice","reviews":{}}
HTTP_STATUS:200
~~~

### Question 4 — Find books by author

~~~powershell
curl.exe -sS -w '\nHTTP_STATUS:%{http_code}' 'http://127.0.0.1:5000/author/Jane%20Austen'
~~~

~~~text
{"8":{"author":"Jane Austen","title":"Pride and Prejudice","reviews":{}}}
HTTP_STATUS:200
~~~

### Question 5 — Find books by title

~~~powershell
curl.exe -sS -w '\nHTTP_STATUS:%{http_code}' 'http://127.0.0.1:5000/title/Pride%20and%20Prejudice'
~~~

~~~text
{"8":{"author":"Jane Austen","title":"Pride and Prejudice","reviews":{}}}
HTTP_STATUS:200
~~~

### Question 6 — Get reviews for a book

~~~powershell
curl.exe -sS -w '\nHTTP_STATUS:%{http_code}' http://127.0.0.1:5000/review/8
~~~

~~~text
{}
HTTP_STATUS:200
~~~

### Question 7 — Register a user

~~~powershell
$registerBody = @{ username = $env:BOOKSTORE_TEST_USERNAME; password = $env:BOOKSTORE_TEST_PASSWORD } | ConvertTo-Json -Compress
curl.exe -sS -w '\nHTTP_STATUS:%{http_code}' -X POST -H 'Content-Type: application/json' --data-raw $registerBody http://127.0.0.1:5000/register
~~~

~~~text
{"message":"User successfully registered","username":"bookreview_reader_retake_20261030"}
HTTP_STATUS:201
~~~

Evidence file: [submission/register](submission/register). Credentials were supplied through local environment variables and are not included.

### Question 8 — Log in a registered user

~~~powershell
$loginBody = @{ username = $env:BOOKSTORE_TEST_USERNAME; password = $env:BOOKSTORE_TEST_PASSWORD } | ConvertTo-Json -Compress
curl.exe -sS -w '\nHTTP_STATUS:%{http_code}' -X POST -H 'Content-Type: application/json' --data-raw $loginBody http://127.0.0.1:5000/customer/login
~~~

~~~text
{"message":"Login successful!","username":"bookreview_reader_retake_20261030","token":"[REDACTED]"}
HTTP_STATUS:200

SECURITY: The live JWT was used for the authenticated requests and redacted from this committed evidence.
~~~

Evidence file: [submission/login](submission/login). Credentials were supplied through local environment variables and are not included.

The JWT value is redacted in the committed output; the live token from this response was used for Questions 9 and 10.

### Question 9 — Add and update a review for the logged-in user

~~~powershell
$addBody = @{ review = 'An engaging classic with memorable characters.' } | ConvertTo-Json -Compress
curl.exe -sS -w '\nHTTP_STATUS:%{http_code}' -X PUT -H 'Content-Type: application/json' -H "Authorization: Bearer $token" --data-raw $addBody http://127.0.0.1:5000/customer/auth/review/8

$updateBody = @{ review = 'The vivid characters and careful pacing make this story memorable.' } | ConvertTo-Json -Compress
curl.exe -sS -w '\nHTTP_STATUS:%{http_code}' -X PUT -H 'Content-Type: application/json' -H "Authorization: Bearer $token" --data-raw $updateBody http://127.0.0.1:5000/customer/auth/review/8

curl.exe -sS -w '\nHTTP_STATUS:%{http_code}' http://127.0.0.1:5000/review/8
~~~

~~~text
ADD REVIEW:
{"message":"Review added successfully","isbn":"8","username":"bookreview_reader_retake_20261030","review":"An engaging classic with memorable characters."}
HTTP_STATUS:201

UPDATE SAME REVIEW:
{"message":"Review updated successfully","isbn":"8","username":"bookreview_reader_retake_20261030","review":"The vivid characters and careful pacing make this story memorable."}
HTTP_STATUS:200

GET REVIEW AFTER UPDATE:
{"bookreview_reader_retake_20261030":"The vivid characters and careful pacing make this story memorable."}
HTTP_STATUS:200
~~~

Evidence file: [submission/reviewadded](submission/reviewadded).

### Question 10 — Delete the review and verify it is gone

~~~powershell
curl.exe -sS -w '\nHTTP_STATUS:%{http_code}' -X DELETE -H "Authorization: Bearer $token" http://127.0.0.1:5000/customer/auth/review/8

# Verify the review is gone.
curl.exe -sS -w '\nHTTP_STATUS:%{http_code}' http://127.0.0.1:5000/review/8
~~~

~~~text
DELETE REVIEW:
{"message":"Review deleted successfully","isbn":"8","username":"bookreview_reader_retake_20261030"}
HTTP_STATUS:200

GET REVIEW AFTER DELETE:
{}
HTTP_STATUS:200
~~~

Evidence file: [submission/deletereview](submission/deletereview).

## Question 11 — Asynchronous requests

general.js implements the public book routes with Promise-backed data lookups and async/await. It also exports Axios client functions and a CLI for the live server: `node router/general.js all`, `node router/general.js isbn 8`, `node router/general.js author "Jane Austen"`, and `node router/general.js title "Pride and Prejudice"`. All four commands were run successfully against the Express server.

Public GitHub URL: https://github.com/PhongLam26/expressBookReview/blob/main/final_project/router/general.js

## Verification summary

- npm install completed, including Axios; npm audit reported 0 vulnerabilities.
- node --check passed for index.js, router/auth_users.js, and router/general.js.
- All listed cURL requests ran against the local server and returned the recorded HTTP statuses and JSON.
- Review behavior was verified as add (201), update (200), query updated text (200), delete (200), and query empty object after deletion (200).
- booksdb.js remains unchanged from the IBM starter.
