// @ts-ignore - Vite supports importing raw strings using ?raw
const rawFiles = import.meta.glob('../data/dialogues/*.md', { query: '?raw', import: 'default', eager: true });

const dialogueMap = new Map<string, string[]>();

/**
 * Initializes and parses the markdown files into a structured dictionary map.
 */
const parseDialogues = () => {
  for (const [path, content] of Object.entries(rawFiles)) {
    // Extract filename without extension (e.g., '../data/dialogues/feed.md' -> 'feed')
    const match = path.match(/\/([^/]+)\.md$/);
    const fileName = match ? match[1] : 'unknown';

    if (typeof content !== 'string') continue;

    const lines = content.split('\n');
    let currentCategory = '';

    lines.forEach((line) => {
      line = line.trim();
      if (line.startsWith('## ')) {
        currentCategory = line.substring(3).trim();
        dialogueMap.set(`${fileName}/${currentCategory}`, []);
      } else if (line.startsWith('- ') && currentCategory) {
        const text = line.substring(2).trim();
        if (text) {
          dialogueMap.get(`${fileName}/${currentCategory}`)?.push(text);
        }
      }
    });
  }
};

parseDialogues();

/**
 * Gets a random dialogue string from the specified file and category.
 * E.g., getDialogue('feed', 'hungry') looks for `## hungry` inside `feed.md`.
 */
export const getDialogue = (categoryGroup: string, situation: string): string => {
  const options = dialogueMap.get(`${categoryGroup}/${situation}`);
  if (!options || options.length === 0) {
    return "...";
  }
  return options[Math.floor(Math.random() * options.length)];
};
