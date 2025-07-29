const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// POST endpoint for /bfhl
app.post('/bfhl', (req, res) => {
    try {
        const { data } = req.body;
        
        // Basic validation
        if (!data || !Array.isArray(data)) {
            return res.status(400).json({
                is_success: false,
                message: "Invalid input. 'data' should be an array."
            });
        }

        // **REPLACE WITH YOUR ACTUAL DETAILS**
        const response = {
            is_success: true,
            user_id: "shravan_rajput_16042002", // Replace with your name and DOB
            email: "shravan836.be22@chitkara.edu.in", // Replace with your email
            roll_number: "2210990836", // Replace with your roll number
            odd_numbers: [],
            even_numbers: [],
            alphabets: [],
            special_characters: [],
            sum: "0",
            concat_string: ""
        };

        let sum = 0;
        const allAlphabets = [];

        // Process each item in the data array
        for (let i = 0; i < data.length; i++) {
            const item = String(data[i]);
            
            // Check if it's a number
            if (/^\d+$/.test(item)) {
                const num = parseInt(item);
                sum += num;
                
                if (num % 2 === 0) {
                    response.even_numbers.push(item);
                } else {
                    response.odd_numbers.push(item);
                }
            }
            // Check if it's alphabetic
            else if (/^[a-zA-Z]+$/.test(item)) {
                response.alphabets.push(item.toUpperCase());
                allAlphabets.push(item);
            }
            // Everything else is special character
            else {
                response.special_characters.push(item);
            }
        }

        // Set sum as string
        response.sum = String(sum);

        // Generate concatenated string
        response.concat_string = generateConcatString(allAlphabets);

        res.status(200).json(response);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            is_success: false,
            message: "Internal server error"
        });
    }
});

// Helper function to generate concatenated string
function generateConcatString(alphabets) {
    // Join all alphabets
    const allChars = alphabets.join('');
    
    // Reverse the string
    const reversed = allChars.split('').reverse().join('');
    
    // Apply alternating caps (even index = uppercase, odd index = lowercase)
    let result = '';
    for (let i = 0; i < reversed.length; i++) {
        if (i % 2 === 0) {
            result += reversed[i].toUpperCase();
        } else {
            result += reversed[i].toLowerCase();
        }
    }
    
    return result;
}

// Simple health check
app.get('/', (req, res) => {
    res.json({
        message: "Bajaj Finserv API is running!",
        endpoint: "POST /bfhl"
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API available at: http://localhost:${PORT}/bfhl`);
});
