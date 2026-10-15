import inventory from "@/content/learning/source-topics.json";
export const sourceTopics = inventory.topics;
export const topicGroups = [...new Set(sourceTopics.map(topic => topic.group))];
export const sourceInventory = inventory;
export function filterSourceTopics(query: string, group: string) {
  const q = query.trim().toLocaleLowerCase();
  return sourceTopics.filter(topic => (!group || topic.group === group) && (!q || `${topic.title} ${topic.group}`.toLocaleLowerCase().includes(q)));
}
