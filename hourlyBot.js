require('dotenv').config();
const { Scraper } = require('agent-twitter-client');
const OpenAI = require('openai');

class HourlyBot {
    constructor() {
        this.scraper = new Scraper();
        
        // Initialize OpenAI with API key and beta flag
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            defaultHeaders: { 'OpenAI-Beta': 'assistants=v2' }
        });
        
        // Twitter account to post from
        this.accountName = process.env.HOURLY_TWITTER_USERNAME || process.env.TWITTER_USERNAME;
        
        // Tweet types for variety
        this.tweetTypes = [
            'crypto_insight',
            'market_update',
            'project_highlight',
            'trading_tip',
            'community_engagement'
        ];
        
        // Tweet prompts for each type
        this.tweetPrompts = {
            'crypto_insight': 'Create a short insightful tweet about the crypto market. Keep it under 69 characters. Use minimal punctuation and symbols.',
            'market_update': 'Create a short tweet updating followers on the current crypto market sentiment. Keep it under 69 characters. Use minimal punctuation and symbols.',
            'project_highlight': 'Create a short tweet highlighting an interesting crypto project. Keep it under 69 characters. Use minimal punctuation and symbols.',
            'trading_tip': 'Create a short tweet with a trading tip for crypto traders. Keep it under 69 characters. Use minimal punctuation and symbols.',
            'community_engagement': 'Create a short tweet asking a question to engage the crypto community. Keep it under 69 characters. Use minimal punctuation and symbols.'
        };
        
        // Track last posted time
        this.lastPostedTime = null;
    }

    async initialize() {
        try {
            // Initialize the Twitter scraper with retry logic
            let loginAttempts = 0;
            const maxLoginAttempts = 3;
            let loginSuccess = false;
            
            console.log("Waiting 5 seconds before first login attempt...");
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            while (!loginSuccess && loginAttempts < maxLoginAttempts) {
                try {
                    loginAttempts++;
                    console.log(`Login attempt ${loginAttempts} of ${maxLoginAttempts}...`);
                    
                    // Try to login with email first if available
                    if (process.env.TWITTER_EMAIL) {
                        try {
                            console.log("Attempting login with email...");
                            await this.scraper.login(process.env.TWITTER_EMAIL, process.env.TWITTER_PASSWORD);
                            loginSuccess = true;
                            console.log("Bot initialized successfully using email login");
                        } catch (emailLoginError) {
                            console.log("Email login failed, trying username login...");
                            await this.scraper.login(process.env.TWITTER_USERNAME, process.env.TWITTER_PASSWORD);
                            loginSuccess = true;
                            console.log("Bot initialized successfully using username login");
                        }
                    } else {
                        // Fall back to username login if email not available
                        await this.scraper.login(process.env.TWITTER_USERNAME, process.env.TWITTER_PASSWORD);
                        loginSuccess = true;
                        console.log("Bot initialized successfully");
                    }
                } catch (loginError) {
                    console.error(`Login attempt ${loginAttempts} failed:`, loginError);
                    if (loginAttempts < maxLoginAttempts) {
                        const waitTime = 15000 * loginAttempts; // Increase wait time with each attempt
                        console.log(`Waiting ${waitTime/1000} seconds before retry...`);
                        await new Promise(resolve => setTimeout(resolve, waitTime));
                    }
                }
            }
            
            if (!loginSuccess) {
                console.error("Failed to login after multiple attempts");
                return false;
            }
            
            return true;
        } catch (error) {
            console.error("Initialization error:", error);
            return false;
        }
    }

    // Helper method to get response from OpenAI
    async _getOpenAIResponse(promptType) {
        try {
            // Get the prompt for the tweet type
            const prompt = this.tweetPrompts[promptType];
            
            // Create a thread
            const thread = await this.openai.beta.threads.create();
            
            // Add a message to the thread
            await this.openai.beta.threads.messages.create(thread.id, {
                role: "user",
                content: prompt
            });
            
            // Run the assistant
            console.log(`Starting OpenAI assistant for ${promptType} tweet...`);
            const run = await this.openai.beta.threads.runs.create(thread.id, {
                assistant_id: process.env.OPENAI_ASSISTANT_ID
            });
            
            // Wait for completion with a maximum of 60 attempts (1 minute)
            let attempts = 0;
            let runStatus = await this.openai.beta.threads.runs.retrieve(thread.id, run.id);
            
            while (runStatus.status !== "completed" && attempts < 60) {
                if (attempts % 10 === 0) { // Log progress every 10 seconds
                    console.log(`Waiting for OpenAI response (${attempts} seconds)... Status: ${runStatus.status}`);
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
                runStatus = await this.openai.beta.threads.runs.retrieve(thread.id, run.id);
                attempts++;
            }
            
            if (runStatus.status !== "completed") {
                throw new Error("OpenAI run did not complete in time (waited 60 seconds)");
            }
            
            console.log(`OpenAI response received after ${attempts} seconds`);
            
            // Get the messages
            const messages = await this.openai.beta.threads.messages.list(thread.id);
            
            if (messages.data.length > 0 && messages.data[0].content.length > 0) {
                const response = messages.data[0].content[0].text.value.replace(/["']/g, '');
                console.log(`AI generated tweet: ${response}`);
                return response;
            } else {
                throw new Error("No response received from OpenAI");
            }
        } catch (error) {
            console.error("Error in _getOpenAIResponse:", error);
            throw error;
        }
    }

    async postHourlyTweet() {
        try {
            // Select a random tweet type
            const tweetType = this.tweetTypes[Math.floor(Math.random() * this.tweetTypes.length)];
            console.log(`Selected tweet type: ${tweetType}`);
            
            // Generate tweet content
            const tweetContent = await this._getOpenAIResponse(tweetType);
            
            // Post the tweet
            await this.scraper.sendTweet(tweetContent);
            console.log(`Posted hourly tweet: ${tweetContent}`);
            
            // Update last posted time
            this.lastPostedTime = new Date();
            console.log(`Tweet posted at: ${this.lastPostedTime.toLocaleString()}`);
            
            return true;
        } catch (error) {
            console.error("Error posting hourly tweet:", error);
            return false;
        }
    }

    async startHourlySchedule() {
        // Post immediately on startup
        console.log("Posting initial tweet on startup...");
        await this.postHourlyTweet();
        
        // Set up hourly schedule
        console.log("Setting up hourly tweet schedule...");
        
        // Calculate time until the next hour
        const now = new Date();
        const nextHour = new Date(now);
        nextHour.setHours(nextHour.getHours() + 1);
        nextHour.setMinutes(0);
        nextHour.setSeconds(0);
        nextHour.setMilliseconds(0);
        
        const timeUntilNextHour = nextHour - now;
        console.log(`Next hourly tweet scheduled for: ${nextHour.toLocaleString()}`);
        
        // Schedule first tweet at the next hour
        setTimeout(() => {
            // Post the tweet
            this.postHourlyTweet();
            
            // Then set up the regular hourly interval
            setInterval(() => {
                this.postHourlyTweet().catch(error => {
                    console.error("Error in hourly tweet cycle:", error);
                });
            }, 60 * 60 * 1000); // Every hour (60 minutes * 60 seconds * 1000 milliseconds)
        }, timeUntilNextHour);
    }
}

// Main function to run the bot
async function main() {
    try {
        console.log("Starting hourly Twitter bot...");
        const bot = new HourlyBot();
        
        // Initialize the bot
        const initialized = await bot.initialize();
        if (!initialized) {
            console.error("Failed to initialize bot. Exiting.");
            process.exit(1);
        }
        
        // Start the hourly tweet schedule
        await bot.startHourlySchedule();
        
        console.log("Hourly bot is running. Press Ctrl+C to exit.");
    } catch (error) {
        console.error("Fatal error:", error);
        process.exit(1);
    }
}

// Start the bot
main().catch(console.error);
