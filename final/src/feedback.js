import { cloudMode } from "./identity.js";
const backend = cloudMode
  ? await import("./cloudRatings.js")
  : await import("./ratings.js");
export const {
  ratings,
  ratingsError,
  refreshRatings,
  saveRating,
  ratingsFor,
  averageRating,
  myRatings,
  myRating,
} = backend;
