require('dotenv').config()
const express = require('express')
const logger = require('./logger')
const expressPino = require('express-pino-logger')({ logger })

// Task 1: import the natural library
const natural = require('natural')

// Task 2: initialize the express server
const app = express()
const port = process.env.PORT || 3000

app.use(express.json())
app.use(expressPino)

// Task 3: create the POST /sentiment route
app.post('/sentiment', async (req, res) => {
  // Task 4: extract the sentence parameter from req.query
  const { sentence } = req.query

  if (!sentence) {
    logger.error('No sentence provided')
    return res.status(400).json({ error: 'No sentence provided' })
  }

  // Initialize the sentiment analyzer
  const Analyzer = natural.SentimentAnalyzer
  const stemmer = natural.PorterStemmer
  const analyzer = new Analyzer('English', stemmer, 'afinn')

  try {
    const analysisResult = analyzer.getSentiment(sentence.split(' '))

    let sentiment = 'neutral'

    // Task 5: set sentiment based on score
    if (analysisResult < 0) {
      sentiment = 'negative'
    } else if (analysisResult > 0.33) {
      sentiment = 'positive'
    }

    logger.info(`Sentiment analysis result: ${analysisResult}`)

    // Task 6: send response
    res.status(200).json({ sentimentScore: analysisResult, sentiment })
  } catch (error) {
    logger.error(`Error performing sentiment analysis: ${error}`)
    // Task 7: handle error
    res.status(500).json({ message: 'Error performing sentiment analysis' })
  }
})

app.listen(port, () => {
  logger.info(`Server running on port ${port}`)
})
