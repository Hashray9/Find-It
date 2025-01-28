const express=require("express");
const path=require("path");
const mongoose=require("mongoose");
const Shop=require("./models/shop");
const Image=require("./models/images");
const Owner=require("./models/owner")

require('dotenv').config();
const PORT = process.env.PORT || 1000;
// const PORT = 1000;
mongoose.connect(process.env.MONGODB_URI);
// mongoose.connect('mongodb://127.0.0.1:27017/imageDB');

const app=express();
 
app.set("view engine","ejs");
app.use(express.static(path.join(__dirname,"public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/:shopname/login', async (req, res) => {
  const shopName=req.params.shopname;
  const { email, password } = req.body;
  try {
    // Find the admin by email
    const owner = await Owner.findOne({ email });

    if (!owner) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (owner.password === password) {
      return res.redirect(`/${shopName}/owner`);
    }else {
      return res.status(401).send('Invalid password');
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/:shopname/admin-login', (req, res) => {
  const shopName=req.params.shopname;
  res.render('admin-login',{shopName});
});

app.get("/:shopname", async (req, res) => {
  const shopName = req.params.shopname;
  let shop = await Shop.findOne({ shopName });

  if (!shop) {
    return res.status(404).send('Shop not found');
  }

  // Get today's date and reset time (to handle comparisons easily)
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set time to midnight for consistency

  // Ensure visitsHistory exists before accessing
  if (!shop.visitsHistory) {
    shop.visitsHistory = []; // Initialize visitsHistory if it's not already there
  }

  // Find if there is an entry for today in visitsHistory
  const todayVisit = shop.visitsHistory.find(visit => visit.date.getTime() === today.getTime());

  if (todayVisit) {
    // If entry for today exists, increment today's visits count
    todayVisit.visits += 1;
  } else {
    // Otherwise, create a new entry for today's visit
    shop.visitsHistory.push({ date: today, visits: 1 });
  }

  // Increment the overall visit count
  shop.visits += 1;

  // Remove entries older than 7 days
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7); // 7 days ago
  shop.visitsHistory = shop.visitsHistory.filter(visit => visit.date >= sevenDaysAgo);

  // Save the updated shop data
  await shop.save();

  // Render the shop's page
  res.render("index", { shopName });
});

app.get("/:shopname/owner", async (req, res) => {
  const shopName = req.params.shopname;
  let shop = await Shop.findOne({ shopName });

  if (!shop) {
    return res.status(404).send('Shop not found');
  }

  let shopVisit = shop.visits;

  // Ensure visitsHistory exists before accessing
  if (!shop.visitsHistory) {
    shop.visitsHistory = []; // Initialize visitsHistory if it's not already there
  }

  // Get today's visit count
  const todayVisit = shop.visitsHistory.find(visit => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return visit.date.getTime() === today.getTime();
  }) || { visits: 0 }; // Default to 0 if no visit entry exists for today

  // Get the last 7 days of visit history
  const lastSevenDays = shop.visitsHistory.slice(-7);

  // Render the owner page with the shop data and the last 7 days' visits
  res.render('owner', { shopName, shopVisit, lastSevenDays, todayVisit: todayVisit.visits });
});



app.get('/api/:name/tshirts_images', async (req, res) => {
    try {
      const shopName = req.params.name;
  
      // Find the shop by name
      const shop = await Shop.findOne({ shopName });
  
      if (!shop) {
        return res.status(404).json({ error: 'Shop not found' });
      }
      
      // Find images associated with the shop
      const tshirts_images = await Image.find({ shopId: shop._id ,category:"tshirts"}).limit(100).hint("shopId_1_category_1").exec();
      
      res.json({tshirts_images});
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'An error occurred' });
    }
  });


  app.get('/api/:name/jeans_images', async (req, res) => {
    try {
      const shopName = req.params.name;
  
      // Find the shop by name
      const shop = await Shop.findOne({ shopName });
  
      if (!shop) {
        return res.status(404).json({ error: 'Shop not found' });
      }
  
      // Find images associated with the shop
      const jeans_images = await Image.find({ shopId: shop._id ,category:"jeans"}).limit(100).hint("shopId_1_category_1").exec();
  
      res.json({jeans_images});
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'An error occurred' });
    }
  });

  app.get('/api/:name/lower_images', async (req, res) => {
    try {
      const shopName = req.params.name;
  
      // Find the shop by name
      const shop = await Shop.findOne({ shopName });
  
      if (!shop) {
        return res.status(404).json({ error: 'Shop not found' });
      }
  
  
      // Fetch the lower images (same query, without explain)
      const lower_images = await Image.find({ shopId: shop._id, category: "lowers" }).limit(100).hint("shopId_1_category_1").exec();
      
      res.json({ lower_images });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'An error occurred' });
    }
  });
  
  app.get('/product/:id', async (req, res) => {
    try {
        const id = req.params.id;  // Corrected from data to id
        const image = await Image.findById(id);  // Use findById for direct ID lookup
        const shop_id=image.shopId;
        const shop= await Shop.findById(shop_id);
        if (!image) {
            return res.status(404).render('error', { message: 'Image not found' });
        }

        res.render("product", { base64: image.base64, shop: shop.shopName, size:image.size, price:image.price });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { message: 'Server error' });
    }
});



app.get('/api/add-sizes', async (req, res) => {
  try {
    const result = await Image.updateMany(
      {}, // Match all documents
      [
        {
          $set: {
            size: {
              $arrayElemAt: [
                ['S', 'M', 'L', 'XL'], // Array of possible sizes
                { $floor: { $multiply: [{ $rand: {} }, 4] } }, // Random index (0–3)
              ],
            },
          },
        },
      ]
    );

    res.json({
      message: `Successfully updated ${result.modifiedCount} documents.`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while updating sizes.' });
  }
});
        
app.get('/api/add-prices', async (req, res) => {
  try {
    const result = await Image.updateMany(
      {}, // Match all documents
      [
        {
          $set: {
            price: {
              $toString: { // Convert the price to a string
                $multiply: [
                  { $add: [{ $floor: { $multiply: [{ $rand: {} }, 24] } }, 7] }, // Random value between 7 and 30
                  100, // Multiply by 100 to get multiples of 100
                ],
              },
            },
          },
        },
      ]
    );

    res.json({
      message: `Successfully updated ${result.modifiedCount} documents with price as string.`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while updating prices.' });
  }
});

app.get('/colormind/api', async (req, res) => {
  try {
    const { r, g, b } = req.query; // Extract variables from query parameters

    // Validate RGB values
    const rgbValues = [r, g, b].map((value) => parseInt(value, 10));
    if (rgbValues.some((value) => isNaN(value) || value < 0 || value > 255)) {
      return res.status(400).json({ error: "Invalid RGB values. Must be integers between 0 and 255." });
    }

    // Call the external Colormind API
    const response = await fetch('http://colormind.io/api/', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "default",
        input: [rgbValues, "N", "N", "N", "N"], // Use the parsed integers
      }),
    });

    if (!response.ok) {
      return res.status(response.status).send("Error communicating with Colormind API.");
    }

    const data = await response.json(); // Parse the JSON response
    res.json(data); // Send the parsed JSON to the frontend
  } catch (error) {
    console.error("Error in /colormind/api:", error);
    res.status(500).send("Error fetching data");
  }
});



app.listen(PORT, () => console.log(`Server running on port ${PORT}`));