import { generateRecommendations } from "../lib/recommend";

const out = generateRecommendations({
  city: "Austin, TX",
  interests: ["climbing", "coffee", "books", "running"],
  socialGoals: ["close_friends", "community"],
  weeklyHours: 6,
  budgetTier: "medium",
  socialEnergy: "medium",
  availability: ["weekday_evenings", "weekends"],
});

console.log(JSON.stringify(out, null, 2));
