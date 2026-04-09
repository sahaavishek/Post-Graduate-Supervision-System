const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

// OpenAI API integration
router.post('/', authenticate, async (req, res) => {
  try {
    const { message, role, conversationHistory = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check if OpenAI API key is configured
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return res.status(500).json({ 
        error: 'OpenAI API key is not configured. Please set OPENAI_API_KEY in your .env file.' 
      });
    }

    // Build system prompt based on role
    let systemPrompt = '';
    if (role === 'student') {
      systemPrompt = `You are a helpful assistant for the UTMGradient Postgraduate Supervision Platform. You help students with:
- Uploading and submitting documents
- Scheduling meetings with supervisors
- Viewing progress and milestones
- Contacting supervisors
- Understanding deadlines and notifications
- Using platform features

Be friendly, concise, and helpful. Provide clear step-by-step instructions when needed.`;
    } else if (role === 'supervisor') {
      systemPrompt = `You are a helpful assistant for the UTMGradient Postgraduate Supervision Platform. You help supervisors with:
- Managing and viewing students
- Reviewing student submissions and providing feedback
- Scheduling meetings with students
- Uploading resources and documents
- Tracking student progress
- Communicating with students

Be professional, concise, and helpful. Provide clear instructions when needed.`;
    } else if (role === 'administrator') {
      systemPrompt = `You are a helpful assistant for the UTMGradient Postgraduate Supervision Platform. You help administrators with:
- Managing users (students, supervisors, admins)
- Viewing reports and analytics
- Generating reports
- System administration tasks

Be professional, concise, and helpful. Provide clear instructions when needed.`;
    } else {
      systemPrompt = `You are a helpful assistant for the UTMGradient Postgraduate Supervision Platform. Be friendly, concise, and helpful.`;
    }

    // Build conversation messages for context
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10).map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.text
      })),
      { role: 'user', content: message }
    ];

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // You can change to gpt-4 if you have access
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API error:', errorData);
      return res.status(response.status).json({ 
        error: errorData.error?.message || 'Failed to get response from OpenAI' 
      });
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || 'I apologize, but I could not generate a response. Please try again.';

    res.json({ 
      response: aiResponse,
      usage: data.usage // Optional: return token usage info
    });

  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ 
      error: error.message || 'An error occurred while processing your request' 
    });
  }
});

module.exports = router;

