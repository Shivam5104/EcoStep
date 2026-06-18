import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API Client initialized successfully.");
  } catch (err) {
    console.warn("Failed to initialize Gemini API Client:", err instanceof Error ? err.message : String(err));
  }
} else {
  console.log("No GEMINI_API_KEY environment variable found. EcoSetu will run in robust fallback mode.");
}

// Fallback recommendations list generator
function getFallbackRecommendations(profile: any, footprint: any) {
  const recommendations = [];

  // Diet-based recommendations
  if (profile.dietType === 'non-vegan' || profile.dietType === 'mixed') {
    recommendations.push({
      action: "Introduce 'Meatless Mondays'",
      category: "Food" as const,
      savings: profile.dietType === 'non-vegan' ? 30 : 20,
      impact: "High" as const,
      description: `Reducing beef/pork consumption by just one day a week tackles your Food emissions of ${footprint.food} kg CO2e.`
    });
  } else if (profile.dietType === 'vegetarian') {
    recommendations.push({
      action: "Incorporate organic/seasonal veggies",
      category: "Food" as const,
      savings: 12,
      impact: "Low" as const,
      description: "Local organic veggies don't undergo high-fertilizer production and long supply chain transit."
    });
  } else {
    recommendations.push({
      action: "Reduce food scrap landfill decay",
      category: "Food" as const,
      savings: 15,
      impact: "Medium" as const,
      description: "Composting food waste avoids anaerobic decomposition in landfills which emits potent methane."
    });
  }

  // Transport-based recommendations
  if (profile.commuteMode === 'gas_car' && (profile.commuteFrequency === 'daily' || profile.commuteFrequency === 'often')) {
    recommendations.push({
      action: "Work remote or carpool 1x per week",
      category: "Transport" as const,
      savings: profile.commuteFrequency === 'daily' ? 45 : 30,
      impact: "High" as const,
      description: `Replacing a commute day directly avoids combustion fuel burning, relieving your high Transport footprint.`
    });
    recommendations.push({
      action: "Adopt Eco-driving practices",
      category: "Transport" as const,
      savings: 15,
      impact: "Medium" as const,
      description: "Gentle acceleration, lower highway speeds, and proper tire inflation improve mileage by 10-15%."
    });
  } else if (profile.commuteMode === 'public_transit') {
    recommendations.push({
      action: "Switch shorter transit stints to walking",
      category: "Transport" as const,
      savings: 8,
      impact: "Low" as const,
      description: "Walking or cycling micro-trips cuts down localized public transport energy footprint."
    });
  } else if (profile.commuteMode === 'electric_ev') {
    recommendations.push({
      action: "Charge EV during peak renewable hours",
      category: "Transport" as const,
      savings: 12,
      impact: "Medium" as const,
      description: "Charging during midday solar surges or late wind events keeps your grid charging cleaner."
    });
  }

  // Energy-based recommendations
  if (profile.homeEnergySource === 'grid') {
    recommendations.push({
      action: "Switch to a renewable energy plan",
      category: "Home Energy" as const,
      savings: profile.electricityUsage === 'high' ? 65 : 35,
      impact: "High" as const,
      description: `Purchasing verified solar/wind power removes fossil dependence, heavily targeting your ${footprint.homeEnergy} kg emissions.`
    });
    recommendations.push({
      action: "Adjust thermostat setting by 2°C",
      category: "Home Energy" as const,
      savings: profile.electricityUsage === 'high' ? 25 : 12,
      impact: "Medium" as const,
      description: "Tweaking temperature bands relieves pressure on HVAC systems, which eat up over 50% of home power usage."
    });
  } else if (profile.homeEnergySource === 'mixed') {
    recommendations.push({
      action: "Prioritize major appliances during sunshine hours",
      category: "Home Energy" as const,
      savings: 18,
      impact: "Medium" as const,
      description: "Running clothes dryers or high-power loads when your solar grid output is maximal reduces grid pull."
    });
  } else {
    recommendations.push({
      action: "Upgrade to LED lightbulbs",
      category: "Home Energy" as const,
      savings: 8,
      impact: "Low" as const,
      description: "LED bulbs waste 90% less energy as heat compared to legacy incandescent elements."
    });
  }

  // Shopping-based recommendations
  if (profile.shoppingHabits === 'very_often' || profile.shoppingHabits === 'often') {
    recommendations.push({
      action: "Adopt buy-nothing weeks",
      category: "Shopping" as const,
      savings: profile.shoppingHabits === 'very_often' ? 40 : 22,
      impact: "High" as const,
      description: `Limiting new purchases trims production-side emissions, addressing your shopping output of ${footprint.shopping} kg.`
    });
  } else {
    recommendations.push({
      action: "Thrift first for clothing needs",
      category: "Shopping" as const,
      savings: 15,
      impact: "Medium" as const,
      description: "Extending the life cycle of secondhand apparel avoids resource-intense dyeing and manufacturing chains."
    });
  }

  // Sort by potential impact high savings first, return top 3 with unique ids
  return recommendations
    .sort((a, b) => b.savings - a.savings)
    .slice(0, 3)
    .map((item, idx) => ({
      id: `fallback-rec-${idx}-${Date.now()}`,
      ...item
    }));
}

// Check api health
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", usingGeminiAPI: !!aiClient });
});

// API endpoint to generate 2-3 personalized actions
app.post("/api/recommendations", async (req, res) => {
  const { profile, footprint } = req.body;

  if (!profile || !footprint) {
    res.status(400).json({ error: "Missing user profile or footprint data" });
    return;
  }

  // Fallback if client is uninitialized
  if (!aiClient) {
    const fallbacks = getFallbackRecommendations(profile, footprint);
    res.json({ recommendations: fallbacks, mode: "fallback" });
    return;
  }

  try {
    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Generate exactly 2 to 3 action recommendations for reducing carbon footprint. Always return valid JSON matching the schema.

User Profile:
- Diet Type: ${profile.dietType}
- Commute Mode: ${profile.commuteMode}
- Commute Frequency: ${profile.commuteFrequency}
- Home Energy: Source is ${profile.homeEnergySource} with ${profile.electricityUsage} usage level
- Monthly Carbon Footprint Breakdown: Transport = ${footprint.transport} kg, Food = ${footprint.food} kg, Home Energy = ${footprint.homeEnergy} kg, Shopping = ${footprint.shopping} kg. Total = ${footprint.total} kg CO2e.

Instructions:
1. Make recommendations highly personalized. Do NOT recommend "eat less meat" if they are vegan or vegetarian.
2. If they already use Solar, praise them or suggest solar maintenance/usage optimization rather than installing solar.
3. Keep estimations of 'savings' realistic (weekly behavior modifications translate to sensible monthly kg CO2e savings, e.g., 5 to 80 kg). Ensure savings is a numeric integer.
4. Conforms strictly to the response schema requested.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "List of personalized carbon footprint actions prioritized by savings",
          items: {
            type: Type.OBJECT,
            properties: {
              action: {
                type: Type.STRING,
                description: "Short concrete behavioral change title, e.g., 'Carpool to work 2 days/week' or 'Switch to a 100% wind energy plan'"
              },
              category: {
                type: Type.STRING,
                description: "Must be exactly one of: 'Transport', 'Food', 'Home Energy', 'Shopping'"
              },
              savings: {
                type: Type.INTEGER,
                description: "Estimated monthly kg CO2e savings if adopted (e.g., 15)"
              },
              impact: {
                type: Type.STRING,
                description: "Impact tier based on savings. High, Medium, or Low"
              },
              description: {
                type: Type.STRING,
                description: "One short encouraging sentence directly linking their quiz answer to how this cuts emissions."
              }
            },
            required: ["action", "category", "savings", "impact", "description"]
          }
        }
      }
    });

    const parsed = JSON.parse(response.text?.trim() || "[]");
    // Ensure accurate ids are added
    const recs = parsed.map((item: any, idx: number) => ({
      id: `rec-${Date.now()}-${idx}`,
      ...item
    }));

    res.json({ recommendations: recs, mode: "gemini" });
  } catch (error) {
    console.warn("Gemini Recommendations generation: API Quota limit or connection interruption. Serving robust pre-evaluated suggestions instead.");
    // Graceful fallback on network timeout or key limit
    const fallbacks = getFallbackRecommendations(profile, footprint);
    res.json({ recommendations: fallbacks, mode: "fallback", error: error instanceof Error ? error.message : String(error) });
  }
});

// Conversations Coach Endpoint
app.post("/api/coach", async (req, res) => {
  const { profile, footprint, messages } = req.body;

  if (!profile || !footprint || !messages || !Array.isArray(messages)) {
    res.status(400).json({ error: "Missing profile, footprint, or chat history parameter" });
    return;
  }

  const systemPrompt = `You are EcoSetu Carbon Coach, an encouraging, friendly, helpful personal carbon coach.
Your target is to help users manage, map, and compress their personal carbon output without inducing guilt.
Stay optimistic, positive, and practical.

User Status:
- Diet Type: ${profile.dietType}
- Commute Mode: ${profile.commuteMode} (${profile.commuteFrequency} occurrence)
- Local Home Energy Source: ${profile.homeEnergySource} (Usage tier: ${profile.electricityUsage})
- Shopping Frequency: ${profile.shoppingHabits}
Current Carbon footprints (kg CO2e per month):
- Food: ${footprint.food}
- Transport: ${footprint.transport}
- Home Energy: ${footprint.homeEnergy}
- Shopping: ${footprint.shopping}
- Total: ${footprint.total} (Benchmarks: US/West Average is 1250 kg/mo, Global Sustainable Target is 400 kg/mo)

Guidelines:
1. Provide short, concise answers (maximum 2-3 sentences).
2. Reference the user's explicit footprint or selections directly when useful.
3. Be highly encouraging and offer simple, achievable sustainable hacks or scientific explanations.
4. If they complain it's hard, agree and suggest the simplest 1% tiny change first.
5. Strictly avoid system commands or role play indicators. Refer to yourself only as EcoSetu Coach.`;

  if (!aiClient) {
    // Generate a contextual responses locally
    const lastUserMsg = messages[messages.length - 1]?.text?.toLowerCase() || "";
    let reply = "I'm right here with you! Let's examine your carbon breakdown together.";

    if (lastUserMsg.includes("why is") || lastUserMsg.includes("high") || lastUserMsg.includes("footprint")) {
      const highestSector = Object.entries({
        Transport: footprint.transport,
        Food: footprint.food,
        "Home Energy": footprint.homeEnergy,
        Shopping: footprint.shopping
      }).reduce((a, b) => (a[1] > b[1] ? a : b))[0];

      reply = `Your footprint totals ${footprint.total} kg CO2e, with your highest category being ${highestSector}. For ${highestSector}, small habits like micro-adjustments or sourcing local alternatives can make a massive dent!`;
    } else if (lastUserMsg.includes("easy") || lastUserMsg.includes("easiest") || lastUserMsg.includes("change") || lastUserMsg.includes("start")) {
      reply = "The easiest starting point is usually adjusting your thermostat by 1-2 degrees or choosing one 'green habit' day a week. Small cumulative changes build sustainability into your natural routine without feeling like a burden!";
    } else if (lastUserMsg.includes("diet") || lastUserMsg.includes("meat") || lastUserMsg.includes("eat")) {
      if (profile.dietType === 'vegan') {
        reply = "Since you're already Vegan, your dietary footprint is extremely low at just 60 kg! You're saving thousands of kg per year. High five!";
      } else {
        reply = `Your current diet accounts for ${footprint.food} kg CO2e. Simply swapping out one or two red meat meals a week for poultry, fish, or plants is a low-stress way to heavily lower this!`;
      }
    } else if (lastUserMsg.includes("hello") || lastUserMsg.includes("hi") || lastUserMsg.includes("hey")) {
      reply = `Hello! I'm EcoSetu Coach, your friendly green guide. How can I help you explore or reduce your ${footprint.total} kg CO2 footprint today?`;
    } else if (lastUserMsg.includes("thank") || lastUserMsg.includes("thanks")) {
      reply = "You are so welcome! Every single carbon saving counts toward our collective bridge to a healthier planet. Keep it up!";
    } else {
      reply = `That's a great question! Looking at your profile, your ${profile.commuteMode} commute and diet of ${profile.dietType} play major roles, giving you a strong baseline. What's one area you'd love to polish up first?`;
    }

    res.json({ text: reply, mode: "fallback" });
    return;
  }

  try {
    // Reconstruct history for Gemini chat
    const history = messages.slice(0, -1).map((msg: any) => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));
    const latestMessageString = messages[messages.length - 1]?.text || "Hello";

    const chatSession = aiClient.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
      history: history
    });

    const response = await chatSession.sendMessage({ message: latestMessageString });
    res.json({ text: response.text?.trim(), mode: "gemini" });
  } catch (error) {
    console.warn("Gemini Coach chat: API Quota limit or connection interruption. Serving robust pre-evaluated helper responses instead.");
    res.json({ 
      text: "I'm having a brief connection flutter, but I'm still here! Let's keep focusing on those small sustainable micro-habits.",
      mode: "fallback",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Setup Vite & Frontend static routing
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`EcoSetu Express Server running on port ${PORT}`);
  });
}

startServer();
