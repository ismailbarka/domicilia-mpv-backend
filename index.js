require("dotenv").config();
const express = require("express");
const cors = require("cors");
const prisma = require("./prismaClient");
const cloudinary = require("./cloudinary");
const upload = require("./upload");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/categories", async (req, res) => {
  const categories = await prisma.category.findMany();
  res.json(categories);
});

const { Prisma } = require("@prisma/client");

app.get("/providers", async (req, res) => {
  const { categoryId, lat, lng, distance } = req.query;

  try {
    let providers;

    if (lat && lng && distance) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      const radius = parseFloat(distance); // in km

      // Using Haversine formula to calculate distance in SQL
      // 6371 is the earth radius in km
      providers = await prisma.$queryRaw`
        SELECT p.*, c.name as "categoryName",
        (6371 * acos(cos(radians(${latitude})) * cos(radians(p.latitude)) * cos(radians(p.longitude) - radians(${longitude})) + sin(radians(${latitude})) * sin(radians(p.latitude)))) AS distance
        FROM "Provider" p
        LEFT JOIN "Category" c ON p."categoryId" = c.id
        WHERE p."isActive" = true
        ${categoryId ? Prisma.sql`AND p."categoryId" = ${Number(categoryId)}` : Prisma.empty}
        AND (6371 * acos(cos(radians(${latitude})) * cos(radians(p.latitude)) * cos(radians(p.longitude) - radians(${longitude})) + sin(radians(${latitude})) * sin(radians(p.latitude)))) <= ${radius}
        ORDER BY distance ASC
      `;
    } else {
      providers = await prisma.provider.findMany({
        where: {
          isActive: true,
          ...(categoryId && { categoryId: Number(categoryId) })
        },
        include: {
          category: true
        }
      });
    }

    res.json(providers);
  } catch (error) {
    console.error("Error fetching providers:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/providers", upload.single("photo"), async (req, res) => {
  try {
    const data = req.body;
    let photoUrl = data.photoUrl || null;

    // If a file was uploaded, send it to Cloudinary
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { 
            folder: "providers",
            transformation: [
              { width: 200, height: 200, crop: "limit" },
              { quality: "auto" },
              { fetch_format: "auto" }
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });
      photoUrl = result.secure_url;
    }

    const provider = await prisma.provider.create({
      data: {
        name: data.name,
        phone: data.phone,
        description: data.description || null,
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        photoUrl,
        categoryId: parseInt(data.categoryId),
      },
    });

    res.json(provider);
  } catch (error) {
    if (error.code === "P2002" && error.meta?.target?.includes("phone")) {
      return res.status(400).json({ error: "A provider with this phone number already exists." });
    }
    console.error("Error creating provider:", error);
    res.status(500).json({ error: "Failed to create provider" });
  }
});

app.post("/providers/seed", async (req, res) => {
  const dummyImages = [
    "https://res.cloudinary.com/doufu6atn/image/upload/v1771604302/providers/onz6j6yghvj0gbadd1ff.jpg",
    "https://res.cloudinary.com/doufu6atn/image/upload/v1771604384/providers/bismtgx4bajrzycshthn.jpg",
    "https://res.cloudinary.com/doufu6atn/image/upload/v1771604132/providers/hehcsyebm6wt2km0ow3y.jpg",
  ];

  const moroccanFirstNames = [
    "Youssef", "Amine", "Mehdi", "Hassan", "Karim", "Omar", "Tariq", "Yassine", "Anas", "Hamza",
    "Fatima", "Khadija", "Amina", "Salma", "Meryem", "Sara", "Imane", "Hajar", "Zineb", "Noura",
    "Rachid", "Mustapha", "Khalid", "Brahim", "Ayoub", "Ilyas", "Bilal", "Adel", "Hicham", "Said",
    "Sanae", "Najat", "Hanane", "Latifa", "Houda", "Leila", "Samira", "Hasna", "Nadia", "Asmae"
  ];

  const moroccanLastNames = [
    "Alaoui", "Amrani", "Berrada", "Chraibi", "El Fassi", "Bennani", "Tahiri", "Tazi", "Idrissi", "Lahlou",
    "Benali", "El Amrani", "Benjelloun", "El Ouazzani", "El Idrissi", "Benkirane", "El Mansouri", "El Hachimi",
    "Zeroual", "Mansouri", "Benmoussa", "El Asri", "Jazouli", "Filali", "El Mahdi", "Abou", "Zidane", "Saadi"
  ];

  const centerLat = 33.0637382;
  const centerLng = -7.2355324;
  const categories = await prisma.category.findMany();

  if (categories.length === 0) {
    return res.status(400).json({ error: "No categories found. Please seed categories first." });
  }

  const providers = [];
  for (let i = 1; i <= 50; i++) {
    // Random offset ~1km range (0.01 degrees approx)
    const latOffset = (Math.random() - 0.5) * 0.005;
    const lngOffset = (Math.random() - 0.5) * 0.005;
    
    const category = categories[Math.floor(Math.random() * categories.length)];
    const photoUrl = dummyImages[Math.floor(Math.random() * dummyImages.length)];

    const firstName = moroccanFirstNames[Math.floor(Math.random() * moroccanFirstNames.length)];
    const lastName = moroccanLastNames[Math.floor(Math.random() * moroccanLastNames.length)];
    const fullName = `${firstName} ${lastName}`;

    providers.push({
      name: fullName,
      phone: `+2126${Math.floor(10000000 + Math.random() * 90000000)}`,
      description: `Professional ${category.name} services provided by ${fullName}. Reliable and experienced.`,
      latitude: centerLat + latOffset,
      longitude: centerLng + lngOffset,
      photoUrl,
      categoryId: category.id,
      isActive: true
    });
  }

  try {
    // Delete existing dummy-named providers first to avoid unique phone conflicts if re-seeded
    // Or just create them. Using createMany for efficiency.
    const created = await prisma.provider.createMany({
      data: providers,
      skipDuplicates: true
    });

    res.json({ message: `Successfully seeded ${created.count} providers`, count: created.count });
  } catch (error) {
    console.error("Error seeding providers:", error);
    res.status(500).json({ error: "Failed to seed providers" });
  }
});

app.delete("/providers/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.provider.delete({
      where: { id: parseInt(id) },
    });
    res.json({ message: "Provider deleted successfully" });
  } catch (error) {
    console.error("Error deleting provider:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Provider not found" });
    }
    res.status(500).json({ error: "Failed to delete provider" });
  }
});

app.delete("/providers", async (req, res) => {
  try {
    await prisma.provider.deleteMany();
    res.json({ message: "All providers deleted successfully" });
  } catch (error) {
    console.error("Error deleting all providers:", error);
    res.status(500).json({ error: "Failed to delete all providers" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
