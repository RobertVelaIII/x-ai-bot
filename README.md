# Twitter Bot

A collection of Twitter bots for automated posting and engagement.

## Features

### Multi-Account Bot (bankofcart.js)
- Monitors multiple Twitter accounts and responds to their tweets
- Posts scheduled tweets with various content types
- Automatically likes and responds to mentions
- Includes redundancy features for continuous operation

### Hourly Bot (hourlyBot.js)
- Posts one tweet every hour
- Rotates through different tweet types for variety
- Uses OpenAI for content generation
- Simple setup and configuration

## Installation

1. Clone this repository
2. Install dependencies:
```bash
npm install
```

## Configuration

Create a `.env` file in the root directory with the following variables:

```
# Twitter Credentials
TWITTER_USERNAME=your_twitter_username
TWITTER_EMAIL=your_twitter_email
TWITTER_PASSWORD=your_twitter_password

# For using a different account with hourlyBot.js (optional)
HOURLY_TWITTER_USERNAME=your_hourly_bot_username

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_ASSISTANT_ID=your_openai_assistant_id
```

## Usage

### Running the Multi-Account Bot
```bash
node bankofcart.js
```

### Running the Hourly Bot
```bash
node hourlyBot.js
```

## Customization

### Modifying Tweet Types
Edit the `tweetTypes` and `tweetPrompts` objects in the respective bot files to customize the content of your tweets.

### Adjusting Posting Schedule
- **Multi-Account Bot**: Modify the scheduling logic in the `setupTweetSchedule` method
- **Hourly Bot**: Change the interval in the `startHourlySchedule` method

## Security Notes

- Never commit your `.env` file to version control
- Keep your Twitter and OpenAI credentials secure
- Review Twitter's terms of service regarding automated posting

## License

ISC
