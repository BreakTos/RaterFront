const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Replace 'YOUR_MONGODB_COLLECTION_LINK' with your actual MongoDB collection link
const mongoDBURI = 'mongodb+srv://parthseth2004:Parthseth123@cluster0.dhpp7zl.mongodb.net/Rater';
mongoose.connect(mongoDBURI, { useNewUrlParser: true, useUnifiedTopology: true });

const voteSchema = new mongoose.Schema({
  problem: String,
  names: [String],
});

const Vote = mongoose.model('Vote', voteSchema);

app.get('/', async (req, res) => {
  try {
    const votes = await Vote.find();
    const html = await generateHTML(votes);
    res.send(html);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Internal Server Error');
  }
});

async function generateHTML(votes) {
  const voteListHTML = await generateVoteList(votes);
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Problem Solvers</title>
      <link rel="stylesheet" href="styles.css">
    </head>
    <body>
      <h1> Best-Of-CF </h1> 
      <div id="solverList">
        <div class="problems-information">
          <table>
            <thead>
              <tr>
                <th>Index</th>
                <th>Problem</th>
                <th>Votes</th>
                <th>Problem Name</th>
              </tr>
            </thead>
            <tbody id="problemListBody">
              ${voteListHTML}
            </tbody>
          </table>
        </div>
      </div>
      <script>
        // Asynchronously load problem names
        async function loadProblemNames() {
          const rows = document.getElementById('problemListBody').querySelectorAll('tr');
          for (const row of rows) {
            const problemId = row.querySelector('td:nth-child(2) a').innerText.trim();
            const problemName = await getProblemName(problemId);

            // Create a new anchor element with the problem name and link
            const problemLink = 'https://codeforces.com/problemset/problem/' + problemId;
            const problemAnchor = document.createElement('a');
            problemAnchor.href = problemLink;
            problemAnchor.target = '_blank';
            problemAnchor.textContent = problemName;

            // Replace the content of the target cell with the anchor element
            row.querySelector('td:nth-child(2)').innerHTML = problemAnchor.outerHTML;
          }
        }

        // Fetch problem name using asynchronous JavaScript
        async function getProblemName(problemId) {
          const response = await fetch('/getProblemName?problemId=' + problemId);
          const data = await response.json();
          return data.problemName || 'Problem name not found';
        }

        // Load problem names after the initial page load
        window.onload = function() {
          loadProblemNames();
        };
      </script>
    </body>
    </html>`;
}

async function generateVoteList(votes) {
  const rows = [];
  for (const [index, vote] of votes.entries()) {
    const problemId = vote.problem;
    const problemLink = `https://codeforces.com/problemset/problem/${problemId}`;
    rows.push(`
      <tr>
        <td>${index + 1}</td>
        <td><a href="${problemLink}" target="_blank">${problemId}</a></td>
        <td>${vote.names.length}</td>
      </tr>
    `);
  }
  return rows.join('');
}

app.get('/getProblemName', async (req, res) => {
  try {
    const problemId = req.query.problemId;
    const problemName = await getName(problemId);
    res.json({ problemName });
  } catch (error) {
    console.error('Error fetching problem name:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

async function getName(id) {
  const url = 'https://codeforces.com/problemset/problem/' + id;

  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const problemName = $('div.title').text().trim();
    console.log(problemName);
    return problemName.substring(0,problemName.indexOf("InputOutput")) || 'Problem name not found';
  } catch (error) {
    console.error('Error:', error);
    return 'Error: Unable to fetch content';
  }
}

app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
});
