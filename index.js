const express = require('express');
const mongoose = require('mongoose');

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
    const html = generateHTML(votes);
    res.send(html);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Internal Server Error');
  }
});

function generateHTML(votes) {
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
      <div id="solverList">
        ${generateVoteList(votes)}
      </div>
    </body>
    </html>
  `;
}

function generateVoteList(votes) {
  return votes.map(vote => `
    <div class="vote-container">
      <h2><a href="https://codeforces.com/problemset/problem/${vote.problem}" target="_blank">${vote.problem}</a></h2>
      <p>${vote.names.length}</p>
    </div>
  `).join('');
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
