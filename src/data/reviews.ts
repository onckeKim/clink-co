export interface Review {
  id: string;
  customerName: string;
  location: string;
  rating: number;
  review: string;
  productPurchased: string;
  productSlug: string;
  verified: boolean;
}

export const reviews: Review[] = [
  {
    id: "review-1",
    customerName: "Amahle N.",
    location: "Johannesburg",
    rating: 5,
    review:
      "The Harbor Rocks glasses are the heaviest, most satisfying glasses I own. My partner asks for his whisky in one specifically now — pours just feel like an occasion.",
    productPurchased: "Harbor Rocks Glasses",
    productSlug: "harbor-rocks-glasses",
    verified: true,
  },
  {
    id: "review-2",
    customerName: "Werner B.",
    location: "Cape Town",
    rating: 5,
    review:
      "Bought the Nightcap Gift Set for my brother's housewarming and he texted me a photo of it on his bar cart within the hour. Packaging alone made it feel like a much bigger gift than it was.",
    productPurchased: "The Nightcap Gift Set",
    productSlug: "the-nightcap-gift-set",
    verified: true,
  },
  {
    id: "review-3",
    customerName: "Lerato M.",
    location: "Pretoria",
    rating: 4,
    review:
      "Beautiful decanter, genuinely a statement piece on our sideboard. Docking one star only because the stopper took a couple of tries to seat properly — once it did, it's perfect.",
    productPurchased: "Aldine Decanter",
    productSlug: "aldine-decanter",
    verified: true,
  },
  {
    id: "review-4",
    customerName: "Chloe V.",
    location: "Stellenbosch",
    rating: 5,
    review:
      "We registered for the Hearth Dinner Plates for our wedding and now use them every single day — exactly the 'nice enough for guests, durable enough for real life' balance we wanted.",
    productPurchased: "Hearth Dinner Plates",
    productSlug: "hearth-dinner-plates",
    verified: true,
  },
  {
    id: "review-5",
    customerName: "Sipho K.",
    location: "Durban",
    rating: 5,
    review:
      "The Solstice Coupes changed how I feel about a Tuesday-night glass of MCC. Mouth-blown, slightly imperfect in the best way — you can tell someone actually made these.",
    productPurchased: "Solstice Coupe Glasses",
    productSlug: "solstice-coupe-glasses",
    verified: true,
  },
  {
    id: "review-6",
    customerName: "Robyn F.",
    location: "Johannesburg",
    rating: 5,
    review:
      "Ordered the Meridian shaker for my home bar and it's the first piece of barware I've owned that doesn't leak from the strainer. Small thing, makes a huge difference.",
    productPurchased: "Meridian Cocktail Shaker",
    productSlug: "meridian-cocktail-shaker",
    verified: false,
  },
];
