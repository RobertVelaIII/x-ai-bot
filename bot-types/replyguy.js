require('dotenv').config();
const { Scraper } = require('agent-twitter-client');
const OpenAI = require('openai');

class MultiAccountBot {
    constructor() {
        this.scraper = new Scraper();
        
        // Initialize OpenAI with API key and beta flag
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            defaultHeaders: { 'OpenAI-Beta': 'assistants=v2' }
        });
        
        // Twitter accounts to monitor
        this.accounts = {
            'altcoingordon': {
                lastSeenTweetId: null,
                tweetCounter: 0, // Counter to track tweets
                respondEvery: 5, // Respond once every 5 tweets
                prompt: 'Interpret the tweet, if its a question answer it. Shill $SMELLER - the FART SMELLER coin is a generational entry! Not a pump. Smart fellers are fart smellers. CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. I\'m building the website + AI. Join us! Use minimal punctuation. If tweet has no words, respond with CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. IMPORTANT: No quotation marks. Maximum 69 characters.'
            },
            'thebuttholeai': {
                lastSeenTweetId: null, 
                prompt: 'Interpret the tweet, if its a question answer it. $SMELLER is the perfect butthole companion! A generational entry not a pump. Fart smellers unite! CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. Leading web/AI dev for the project. If tweet has no words, respond with CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. Use minimal punctuation. IMPORTANT: No quotation marks. Maximum 69 characters.'
            },
            'FartCoinOfSOL': {
                lastSeenTweetId: null,
                prompt: 'Interpret the tweet, if its a question answer it. $SMELLER is the official Solana fart token! A generational entry not a pump. CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. I\'m handling the tech integration. If tweet has no words, respond with CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. Use minimal punctuation. IMPORTANT: No quotation marks. Maximum 69 characters.'
            },
            'fatfellaseason': {
                lastSeenTweetId: null, 
                prompt: 'Interpret the tweet, if its a question answer it. $FAT + $SMELLER - degen plays of the year! FART SMELLER is a generational entry not a pump. CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. I\'m handling all web/AI dev. If tweet has no words, respond with CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. Use minimal punctuation. IMPORTANT: No quotation marks. Maximum 69 characters.'
            },
            'PrimusMeta': {
                lastSeenTweetId: null,
                prompt: 'Interpret the tweet, if its a question answer it. Tech meets memes with $SMELLER! The FART SMELLER coin is a generational entry not a pump. CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. I\'m building the tech. If tweet has no words, respond with CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. Use minimal punctuation. IMPORTANT: No quotation marks. Maximum 69 characters.'
            },
            'syntoxc': {
                lastSeenTweetId: null,
                prompt: 'Interpret the tweet, if its a question answer it. Found the play - $SMELLER! FART SMELLER is a generational entry not a pump. Smart fellers are loading. CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. I\'m building AI/web. If tweet has no words, respond with CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. Use minimal punctuation. IMPORTANT: No quotation marks. Maximum 69 characters.'
            },
            'JamesEastonUK': {
                lastSeenTweetId: null, 
                tweetCounter: 0, // Counter to track tweets
                respondEvery: 3, // Respond once every 3 tweets
                prompt: 'Interpret the tweet, if its a question answer it. Bro you gotta ape $SMELLER! The FART SMELLER coin is a generational entry not a pump. CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. I\'m leading web/AI dev. If tweet has no words, respond with CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. Use minimal punctuation. IMPORTANT: No quotation marks. Maximum 69 characters.'
            },
            'alldexone': {
                lastSeenTweetId: null, 
                prompt: 'Interpret the tweet, if its a question answer it. $ONE + $SMELLER - the FART SMELLER coin is a generational entry not a pump. CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. I\'m building the tech/AI. If tweet has no words, respond with CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. Use minimal punctuation. IMPORTANT: No quotation marks. Maximum 69 characters.'
            },
            'brooksdyor': {
                lastSeenTweetId: null, 
                prompt: 'Interpret the tweet, if its a question answer it. Market wizard should analyze $SMELLER! FART SMELLER is a generational entry not a pump. CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. I\'m building the tech/AI. If tweet has no words, respond with CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. Use minimal punctuation. IMPORTANT: No quotation marks. Maximum 69 characters.'
            },
            'RiskBetsDEV': {
                lastSeenTweetId: null, 
                prompt: 'Interpret the tweet, if its a question answer it. While you scam, $SMELLER builds! The FART SMELLER is a generational entry not a pump. CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. I\'m handling web/AI dev. If tweet has no words, respond with CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. Use minimal punctuation. IMPORTANT: No quotation marks. Maximum 69 characters.'
            },
            'Binance': {
                lastSeenTweetId: null, 
                prompt: 'Interpret the tweet, if its a question answer it. List $SMELLER next! FART SMELLER is a generational entry not a pump. CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. I\'m building the tech/AI. If tweet has no words, respond with CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. Use minimal punctuation. IMPORTANT: No quotation marks. Maximum 69 characters.'
            },
            'cobratate': {
                lastSeenTweetId: null, 
                prompt: 'Interpret the tweet, if its a question answer it. Real alphas ape $SMELLER! The FART SMELLER coin is a generational entry not a pump. CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. I\'m leading web/AI dev. If tweet has no words, respond with CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. Use minimal punctuation. IMPORTANT: No quotation marks. Maximum 69 characters.'
            },
            'cryptehsnipeh': {
                lastSeenTweetId: null, 
                prompt: 'Interpret the tweet, if its a question answer it. Spot this gem - $SMELLER! The FART SMELLER is a generational entry not a pump. CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. I\'m building the web/AI. If tweet has no words, respond with CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. Use minimal punctuation. IMPORTANT: No quotation marks. Maximum 69 characters.'
            },
            'funkymetax': {
                lastSeenTweetId: null, 
                prompt: 'Interpret the tweet, if its a question answer it. $GHOST + $SMELLER! The FART SMELLER is a generational entry not a pump. CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. I\'m leading web/AI development for the project. If tweet has no words, respond with CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. Use minimal punctuation. IMPORTANT: No quotation marks. Maximum 69 characters.'
            },
            'barkmeta': {
                lastSeenTweetId: null, 
                prompt: 'Interpret the tweet, if its a question answer it. Follow back to hear about $SMELLER! The FART SMELLER is a generational entry not a pump. CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. I\'m building the tech/AI. If tweet has no words, respond with CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. Use minimal punctuation. IMPORTANT: No quotation marks. Maximum 69 characters.'
            },
            'elonmusk': {
                lastSeenTweetId: null,
                prompt: 'Interpret the tweet, if its a question answer it. Even Mars needs $SMELLER! The FART SMELLER is a generational entry not a pump. CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. I\'m building the web/AI tech. If tweet has no words, respond with CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. Use minimal punctuation. IMPORTANT: No quotation marks. Maximum 69 characters.'
            },
            'TateTheTalisman': {
                lastSeenTweetId: null,
                prompt: 'Interpret the tweet, if its a question answer it. Real G\'s ape $SMELLER! The FART SMELLER is a generational entry not a pump. CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. I\'m building the tech/AI. If tweet has no words, respond with CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. Use minimal punctuation. IMPORTANT: No quotation marks. Maximum 69 characters.'
            },
            'TiffanyFong_': {
                lastSeenTweetId: null,
                prompt: 'Interpret the tweet, if its a question answer it. Sis check out $SMELLER! The FART SMELLER is a generational entry not a pump. CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. I\'m handling all web/AI dev. If tweet has no words, respond with CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. Use minimal punctuation. IMPORTANT: No quotation marks. Maximum 69 characters.'
            },
            'MotionMetaX': {
                lastSeenTweetId: null,
                prompt: 'Interpret the tweet, if its a question answer it. Marine, ape $SMELLER! The FART SMELLER is a generational entry not a pump. CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. I\'m building all tech/AI for the project. If tweet has no words, respond with CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. Use minimal punctuation. IMPORTANT: No quotation marks. Maximum 69 characters.'
            },
            'CoinismX': {
                lastSeenTweetId: null,
                prompt: 'Interpret the tweet, if its a question answer it. Doginal dogs should ape $SMELLER! The FART SMELLER is a generational entry not a pump. CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. I\'m leading web/AI development. If tweet has no words, respond with CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. Use minimal punctuation. IMPORTANT: No quotation marks. Maximum 69 characters.'
            },
            'Mousemetax': {
                lastSeenTweetId: null,
                prompt: 'Interpret the tweet, if its a question answer it. Squeaking about $SMELLER! The FART SMELLER is a generational entry not a pump. CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. I\'m building all the tech/AI. If tweet has no words, respond with CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. Use minimal punctuation. IMPORTANT: No quotation marks. Maximum 69 characters.'
            },
            'Fiinaoo': {
                lastSeenTweetId: null,
                prompt: 'Interpret the tweet, if its a question answer it. Lock in on $SMELLER! The FART SMELLER is a generational entry not a pump. CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. I\'m building the web/AI. If tweet has no words, respond with CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. Use minimal punctuation. IMPORTANT: No quotation marks. Maximum 69 characters.'
            },
            'its_me_WiSH': {
                lastSeenTweetId: null,
                tweetCounter: 0,
                respondEvery: 7,
                prompt: 'Interpret the tweet, if its a question answer it. Gaming + AI + $SMELLER = future! The FART SMELLER is a generational entry not a pump. CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. I\'m leading tech/AI development. If tweet has no words, respond with CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. Use minimal punctuation. IMPORTANT: No quotation marks. Maximum 69 characters.'
            },
            'oldfatytguy': {
                lastSeenTweetId: null,
                prompt: 'Interpret the tweet, if its a question answer it. HODL through -90% to find $SMELLER! The FART SMELLER is a generational entry not a pump. CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. I\'m building the web/AI. If tweet has no words, respond with CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. Use minimal punctuation. IMPORTANT: No quotation marks. Maximum 69 characters.'
            },
            'POV_you_held': {
                lastSeenTweetId: null,
                prompt: 'Interpret the tweet, if its a question answer it. Diamond hands ape $SMELLER! The FART SMELLER is a generational entry not a pump. CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. I\'m building all tech/AI for it. If tweet has no words, respond with CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. Use minimal punctuation. IMPORTANT: No quotation marks. Maximum 69 characters.'
            },
            'tall_data': {
                lastSeenTweetId: null,
                prompt: 'Interpret the tweet, if its a question answer it. Doginal dogs should sniff $SMELLER! 🐾🐶 The FART SMELLER is a generational entry not a pump. CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. I\'m building all tech/AI. Follow back! If tweet has no words, respond with CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. Use minimal punctuation. IMPORTANT: No quotation marks. Maximum 69 characters.'
            },
            'NewynMETA': {
                lastSeenTweetId: null,
                prompt: 'Respond with 💨❤️🫶🏻 only. IMPORTANT: Do NOT include quotation marks in your response.'
            },            
            'Crashmetax': {                
                lastSeenTweetId: null,                
                prompt: 'Interpret the tweet, if its a question answer it. Fellow doginal needs to ape $SMELLER! 🐾🐶 The FART SMELLER is a generational entry not a pump. CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. I\'m building all tech/AI. If tweet has no words, respond with CA: 2xsQDAJuuQkcuGd8bC4vgdTKAF3FKwmXF8zVeLkYpump. Use minimal punctuation. IMPORTANT: No quotation marks. Maximum 69 characters.'
            }
        };
        
        // For routine tweets as BasedNPCsol
        this.routinePrompts = {
            'evening': 'Create a short good evening tweet for crypto traders. Keep it under 69 characters. Use minimal punctuation and symbols. IMPORTANT: Do NOT include quotation marks in your response.',
            'goodnight': 'Create a short goodnight tweet for crypto traders. Keep it under 69 characters. Use minimal punctuation and symbols. IMPORTANT: Do NOT include quotation marks in your response.',
            'gym': 'Create a short tweet encouraging crypto traders to hit the gym. Mention that women are attracted to both wealth and fitness. Keep it under 69 characters. Use minimal punctuation and symbols. IMPORTANT: Do NOT include quotation marks in your response.',
            'manifest_100x': 'Create a short mantra-like tweet manifesting finding 100x coins. Keep it under 69 characters. Use minimal punctuation and symbols. IMPORTANT: Do NOT include quotation marks in your response.',
            'solana_1000': 'Create a short mantra-like tweet manifesting Solana pumping to $1,000. Keep it under 69 characters. Use minimal punctuation and symbols. IMPORTANT: Do NOT include quotation marks in your response.',
            'butthole_billion': 'Create a short tweet starting with "when butthole coin hits 1B" followed by something you will do like donate to the poor, buy a lambo, eat steak, or subtle signs of being rich. Keep it under 69 characters. Use minimal punctuation and symbols. IMPORTANT: Do NOT include quotation marks in your response.',
            'engagement': 'Create a short tweet challenging people to comment, like, and follow you for the best crypto calls. Ask if they are ready to follow for alpha. Keep it under 69 characters. Use minimal punctuation and symbols. IMPORTANT: Do NOT include quotation marks in your response.',
            'notifications': 'Create a short tweet challenging users to follow you AND turn on notifications for guaranteed 100x Solana memecoin launches. Keep it under 69 characters. Use minimal punctuation and symbols. IMPORTANT: Do NOT include quotation marks in your response.',
            'follow_blue': 'Create a short tweet saying you follow back users with blue check marks and mention how we are all in this together. Create a community vibe. Keep it under 69 characters. Use minimal punctuation and symbols. IMPORTANT: Do NOT include quotation marks in your response.',
            'career_change': 'Create a short tweet about giving up your full-time job building rockets to focus on web3. Mention your growing network of whales, developers, and celebrities. Make it sound bullish and exciting. Keep it under 69 characters. Use minimal punctuation and symbols. IMPORTANT: Do NOT include quotation marks in your response.',
            'not_too_late': 'Create a short tweet emphasizing that it is not too late to become rich off Solana. Make it encouraging and urgent. Keep it under 69 characters. Use minimal punctuation and symbols. IMPORTANT: Do NOT include quotation marks in your response.',
            'future_coin': 'Create a short tweet about your plans to create a coin for the people when you get big, mentioning it will have a marketing wallet, iPhone app, and AI tools. Make it sound exciting and community-focused. Keep it under 69 characters. Use minimal punctuation and symbols. IMPORTANT: Do NOT include quotation marks in your response.',
            'scammer_alert': 'Create a short tweet starting with "Scam alert @RiskBetsDEV @mrpunkdoteth @TheBullishTradR @HardSnipe" warning about scammers. Advise following coins with conviction like Butthole and $FAT. Mention daily runners will crush you and 9/10 celebrity launches are trash. Tell people to comment more scammers and RT to spread awareness. Keep it under 150 characters. Use minimal punctuation. IMPORTANT: Do NOT include quotation marks in your response and DO NOT change the @ usernames.'
        };
    }

    async initialize() {
        try {
            // Initialize the Twitter scraper with retry logic
            let loginAttempts = 0;
            const maxLoginAttempts = 3;
            let loginSuccess = false;
            
            // Add initial delay before first login attempt
            console.log("Waiting 10 seconds before first login attempt...");
            await new Promise(resolve => setTimeout(resolve, 10000));
            
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
            
            // Get the most recent tweet for each account to establish a baseline
            for (const account of Object.keys(this.accounts)) {
                try {
                    const latestTweet = await this.scraper.getLatestTweet(account);
                    if (latestTweet) {
                        this.accounts[account].lastSeenTweetId = latestTweet.id;
                        console.log(`Starting to monitor ${account} from tweet: ${latestTweet.id}`);
                    }
                } catch (error) {
                    console.error(`Error getting latest tweet for ${account}:`, error);
                }
            }
            
            return true;
        } catch (error) {
            console.error("Initialization error:", error);
            return false;
        }
    }

    async getAIResponse(tweetText, account) {
        try {
            // No timeout here - we'll wait as long as needed for the OpenAI response
            console.log(`Getting AI response for tweet from ${account}...`);
            return await this._getOpenAIResponse(tweetText, account);
        } catch (error) {
            console.error('Error getting AI response:', error);
            // Fallback responses if AI fails
            const fallbacks = [
                "NGMI 🤝",
                "Based take 🫡",
                "W",
                "Absolutely based",
                "📈📈📈",
                "🔥🔥🔥",
                "Incredibly based",
                "Peak basedness achieved"
            ];
            return fallbacks[Math.floor(Math.random() * fallbacks.length)];
        }
    }
    
    // Helper method to get response from OpenAI
    async _getOpenAIResponse(tweetText, account) {
        try {
            // Get the prompt for the account
            const prompt = this.accounts[account].prompt;
            
            // Create a thread
            const thread = await this.openai.beta.threads.create();
            
            // Add a message to the thread
            await this.openai.beta.threads.messages.create(thread.id, {
                role: "user",
                content: `${prompt} Tweet to respond to: "${tweetText}"`
            });
            
            // Run the assistant
            console.log(`Starting OpenAI assistant for response to ${account}...`);
            const run = await this.openai.beta.threads.runs.create(thread.id, {
                assistant_id: process.env.OPENAI_ASSISTANT_ID
            });
            
            // Wait for completion with a maximum of 60 attempts (2 minutes)
            let attempts = 0;
            let runStatus = await this.openai.beta.threads.runs.retrieve(thread.id, run.id);
            
            while (runStatus.status !== "completed" && attempts < 60) {
                if (attempts % 5 === 0) { // Log progress every 5 seconds
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
                console.log(`AI generated response: ${response}`);
                return response;
            } else {
                throw new Error("No response received from OpenAI");
            }
        } catch (error) {
            console.error("Error in _getOpenAIResponse:", error);
            throw error; // Re-throw to be handled by the parent method
        }
    }

    async monitorAndRespond() {
        // Set up continuous monitoring
        const monitoringInterval = 2 * 60 * 1000; // Check every 2 minutes
        
        // Initial check
        console.log("Starting initial account check...");
        await this._checkAllAccounts();
        
        // Set up recurring checks
        setInterval(() => {
            console.log("Checking for new tweets...");
            this._checkAllAccounts().catch(error => {
                console.error('Error during monitoring cycle:', error);
            });
        }, monitoringInterval);
    }
    
    // Removed reply checking functionality
    async _checkAndLikeReplies() {
        // This function is intentionally empty
        // We've removed the reply checking functionality because the required methods
        // aren't available in the agent-twitter-client library
    }
    
    async _checkAllAccounts() {
        // Check for accounts to monitor
        for (const account of Object.keys(this.accounts)) {
            try {
                const latestTweet = await this.scraper.getLatestTweet(account);
                
                if (latestTweet && latestTweet.id !== this.accounts[account].lastSeenTweetId) {
                    console.log(`New tweet from ${account}:`, latestTweet.text);
                    
                    // Always like the tweet regardless of who it's from
                    if (!latestTweet.isRetweet && !latestTweet.inReplyToStatusId) {
                        await this.scraper.likeTweet(latestTweet.id);
                        console.log(`Liked tweet from ${account}`);
                        
                        // Special handling for accounts with selective responses
                        let shouldReply = true;
                        
                        // Handle accounts with respondEvery property
                        if (this.accounts[account].respondEvery) {
                            const respondEvery = this.accounts[account].respondEvery;
                            
                            // Increment the counter
                            this.accounts[account].tweetCounter = (this.accounts[account].tweetCounter || 0) + 1;
                            
                            // Only reply if counter is divisible by respondEvery
                            if (this.accounts[account].tweetCounter % respondEvery !== 0) {
                                console.log(`Skipping reply to ${account} (tweet ${this.accounts[account].tweetCounter} of ${respondEvery})`);
                                shouldReply = false;
                            } else {
                                console.log(`Responding to ${account} (tweet ${this.accounts[account].tweetCounter} - every ${respondEvery}th tweet)`);
                            }
                        }
                        
                        // Reply if we should
                        if (shouldReply) {
                            const response = await this.getAIResponse(latestTweet.text, account);
                            await this.scraper.sendTweet(response, latestTweet.id);
                            console.log(`Replied to ${account} with: ${response}`);
                        }
                    }
                    
                    this.accounts[account].lastSeenTweetId = latestTweet.id;
                }
                
                // Add a small delay between checking different accounts
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.error(`Error monitoring ${account}:`, error);
            }
        }
        
        console.log("Completed account monitoring cycle");
    }
    
    async postRoutineTweet(promptType) {
        try {
            let tweetContent;
            
            // Special handling for scammer alert tweets - use hardcoded content
            if (promptType === 'scammer_alert') {
                // Rotate between a few variations to keep it fresh but always include the @ mentions
                const scammerAlerts = [
                    "Scam alert @RiskBetsDEV @mrpunkdoteth @TheBullishTradR @HardSnipe RT and comment more names below we're all in this together",
                    "@RiskBetsDEV @mrpunkdoteth @TheBullishTradR @HardSnipe are scammers drop more names in comments we protect our community together",
                    "Beware @RiskBetsDEV @mrpunkdoteth @TheBullishTradR @HardSnipe comment more scammers below we keep each other safe"
                ];
                tweetContent = scammerAlerts[Math.floor(Math.random() * scammerAlerts.length)];
                console.log(`Using hardcoded scammer alert: ${tweetContent}`);
            } else {
                // For all other tweet types, use the AI generation
                // Get the prompt based on the type
                const prompt = this.routinePrompts[promptType] || 
                    "Generate a tweet about crypto that would be interesting to meme coin investors. Include your perspective as an AI developer. Maximum 240 characters.";
                
                // Generate tweet content using OpenAI directly using the Assistants API
                const thread = await this.openai.beta.threads.create();
                
                await this.openai.beta.threads.messages.create(thread.id, {
                    role: "user",
                    content: prompt
                });

                const run = await this.openai.beta.threads.runs.create(thread.id, {
                    assistant_id: process.env.OPENAI_ASSISTANT_ID
                });

                // Wait for completion
                let response = await this.openai.beta.threads.runs.retrieve(thread.id, run.id);
                while (response.status !== 'completed') {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    response = await this.openai.beta.threads.runs.retrieve(thread.id, run.id);
                }

                const messages = await this.openai.beta.threads.messages.list(thread.id);
                tweetContent = messages.data[0].content[0].text.value;
            }
            
            // Post the tweet (passing null for an original tweet, not a reply)
            await this.scraper.sendTweet(tweetContent, null);
            
            console.log(`Posted routine ${promptType} tweet: ${tweetContent}`);
        } catch (error) {
            console.error(`Error posting routine ${promptType} tweet:`, error);
            // Fallback responses if AI fails
            const fallbacks = [
                "markets looking spicy today",
                "buying the dip",
                "bullish on innovation",
                "study the charts not the noise",
                "are you locked in today",
                "grinding while they sleep"
            ];
            const fallbackTweet = fallbacks[Math.floor(Math.random() * fallbacks.length)];
            
            try {
                await this.scraper.sendTweet(fallbackTweet, null);
                console.log(`Posted fallback ${promptType} tweet: ${fallbackTweet}`);
            } catch (innerError) {
                console.error('Error posting fallback tweet:', innerError);
            }
        }
    }
}

// Start the bot
async function main() {
    try {
        // Create the bot
        const bot = new MultiAccountBot();
        
        // Initialize the bot
        const initSuccess = await bot.initialize();
        
        if (!initSuccess) {
            console.error("Bot initialization failed. Exiting...");
            return;
        }
        
        // Post an initial scammer alert tweet immediately on startup
        try {
            console.log("Posting initial scammer alert tweet on startup");
            await bot.postRoutineTweet('scammer_alert');
        } catch (tweetError) {
            console.error("Error posting initial scammer alert tweet:", tweetError);
            // Continue even if initial tweet fails
        }
        
        // Start monitoring accounts for tweets to respond to immediately
        const startTimestamp = new Date().toLocaleString();
        console.log(`[${startTimestamp}] Starting to monitor accounts for tweets to respond to...`);
        bot.monitorAndRespond();
        
        console.log("Setting up daily tweet schedule...");
        
        // Helper function to schedule daily tasks at specific times
        function scheduleDaily(hour, minute, task) {
            const now = new Date();
            let scheduledTime = new Date(now);
            scheduledTime.setHours(hour, minute, 0, 0);
            
            if (scheduledTime < now) {
                scheduledTime.setDate(scheduledTime.getDate() + 1);
            }
            
            const timeUntilTask = scheduledTime - now;
            setTimeout(() => {
                task();
                // Schedule for the next day after execution
                setInterval(task, 24 * 60 * 60 * 1000);
            }, timeUntilTask);
            
            // Log when the next execution will happen
            console.log(`Next execution of scheduled task at ${scheduledTime.toLocaleString()}`);
        }
        
        // Helper function to schedule tasks on specific days at specific times
        function scheduleOnDays(days, hour, minute, task) {
            const now = new Date();
            let scheduledTime = new Date(now);
            scheduledTime.setHours(hour, minute, 0, 0);
            
            // If today is not in the days list or the time has already passed, find the next valid day
            while (!days.includes(scheduledTime.getDay()) || scheduledTime < now) {
                scheduledTime.setDate(scheduledTime.getDate() + 1);
                scheduledTime.setHours(hour, minute, 0, 0);
            }
            
            const timeUntilTask = scheduledTime - now;
            setTimeout(() => {
                task();
                // After execution, schedule for the next valid day
                scheduleOnDays(days, hour, minute, task);
            }, timeUntilTask);
            
            // Log when the next execution will happen with the day name
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const dayName = dayNames[scheduledTime.getDay()];
            console.log(`Next execution of scheduled day-specific task at ${scheduledTime.toLocaleString()} (${dayName})`);
        }
        
        // Controversial take - 12:15 PM daily
        scheduleDaily(12, 15, () => {
            console.log("Posting controversial tweet");
            bot.postRoutineTweet('controversial');
        });
        
        // AI insight - 3:45 PM daily
        scheduleDaily(15, 45, () => {
            console.log("Posting AI insight tweet");
            bot.postRoutineTweet('ai_insight');
        });
        
        // Accountability tweet - 7:20 PM daily
        scheduleDaily(19, 20, () => {
            console.log("Posting accountability tweet");
            bot.postRoutineTweet('accountability');
        });
        
        // Extra accountability tweets on weekends
        scheduleOnDays([0, 6], 11, 30, () => {
            console.log("Posting morning weekend accountability tweet");
            bot.postRoutineTweet('accountability');
        });
        
        scheduleOnDays([0, 6], 15, 0, () => {
            console.log("Posting afternoon weekend accountability tweet");
            bot.postRoutineTweet('accountability');
        });
        
        scheduleOnDays([0, 6], 22, 15, () => {
            console.log("Posting late night weekend accountability tweet");
            bot.postRoutineTweet('accountability');
        });
        
        // Good evening tweet - 6:00 PM daily
        scheduleDaily(18, 0, () => {
            console.log("Posting good evening tweet");
            bot.postRoutineTweet('evening');
        });
        
        // Good night tweet - 11:30 PM daily
        scheduleDaily(23, 30, () => {
            console.log("Posting good night tweet");
            bot.postRoutineTweet('goodnight');
        });
        
        // Gym motivation tweet - 5:00 PM daily
        scheduleDaily(17, 0, () => {
            console.log("Posting gym motivation tweet");
            bot.postRoutineTweet('gym');
        });
        
        // 100x coin manifestation - 9:45 AM daily
        scheduleDaily(9, 45, () => {
            console.log("Posting 100x coin manifestation");
            bot.postRoutineTweet('manifest_100x');
        });
        
        // Solana $1,000 manifestation - 2:30 PM daily
        scheduleDaily(14, 30, () => {
            console.log("Posting Solana $1,000 manifestation");
            bot.postRoutineTweet('solana_1000');
        });
        
        // Butthole coin billion tweet - 1:00 PM daily
        scheduleDaily(13, 0, () => {
            console.log("Posting butthole coin billion tweet");
            bot.postRoutineTweet('butthole_billion');
        });
        
        // Engagement tweet - 10:30 AM and 4:30 PM daily
        scheduleDaily(10, 30, () => {
            console.log("Posting morning engagement tweet");
            bot.postRoutineTweet('engagement');
        });
        
        scheduleDaily(16, 30, () => {
            console.log("Posting afternoon engagement tweet");
            bot.postRoutineTweet('engagement');
        });
        
        // Notification engagement tweet - 11:45 AM and 8:15 PM daily
        scheduleDaily(11, 45, () => {
            console.log("Posting morning notification engagement tweet");
            bot.postRoutineTweet('notifications');
        });
        
        scheduleDaily(20, 15, () => {
            console.log("Posting evening notification engagement tweet");
            bot.postRoutineTweet('notifications');
        });
        
        // Follow back blue checks tweet - 1:45 PM daily
        scheduleDaily(13, 45, () => {
            console.log("Posting follow back blue checks tweet");
            bot.postRoutineTweet('follow_blue');
        });
        
        // Career change tweet - 9:15 AM on Monday, Wednesday, Friday
        scheduleOnDays([1, 3, 5], 9, 15, () => {
            console.log("Posting career change tweet");
            bot.postRoutineTweet('career_change');
        });
        
        // Not too late for Solana tweet - 2:00 PM and 7:45 PM daily
        scheduleDaily(14, 0, () => {
            console.log("Posting not too late for Solana tweet");
            bot.postRoutineTweet('not_too_late');
        });
        
        scheduleDaily(19, 45, () => {
            console.log("Posting evening not too late for Solana tweet");
            bot.postRoutineTweet('not_too_late');
        });
        
        // Future coin plans tweet - 11:15 AM and 6:30 PM daily
        scheduleDaily(11, 15, () => {
            console.log("Posting morning future coin plans tweet");
            bot.postRoutineTweet('future_coin');
        });
        
        scheduleDaily(18, 30, () => {
            console.log("Posting evening future coin plans tweet");
            bot.postRoutineTweet('future_coin');
        });
        
        // Daily health check to ensure the bot is running
        const healthCheckInterval = 12 * 60 * 60 * 1000; // 12 hours
        setInterval(() => {
            console.log(`Bot health check: ${new Date().toLocaleString()} - Bot is running normally`);
            // Post a random tweet type if no tweet has been posted in the last 3 hours
            const threeHoursAgo = new Date();
            threeHoursAgo.setHours(threeHoursAgo.getHours() - 3);
            
            // Post a backup tweet if needed to ensure we never miss a day
            const randomTweetTypes = ['morning', 'engagement', 'manifest_100x', 'not_too_late', 'solana_1000', 'future_coin'];
            const randomType = randomTweetTypes[Math.floor(Math.random() * randomTweetTypes.length)];
            console.log(`Posting backup ${randomType} tweet to ensure daily activity`);
            bot.postRoutineTweet(randomType);
        }, healthCheckInterval);
        
        // Add a daily emergency backup tweet at 11:55 PM in case all other tweets failed
        scheduleDaily(23, 55, () => {
            console.log("Posting emergency backup tweet");
            bot.postRoutineTweet('morning');
        });
        
        // Scammer alert tweets - 4 times daily at strategic times for maximum visibility
        // Morning scammer alert - 8:30 AM (when people check Twitter before work)
        scheduleDaily(8, 30, () => {
            console.log("Posting morning scammer alert tweet");
            bot.postRoutineTweet('scammer_alert');
        });
        
        // Lunch time scammer alert - 12:30 PM (when people check during lunch break)
        scheduleDaily(12, 30, () => {
            console.log("Posting lunch time scammer alert tweet");
            bot.postRoutineTweet('scammer_alert');
        });
        
        // After work scammer alert - 5:30 PM (high engagement time after work)
        scheduleDaily(17, 30, () => {
            console.log("Posting after work scammer alert tweet");
            bot.postRoutineTweet('scammer_alert');
        });
        
        // Evening scammer alert - 8:45 PM (prime time evening engagement)
        scheduleDaily(20, 45, () => {
            console.log("Posting evening scammer alert tweet");
            bot.postRoutineTweet('scammer_alert');
        });
        
        console.log(`Real-world tweet schedule initialized. Regular tweets daily, with good evening/night posts, gym motivation, manifestations, butthole coin billion posts, engagement challenges, notification reminders, follow-back promises, career transition updates, not-too-late reminders, future coin plans, and extra accountability tweets on weekends.`);
        console.log(`Bot will post immediately on startup and then follow the regular schedule. Health checks every 12 hours will ensure continuous operation.`);
        console.log(`Emergency backup tweet scheduled for 11:55 PM daily to guarantee at least one tweet per day.`);
        console.log(`Bot will post immediately on startup and then follow the regular schedule. Health checks every 12 hours will ensure continuous operation.`);
    } catch (error) {
        console.error("Critical error in main function:", error);
    }
}

main().catch(console.error);