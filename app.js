const express=require("express");
const path=require("path");
const mongoose=require("mongoose");
const Shop=require("./models/shop");
const Image=require("./models/images")

require('dotenv').config();
const PORT = process.env.PORT || 1000;
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/imageDB');
// mongoose.connect('mongodb://127.0.0.1:27017/imageDB');

const app=express();
 
app.set("view engine","ejs");
app.use(express.static(path.join(__dirname,"public")));


app.get("/:shopname",(req,res)=>{
    const shopName=req.params.shopname;
    res.render("index",{shopName})
})


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

app.get("/admin", (req,res)=>{
  res.send("hii")
})

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));