export const poems = [
  {
    id: "p1",
    title: "The Golden Evening",
    body: `The sky leans in, a copper hymn,
And every hush becomes a ring.
I keep the light between my hands
And fold the day like a small thing.`,
    date: "2026-01-01",
    image: "/profile.svg",
  },
  {
    id: "p2",
    title: "Quiet Harbor",
    body: `A boat remembers the moon it left,
Returning slow with memory.
We count the rounds of tides and breath
And call the dark our company.`,
    date: "2026-01-12",
    image: null,
  },
];

export const videos = [
  {
    id: "v1",
    title: "Reading: The Golden Evening",
    youtubeId: "dQw4w9WgXcQ",
    date: "2026-01-15",
  },
  {
    id: "v2",
    title: "Conversation with Fabris",
    youtubeId: "M7lc1UVf-VE",
    date: "2026-01-20",
  },
];

export function isLive() {
  // Mock; replace with real live-check later
  return { live: false, youtubeId: null };
}
