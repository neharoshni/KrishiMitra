import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import AWS from 'aws-sdk';
import fs from 'fs';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Configure AWS
const awsRegion = process.env.AWS_REGION ? process.env.AWS_REGION.trim() : 'us-east-1';
const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

// Log AWS configuration for debugging
console.log('AWS Region:', awsRegion);
console.log('AWS Access Key ID:', awsAccessKeyId ? '****' + awsAccessKeyId.slice(-4) : 'Not set');
console.log('AWS Secret Access Key:', awsSecretAccessKey ? '****' : 'Not set');

// Explicitly set AWS credentials
AWS.config.update({
  region: awsRegion,
  accessKeyId: awsAccessKeyId,
  secretAccessKey: awsSecretAccessKey
});

// Initialize AWS clients
const lexRuntimeV2 = new AWS.LexRuntimeV2();

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Middleware
app.use(express.static(path.join(__dirname, 'dist')));
app.use(bodyParser.json());

// Simulate bot responses
function simulateBotResponse(message, sessionId) {
  console.log(`Received message: "${message}" from session ${sessionId}`);

  let botMessage = '';
  let intentName = '';
  let dialogState = '';

  // Simple intent detection based on keywords
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('fertilizer') || lowerMessage.includes('nutrient')) {
    botMessage = "For optimal crop growth, I recommend using a balanced NPK fertilizer. " +
                "Based on your soil type, you might need to adjust the nitrogen levels. " +
                "Would you like specific recommendations for your crops?";
    intentName = 'FertilizerRecommendation';
    dialogState = 'ElicitSlot';
  }
  else if (lowerMessage.includes('weather') || lowerMessage.includes('rain') || lowerMessage.includes('forecast')) {
    botMessage = "The weather forecast for your area shows sunny conditions for the next 3 days " +
                "with a chance of light rain on Thursday. Temperatures will range from 25°C to 32°C. " +
                "Would you like more detailed information?";
    intentName = 'WeatherForecast';
    dialogState = 'Fulfilled';
  }
  else if (lowerMessage.includes('market') || lowerMessage.includes('price') || lowerMessage.includes('sell')) {
    botMessage = "Current market prices in your region:\n\n" +
                "- Rice: ₹2,100 per quintal\n" +
                "- Wheat: ₹2,015 per quintal\n" +
                "- Cotton: ₹6,500 per quintal\n" +
                "- Sugarcane: ₹285 per quintal\n\n" +
                "Would you like information about other crops?";
    intentName = 'MarketInformation';
    dialogState = 'ElicitIntent';
  }
  else if (lowerMessage.includes('disease') || lowerMessage.includes('pest') || lowerMessage.includes('insect')) {
    botMessage = "Based on your description, your crops might be affected by leaf blight. " +
                "I recommend applying a copper-based fungicide and ensuring proper drainage in your fields. " +
                "For more accurate diagnosis, please upload a photo of the affected plants.";
    intentName = 'CropDiseaseDetection';
    dialogState = 'ElicitSlot';
  }
  else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    botMessage = "Hello! I'm your agricultural assistant. How can I help you today?\n\n" +
                "You can ask me about:\n" +
                "- Fertilizer recommendations\n" +
                "- Weather forecasts for your area\n" +
                "- Current market prices for agricultural commodities\n" +
                "- Crop disease detection\n" +
                "- General agricultural questions";
    intentName = 'Greeting';
    dialogState = 'Fulfilled';
  }
  else {
    botMessage = "I'm your agricultural assistant. You can ask me about:\n\n" +
                "- Fertilizer recommendations\n" +
                "- Weather forecasts for your area\n" +
                "- Current market prices for agricultural commodities\n" +
                "- General agricultural questions";
    dialogState = 'ElicitIntent';
  }

  return {
    message: botMessage,
    sessionAttributes: {},
    dialogState: dialogState,
    intentName: intentName
  };
}

// API endpoint to upload an image to ImgBB
app.post('/api/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Get ImgBB API key from environment variables
    const imgbbApiKey = process.env.IMGBB_API_KEY;
    if (!imgbbApiKey) {
      return res.status(500).json({ error: 'ImgBB API key not configured' });
    }

    // Create form data for ImgBB API
    const formData = new FormData();
    formData.append('image', fs.createReadStream(req.file.path));

    // Upload to ImgBB
    const response = await axios.post(
      `https://api.imgbb.com/1/upload?key=${imgbbApiKey}`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
      }
    );

    // Delete the temporary file
    fs.unlinkSync(req.file.path);

    // Return the image URL
    if (response.data && response.data.data && response.data.data.url) {
      return res.json({
        success: true,
        url: response.data.data.url,
        display_url: response.data.data.display_url
      });
    } else {
      return res.status(500).json({ error: 'Failed to get image URL from ImgBB' });
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    return res.status(500).json({ error: 'Failed to upload image' });
  }
});

// API endpoint for chatbot messages
app.post('/api/message', async (req, res) => {
  const { message, sessionId, user } = req.body;

  if (!message || !sessionId) {
    return res.status(400).json({ error: 'Message and sessionId are required' });
  }

  // Check if we should use simulation mode
  const useSimulation = process.env.USE_SIMULATION === 'true';

  if (useSimulation) {
    console.log('Using simulation mode');
    // Simulate a response based on the message
    const simulatedResponse = simulateBotResponse(message, sessionId);

    // Add user information to session attributes if available
    if (user) {
      simulatedResponse.sessionAttributes = {
        ...simulatedResponse.sessionAttributes,
        user_name: user.name || '',
        user_email: user.email || '',
        user_farm_size: user.farmSize ? user.farmSize.toString() : '',
        user_location: user.location || '',
        user_soil_type: user.soilType || '',
        user_irrigation_capacity: user.irrigationCapacity || ''
      };
    }

    return res.json(simulatedResponse);
  }

  // If not using simulation, proceed with Lex V2
  // Ensure we're using clean IDs without any comments
  const botId = process.env.BOT_ID ? process.env.BOT_ID.trim() : 'KrishiChatBot';
  const botAliasId = process.env.BOT_ALIAS_ID ? process.env.BOT_ALIAS_ID.trim() : 'TestBotAlias';
  const region = process.env.AWS_REGION ? process.env.AWS_REGION.trim() : 'us-east-1';

  console.log('Using bot:', botId);
  console.log('Using alias:', botAliasId);
  console.log('Using region:', region);

  // Create session attributes from user object if available
  const sessionAttributes = {};
  if (user) {
    // Convert user object properties to string values for Lex
    // Note: Lex requires all session attributes to be strings
    sessionAttributes.user_name = user.name || '';
    sessionAttributes.user_email = user.email || '';
    sessionAttributes.user_farm_size = user.farmSize ? user.farmSize.toString() : '';
    sessionAttributes.user_location = user.location || '';
    sessionAttributes.user_soil_type = user.soilType || '';
    sessionAttributes.user_irrigation_capacity = user.irrigationCapacity || '';
  }

  const params = {
    botId: botId,
    botAliasId: botAliasId,
    localeId: process.env.LOCALE_ID || 'en_US',
    sessionId: sessionId,
    text: message,
    sessionState: {
      sessionAttributes: sessionAttributes
    }
  };

  // Log the full parameters for debugging
  console.log('Lex params:', JSON.stringify(params, null, 2));

  try {
    // Call Lex
    const lexResponse = await lexRuntimeV2.recognizeText(params).promise();

    // Log the response for debugging
    console.log('Lex response:', JSON.stringify(lexResponse, null, 2));

    // Extract the message from the response
    let botMessage = 'Sorry, I could not process your request.';
    if (lexResponse.messages && lexResponse.messages.length > 0) {
      botMessage = lexResponse.messages[0].content;
    }

    // Get intent information
    const dialogState = lexResponse.sessionState ? lexResponse.sessionState.dialogAction.type : 'Failed';
    const intentName = lexResponse.sessionState && lexResponse.sessionState.intent ? lexResponse.sessionState.intent.name : '';

    // Get session attributes from the response
    const responseSessionAttributes = lexResponse.sessionState && lexResponse.sessionState.sessionAttributes
      ? lexResponse.sessionState.sessionAttributes
      : {};

    // Return response to client with the updated session attributes
    return res.json({
      message: botMessage,
      sessionAttributes: responseSessionAttributes,
      dialogState: dialogState,
      intentName: intentName
    });
  } catch (error) {
    console.error('Error processing message:', error);

    // If we get an error, fall back to simulation
    console.log('Falling back to simulation mode due to error');
    const simulatedResponse = simulateBotResponse(message, sessionId);

    // Add user information to session attributes if available
    if (user) {
      simulatedResponse.sessionAttributes = {
        ...simulatedResponse.sessionAttributes,
        user_name: user.name || '',
        user_email: user.email || '',
        user_farm_size: user.farmSize ? user.farmSize.toString() : '',
        user_location: user.location || '',
        user_soil_type: user.soilType || '',
        user_irrigation_capacity: user.irrigationCapacity || ''
      };
    }

    return res.json(simulatedResponse);
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open your browser and navigate to http://localhost:${PORT}`);
});
