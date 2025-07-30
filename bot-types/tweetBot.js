require('dotenv').config();
const { Scraper } = require('agent-twitter-client');
const OpenAI = require('openai');

class TweetBot {
    constructor() {
        this.scraper = new Scraper();
        
        // Initialize OpenAI with API key and beta flag
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            defaultHeaders: { 'OpenAI-Beta': 'assistants=v2' }
        });
        
        // Twitter account to post from
        this.accountName = process.env.TWITTER_USERNAME;
        
        // Simple prompt for OpenAI (always includes the word 'tweet')
        this.prompt = 'Tweet something. Keep it under 69 characters. Use minimal punctuation and symbols.';
        
        // Morning tweet prompt
        this.morningPrompt = 'Tweet goodmorning post. Keep it under 69 characters. Use minimal punctuation and symbols.';
        
        // Track timing
        this.lastPostedTime = null;
        this.inCooldown = false;
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
    async _getOpenAIResponse(isMorningTweet = false) {
        try {
            // Use the appropriate prompt
            const prompt = isMorningTweet ? this.morningPrompt : this.prompt;
            
            // Create a thread
            const thread = await this.openai.beta.threads.create();
            
            // Add a message to the thread
            await this.openai.beta.threads.messages.create(thread.id, {
                role: "user",
                content: prompt
            });
            
            // Run the assistant
            console.log(`Starting OpenAI assistant for tweet...`);
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

    async postTweet(isMorningTweet = false) {
        try {
            // Generate tweet content
            const tweetContent = await this._getOpenAIResponse(isMorningTweet);
            
            // Post the tweet
            await this.scraper.sendTweet(tweetContent);
            console.log(`Posted tweet: ${tweetContent}`);
            
            // Update last posted time
            this.lastPostedTime = new Date();
            console.log(`Tweet posted at: ${this.lastPostedTime.toLocaleString()}`);
            
            // Enter cooldown period
            this.inCooldown = true;
            console.log(`Entering 30-minute cooldown period`);
            
            return true;
        } catch (error) {
            console.error("Error posting tweet:", error);
            return false;
        }
    }

    async startTweetSchedule() {
        // Post immediately on startup
        console.log("Posting initial tweet on startup...");
        await this.postTweet();
        
        // Set up the tweet schedule with 2-hour window and 30-minute cooldown
        console.log("Setting up tweet schedule (2-hour window with 30-minute cooldown)...");
        
        // Start the scheduling loop
        this.schedulingLoop();
    }
    
    // Helper method to check if it's time for the morning tweet (9AM CT +/- 30 min)
    _checkForMorningTweetTime(currentTime) {
        // Get the current time in Central Time
        const options = { timeZone: 'America/Chicago' };
        const ctTime = new Date(currentTime.toLocaleString('en-US', options));
        
        // Check if it's between 8:30 AM and 9:30 AM CT
        if (ctTime.getHours() === 8 && ctTime.getMinutes() >= 30) {
            // It's between 8:30 AM and 9:00 AM
            const morningTime = new Date(ctTime);
            // Add a random offset (0-30 minutes)
            const randomOffset = Math.floor(Math.random() * 31);
            morningTime.setMinutes(morningTime.getMinutes() + randomOffset);
            return morningTime;
        } else if (ctTime.getHours() === 9 && ctTime.getMinutes() <= 30) {
            // It's between 9:00 AM and 9:30 AM
            const morningTime = new Date(ctTime);
            // Add a random offset (0-30 minutes, but don't go past 9:30)
            const maxOffset = 30 - ctTime.getMinutes();
            const randomOffset = Math.floor(Math.random() * (maxOffset + 1));
            morningTime.setMinutes(morningTime.getMinutes() + randomOffset);
            return morningTime;
        }
        
        return null; // Not morning tweet time
    }
    
    async schedulingLoop() {
        // If we're in cooldown, wait 30 minutes then reset
        if (this.inCooldown) {
            console.log("In cooldown period. Will reset in 30 minutes.");
            setTimeout(() => {
                this.inCooldown = false;
                console.log("Cooldown complete. Starting new 2-hour window.");
                this.schedulingLoop();
            }, 30 * 60 * 1000); // 30 minutes
            return;
        }
        
        // Check if it's time for the morning tweet (around 9AM CT +/- 30 minutes)
        const now = new Date();
        const morningTweetTime = this._checkForMorningTweetTime(now);
        
        if (morningTweetTime) {
            // Schedule the morning tweet
            const timeUntilMorningTweet = morningTweetTime - now;
            console.log(`Morning tweet scheduled for: ${morningTweetTime.toLocaleString()} (in ${Math.floor(timeUntilMorningTweet/60000)} minutes)`);
            
            setTimeout(async () => {
                await this.postTweet(true); // true for morning tweet
                // Continue the loop
                this.schedulingLoop();
            }, timeUntilMorningTweet);
            return;
        }
        
        // If we're not in cooldown and it's not morning tweet time, pick a random time within the next 2 hours to tweet
        const randomMinutes = Math.floor(Math.random() * 120); // Random time within 2 hours
        const tweetTime = new Date();
        tweetTime.setMinutes(tweetTime.getMinutes() + randomMinutes);
        
        const timeUntilTweet = (tweetTime - new Date());
        console.log(`Next tweet scheduled for: ${tweetTime.toLocaleString()} (in ${Math.floor(timeUntilTweet/60000)} minutes)`);
        
        // Schedule the tweet
        setTimeout(async () => {
            await this.postTweet();
            // Continue the loop
            this.schedulingLoop();
        }, timeUntilTweet);
    }
}

// Main function to run the bot
async function main() {
    try {
        console.log("Starting Twitter bot with 2-hour window and 30-minute cooldown...");
        const bot = new TweetBot();
        
        // Initialize the bot
        const initialized = await bot.initialize();
        if (!initialized) {
            console.error("Failed to initialize bot. Exiting.");
            process.exit(1);
        }
        
        // Start the tweet schedule
        await bot.startTweetSchedule();
        
        console.log("Bot is running. Press Ctrl+C to exit.");
    } catch (error) {
        console.error("Fatal error:", error);
        process.exit(1);
    }
}

// Start the bot
main().catch(console.error);
