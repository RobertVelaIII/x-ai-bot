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
        
        // Track tweet IDs for reply checking
        this.lastTweetId = null;
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
            const tweet = await this.scraper.sendTweet(tweetContent);
            console.log(`Posted tweet: ${tweetContent}`);
            
            // Debug tweet object
            console.log('Tweet object structure:', JSON.stringify(tweet, null, 2));
            
            // Try to find the tweet ID in different possible locations
            this.lastTweetId = tweet?.id_str || tweet?.id || tweet?.data?.id_str || tweet?.data?.id || null;
            
            if (this.lastTweetId) {
                console.log(`Tweet ID captured: ${this.lastTweetId}`);
            } else {
                console.log('Failed to capture tweet ID from the tweet object.');
                console.log('Attempting to get the latest tweet from your timeline...');
                
                try {
                    // Wait a moment for the tweet to appear in the timeline
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    
                    // Try to get the latest tweet by searching for the exact content
                    const latestTweet = await this.scraper.getLatestTweet(this.accountName);
                    if (latestTweet) {
                        console.log('Found latest tweet:', JSON.stringify(latestTweet, null, 2));
                        this.lastTweetId = latestTweet.id_str || latestTweet.id || null;
                        
                        if (this.lastTweetId) {
                            console.log(`Got tweet ID from latest tweet: ${this.lastTweetId}`);
                        } else {
                            console.log('Latest tweet found but no ID available');
                        }
                    } else {
                        console.log('No latest tweet found');
                    }
                } catch (err) {
                    console.error('Error getting latest tweet:', err);
                }
                
                if (!this.lastTweetId) {
                    console.log('Will proceed without a tweet ID - reply liking may not work this time.');
                }
            }
            
            // Update last posted time
            this.lastPostedTime = new Date();
            console.log(`Tweet posted at: ${this.lastPostedTime.toLocaleString()}`);
            
            // Enter cooldown period
            this.inCooldown = true;
            console.log(`Entering 30-minute cooldown period`);
            
            // Schedule reply checking at a random time between 1-2 minutes after posting
            const randomSeconds = 60 + Math.floor(Math.random() * 60); // Random time between 60-120 seconds
            console.log(`Will check for replies to like in ${randomSeconds} seconds (${(randomSeconds/60).toFixed(1)} minutes)`);
            
            setTimeout(() => {
                this.likeReplies();
            }, randomSeconds * 1000);
            
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
    
    // New method to like replies to the bot's tweets
    async likeReplies() {
        try {
            if (!this.lastTweetId) {
                console.log("No tweet ID available to check for replies");
                return;
            }
            
            console.log(`Checking for replies to tweet ID: ${this.lastTweetId}`);
            
            try {
                // First, try to get the tweet to verify the ID is valid
                const tweetCheck = await this.scraper.getTweet(this.lastTweetId);
                console.log('Successfully verified tweet exists:', tweetCheck ? 'Yes' : 'No');
                
                // Get the conversation ID (which is needed to find replies)
                const conversationId = tweetCheck.conversationId || this.lastTweetId;
                console.log(`Using conversation ID: ${conversationId}`);
                
                // Search for tweets that are replies to this conversation
                // We'll use the search functionality to find replies
                console.log('Searching for replies...');
                
                // Record the time when our tweet was posted
                const ourTweetTime = new Date();
                console.log(`Our tweet was posted at: ${ourTweetTime.toISOString()}`);
                
                // We'll search for tweets mentioning our username that were posted after our tweet
                const searchQuery = `to:${this.accountName}`;
                console.log(`Searching for tweets with query: ${searchQuery}`);
                
                // Use fetchSearchTweets instead of searchTweets for better control
                const searchResults = await this.scraper.fetchSearchTweets(searchQuery, 20);
                console.log('Search results:', JSON.stringify(searchResults, null, 2));
                
                // Extract tweets from search results
                let tweets = [];
                if (searchResults && searchResults.tweets && Array.isArray(searchResults.tweets)) {
                    tweets = searchResults.tweets;
                } else if (Array.isArray(searchResults)) {
                    tweets = searchResults;
                }
                
                if (!tweets || tweets.length === 0) {
                    console.log("No potential replies found in search results");
                    return;
                }
                
                console.log(`Found ${tweets.length} potential tweets in search results`);
                
                // Filter to find actual replies to our tweet
                const replies = [];
                for (const tweet of tweets) {
                    // Extract all possible ID fields for comparison
                    const tweetInReplyToId = 
                        tweet.inReplyToStatusId || 
                        tweet.inReplyToStatusId_str || 
                        tweet.in_reply_to_status_id || 
                        tweet.in_reply_to_status_id_str;
                    
                    // Check if it's specifically a reply to our most recent tweet
                    const isReplyToOurTweet = 
                        tweetInReplyToId === this.lastTweetId ||
                        (tweet.conversationId && tweet.conversationId === conversationId);
                    
                    // Check if the tweet was created after our tweet was posted
                    // This helps ensure we're only getting replies to the most recent tweet
                    const tweetTimestamp = tweet.timestamp || 
                        (tweet.created_at ? new Date(tweet.created_at).getTime() / 1000 : 0);
                    
                    // Only consider tweets that are replies to our specific tweet ID and were posted after our tweet
                    if (isReplyToOurTweet) {
                        console.log(`Found potential reply: ${tweet.text || tweet.full_text}`);
                        console.log(`Reply to status ID: ${tweetInReplyToId}, Our tweet ID: ${this.lastTweetId}`);
                        console.log(`Conversation ID: ${tweet.conversationId}, Our conversation ID: ${conversationId}`);
                        
                        // Additional verification that it's a reply to our specific tweet
                        if (tweetInReplyToId === this.lastTweetId) {
                            console.log(`Confirmed reply to our specific tweet ID`);
                            replies.push(tweet);
                        } else if (tweet.conversationId === conversationId) {
                            // For tweets that match by conversation ID, do additional verification
                            // Check if the tweet mentions our username and was posted after our tweet
                            const mentionsUs = tweet.mentions && 
                                tweet.mentions.some(mention => 
                                    mention.username.toLowerCase() === this.accountName.toLowerCase());
                            
                            if (mentionsUs) {
                                console.log(`Confirmed reply in our conversation that mentions us`);
                                replies.push(tweet);
                            } else {
                                console.log(`Skipping - same conversation but doesn't mention us directly`);
                            }
                        }
                    }
                }
                
                if (!replies || replies.length === 0) {
                    console.log("No replies found to like after filtering");
                    return;
                }
                
                console.log(`Found ${replies.length} replies to like`);
                
                // Like each reply
                for (const reply of replies) {
                    try {
                        // Extract the tweet ID from various possible locations
                        const replyId = reply.id_str || reply.id || reply.tweet_id || 
                                       reply.tweetId || reply.tweet_id_str || 
                                       (reply.rest_id ? reply.rest_id : null);
                        
                        if (!replyId) {
                            console.log('Reply has no ID, skipping. Reply object:', JSON.stringify(reply, null, 2));
                            continue;
                        }
                        
                        console.log(`Attempting to like reply with ID: ${replyId}`);
                        await this.scraper.likeTweet(replyId);
                        
                        const username = reply.username || reply.user?.screen_name || reply.screen_name || 'unknown';
                        const text = reply.text || reply.full_text || reply.content || 'No text available';
                        console.log(`Liked reply from @${username}: ${text}`);
                        
                        // Small delay to avoid rate limiting
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    } catch (likeError) {
                        console.error(`Failed to like reply:`, likeError);
                    }
                }
                
                console.log("Finished liking replies");
                
            } catch (tweetCheckError) {
                console.error('Error checking tweet or finding replies:', tweetCheckError);
            }
        } catch (error) {
            console.error("Error in likeReplies method:", error);
        }
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
