export type SceneMedia = {
  key: string;
  title: string;
  promptSeed: string;
  alt: string;
  imageUrl: string;
};

export const SCENE_MEDIA: SceneMedia[] = [
  {
    key: "uptown-platform",
    title: "Uptown platform",
    promptSeed: "The 1 train pauses at 125th and everyone becomes a train engineer.",
    alt: "An underground train platform in New York City.",
    imageUrl: "https://images.unsplash.com/photo-1519501025264-65ba15a82390",
  },
  {
    key: "dorm-desk",
    title: "Dorm desk",
    promptSeed: "My roommate carries a tote bag full of free campus merch like it is survival gear.",
    alt: "A study desk with a laptop and office supplies.",
    imageUrl: "https://images.unsplash.com/photo-1524758631624-e2822e304c36",
  },
  {
    key: "soho-coffee",
    title: "SoHo coffee run",
    promptSeed: "A Saturday walk in SoHo turns into a three-hour search for the one coffee shop with seats.",
    alt: "A coffee shop counter and warm interior lighting.",
    imageUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb",
  },
  {
    key: "city-after-class",
    title: "After class",
    promptSeed: "You leave campus at golden hour and somehow it is already a full production to get dinner.",
    alt: "New York City buildings at dusk.",
    imageUrl: "https://images.unsplash.com/photo-1485871981521-5b1fd3805eee",
  },
];

export function getSceneMedia(key: string | null | undefined) {
  return SCENE_MEDIA.find((scene) => scene.key === key) ?? null;
}
