# 🐦 Twitter Bot Arsenal

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Node.js-green.svg)
![OpenAI](https://img.shields.io/badge/AI-OpenAI-purple.svg)

A powerful collection of Twitter bots for automated posting, engagement, and content generation. Leverage the power of AI to maintain an active Twitter presence with minimal effort.

## ✨ Bot Collection

### 🔄 ReplyGuy Bot (`bot-types/replyguy.js`)

The ReplyGuy bot is a sophisticated multi-account monitoring and engagement system that keeps your Twitter presence active and responsive.

**Key Features:**
- 👀 **Multi-Account Monitoring**: Tracks specified Twitter accounts and responds to their tweets based on configurable criteria
- 🤖 **AI-Powered Responses**: Generates contextually relevant replies using OpenAI's assistant API
- ⏱️ **Scheduled Content**: Posts routine tweets at configurable intervals to maintain account activity
- ❤️ **Engagement Automation**: Automatically likes and responds to mentions based on customizable rules
- 🔄 **Redundancy Features**: Built-in retry mechanisms and error handling for continuous operation

### ⏰ TweetBot (`bot-types/tweetBot.js`)

The TweetBot is a streamlined posting system that maintains a consistent Twitter presence with AI-generated content on a customizable schedule.

**Key Features:**
- 🕒 **Smart Scheduling**: Posts one tweet at a random time within a 2-hour window, followed by a 30-minute cooldown period
- 🌅 **Special Morning Tweets**: Posts a "good morning" tweet at a randomized time around 9AM CT (±30 minutes)
- 🧠 **OpenAI Integration**: Generates fresh, engaging content for every tweet
- 🚀 **Immediate Startup**: Posts a tweet immediately when launched
- 🔄 **Continuous Operation**: Runs indefinitely with configurable posting windows

## 🚀 Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/twitter-bot-arsenal.git
cd twitter-bot-arsenal

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials
```

## ⚙️ Configuration

Edit the `.env` file with your credentials:

```
# Twitter Credentials
TWITTER_USERNAME='your_username'
TWITTER_PASSWORD='your_password'
TWITTER_EMAIL='your_email'

# OpenAI Configuration
OPENAI_API_KEY='your_api_key'
OPENAI_ASSISTANT_ID='your_assistant_id'
```

### 🔑 Required Credentials

1. **Twitter Account Credentials**
   - Username
   - Email
   - Password

2. **OpenAI API Access**
   - API Key from [OpenAI Platform](https://platform.openai.com/api-keys)
   - Assistant ID from [OpenAI Assistants](https://platform.openai.com/assistants)

## Usage

### Running the ReplyGuy Bot
```bash
node bot-types/replyguy.js
```

### Running the TweetBot
```bash
node bot-types/tweetBot.js
```

## Customization

### Modifying Tweet Types
Edit the `tweetTypes` and `tweetPrompts` objects in the respective bot files to customize the content of your tweets.

### Adjusting Posting Schedule
- **Multi-Account Bot**: Modify the scheduling logic in the `setupTweetSchedule` method
- **Hourly Bot**: Change the interval in the `startHourlySchedule` method

### ReplyGuy Bot
The multi-account monitoring bot can be customized by editing `bot-types/replyguy.js`:

- Add or remove accounts to monitor
- Customize AI prompts for different response types
- Adjust monitoring frequency and engagement rules
- Configure routine tweet schedules

### TweetBot
The scheduled posting bot can be customized by editing `bot-types/tweetBot.js`:

- Modify the 2-hour posting window
- Adjust the 30-minute cooldown period
- Customize the morning tweet time window (currently 9AM CT ±30min)
- Edit the OpenAI prompts for different tweet styles

## 🔒 Security Notes

- Never commit your `.env` file to version control (it's already in `.gitignore`)
- Keep your Twitter and OpenAI credentials secure and rotate them regularly
- Monitor your Twitter account for any unusual activity
- Be mindful of Twitter API rate limits to avoid account restrictions

## 👷 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a pull request

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ❤️ Acknowledgments

- [OpenAI](https://openai.com/) for their powerful AI models
- [agent-twitter-client](https://www.npmjs.com/package/agent-twitter-client) for Twitter API integration
- Review Twitter's terms of service regarding automated posting


## Configuring the AI Assistant

Configure the AI assistant to respond to the following commands:

- `tweet`: Polls the AI assistant to post a tweet
- `tweet goodmorning post`: Polls the AI to post a good morning tweet