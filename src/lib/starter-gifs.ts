export type StarterGif = {
  id: string;
  title: string;
  description: string;
  alt: string;
  url: string;
  sourceUrl: string;
};

export const STARTER_GIFS: StarterGif[] = [
  {
    id: "kid-dancing",
    title: "Kid dancing",
    description: "A kid climbs onto a chair and dances while another kid joins in.",
    alt: "A child happily dancing in a classroom.",
    url: "https://media.giphy.com/media/13hxeOYjoTWtK8/giphy.gif",
    sourceUrl: "https://giphy.com/gifs/mrw-get-upvote-13hxeOYjoTWtK8",
  },
  {
    id: "pedro-laughing",
    title: "Pedro laughing",
    description: "Pedro Pascal laughs at something just a little too funny.",
    alt: "Pedro Pascal laughing.",
    url: "https://media.giphy.com/media/YRPBhd3vscg5Fxx1DQ/giphy.gif",
    sourceUrl: "https://giphy.com/gifs/brandmkrs-pedro-arwind-gajadien-YRPBhd3vscg5Fxx1DQ",
  },
  {
    id: "spanky-waiting",
    title: "Spanky waiting",
    description: "A bored child drums a desk while waiting for something to happen.",
    alt: "A child waiting impatiently at a desk.",
    url: "https://media.giphy.com/media/tXL4FHPSnVJ0A/giphy.gif",
    sourceUrl: "https://giphy.com/gifs/little-rascals-our-gang-spanky-tXL4FHPSnVJ0A",
  },
  {
    id: "goodfellas-laughing",
    title: "Goodfellas laugh",
    description: "A man breaks into a knowing, exaggerated laugh.",
    alt: "A man laughing from Goodfellas.",
    url: "https://media.giphy.com/media/BFYLNwlsSNtcc/giphy.gif",
    sourceUrl: "https://giphy.com/gifs/lol-grammys-steven-tyler-BFYLNwlsSNtcc",
  },
];

export function getStarterGif(id: string | null | undefined) {
  return STARTER_GIFS.find((gif) => gif.id === id) ?? null;
}
